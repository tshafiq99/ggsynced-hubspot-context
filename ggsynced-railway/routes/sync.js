import express from 'express';
import { getStartGGToken, getHubSpotToken } from '../services/supabase.js';
import { refreshStartGGToken, refreshHubSpotToken } from '../services/oauth.js';
import { storeHubSpotTokens, storeStartGGTokens } from '../services/supabase.js';
import { fetchParticipants } from '../services/startgg.js';
import { syncEmailsToHubSpot } from '../services/hubspot.js';

const router = express.Router();

// Get valid token with auto-refresh
async function getValidStartGGToken(sessionId) {
  let tokenData = await getStartGGToken(sessionId);
  if (!tokenData) throw new Error('Start.gg not connected');
  
  if (new Date(tokenData.expires_at) <= new Date()) {
    const newTokens = await refreshStartGGToken(tokenData.refresh_token);
    await storeStartGGTokens(sessionId, newTokens);
    return newTokens.access_token;
  }
  return tokenData.access_token;
}

async function getValidHubSpotToken(sessionId) {
  let tokenData = await getHubSpotToken(sessionId);
  if (!tokenData) throw new Error('HubSpot not connected');
  
  if (new Date(tokenData.expires_at) <= new Date()) {
    const newTokens = await refreshHubSpotToken(tokenData.refresh_token);
    await storeHubSpotTokens(sessionId, newTokens);
    return newTokens.access_token;
  }
  return tokenData.access_token;
}

// Sync emails to HubSpot
router.post('/', async (req, res) => {
  try {
    const { tournamentSlug } = req.body;
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Session ID required' });
    }

    if (!tournamentSlug) {
      return res.status(400).json({ error: 'Tournament slug required' });
    }

    // Get valid tokens
    const startggToken = await getValidStartGGToken(sessionId);
    const hubspotToken = await getValidHubSpotToken(sessionId);

    // Fetch participants
    const participants = await fetchParticipants(startggToken, tournamentSlug);
    
    // Extract and deduplicate emails
    const emails = [...new Set(
      participants
        .map(p => p.email)
        .filter(email => email && email.includes('@'))
    )];

    if (emails.length === 0) {
      return res.json({
        synced: 0,
        skipped: 0,
        errors: ['No valid emails found']
      });
    }

    // Sync to HubSpot
    const result = await syncEmailsToHubSpot(hubspotToken, emails);

    res.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message || 'Sync failed' });
  }
});

export default router;

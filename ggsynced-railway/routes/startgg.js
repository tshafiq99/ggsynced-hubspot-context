import express from 'express';
import { getStartGGToken, storeStartGGTokens } from '../services/supabase.js';
import { refreshStartGGToken } from '../services/oauth.js';
import { fetchTournaments, fetchParticipants } from '../services/startgg.js';

const router = express.Router();

// Middleware to get and refresh token
async function getValidToken(sessionId) {
  let tokenData = await getStartGGToken(sessionId);
  
  if (!tokenData) {
    throw new Error('Start.gg not connected');
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) <= new Date()) {
    // Refresh token
    const newTokens = await refreshStartGGToken(tokenData.refresh_token);
    await storeStartGGTokens(sessionId, newTokens);
    return newTokens.access_token;
  }

  return tokenData.access_token;
}

// List tournaments
router.get('/tournaments', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Session ID required' });
    }

    const accessToken = await getValidToken(sessionId);
    const tournaments = await fetchTournaments(accessToken);

    res.json({ tournaments });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tournaments' });
  }
});

// Get participants for a tournament
router.get('/tournaments/:slug/participants', async (req, res) => {
  try {
    const { slug } = req.params;
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Session ID required' });
    }

    const accessToken = await getValidToken(sessionId);
    const participants = await fetchParticipants(accessToken, slug);

    res.json({ participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch participants' });
  }
});

export default router;

import express from 'express';
import { getHubSpotToken, storeHubSpotTokens } from '../services/supabase.js';
import { refreshHubSpotToken } from '../services/oauth.js';
import { fetchContactProperties } from '../services/hubspot.js';

const router = express.Router();

// Middleware to get and refresh token
async function getValidToken(sessionId) {
  let tokenData = await getHubSpotToken(sessionId);
  
  if (!tokenData) {
    throw new Error('HubSpot not connected');
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) <= new Date()) {
    // Refresh token
    const newTokens = await refreshHubSpotToken(tokenData.refresh_token);
    await storeHubSpotTokens(sessionId, newTokens);
    return newTokens.access_token;
  }

  return tokenData.access_token;
}

// Get HubSpot contact columns/properties
router.get('/columns', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Session ID required' });
    }

    const accessToken = await getValidToken(sessionId);
    const columns = await fetchContactProperties(accessToken);

    res.json({ columns });
  } catch (error) {
    console.error('Error fetching HubSpot columns:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch HubSpot columns' });
  }
});

export default router;

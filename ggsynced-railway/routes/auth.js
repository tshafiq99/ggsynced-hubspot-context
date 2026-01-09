import express from 'express';
import { exchangeHubSpotToken, exchangeStartGGToken } from '../services/oauth.js';
import { storeHubSpotTokens, storeStartGGTokens } from '../services/supabase.js';

const router = express.Router();

// HubSpot OAuth callback
router.get('/hubspot/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    // Extract session ID from state parameter (encoded by frontend)
    let sessionId = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        sessionId = decoded.sessionId;
      } catch (e) {
        // Fallback: try state as direct session ID (for backwards compatibility)
        sessionId = state;
      }
    }

    // Fallback to header if state doesn't contain session ID
    if (!sessionId) {
      sessionId = req.headers['x-session-id'];
    }

    if (!sessionId) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_session`);
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeHubSpotToken(code);

    // Store tokens in Supabase
    await storeHubSpotTokens(sessionId, tokens);

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}?hubspot=connected`);
  } catch (error) {
    console.error('HubSpot OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
  }
});

// Start.gg OAuth callback
router.get('/startgg/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
    }

    // Extract session ID from state parameter (encoded by frontend)
    let sessionId = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        sessionId = decoded.sessionId;
      } catch (e) {
        // Fallback: try state as direct session ID (for backwards compatibility)
        sessionId = state;
      }
    }

    // Fallback to header if state doesn't contain session ID
    if (!sessionId) {
      sessionId = req.headers['x-session-id'];
    }

    if (!sessionId) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=no_session`);
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeStartGGToken(code);

    // Store tokens in Supabase
    await storeStartGGTokens(sessionId, tokens);

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}?startgg=connected`);
  } catch (error) {
    console.error('Start.gg OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
  }
});

export default router;

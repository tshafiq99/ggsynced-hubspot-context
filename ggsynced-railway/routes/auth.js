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

    // Construct the redirect URI that was used in the authorization request
    // This must match exactly what was sent to HubSpot
    let backendUrl;
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      backendUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    } else if (process.env.BACKEND_URL) {
      backendUrl = process.env.BACKEND_URL;
    } else {
      // Fallback: construct from request
      const protocol = req.protocol || 'https';
      const host = req.get('host') || 'localhost:3000';
      backendUrl = `${protocol}://${host}`;
    }
    backendUrl = backendUrl.replace(/\/$/, '');
    const redirectUri = `${backendUrl}/auth/hubspot/callback`;

    // Exchange authorization code for tokens
    const tokens = await exchangeHubSpotToken(code, redirectUri);

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

    // Construct the redirect URI that was used in the authorization request
    // This must match exactly what was sent to Start.gg
    let backendUrl;
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      backendUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    } else if (process.env.BACKEND_URL) {
      backendUrl = process.env.BACKEND_URL;
    } else {
      // Fallback: construct from request
      const protocol = req.protocol || 'https';
      const host = req.get('host') || 'localhost:3000';
      backendUrl = `${protocol}://${host}`;
    }
    backendUrl = backendUrl.replace(/\/$/, '');
    const redirectUri = `${backendUrl}/auth/startgg/callback`;
    
    console.log('Start.gg callback - using redirect URI:', redirectUri);

    // Exchange authorization code for tokens
    const tokens = await exchangeStartGGToken(code, redirectUri);

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

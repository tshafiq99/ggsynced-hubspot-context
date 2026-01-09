// Helper function to get normalized backend URL
function getBackendUrl() {
  let backendUrl;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    backendUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  } else if (process.env.BACKEND_URL) {
    backendUrl = process.env.BACKEND_URL;
  } else {
    backendUrl = 'http://localhost:3000';
  }
  // Remove trailing slash if present
  return backendUrl.replace(/\/$/, '');
}

// HubSpot OAuth token exchange
export async function exchangeHubSpotToken(code, redirectUri = null) {
  // Redirect URI should be the backend callback URL
  const backendUrl = getBackendUrl();
  const finalRedirectUri = redirectUri || `${backendUrl}/auth/hubspot/callback`;

  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: finalRedirectUri,
      code: code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot token exchange failed: ${error}`);
  }

  return await response.json();
}

// HubSpot token refresh
export async function refreshHubSpotToken(refreshToken) {
  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.HUBSPOT_CLIENT_ID,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot token refresh failed: ${error}`);
  }

  return await response.json();
}

// Start.gg OAuth token exchange
export async function exchangeStartGGToken(code, redirectUri = null) {
  // Redirect URI should be the backend callback URL
  // If not provided, construct it from environment variables
  const backendUrl = getBackendUrl();
  const finalRedirectUri = redirectUri || `${backendUrl}/auth/startgg/callback`;
  
  console.log('Start.gg token exchange - redirect URI:', finalRedirectUri);
  
  const response = await fetch('https://api.start.gg/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.STARTGG_CLIENT_ID,
      client_secret: process.env.STARTGG_CLIENT_SECRET,
      redirect_uri: finalRedirectUri,
      code: code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Start.gg token exchange error:', error);
    throw new Error(`Start.gg token exchange failed: ${error}`);
  }

  const data = await response.json();
  
  // Start.gg returns expires_in in seconds
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in || 3600,
    user_id: data.user_id
  };
}

// Start.gg token refresh
export async function refreshStartGGToken(refreshToken) {
  const response = await fetch('https://api.start.gg/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.STARTGG_CLIENT_ID,
      client_secret: process.env.STARTGG_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Start.gg token refresh failed: ${error}`);
  }

  const data = await response.json();
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in || 3600,
    user_id: data.user_id
  };
}

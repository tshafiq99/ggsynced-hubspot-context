import { getSessionId } from './session';

const HUBSPOT_CLIENT_ID = import.meta.env.VITE_HUBSPOT_CLIENT_ID || '';
const STARTGG_CLIENT_ID = import.meta.env.VITE_STARTGG_CLIENT_ID || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const HUBSPOT_SCOPES = 'crm.objects.contacts.read crm.objects.contacts.write';
const STARTGG_SCOPES = 'user.identity user.email tournament.manager';

// Helper function to normalize backend URL
function normalizeBackendUrl(url: string): string {
  let normalized = url;
  // Ensure URL has protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}

export function connectHubSpot(): void {
  const backendUrl = normalizeBackendUrl(API_URL);
  const redirectUri = `${backendUrl}/auth/hubspot/callback`;
  const sessionId = getSessionId();
  const randomState = crypto.randomUUID();
  // Encode session ID and random state together
  const state = btoa(JSON.stringify({ sessionId, state: randomState }));
  sessionStorage.setItem('oauth_state', randomState);
  
  const params = new URLSearchParams({
    client_id: HUBSPOT_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: HUBSPOT_SCOPES,
    state,
  });

  window.location.href = `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

export function connectStartGG(): void {
  const backendUrl = normalizeBackendUrl(API_URL);
  const redirectUri = `${backendUrl}/auth/startgg/callback`;
  
  const sessionId = getSessionId();
  const randomState = crypto.randomUUID();
  // Encode session ID and random state together
  const state = btoa(JSON.stringify({ sessionId, state: randomState }));
  sessionStorage.setItem('oauth_state', randomState);
  
  const params = new URLSearchParams({
    client_id: STARTGG_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: STARTGG_SCOPES,
    state,
    response_type: 'code',
  });

  window.location.href = `https://www.start.gg/oauth/authorize?${params.toString()}`;
}

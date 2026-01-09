import { getSessionId } from './session';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const sessionId = getSessionId();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  async getTournaments() {
    return request<{ tournaments: Tournament[] }>('/startgg/tournaments');
  },

  async getParticipants(slug: string) {
    return request<{ participants: Participant[] }>('/startgg/tournaments/' + slug + '/participants');
  },

  async getHubSpotColumns() {
    return request<{ columns: HubSpotColumn[] }>('/hubspot/columns');
  },

  async sync(tournamentSlug: string) {
    return request<SyncResult>('/sync', {
      method: 'POST',
      body: JSON.stringify({ tournamentSlug }),
    });
  },
};

export interface Tournament {
  id: string;
  name: string;
  slug: string;
}

export interface Participant {
  email: string;
}

export interface HubSpotColumn {
  name: string;
  label: string;
  type: string;
}

export interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

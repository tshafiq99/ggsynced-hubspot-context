import { useState, useEffect } from 'react';
import { OAuthButton } from './components/OAuthButton';
import { TournamentList } from './components/TournamentList';
import { ParticipantList } from './components/ParticipantList';
import { HubSpotColumns } from './components/HubSpotColumns';
import { SyncButton } from './components/SyncButton';
import { SyncResult } from './components/SyncResult';
import { api, Tournament, Participant, HubSpotColumn, SyncResult as SyncResultType } from './utils/api';
import { connectHubSpot, connectStartGG } from './utils/oauth';
import './App.css';

function App() {
  const [hubspotConnected, setHubspotConnected] = useState(false);
  const [startggConnected, setStartggConnected] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [columns, setColumns] = useState<HubSpotColumn[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResultType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnections();
  }, []);

  useEffect(() => {
    if (startggConnected) {
      loadTournaments();
    }
  }, [startggConnected]);

  useEffect(() => {
    if (hubspotConnected) {
      loadColumns();
    }
  }, [hubspotConnected]);

  useEffect(() => {
    if (selectedSlug && startggConnected) {
      loadParticipants(selectedSlug);
    }
  }, [selectedSlug, startggConnected]);

  async function checkConnections() {
    try {
      const [tournamentsRes, columnsRes] = await Promise.allSettled([
        api.getTournaments(),
        api.getHubSpotColumns(),
      ]);

      if (tournamentsRes.status === 'fulfilled') {
        setStartggConnected(true);
        setTournaments(tournamentsRes.value.tournaments);
      }

      if (columnsRes.status === 'fulfilled') {
        setHubspotConnected(true);
        setColumns(columnsRes.value.columns);
      }
    } catch (err) {
      // Connections not established yet
    }
  }

  async function loadTournaments() {
    setLoadingTournaments(true);
    setError(null);
    try {
      const data = await api.getTournaments();
      setTournaments(data.tournaments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setLoadingTournaments(false);
    }
  }

  async function loadParticipants(slug: string) {
    setLoadingParticipants(true);
    setError(null);
    try {
      const data = await api.getParticipants(slug);
      setParticipants(data.participants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants');
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }

  async function loadColumns() {
    setLoadingColumns(true);
    setError(null);
    try {
      const data = await api.getHubSpotColumns();
      setColumns(data.columns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HubSpot columns');
    } finally {
      setLoadingColumns(false);
    }
  }

  async function handleSync() {
    if (!selectedSlug) return;

    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const result = await api.sync(selectedSlug);
      setSyncResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Start.gg → HubSpot Email Sync</h1>
        <p>Sync participant emails from Start.gg tournaments to HubSpot Contacts</p>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <section className="oauth-section">
          <div className="oauth-buttons">
            <OAuthButton
              provider="hubspot"
              onConnect={connectHubSpot}
              connected={hubspotConnected}
            />
            <OAuthButton
              provider="startgg"
              onConnect={connectStartGG}
              connected={startggConnected}
            />
          </div>
        </section>

        {startggConnected && (
          <section className="tournaments-section">
            {loadingTournaments ? (
              <div>Loading tournaments...</div>
            ) : (
              <TournamentList
                tournaments={tournaments}
                selectedSlug={selectedSlug}
                onSelect={setSelectedSlug}
              />
            )}
          </section>
        )}

        {selectedSlug && (
          <section className="participants-section">
            <ParticipantList
              participants={participants}
              loading={loadingParticipants}
            />
          </section>
        )}

        {hubspotConnected && (
          <section className="columns-section">
            <HubSpotColumns
              columns={columns}
              loading={loadingColumns}
            />
          </section>
        )}

        {selectedSlug && hubspotConnected && startggConnected && (
          <section className="sync-section">
            <SyncButton
              onSync={handleSync}
              loading={syncing}
              disabled={!selectedSlug || participants.length === 0}
            />
            {syncResult && <SyncResult result={syncResult} />}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

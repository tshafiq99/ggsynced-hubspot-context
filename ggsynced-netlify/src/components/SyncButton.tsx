import './SyncButton.css';

interface SyncButtonProps {
  onSync: () => void;
  loading: boolean;
  disabled: boolean;
}

export function SyncButton({ onSync, loading, disabled }: SyncButtonProps) {
  return (
    <button
      className="sync-button"
      onClick={onSync}
      disabled={disabled || loading}
    >
      {loading ? 'Syncing...' : 'Sync to HubSpot'}
    </button>
  );
}

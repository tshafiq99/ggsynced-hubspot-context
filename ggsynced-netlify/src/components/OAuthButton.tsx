import './OAuthButton.css';

interface OAuthButtonProps {
  provider: 'hubspot' | 'startgg';
  onConnect: () => void;
  connected: boolean;
}

export function OAuthButton({ provider, onConnect, connected }: OAuthButtonProps) {
  const label = provider === 'hubspot' ? 'HubSpot' : 'Start.gg';
  
  return (
    <button
      className={`oauth-button ${provider} ${connected ? 'connected' : ''}`}
      onClick={onConnect}
      disabled={connected}
    >
      {connected ? `✓ ${label} Connected` : `Connect ${label}`}
    </button>
  );
}

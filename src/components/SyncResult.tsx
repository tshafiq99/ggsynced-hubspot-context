import { SyncResult as SyncResultType } from '../utils/api';
import './SyncResult.css';

interface SyncResultProps {
  result: SyncResultType | null;
}

export function SyncResult({ result }: SyncResultProps) {
  if (!result) return null;

  return (
    <div className="sync-result">
      <div className="summary">
        <div className="stat success">
          <strong>{result.synced}</strong> synced
        </div>
        <div className="stat warning">
          <strong>{result.skipped}</strong> skipped
        </div>
        {result.errors.length > 0 && (
          <div className="stat error">
            <strong>{result.errors.length}</strong> errors
          </div>
        )}
      </div>
      {result.errors.length > 0 && (
        <div className="errors">
          <h4>Errors:</h4>
          <ul>
            {result.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

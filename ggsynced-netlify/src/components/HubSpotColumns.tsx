import { HubSpotColumn } from '../utils/api';
import './HubSpotColumns.css';

interface HubSpotColumnsProps {
  columns: HubSpotColumn[];
  loading: boolean;
}

export function HubSpotColumns({ columns, loading }: HubSpotColumnsProps) {
  if (loading) {
    return <div className="hubspot-columns loading">Loading HubSpot columns...</div>;
  }

  if (columns.length === 0) {
    return <div className="hubspot-columns empty">No columns found</div>;
  }

  return (
    <div className="hubspot-columns">
      <ul>
        {columns.map((column) => (
          <li key={column.name}>
            {column.label} <span className="type">({column.type})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

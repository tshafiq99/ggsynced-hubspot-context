import { Tournament } from '../utils/api';
import './TournamentList.css';

interface TournamentListProps {
  tournaments: Tournament[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

export function TournamentList({ tournaments, selectedSlug, onSelect }: TournamentListProps) {
  if (tournaments.length === 0) {
    return <div className="tournament-list empty">No tournaments found</div>;
  }

  return (
    <div className="tournament-list">
      <ul>
        {tournaments.map((tournament) => (
          <li
            key={tournament.id}
            className={selectedSlug === tournament.slug ? 'selected' : ''}
            onClick={() => onSelect(tournament.slug)}
          >
            {tournament.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

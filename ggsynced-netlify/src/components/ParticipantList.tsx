import { Participant } from '../utils/api';
import './ParticipantList.css';

interface ParticipantListProps {
  participants: Participant[];
  loading: boolean;
}

export function ParticipantList({ participants, loading }: ParticipantListProps) {
  if (loading) {
    return <div className="participant-list loading">Loading participants...</div>;
  }

  if (participants.length === 0) {
    return <div className="participant-list empty">No participants found</div>;
  }

  return (
    <div className="participant-list">
      <div className="participant-count">{participants.length} participants</div>
      <ul>
        {participants.map((participant, index) => (
          <li key={index}>{participant.email || 'No email'}</li>
        ))}
      </ul>
    </div>
  );
}

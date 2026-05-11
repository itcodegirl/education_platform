import { PublicProfile } from '../components/shared/PublicProfile';
import '../styles/public-profile.css';

export function PublicProfileRoute({ handle, onClose }) {
  return <PublicProfile handle={handle} onClose={onClose} />;
}

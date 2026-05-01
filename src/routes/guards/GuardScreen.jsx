<<<<<<< HEAD
import { Logo } from '../../components/shared/Logo';
import { useTheme } from '../../providers';

export function GuardScreen({ message = 'Loading...' }) {
  const { theme } = useTheme();

  return (
    <div className={`loading-screen ${theme}`}>
      <div className="loading-pulse">
        <Logo size="sm" />
=======
export function GuardScreen({ message = 'Checking access...' }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-pulse">
>>>>>>> origin/main
        <p>{message}</p>
      </div>
    </div>
  );
}

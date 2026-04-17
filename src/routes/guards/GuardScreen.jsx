import { Logo } from '../../components/shared/Logo';
import { useTheme } from '../../providers';

export function GuardScreen({ message = 'Loading...' }) {
  const { theme } = useTheme();

  return (
    <div className={`loading-screen ${theme}`}>
      <div className="loading-pulse">
        <Logo size="sm" />
        <p>{message}</p>
      </div>
    </div>
  );
}

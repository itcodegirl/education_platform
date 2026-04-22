export function GuardScreen({ message = 'Checking access...' }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-pulse">
        <p>{message}</p>
      </div>
    </div>
  );
}

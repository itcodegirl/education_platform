import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../routes/routePaths';

export function NotFoundPage() {
  const navigate = useNavigate();
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <main
      className="eb-screen"
      aria-labelledby="not-found-title"
      aria-describedby="not-found-message"
    >
      <div className="eb-card">
        <span className="eb-icon" aria-hidden="true">404</span>
        <h2
          id="not-found-title"
          className="eb-title"
          ref={titleRef}
          tabIndex={-1}
        >
          Page not found
        </h2>
        <p id="not-found-message" className="eb-msg">
          That URL doesn&apos;t exist. You can head back to the dashboard and keep learning.
        </p>
        <div className="eb-actions">
          <button
            type="button"
            className="eb-retry"
            onClick={() => navigate(APP_ROUTES.home, { replace: true })}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}

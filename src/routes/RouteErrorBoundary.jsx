import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { APP_ROUTES } from './routePaths';

function getErrorSummary(error) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 405) {
      return {
        title: 'That action could not be completed',
        message: 'The app received a request method this route does not handle. No progress was lost.',
      };
    }

    if (error.status >= 500) {
      return {
        title: 'Temporary server issue',
        message: 'CodeHerWay hit a temporary server error. Please reload and try again.',
      };
    }

    if (error.status >= 400) {
      return {
        title: 'Request could not be completed',
        message: 'Please try that action again. If it keeps failing, reload the app.',
      };
    }
  }

  return {
    title: 'Unexpected app error',
    message: 'Something went wrong while loading this screen. You can safely return to the dashboard.',
  };
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { title, message } = getErrorSummary(error);

  return (
    <div className="eb-screen">
      <div className="eb-card">
        <span className="eb-icon" aria-hidden="true">⚠︎</span>
        <h2 className="eb-title">{title}</h2>
        <p className="eb-msg">{message}</p>

        {isRouteErrorResponse(error) && (
          <div className="eb-detail">
            <code>
              {error.status} {error.statusText || 'Request Error'}
            </code>
          </div>
        )}

        <div className="eb-actions">
          <button
            type="button"
            className="eb-retry"
            onClick={() => navigate(APP_ROUTES.home, { replace: true })}
          >
            Return to Dashboard
          </button>
          <button
            type="button"
            className="eb-reload"
            onClick={() => window.location.reload()}
          >
            Reload App
          </button>
        </div>
      </div>
    </div>
  );
}

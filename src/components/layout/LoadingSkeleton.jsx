import { EmailVerifyBanner } from './EmailVerifyBanner';
import { OfflineIndicator } from './OfflineIndicator';

export function LoadingSkeleton({ theme, courseId, courseIcon, courseLabel }) {
  return (
    <div className={`shell ${theme}`} data-course={courseId || 'html'}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <EmailVerifyBanner />
      <OfflineIndicator />
      <main
        id="main-content"
        className="main-shell course-skeleton"
        tabIndex={-1}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="course-skeleton-inner">
          <span className="course-skeleton-emoji" aria-hidden="true">
            {courseIcon || '📚'}
          </span>
          <p className="course-skeleton-label">
            Loading {courseLabel || 'course'}…
          </p>
        </div>
      </main>
    </div>
  );
}

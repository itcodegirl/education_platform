import { CourseContentProvider } from '../providers/CourseContentProvider';
import { GuestPreview } from '../components/auth/GuestPreview';
import '../styles/App.css';

export function GuestPreviewRoute({ onBack }) {
  return (
    <CourseContentProvider>
      <GuestPreview onBack={onBack} />
    </CourseContentProvider>
  );
}

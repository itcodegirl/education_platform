// ═══════════════════════════════════════════════
// AUTH LAYOUT — Auth page + guest preview option
// ═══════════════════════════════════════════════

import { useState } from 'react';
import { AuthPage } from '../components/auth/AuthPage';
import { GuestPreview } from '../components/auth/GuestPreview';

export function AuthLayout() {
  const [showPreview, setShowPreview] = useState(false);

  if (showPreview) {
    return <GuestPreview onBack={() => setShowPreview(false)} />;
  }

  return <AuthPage onPreview={() => setShowPreview(true)} />;
}

import { Suspense } from 'react';
import { StudioLoginForm } from '@/components/studio/StudioLoginForm';

export default function StudioLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="studio-login">
          <p style={{ color: '#fff' }}>Loading…</p>
        </div>
      }
    >
      <StudioLoginForm />
    </Suspense>
  );
}

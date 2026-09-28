import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StudioAuthProvider } from '@/components/studio/StudioAuthContext';
import { StudioShell } from '@/components/studio/StudioShell';

export const metadata: Metadata = {
  title: 'Visual Studio',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudioAuthProvider>
      <Suspense
        fallback={
          <div className="studio-shell studio-shell--loading">
            <p>Loading studio…</p>
          </div>
        }
      >
        <StudioShell>{children}</StudioShell>
      </Suspense>
    </StudioAuthProvider>
  );
}

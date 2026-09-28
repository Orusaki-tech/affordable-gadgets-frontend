import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visual Studio Login',
  robots: { index: false, follow: false },
};

export default function StudioLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

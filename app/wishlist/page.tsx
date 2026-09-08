import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import WishlistClient from '@/components/WishlistClient';

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Devices you saved on Affordable Gadgets KE.',
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <WishlistClient />
      <Footer />
    </div>
  );
}

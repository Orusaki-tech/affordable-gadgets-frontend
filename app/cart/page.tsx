import { Metadata } from 'next';
import { Suspense } from 'react';
import { CartPage } from '@/components/CartPage';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your cart items before checkout',
};

function CartContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderWithAnnouncement />
      <main className="flex-1 container mx-auto px-4 py-8">
        <CartPage />
      </main>
      <Footer />
    </div>
  );
}

export default function Cart() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <HeaderWithAnnouncement />
          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="cart-page__loading">Loading cart...</div>
          </main>
          <Footer />
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}








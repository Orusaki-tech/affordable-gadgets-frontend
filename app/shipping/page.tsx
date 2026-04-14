import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { Suspense } from 'react';



export const dynamic = 'force-dynamic';


export default function ShippingPage() {
  return (
    <div className="app-page app-page--bg-white">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="app-page__main page-container u-py-12">
        <h1 className="simple-page-heading">Shipping</h1>
        <div className="simple-page-prose">
          <p>We offer fast, reliable delivery across Kenya. Delivery times and costs vary by location and order size.</p>
          <p>For exact timelines and fees, please contact our team before checkout.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

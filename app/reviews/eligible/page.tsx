import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { ReviewEligibilityPanel } from '@/components/ReviewEligibilityPanel';

export default function ReviewEligibilityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <HeaderWithAnnouncement />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-10">
          <ReviewEligibilityPanel />
        </section>
      </main>
      <Footer />
    </div>
  );
}

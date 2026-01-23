import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">FAQs</h1>
        <div className="space-y-4 text-gray-700">
          <div>
            <h2 className="font-semibold">Do you offer warranties?</h2>
            <p>Yes. Warranty terms depend on the product and are shared at purchase.</p>
          </div>
          <div>
            <h2 className="font-semibold">Can I reserve a device?</h2>
            <p>Yes. Contact us to reserve units and confirm availability.</p>
          </div>
          <div>
            <h2 className="font-semibold">Do you deliver outside Nairobi?</h2>
            <p>Yes. We deliver countrywide with varying timelines and fees.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

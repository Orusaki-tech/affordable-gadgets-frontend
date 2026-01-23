import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function ShippingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Shipping</h1>
        <p className="text-gray-700 mb-3">
          We offer fast, reliable delivery across Kenya. Delivery times and costs
          vary by location and order size.
        </p>
        <p className="text-gray-700">
          For exact timelines and fees, please contact our team before checkout.
        </p>
      </main>
      <Footer />
    </div>
  );
}

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-700 mb-4">
          Reach us for product inquiries, availability, or support.
        </p>
        <div className="text-gray-700 space-y-2">
          <p><span className="font-semibold">Phone:</span> +254717881573</p>
          <p><span className="font-semibold">Email:</span> affordablegadgetske@gmail.com</p>
          <p><span className="font-semibold">Location:</span> Kimathi House Room 409, Nairobi</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

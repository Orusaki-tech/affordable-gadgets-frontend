import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-700 mb-3">
          By using our site or services, you agree to our terms and conditions.
          We may update these terms from time to time.
        </p>
        <p className="text-gray-700">
          For questions, please contact our support team.
        </p>
      </main>
      <Footer />
    </div>
  );
}

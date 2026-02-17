import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderWithAnnouncement />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-700 mb-3">
          We value your privacy and only collect data needed to process orders
          and improve your experience.
        </p>
        <p className="text-gray-700">
          We do not sell your personal information to third parties.
        </p>
      </main>
      <Footer />
    </div>
  );
}

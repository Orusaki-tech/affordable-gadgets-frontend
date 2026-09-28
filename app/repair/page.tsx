import { Suspense } from 'react';
import type { Metadata } from 'next';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { RepairBookingForm } from '@/components/RepairBookingForm';
import { brandConfig } from '@/lib/config/brand';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Device Repair Booking',
  description:
    'Book phone, tablet, laptop, and accessory repairs at Affordable Gadgets KE in Nairobi. Describe your issue and get a quote on WhatsApp after diagnosis.',
  alternates: {
    canonical: '/repair',
  },
};

const STEPS = [
  {
    title: "Tell us what's broken",
    body: 'Share the device and issue — we repair the brands and categories we sell.',
  },
  {
    title: 'Continue on WhatsApp',
    body: 'Your details open a chat with our team so we can confirm next steps.',
  },
  {
    title: 'Get a diagnosis quote',
    body: 'Pricing is confirmed after we assess the device — no online price list.',
  },
] as const;

export default function RepairPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-canvas)]">
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      <main className="repair-page flex-1">
        <section className="repair-page__hero">
          <div className="repair-page__hero-inner">
            <p className="repair-page__eyebrow">Repair services</p>
            <h1 className="repair-page__title">Book a device repair</h1>
            <p className="repair-page__lead">
              Screens, batteries, charging ports, and more — for phones, tablets, laptops, and
              accessories we sell. Drop your details below and we&apos;ll quote you on WhatsApp after
              diagnosis.
            </p>
            <ul className="repair-page__meta" aria-label="Shop details">
              <li>{brandConfig.business.address.streetAddress}, Nairobi</li>
              <li>Quote after diagnosis · Via WhatsApp</li>
            </ul>
          </div>
        </section>

        <section className="repair-page__content">
          <ol className="repair-page__steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="repair-page__step">
                <span className="repair-page__step-num" aria-hidden>
                  {index + 1}
                </span>
                <div>
                  <h2 className="repair-page__step-title">{step.title}</h2>
                  <p className="repair-page__step-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="repair-page__panel">
            <h2 className="repair-page__panel-title">Request a repair</h2>
            <p className="repair-page__panel-sub">
              Fill this in and continue on WhatsApp — we&apos;ll take it from there.
            </p>
            <Suspense fallback={<div className="repair-page__form-skeleton" aria-hidden />}>
              <RepairBookingForm />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { getBusinessWhatsAppUrl } from '@/lib/config/brand';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Kimathi+House+Room+504+Nairobi';

const THUMBS = [
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto,w_96/v1788773195/products-banners/iphone.jpg',
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto,w_96/v1781265362/products-banners/samsung.jpg',
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto,w_96/v1781354997/products-banners/google.png',
];

export function HomeCbdRibbon() {
  return (
    <section className="ag-section ag-section--ribbon">
      <div className="flex flex-col gap-4 rounded-2xl bg-obsidian-dark px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-control-icon w-control-icon shrink-0 items-center justify-center rounded-xl bg-promo-lime text-primary">
            <MaterialIcon name="shopping_bag" className="text-[1.375rem]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-white sm:text-base">
                Get KSh 500 OFF Website Prices
              </p>
              <span className="ag-tag ag-tag--on-dark">Nairobi CBD</span>
            </div>
            <p className="mt-1 text-sm text-white/80">
              Walk in at Kimathi House Room 504, 5th Floor. Cash, M-Pesa, Card accepted on spot.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center -space-x-2 sm:flex">
            {THUMBS.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="h-10 w-10 rounded-lg border-2 border-obsidian-dark object-cover"
              />
            ))}
          </div>
          <a
            href={getBusinessWhatsAppUrl('Hi — I want the CBD shop KSh 500 OFF offer.')}
            target="_blank"
            rel="noopener noreferrer"
            className="ag-btn ag-btn--lime"
          >
            <MaterialIcon name="chat" className="text-[1rem]" />
            WhatsApp shop
          </a>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ag-btn ag-btn--ghost"
          >
            Get Directions
            <MaterialIcon name="arrow_outward" className="text-[1rem]" />
          </a>
          <Link href="/contact" className="sr-only">
            Contact
          </Link>
        </div>
      </div>
    </section>
  );
}

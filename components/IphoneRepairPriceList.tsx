'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { RepairBookingForm, type RepairBookingPreset } from '@/components/RepairBookingForm';
import { OpenAPI } from '@/lib/api/generated';
import { apiBaseUrl } from '@/lib/api/openapi';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';
import {
  IPHONE_SCREEN_GRADE_LABELS,
  buildIphoneRepairModelOffers,
  findCatalogImageForRepairModel,
  formatRepairKes,
  type CatalogImageSource,
  type IphoneRepairModelOffer,
  type IphoneRepairService,
  type IphoneScreenGrade,
  type RepairLineItem,
} from '@/lib/repair/iphoneRepairPrices';

async function fetchIphoneCatalogImages(): Promise<CatalogImageSource[]> {
  OpenAPI.BASE = apiBaseUrl;
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
  const res = await fetch(
    `${base}/api/v1/public/products/?search=iPhone&page_size=100&page=1`,
    { credentials: 'omit', headers, cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: CatalogImageSource[] };
  return (data.results ?? []).filter((p) => /iphone/i.test(p.product_name || ''));
}

type CardSelection = {
  battery: boolean;
  screen: boolean;
  screenGrade: IphoneScreenGrade | null;
};

function defaultSelection(offer: IphoneRepairModelOffer): CardSelection {
  const firstScreen = offer.screens[0] ?? null;
  return {
    battery: Boolean(offer.battery),
    screen: !offer.battery && offer.screens.length > 0,
    screenGrade: firstScreen?.screenGrade ?? null,
  };
}

function lineItemsFor(
  offer: IphoneRepairModelOffer,
  selection: CardSelection
): RepairLineItem[] {
  const items: RepairLineItem[] = [];
  if (selection.battery && offer.battery) {
    items.push({
      service: 'battery',
      label: 'Battery',
      priceKes: offer.battery.priceKes,
    });
  }
  if (selection.screen && offer.screens.length > 0) {
    const screen =
      offer.screens.find((row) => row.screenGrade === selection.screenGrade) ||
      offer.screens[0];
    const grade = screen.screenGrade
      ? IPHONE_SCREEN_GRADE_LABELS[screen.screenGrade]
      : 'Screen';
    items.push({
      service: 'screen',
      label: `Screen · ${grade}`,
      priceKes: screen.priceKes,
      screenGrade: screen.screenGrade,
    });
  }
  return items;
}

const REPAIR_CARD_PEEK_EVENT = 'repair-card-peek';

function RepairModelCard({
  offer,
  imageUrl,
  onRequestRepair,
}: {
  offer: IphoneRepairModelOffer;
  imageUrl: string;
  onRequestRepair: (preset: RepairBookingPreset) => void;
}) {
  const [selection, setSelection] = useState<CardSelection>(() => defaultSelection(offer));
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const isTouchLikeRef = useRef(false);

  const items = useMemo(() => lineItemsFor(offer, selection), [offer, selection]);
  const totalKes = items.reduce((sum, item) => sum + item.priceKes, 0);
  const canBook = items.length > 0 && totalKes > 0;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: none)');
    const update = () => {
      isTouchLikeRef.current = mq.matches;
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isPeekOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsPeekOpen(false);
      }
    };
    const onOtherPeek = (event: Event) => {
      const detail = (event as CustomEvent<string | undefined>).detail;
      if (detail !== offer.model) setIsPeekOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener(REPAIR_CARD_PEEK_EVENT, onOtherPeek);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener(REPAIR_CARD_PEEK_EVENT, onOtherPeek);
    };
  }, [isPeekOpen, offer.model]);

  const openPeek = () => {
    setIsPeekOpen(true);
    window.dispatchEvent(new CustomEvent(REPAIR_CARD_PEEK_EVENT, { detail: offer.model }));
  };

  const openBooking = () => {
    if (!canBook) return;
    const services = items.map((item) => item.service);
    onRequestRepair({
      model: offer.model,
      brand: 'Apple',
      deviceType: 'Phone',
      services,
      screenGrade: items.find((item) => item.service === 'screen')?.screenGrade,
      lineItems: items,
      totalKes,
    });
  };

  const toggleService = (service: IphoneRepairService) => {
    setSelection((prev) => {
      if (service === 'battery') {
        const nextBattery = !prev.battery;
        if (!nextBattery && !prev.screen && offer.screens.length > 0) {
          return {
            ...prev,
            battery: false,
            screen: true,
            screenGrade: prev.screenGrade || offer.screens[0]?.screenGrade || null,
          };
        }
        if (!nextBattery && !prev.screen) return prev;
        return { ...prev, battery: nextBattery };
      }

      const nextScreen = !prev.screen;
      if (!nextScreen && !prev.battery && offer.battery) {
        return { ...prev, screen: false, battery: true };
      }
      if (!nextScreen && !prev.battery) return prev;
      return {
        ...prev,
        screen: nextScreen,
        screenGrade: prev.screenGrade || offer.screens[0]?.screenGrade || null,
      };
    });
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('button, [role="button"], input, select, textarea, label'));
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return;
    if (!isTouchLikeRef.current) return;
    if (!isPeekOpen) openPeek();
  };

  const handlePeekToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPeekOpen) {
      setIsPeekOpen(false);
      return;
    }
    openPeek();
  };

  const handleBookClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isTouchLikeRef.current && !isPeekOpen) {
      openPeek();
      return;
    }
    openBooking();
  };

  return (
    <article
      ref={cardRef}
      className={`repair-page__model-card${isPeekOpen ? ' repair-page__model-card--peek' : ''}`}
      onClick={handleCardClick}
      aria-expanded={isPeekOpen}
    >
      <div className="repair-page__model-card-media">
        <CloudinaryImage
          src={imageUrl}
          alt={offer.model}
          preset="productThumb"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="repair-page__model-card-image"
          fill
        />
        <button
          type="button"
          className={`repair-page__model-card-peek-toggle${
            isPeekOpen ? ' repair-page__model-card-peek-toggle--open' : ''
          }`}
          onClick={handlePeekToggle}
          aria-label={isPeekOpen ? 'Hide repair options' : 'Show repair options'}
          aria-expanded={isPeekOpen}
        >
          {isPeekOpen ? (
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          )}
        </button>
      </div>

      <div className="repair-page__model-card-footer">
        <div className="repair-page__model-card-bar">
          <h3 className="repair-page__model-card-name">{offer.model}</h3>
          <button type="button" className="repair-page__model-card-buy" onClick={handleBookClick}>
            Book
          </button>
        </div>

        <div className="repair-page__model-card-overlay" aria-hidden={!isPeekOpen}>
          <div className="repair-page__model-card-overlay-head">
            <h3 className="repair-page__model-card-overlay-name">{offer.model}</h3>
            <button
              type="button"
              className="repair-page__model-card-buy"
              onClick={handleBookClick}
            >
              Book
            </button>
          </div>

          <p className="repair-page__model-card-overlay-title">Repair options</p>

          <div
            className="repair-page__model-card-options"
            role="group"
            aria-label={`${offer.model} repairs`}
          >
            {offer.battery ? (
              <label className="repair-page__model-card-option">
                <input
                  type="checkbox"
                  checked={selection.battery}
                  onChange={() => toggleService('battery')}
                />
                <span className="repair-page__model-card-option-copy">
                  <span className="repair-page__model-card-option-label">Battery</span>
                  <span className="repair-page__model-card-option-price">
                    {formatRepairKes(offer.battery.priceKes)}
                  </span>
                </span>
              </label>
            ) : null}

            {offer.screens.length > 0 ? (
              <label className="repair-page__model-card-option">
                <input
                  type="checkbox"
                  checked={selection.screen}
                  onChange={() => toggleService('screen')}
                />
                <span className="repair-page__model-card-option-copy">
                  <span className="repair-page__model-card-option-label">Screen</span>
                  <span className="repair-page__model-card-option-price">
                    {formatRepairKes(
                      (
                        offer.screens.find((row) => row.screenGrade === selection.screenGrade) ||
                        offer.screens[0]
                      ).priceKes
                    )}
                  </span>
                </span>
              </label>
            ) : null}
          </div>

          {selection.screen && offer.screens.length > 1 ? (
            <label className="repair-page__model-card-grade">
              <span className="sr-only">Screen grade</span>
              <select
                className="repair-page__model-card-grade-select"
                value={selection.screenGrade ?? offer.screens[0]?.screenGrade ?? ''}
                onChange={(e) =>
                  setSelection((prev) => ({
                    ...prev,
                    screenGrade: e.target.value as IphoneScreenGrade,
                  }))
                }
              >
                {offer.screens.map((row) => (
                  <option key={`${row.model}-${row.screenGrade}`} value={row.screenGrade}>
                    {row.screenGrade
                      ? IPHONE_SCREEN_GRADE_LABELS[row.screenGrade]
                      : 'Screen'}{' '}
                    · {formatRepairKes(row.priceKes)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            className="repair-page__model-card-total"
            disabled={!canBook}
            onClick={(e) => {
              e.stopPropagation();
              openBooking();
            }}
          >
            <span>Total</span>
            <strong>{canBook ? formatRepairKes(totalKes) : '—'}</strong>
          </button>
        </div>
      </div>
    </article>
  );
}

export function IphoneRepairPriceList() {
  const [query, setQuery] = useState('');
  const [bookingPreset, setBookingPreset] = useState<RepairBookingPreset | null>(null);
  const catalogQuery = useQuery({
    queryKey: ['repair', 'iphone-catalog-images'],
    queryFn: fetchIphoneCatalogImages,
    staleTime: 10 * 60 * 1000,
  });

  const offers = useMemo(() => buildIphoneRepairModelOffers(), []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const products = catalogQuery.data ?? [];
    return offers
      .filter((offer) => !q || offer.model.toLowerCase().includes(q))
      .map((offer) => ({
        ...offer,
        imageUrl:
          findCatalogImageForRepairModel(offer.model, products) ||
          getPlaceholderProductImage(offer.model),
      }));
  }, [offers, query, catalogQuery.data]);

  useEffect(() => {
    if (!bookingPreset) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [bookingPreset]);

  return (
    <section
      id="iphone-repair-prices"
      className="repair-page__prices"
      aria-labelledby="iphone-repair-prices-title"
    >
      <div className="repair-page__prices-header">
        <div>
          <p className="repair-page__prices-eyebrow">Apple · iPhone</p>
          <h2 id="iphone-repair-prices-title" className="repair-page__prices-title">
            iPhone repair prices
          </h2>
          <p className="repair-page__prices-sub">
            Hover a model to choose battery and/or screen, then tap the total to request a repair.
            On phones, tap the options button on a card. Listed rates are for drop-off at our Nairobi
            CBD shop and may vary after inspection.
          </p>
        </div>
        <label className="repair-page__prices-search">
          <span className="sr-only">Search iPhone model</span>
          <input
            type="search"
            className="checkout-modal__input"
            placeholder="Search model… e.g. 13 Pro"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      {rows.length > 0 ? (
        <ul className="repair-page__prices-grid">
          {rows.map((row) => (
            <li key={row.model}>
              <RepairModelCard
                offer={row}
                imageUrl={row.imageUrl}
                onRequestRepair={setBookingPreset}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="repair-page__prices-empty">No models match that search.</p>
      )}

      {bookingPreset ? (
        <div
          className="checkout-modal repair-page__booking-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="repair-booking-modal-title"
          onClick={() => setBookingPreset(null)}
        >
          <div
            className="checkout-modal__panel repair-page__booking-modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="checkout-modal__close"
              aria-label="Close repair request"
              onClick={() => setBookingPreset(null)}
            >
              <svg className="checkout-modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 id="repair-booking-modal-title" className="checkout-modal__title">
              Request a repair
            </h2>
            <p className="repair-page__booking-modal-sub">
              Confirm your details and continue on WhatsApp — we&apos;ll take it from there.
            </p>
            <RepairBookingForm
              key={`${bookingPreset.model}-${bookingPreset.totalKes}-${bookingPreset.services.join(',')}`}
              preset={bookingPreset}
              onSubmitted={() => setBookingPreset(null)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** @deprecated use IphoneRepairPriceList */
export function IphoneBatteryPriceList() {
  return <IphoneRepairPriceList />;
}

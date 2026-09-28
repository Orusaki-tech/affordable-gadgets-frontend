'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  patchStudioPromotion,
  resolveStudioImageUrl,
  StudioApiError,
  type StudioPromotion,
} from '@/lib/studio/api';

const LOCATION_OPTIONS = [
  { value: 'homepage_hero', label: 'Homepage hero', hint: 'Main carousel' },
  { value: 'stories_carousel', label: 'Stories', hint: 'Story strip' },
  { value: 'special_offers', label: 'Special offers', hint: 'Offers block' },
  { value: 'flash_sales', label: 'Flash sales', hint: 'Timed deals' },
  { value: 'cbd_ribbon', label: 'CBD ribbon', hint: 'Top ribbon' },
  { value: 'brand_banner', label: 'Brand banner', hint: 'Products brand page' },
] as const;

type StudioPromotionEditorProps = {
  promotion: StudioPromotion;
  roleHint?: string;
  onSaved?: (promotion: StudioPromotion) => void;
};

function normalizeLocations(raw: StudioPromotion['display_locations']): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function toDatetimeLocal(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StudioPromotionEditor({
  promotion,
  roleHint,
  onSaved,
}: StudioPromotionEditorProps) {
  const [title, setTitle] = useState(promotion.title || '');
  const [description, setDescription] = useState(promotion.description || '');
  const [isActive, setIsActive] = useState(promotion.is_active ?? true);
  const [discountPercentage, setDiscountPercentage] = useState(
    promotion.discount_percentage != null ? String(promotion.discount_percentage) : ''
  );
  const [discountAmount, setDiscountAmount] = useState(
    promotion.discount_amount != null ? String(promotion.discount_amount) : ''
  );
  const [locations, setLocations] = useState<string[]>(() =>
    normalizeLocations(promotion.display_locations)
  );
  const [carouselPosition, setCarouselPosition] = useState(
    promotion.carousel_position != null ? String(promotion.carousel_position) : ''
  );
  const [startDate, setStartDate] = useState(toDatetimeLocal(promotion.start_date));
  const [endDate, setEndDate] = useState(toDatetimeLocal(promotion.end_date));
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(promotion.title || '');
    setDescription(promotion.description || '');
    setIsActive(promotion.is_active ?? true);
    setDiscountPercentage(
      promotion.discount_percentage != null ? String(promotion.discount_percentage) : ''
    );
    setDiscountAmount(
      promotion.discount_amount != null ? String(promotion.discount_amount) : ''
    );
    setLocations(normalizeLocations(promotion.display_locations));
    setCarouselPosition(
      promotion.carousel_position != null ? String(promotion.carousel_position) : ''
    );
    setStartDate(toDatetimeLocal(promotion.start_date));
    setEndDate(toDatetimeLocal(promotion.end_date));
    setBannerFile(null);
    setBannerPreview(null);
  }, [promotion]);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const currentBanner =
    bannerPreview ||
    resolveStudioImageUrl(promotion.banner_image_url, [promotion.banner_image]);

  const toggleLocation = (value: string) => {
    setLocations((prev) =>
      prev.includes(value) ? prev.filter((loc) => loc !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (locations.length === 0) {
      setError('Pick at least one place this promo should appear.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<
        string,
        string | Blob | boolean | number | null | undefined | string[]
      > = {
        title: title.trim(),
        description: description.trim(),
        is_active: isActive,
        discount_percentage: discountPercentage.trim() || null,
        discount_amount: discountAmount.trim() || null,
        display_locations: locations,
        carousel_position: carouselPosition.trim() ? Number(carouselPosition) : null,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : null,
      };
      if (bannerFile) {
        payload.banner_image = bannerFile;
      }
      const saved = await patchStudioPromotion(promotion.id, payload);
      onSaved?.(saved);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="studio-editor studio-editor--flush" onSubmit={handleSubmit}>
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Promotion'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            {title.trim() || promotion.title || `Promotion #${promotion.id}`}
          </h2>
        </div>
        <label className={`studio-switch${isActive ? ' is-on' : ''}`}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>{isActive ? 'Active' : 'Off'}</span>
        </label>
      </div>

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}

      <section className="studio-editor__section">
        <div className="studio-editor__section-head">
          <h3>Banner</h3>
          <label className="studio-btn studio-btn--ghost studio-images__upload">
            {bannerFile ? 'Replace' : currentBanner ? 'Change' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              disabled={saving}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (bannerPreview) URL.revokeObjectURL(bannerPreview);
                setBannerFile(file);
                setBannerPreview(file ? URL.createObjectURL(file) : null);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {currentBanner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentBanner} alt="" className="studio-images__preview studio-images__preview--banner" />
        ) : (
          <div className="studio-dropzone">Drop or upload a hero banner</div>
        )}
      </section>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Basics</h3>
        <div className="studio-editor__stack">
          <label className="studio-field">
            <span>Title</span>
            <input
              className="studio-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="studio-field">
            <span>Description</span>
            <textarea
              className="studio-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional short line for the promo"
            />
          </label>
        </div>
      </section>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Offer</h3>
        <div className="studio-editor__grid">
          <label className="studio-field">
            <span>Discount %</span>
            <input
              className="studio-input"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </label>
          <label className="studio-field">
            <span>Amount (KES)</span>
            <input
              className="studio-input"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </label>
        </div>
      </section>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Schedule & order</h3>
        <div className="studio-editor__grid">
          <label className="studio-field">
            <span>Starts</span>
            <input
              className="studio-input"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label className="studio-field">
            <span>Ends</span>
            <input
              className="studio-input"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <label className="studio-field studio-field--full">
            <span>Hero order</span>
            <input
              className="studio-input"
              value={carouselPosition}
              onChange={(e) => setCarouselPosition(e.target.value)}
              inputMode="numeric"
              placeholder="1"
            />
            <span className="studio-field__help">1 = first slide on the homepage hero</span>
          </label>
        </div>
      </section>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Where it shows</h3>
        <p className="studio-editor__hint studio-editor__hint--tight">
          Toggle the surfaces that should render this promo.
        </p>
        <div className="studio-chip-grid" role="group" aria-label="Display locations">
          {LOCATION_OPTIONS.map((opt) => {
            const on = locations.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className={`studio-chip${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => toggleLocation(opt.value)}
              >
                <span className="studio-chip__label">{opt.label}</span>
                <span className="studio-chip__hint">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="studio-editor__footer">
        <button type="submit" className="studio-btn studio-btn--primary studio-btn--block" disabled={saving}>
          {saving ? 'Saving…' : 'Save promotion'}
        </button>
      </div>
    </form>
  );
}

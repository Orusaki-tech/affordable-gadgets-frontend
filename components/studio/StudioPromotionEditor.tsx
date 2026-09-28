'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  patchStudioPromotion,
  resolveStudioImageUrl,
  StudioApiError,
  type StudioPromotion,
} from '@/lib/studio/api';

const LOCATION_OPTIONS = [
  { value: 'homepage_hero', label: 'Homepage hero' },
  { value: 'stories_carousel', label: 'Stories carousel' },
  { value: 'special_offers', label: 'Special offers' },
  { value: 'flash_sales', label: 'Flash sales' },
  { value: 'cbd_ribbon', label: 'CBD ribbon' },
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
      setError('Select at least one display location (same as ops admin).');
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
    <form className="studio-editor" onSubmit={handleSubmit}>
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">Edit promotion</h2>
        <p className="studio-editor__hint">
          {roleHint || 'Uses the same /api/inventory/promotions/ endpoint as ops admin.'}
        </p>
        <p className="studio-editor__hint">
          Editing: <strong>{promotion.title || `Promotion #${promotion.id}`}</strong>
        </p>
      </div>

      <label className="studio-field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="studio-field">
        <span>Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </label>
      <label className="studio-field">
        <span>Discount %</span>
        <input
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(e.target.value)}
          inputMode="decimal"
        />
      </label>
      <label className="studio-field">
        <span>Discount amount (KES)</span>
        <input
          value={discountAmount}
          onChange={(e) => setDiscountAmount(e.target.value)}
          inputMode="decimal"
        />
      </label>
      <label className="studio-field">
        <span>Start</span>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </label>
      <label className="studio-field">
        <span>End</span>
        <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>
      <label className="studio-field">
        <span>Hero / carousel order</span>
        <input
          value={carouselPosition}
          onChange={(e) => setCarouselPosition(e.target.value)}
          inputMode="numeric"
          placeholder="1 = first on homepage hero"
        />
      </label>

      <fieldset className="studio-field">
        <legend>Display locations</legend>
        <div className="studio-check-list">
          {LOCATION_OPTIONS.map((opt) => (
            <label key={opt.value} className="studio-field studio-field--checkbox">
              <input
                type="checkbox"
                checked={locations.includes(opt.value)}
                onChange={() => toggleLocation(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="studio-images studio-images--single">
        <div className="studio-images__head">
          <h3 className="studio-images__title">Banner image</h3>
          <label className="studio-btn studio-btn--ghost studio-images__upload">
            {bannerFile ? 'Change image' : 'Upload image'}
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
          <img src={currentBanner} alt="" className="studio-images__preview" />
        ) : (
          <p className="studio-images__empty">No banner yet.</p>
        )}
      </div>

      <label className="studio-field studio-field--checkbox">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span>Active</span>
      </label>
      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save promotion'}
      </button>
    </form>
  );
}

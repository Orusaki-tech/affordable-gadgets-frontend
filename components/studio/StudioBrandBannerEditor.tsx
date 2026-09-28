'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  brandBannerPromotionCode,
  createStudioPromotion,
  findStudioBrandBannerPromotion,
  patchStudioPromotion,
  resolveStudioImageUrl,
  StudioApiError,
  type StudioPromotion,
} from '@/lib/studio/api';
import { getBrandBannerConfig } from '@/lib/config/products-brand-banners';

type StudioBrandBannerEditorProps = {
  brandFilter: string;
  roleHint?: string;
  onSaved?: (promotion: StudioPromotion) => void;
};

function yearAheadIsoRange(): { start: string; end: string } {
  const start = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 2);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function StudioBrandBannerEditor({
  brandFilter,
  roleHint,
  onSaved,
}: StudioBrandBannerEditorProps) {
  const fallback = getBrandBannerConfig(brandFilter);
  const [promotion, setPromotion] = useState<StudioPromotion | null>(null);
  const [href, setHref] = useState(fallback?.href || '');
  const [isActive, setIsActive] = useState(true);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await findStudioBrandBannerPromotion(brandFilter);
        if (cancelled) return;
        setPromotion(existing);
        setIsActive(existing?.is_active ?? true);
        setHref((existing?.description || fallback?.href || '').trim());
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof StudioApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Could not load brand banner'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brandFilter, fallback?.href]);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const currentBanner =
    bannerPreview ||
    resolveStudioImageUrl(promotion?.banner_image_url, [promotion?.banner_image]) ||
    fallback?.backgroundImage ||
    null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (!promotion && !bannerFile && !fallback?.backgroundImage) {
      setError('Upload a banner image for this brand.');
      return;
    }
    if (!promotion && !bannerFile) {
      setError('Upload a banner image to create this brand banner.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string | Blob | boolean | number | null | undefined | string[]> = {
        title: `${brandFilter} brand banner`,
        description: href.trim(),
        listing_brand: brandFilter.trim(),
        display_locations: ['brand_banner'],
        is_active: isActive,
        promotion_code: brandBannerPromotionCode(brandFilter),
        discount_percentage: null,
        discount_amount: null,
      };
      if (bannerFile) payload.banner_image = bannerFile;

      let saved: StudioPromotion;
      if (promotion?.id) {
        saved = await patchStudioPromotion(promotion.id, payload);
      } else {
        const range = yearAheadIsoRange();
        payload.start_date = range.start;
        payload.end_date = range.end;
        saved = await createStudioPromotion(payload);
      }
      setPromotion(saved);
      setBannerFile(null);
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
        setBannerPreview(null);
      }
      setMsg('Brand banner saved — it will show on this brand’s products page.');
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

  if (loading) {
    return <p className="studio-editor__hint">Loading {brandFilter} banner…</p>;
  }

  return (
    <form className="studio-editor studio-editor--flush" onSubmit={handleSubmit}>
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Brand banner'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            {brandFilter} products banner
          </h2>
          <p className="studio-editor__hint studio-editor__hint--tight">
            Upload the hero image for /products?brand_filter={brandFilter}. Static fallback stays
            until you save a Studio banner.
          </p>
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
      {msg && (
        <div className="studio-alert studio-alert--ok" role="status">
          {msg}
        </div>
      )}

      <section className="studio-editor__section">
        <div className="studio-editor__section-head">
          <h3>Banner image</h3>
          <label className="studio-btn studio-btn--ghost studio-images__upload">
            {bannerFile || currentBanner ? 'Replace' : 'Upload'}
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
          <img
            src={currentBanner}
            alt=""
            className="studio-images__preview studio-images__preview--banner"
          />
        ) : (
          <div className="studio-dropzone">Upload a wide brand hero (≈16:9 or wider)</div>
        )}
      </section>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Optional link</h3>
        <label className="studio-field">
          <span>Click-through URL</span>
          <input
            className="studio-input"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/products/apple-iphone-18-pro-max"
          />
          <span className="studio-field__help">Leave blank for a non-clickable banner.</span>
        </label>
      </section>

      <div className="studio-editor__footer">
        <button
          type="submit"
          className="studio-btn studio-btn--primary studio-btn--block"
          disabled={saving}
        >
          {saving ? 'Saving…' : promotion ? 'Save brand banner' : 'Create brand banner'}
        </button>
      </div>
    </form>
  );
}

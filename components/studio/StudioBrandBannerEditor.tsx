'use client';

import { useEffect, useState } from 'react';
import {
  brandBannerPromotionCode,
  findStudioBrandBannerPromotion,
  StudioApiError,
  type StudioPromotion,
} from '@/lib/studio/api';
import { getBrandBannerConfig } from '@/lib/config/products-brand-banners';
import { StudioPromotionEditor } from '@/components/studio/StudioPromotionEditor';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const existing = await findStudioBrandBannerPromotion(brandFilter);
        if (cancelled) return;
        setPromotion(existing);
        setEditorKey((k) => k + 1);
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
  }, [brandFilter]);

  if (loading) {
    return <p className="studio-editor__hint">Loading {brandFilter} banner…</p>;
  }

  const schedule = yearAheadIsoRange();
  const defaults = {
    title: `${brandFilter} brand banner`,
    description: (promotion?.description || fallback?.href || '').trim(),
    listing_brand: brandFilter.trim(),
    promotion_code: brandBannerPromotionCode(brandFilter),
    display_locations: ['brand_banner'] as string[],
    start_date: schedule.start,
    end_date: schedule.end,
  };

  return (
    <div className="studio-editor studio-editor--flush">
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Brand banner'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            {brandFilter} products banner
          </h2>
          <p className="studio-editor__hint studio-editor__hint--tight">
            Upload the hero for /products?brand_filter={brandFilter}. Set Starts/Ends so it stays
            live. Description can hold an optional click-through URL.
          </p>
        </div>
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

      {!promotion && fallback?.backgroundImage && (
        <section className="studio-editor__section">
          <p className="studio-editor__hint studio-editor__hint--tight">
            Static fallback is still showing until you create a Studio banner.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fallback.backgroundImage}
            alt=""
            className="studio-images__preview studio-images__preview--banner"
          />
        </section>
      )}

      <StudioPromotionEditor
        key={`${promotion?.id ?? 'new'}-${editorKey}`}
        promotion={promotion}
        roleHint={`${brandFilter} brand banner`}
        defaults={defaults}
        forceLocations={['brand_banner']}
        lockLocations
        onSaved={(saved) => {
          setPromotion(saved);
          setMsg('Brand banner saved — it will show on this brand’s products page.');
          onSaved?.(saved);
        }}
      />
    </div>
  );
}

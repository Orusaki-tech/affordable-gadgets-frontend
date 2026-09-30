'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createStudioPromotion,
  listStudioPromotions,
  patchStudioPromotion,
  resolveStudioImageUrl,
  StudioApiError,
  studioPromotionHasLocation,
  type StudioPromotion,
} from '@/lib/studio/api';

type StudioHomepageHeroEditorProps = {
  roleHint?: string;
  /** Prefer editing this promotion when opening from an active slide. */
  preferPromotionId?: number | null;
  onSaved?: (promotion: StudioPromotion) => void;
};

function yearAheadIsoRange(): { start: string; end: string } {
  const start = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 2);
  return { start: start.toISOString(), end: end.toISOString() };
}

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

function withHomepageHero(locations: string[]): string[] {
  return locations.includes('homepage_hero')
    ? locations
    : [...locations, 'homepage_hero'];
}

function isPromotionWindowActive(promotion: StudioPromotion | null | undefined): boolean {
  if (!promotion?.is_active) return false;
  const now = Date.now();
  const start = promotion.start_date ? new Date(promotion.start_date).getTime() : NaN;
  const end = promotion.end_date ? new Date(promotion.end_date).getTime() : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= now && end >= now;
}

/** Public storefront only shows promos in an active date window — revive if expired. */
function storefrontDatePayload(promotion?: StudioPromotion | null): {
  start_date?: string;
  end_date?: string;
} {
  const range = yearAheadIsoRange();
  if (!promotion) return range;
  if (isPromotionWindowActive(promotion)) return {};
  return range;
}

export function StudioHomepageHeroEditor({
  roleHint,
  preferPromotionId,
  onSaved,
}: StudioHomepageHeroEditorProps) {
  const [allPromotions, setAllPromotions] = useState<StudioPromotion[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(preferPromotionId ?? null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [carouselPosition, setCarouselPosition] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const heroPromotions = useMemo(
    () => allPromotions.filter((p) => studioPromotionHasLocation(p, 'homepage_hero')),
    [allPromotions]
  );

  const liveHeroCount = useMemo(
    () => heroPromotions.filter((p) => isPromotionWindowActive(p)).length,
    [heroPromotions]
  );

  const selected = useMemo(() => {
    if (creating) return null;
    if (selectedId != null) {
      return allPromotions.find((p) => p.id === selectedId) ?? null;
    }
    return (
      heroPromotions.find((p) => isPromotionWindowActive(p)) ?? heroPromotions[0] ?? null
    );
  }, [allPromotions, creating, heroPromotions, selectedId]);

  const reload = async () => {
    const data = await listStudioPromotions({ page: 1 });
    const rows = (data.results ?? []).filter((p) => p.id);
    setAllPromotions(rows);
    return rows;
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await reload();
        if (cancelled) return;
        const preferred =
          preferPromotionId != null
            ? rows.find((p) => p.id === preferPromotionId) ?? null
            : null;
        const heroes = rows.filter((p) => studioPromotionHasLocation(p, 'homepage_hero'));
        const liveHero = heroes.find((p) => isPromotionWindowActive(p));
        if (preferred) {
          setSelectedId(preferred.id);
          setCreating(false);
        } else if (liveHero?.id) {
          setSelectedId(liveHero.id);
          setCreating(false);
        } else if (heroes[0]?.id) {
          // Expired heroes still editable so editors can revive them.
          setSelectedId(heroes[0].id);
          setCreating(false);
        } else {
          setCreating(true);
          setSelectedId(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof StudioApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Could not load promotions'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferPromotionId]);

  useEffect(() => {
    if (!selected) {
      if (creating) {
        setTitle('');
        setDescription('');
        setCarouselPosition(String((heroPromotions.length || 0) + 1));
        setIsActive(true);
      }
      return;
    }
    setTitle(selected.title || '');
    setDescription(selected.description || '');
    setCarouselPosition(
      selected.carousel_position != null ? String(selected.carousel_position) : '1'
    );
    setIsActive(selected.is_active ?? true);
    setBannerFile(null);
    setBannerPreview(null);
  }, [selected, creating, heroPromotions.length]);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const currentBanner =
    bannerPreview ||
    resolveStudioImageUrl(selected?.banner_image_url, [selected?.banner_image]) ||
    null;

  const startCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setError(null);
    setMsg(null);
    setTitle('');
    setDescription('');
    setCarouselPosition(String((heroPromotions.length || 0) + 1));
    setIsActive(true);
    setBannerFile(null);
    setBannerPreview(null);
  };

  const placeOnHero = async (promotion: StudioPromotion) => {
    if (!promotion.id) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const locations = withHomepageHero(normalizeLocations(promotion.display_locations));
      const datePayload = storefrontDatePayload(promotion);
      const saved = await patchStudioPromotion(promotion.id, {
        display_locations: locations,
        carousel_position:
          promotion.carousel_position != null
            ? promotion.carousel_position
            : heroPromotions.length + 1,
        is_active: true,
        ...datePayload,
      });
      await reload();
      setCreating(false);
      setSelectedId(saved.id);
      setMsg(
        datePayload.start_date
          ? `“${saved.title || 'Promotion'}” placed on the hero and date window revived for the storefront.`
          : `“${saved.title || 'Promotion'}” is now on the homepage hero.`
      );
      onSaved?.(saved);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not place promotion on hero'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    if (!title.trim()) {
      setError('Add a title for this hero banner.');
      return;
    }
    if (!selected && !bannerFile) {
      setError('Upload a banner image to create the homepage hero.');
      return;
    }
    if (selected && !currentBanner && !bannerFile) {
      setError('Upload a banner image — homepage hero requires a banner.');
      return;
    }
    setSaving(true);
    try {
      const pos = Number(carouselPosition);
      const datePayload = storefrontDatePayload(selected);
      const payload: Record<string, string | Blob | boolean | number | null | undefined | string[]> =
        {
          title: title.trim(),
          description: description.trim(),
          display_locations: withHomepageHero(
            selected ? normalizeLocations(selected.display_locations) : []
          ),
          is_active: isActive,
          carousel_position: Number.isFinite(pos) && pos > 0 ? pos : 1,
          ...datePayload,
        };
      if (bannerFile) payload.banner_image = bannerFile;

      let saved: StudioPromotion;
      if (selected?.id) {
        saved = await patchStudioPromotion(selected.id, payload);
      } else {
        // Create always needs an explicit active window for the public API.
        const range = yearAheadIsoRange();
        payload.start_date = range.start;
        payload.end_date = range.end;
        payload.is_active = true;
        saved = await createStudioPromotion(payload);
      }
      await reload();
      setCreating(false);
      setSelectedId(saved.id);
      setBannerFile(null);
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
        setBannerPreview(null);
      }
      setMsg(
        selected
          ? datePayload.start_date
            ? 'Homepage hero saved and date window revived — it will show on the storefront.'
            : 'Homepage hero saved — it will show on the storefront banner.'
          : 'Homepage hero created — it will show on the storefront banner.'
      );
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
    return <p className="studio-editor__hint">Loading homepage hero…</p>;
  }

  const candidates = allPromotions.filter(
    (p) => p.id && !studioPromotionHasLocation(p, 'homepage_hero')
  );

  return (
    <form className="studio-editor studio-editor--flush" onSubmit={handleSubmit}>
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Homepage hero'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            {creating ? 'New homepage hero' : selected?.title || 'Homepage hero banner'}
          </h2>
          <p className="studio-editor__hint studio-editor__hint--tight">
            Create or edit the storefront hero. Saving always applies the Homepage hero location and
            keeps an active date window so the banner appears publicly.
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

      {liveHeroCount === 0 && heroPromotions.length > 0 && !creating && (
        <div className="studio-alert" role="status">
          Hero promotions exist but their date window expired, so the storefront shows the
          placeholder. Save below to revive dates, or create a new hero.
        </div>
      )}

      <section className="studio-editor__section">
        <div className="studio-editor__row" style={{ justifyContent: 'space-between', gap: '0.75rem' }}>
          <p className="studio-field__label" style={{ margin: 0 }}>
            Hero slides ({heroPromotions.length}) · live {liveHeroCount}
          </p>
          <button type="button" className="studio-icon-btn studio-icon-btn--edit" onClick={startCreate}>
            <span>New hero</span>
          </button>
        </div>
        {heroPromotions.length > 0 ? (
          <ul className="studio-hero-placement__list" style={{ marginTop: '0.55rem' }}>
            {heroPromotions.map((promo, index) => {
              const live = isPromotionWindowActive(promo);
              return (
                <li key={promo.id}>
                  <button
                    type="button"
                    className={`studio-hero-placement__item${
                      !creating && selected?.id === promo.id
                        ? ' studio-hero-placement__item--active'
                        : ''
                    }`}
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(promo.id);
                      setMsg(null);
                      setError(null);
                    }}
                  >
                    <span className="studio-hero-placement__pos">
                      #{promo.carousel_position ?? index + 1}
                    </span>
                    <span className="studio-hero-placement__title">
                      {promo.title}
                      {!live ? ' (expired)' : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="studio-editor__hint">No homepage hero promotions yet — create one below.</p>
        )}
      </section>

      <section className="studio-editor__section">
        <label className="studio-field">
          <span className="studio-field__label">Title</span>
          <input
            className="studio-field__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Google Pixel 8 — zoom in"
          />
        </label>
        <label className="studio-field">
          <span className="studio-field__label">Description</span>
          <textarea
            className="studio-field__input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short supporting line shown with the offer"
          />
        </label>
        <label className="studio-field">
          <span className="studio-field__label">Carousel position</span>
          <input
            className="studio-field__input"
            type="number"
            min={1}
            value={carouselPosition}
            onChange={(e) => setCarouselPosition(e.target.value)}
          />
          <span className="studio-field__help">1 = first slide on the homepage hero</span>
        </label>
      </section>

      <section className="studio-editor__section">
        <p className="studio-field__label">Banner image {creating ? '(required)' : ''}</p>
        {currentBanner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentBanner}
            alt=""
            className="studio-editor__banner-preview"
            style={{ width: '100%', borderRadius: '0.75rem', marginBottom: '0.75rem' }}
          />
        ) : (
          <div className="studio-dropzone">Upload a hero banner image</div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setBannerFile(file);
            if (bannerPreview) URL.revokeObjectURL(bannerPreview);
            setBannerPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </section>

      {candidates.length > 0 && (
        <section className="studio-editor__section">
          <p className="studio-field__label">Or place an existing promotion on the hero</p>
          <ul className="studio-hero-placement__list">
            {candidates.slice(0, 12).map((promo) => (
              <li key={promo.id}>
                <button
                  type="button"
                  className="studio-hero-placement__item"
                  disabled={saving}
                  onClick={() => void placeOnHero(promo)}
                >
                  <span className="studio-hero-placement__title">
                    {promo.title}
                    {!isPromotionWindowActive(promo) ? ' (will revive dates)' : ''}
                  </span>
                  <span className="studio-icon-btn studio-icon-btn--edit">
                    <span>Place</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="studio-editor__actions">
        <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
          {saving
            ? 'Saving…'
            : creating
              ? 'Create homepage hero'
              : selected && !isPromotionWindowActive(selected)
                ? 'Revive & save homepage hero'
                : 'Save homepage hero'}
        </button>
      </div>
    </form>
  );
}

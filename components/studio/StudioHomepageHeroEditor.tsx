'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listStudioPromotions,
  patchStudioPromotion,
  StudioApiError,
  studioPromotionHasLocation,
  type StudioPromotion,
} from '@/lib/studio/api';
import { StudioPromotionEditor } from '@/components/studio/StudioPromotionEditor';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

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

  const startCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setError(null);
    setMsg(null);
    setEditorKey((k) => k + 1);
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
      setEditorKey((k) => k + 1);
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

  if (loading) {
    return <p className="studio-editor__hint">Loading homepage hero…</p>;
  }

  const candidates = allPromotions.filter(
    (p) => p.id && !studioPromotionHasLocation(p, 'homepage_hero')
  );

  const schedule = yearAheadIsoRange();
  const createDefaults = {
    display_locations: ['homepage_hero'] as string[],
    carousel_position: (heroPromotions.length || 0) + 1,
    start_date: schedule.start,
    end_date: schedule.end,
  };

  return (
    <div className="studio-editor studio-editor--flush">
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Homepage hero'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            {creating
              ? 'Create promotion (homepage hero)'
              : selected?.title || 'Homepage hero banner'}
          </h2>
          <p className="studio-editor__hint studio-editor__hint--tight">
            {creating
              ? 'Fill in the form below to create a new promotion. Homepage hero placement and an active date window are applied automatically.'
              : 'Edit this hero slide, or create a new promotion with the button above the slide list.'}
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

      {liveHeroCount === 0 && heroPromotions.length > 0 && !creating && (
        <div className="studio-alert" role="status">
          Hero promotions exist but their date window expired, so the storefront shows the
          placeholder. Update Starts/Ends below (or save with a fresh window) to revive them.
        </div>
      )}

      <section className="studio-editor__section">
        <div className="studio-editor__row" style={{ justifyContent: 'space-between', gap: '0.75rem' }}>
          <p className="studio-field__label" style={{ margin: 0 }}>
            Hero slides ({heroPromotions.length}) · live {liveHeroCount}
          </p>
          <button
            type="button"
            className="studio-btn studio-btn--primary"
            onClick={startCreate}
            disabled={creating}
          >
            Create promotion
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
                      setEditorKey((k) => k + 1);
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

      {creating && (
        <div className="studio-alert studio-alert--ok" role="status">
          Creating a new promotion — upload a banner, set Starts/Ends, then hit Create promotion.
        </div>
      )}

      <StudioPromotionEditor
        key={`${creating ? 'create' : `edit-${selected?.id ?? 'none'}`}-${editorKey}`}
        promotion={creating ? null : selected}
        roleHint={creating ? 'Create promotion' : 'Edit promotion'}
        defaults={creating ? createDefaults : { display_locations: ['homepage_hero'] }}
        forceLocations={['homepage_hero']}
        onSaved={async (saved) => {
          await reload();
          setCreating(false);
          setSelectedId(saved.id);
          setMsg(
            creating
              ? 'Promotion created and placed on the homepage hero.'
              : 'Homepage hero saved.'
          );
          onSaved?.(saved);
        }}
      />

      {!creating && candidates.length > 0 && (
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
    </div>
  );
}

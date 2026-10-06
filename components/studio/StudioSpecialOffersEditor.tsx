'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listAllStudioPromotions,
  patchStudioPromotion,
  resolveStudioImageUrl,
  StudioApiError,
  studioPromotionHasLocation,
  type StudioPromotion,
} from '@/lib/studio/api';
import { StudioPromotionEditor } from '@/components/studio/StudioPromotionEditor';

const LOCATION = 'special_offers' as const;

type StudioSpecialOffersEditorProps = {
  roleHint?: string;
  preferPromotionId?: number | null;
  onSaved?: (promotion: StudioPromotion) => void;
};

type DetailMode = 'pick' | 'edit' | 'create';

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

function withLocation(locations: string[]): string[] {
  return locations.includes(LOCATION) ? locations : [...locations, LOCATION];
}

function withoutLocation(locations: string[]): string[] {
  return locations.filter((loc) => loc !== LOCATION);
}

function isPromotionWindowActive(promotion: StudioPromotion | null | undefined): boolean {
  if (!promotion?.is_active) return false;
  const now = Date.now();
  const start = promotion.start_date ? new Date(promotion.start_date).getTime() : NaN;
  const end = promotion.end_date ? new Date(promotion.end_date).getTime() : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return start <= now && end >= now;
}

function storefrontDatePayload(promotion?: StudioPromotion | null): {
  start_date?: string;
  end_date?: string;
} {
  const range = yearAheadIsoRange();
  if (!promotion) return { start_date: range.start, end_date: range.end };
  if (isPromotionWindowActive(promotion)) return {};
  return { start_date: range.start, end_date: range.end };
}

function sortByCarousel(a: StudioPromotion, b: StudioPromotion): number {
  const ap = a.carousel_position ?? Number.MAX_SAFE_INTEGER;
  const bp = b.carousel_position ?? Number.MAX_SAFE_INTEGER;
  if (ap !== bp) return ap - bp;
  return (a.id ?? 0) - (b.id ?? 0);
}

function promoMeta(promo: StudioPromotion): string {
  const bits: string[] = [`#${promo.id}`];
  if (promo.promotion_code) bits.push(promo.promotion_code);
  if (promo.carousel_position != null) bits.push(`order ${promo.carousel_position}`);
  return bits.join(' · ');
}

function promoThumb(promo: StudioPromotion): string | null {
  return resolveStudioImageUrl(promo.banner_image_url || promo.banner_image) || null;
}

function OfferPromoRow({
  promo,
  index,
  selected,
  status,
  busy,
  primaryLabel,
  onPrimary,
  onEdit,
  onRemove,
}: {
  promo: StudioPromotion;
  index: number;
  selected?: boolean;
  status: 'live' | 'expired' | 'off';
  busy?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const thumb = promoThumb(promo);
  return (
    <li>
      <div
        className={`studio-featured-picker__row studio-hero-picker__row${
          selected ? ' studio-hero-picker__row--selected' : ''
        }`}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="studio-featured-picker__thumb" />
        ) : (
          <span className="studio-featured-picker__thumb studio-featured-picker__thumb--empty" />
        )}
        <div className="studio-hero-picker__copy">
          <p className="studio-featured-picker__name">
            {status !== 'off' ? (
              <span className="studio-hero-placement__pos">
                #{promo.carousel_position ?? index + 1}
              </span>
            ) : null}{' '}
            {promo.title || `Promotion #${promo.id}`}
          </p>
          <p className="studio-hero-picker__meta">
            {promoMeta(promo)}
            {status === 'live' ? (
              <span className="studio-hero-picker__badge studio-hero-picker__badge--live">Live</span>
            ) : null}
            {status === 'expired' ? (
              <span className="studio-hero-picker__badge studio-hero-picker__badge--expired">
                Expired
              </span>
            ) : null}
          </p>
        </div>
        <div className="studio-hero-picker__actions">
          <button
            type="button"
            className="studio-btn studio-btn--primary studio-btn--compact"
            disabled={busy}
            onClick={onPrimary}
          >
            {primaryLabel}
          </button>
          {onEdit ? (
            <button
              type="button"
              className="studio-btn studio-btn--ghost studio-btn--compact"
              disabled={busy}
              onClick={onEdit}
            >
              Edit
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              className="studio-btn studio-btn--danger studio-btn--compact"
              disabled={busy}
              onClick={onRemove}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function StudioSpecialOffersEditor({
  roleHint,
  preferPromotionId,
  onSaved,
}: StudioSpecialOffersEditorProps) {
  const [allPromotions, setAllPromotions] = useState<StudioPromotion[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(preferPromotionId ?? null);
  const [detailMode, setDetailMode] = useState<DetailMode>(
    preferPromotionId != null ? 'edit' : 'pick'
  );
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [catalogFilter, setCatalogFilter] = useState('');
  const [showExpired, setShowExpired] = useState(false);

  const sectionPromotions = useMemo(
    () =>
      allPromotions
        .filter((p) => studioPromotionHasLocation(p, LOCATION))
        .slice()
        .sort(sortByCarousel),
    [allPromotions]
  );

  const liveOffers = useMemo(
    () => sectionPromotions.filter((p) => isPromotionWindowActive(p)),
    [sectionPromotions]
  );

  const expiredOffers = useMemo(
    () => sectionPromotions.filter((p) => !isPromotionWindowActive(p)),
    [sectionPromotions]
  );

  const catalog = useMemo(() => {
    const q = catalogFilter.trim().toLowerCase();
    return allPromotions
      .filter((p) => p.id && !studioPromotionHasLocation(p, LOCATION))
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.title || ''} ${p.promotion_code || ''} ${p.id}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.title || '').localeCompare(b.title || '') || (a.id ?? 0) - (b.id ?? 0));
  }, [allPromotions, catalogFilter]);

  const selected = useMemo(() => {
    if (detailMode === 'create') return null;
    if (selectedId != null) {
      return allPromotions.find((p) => p.id === selectedId) ?? null;
    }
    return null;
  }, [allPromotions, detailMode, selectedId]);

  const schedule = useMemo(() => yearAheadIsoRange(), []);
  const createDefaults = useMemo(
    () => ({
      display_locations: [LOCATION] as string[],
      carousel_position: (liveOffers.length || sectionPromotions.length || 0) + 1,
      start_date: schedule.start,
      end_date: schedule.end,
    }),
    [liveOffers.length, schedule.end, schedule.start, sectionPromotions.length]
  );
  const editDefaults = useMemo(() => ({ display_locations: [LOCATION] as string[] }), []);
  const forceLocations = useMemo(() => [LOCATION], []);

  const reload = async () => {
    const rows = (await listAllStudioPromotions()).filter((p) => p.id);
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
        if (preferred?.id) {
          setSelectedId(preferred.id);
          setDetailMode('edit');
        } else {
          setDetailMode('pick');
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

  const openEdit = (promo: StudioPromotion) => {
    if (!promo.id) return;
    setDetailMode('edit');
    setSelectedId(promo.id);
    setMsg(null);
    setError(null);
    setEditorKey((k) => k + 1);
  };

  const startCreate = () => {
    setDetailMode('create');
    setSelectedId(null);
    setError(null);
    setMsg(null);
    setEditorKey((k) => k + 1);
  };

  const backToPicker = () => {
    setDetailMode('pick');
    setSelectedId(null);
    setMsg(null);
    setError(null);
  };

  const placeOnOffers = async (promotion: StudioPromotion, opts?: { revive?: boolean }) => {
    if (!promotion.id) return;
    setBusyId(promotion.id);
    setError(null);
    setMsg(null);
    try {
      const locations = withLocation(normalizeLocations(promotion.display_locations));
      const datePayload =
        opts?.revive || !isPromotionWindowActive(promotion)
          ? storefrontDatePayload(null)
          : storefrontDatePayload(promotion);
      const nextOrder =
        promotion.carousel_position != null
          ? promotion.carousel_position
          : (liveOffers.length || sectionPromotions.length || 0) + 1;
      const saved = await patchStudioPromotion(promotion.id, {
        display_locations: locations,
        carousel_position: nextOrder,
        is_active: true,
        ...datePayload,
      });
      await reload();
      setDetailMode('pick');
      setSelectedId(null);
      setMsg(`“${saved.title || 'Promotion'}” is now in Special Offers.`);
      onSaved?.(saved);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not add promotion to Special Offers'
      );
    } finally {
      setBusyId(null);
    }
  };

  const removeFromOffers = async (promotion: StudioPromotion) => {
    if (!promotion.id) return;
    if (
      !window.confirm(
        `Remove “${promotion.title || promotion.id}” from Special Offers? The promotion itself is kept.`
      )
    ) {
      return;
    }
    setBusyId(promotion.id);
    setError(null);
    setMsg(null);
    try {
      const locations = withoutLocation(normalizeLocations(promotion.display_locations));
      const saved = await patchStudioPromotion(promotion.id, {
        display_locations: locations,
      });
      await reload();
      if (selectedId === promotion.id) {
        setDetailMode('pick');
        setSelectedId(null);
      }
      setMsg(`“${saved.title || 'Promotion'}” removed from Special Offers.`);
      onSaved?.(saved);
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not remove promotion from Special Offers'
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="studio-editor__hint">Loading special offers…</p>;
  }

  const showEditor = detailMode === 'create' || detailMode === 'edit';

  return (
    <div className="studio-editor studio-editor--flush">
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Special offers'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            Choose special offers
          </h2>
          <p className="studio-editor__hint studio-editor__hint--tight">
            Only <strong>Live</strong> promotions appear in the Special Offers section. Add from
            catalog, revive expired ones, or create a new offer. Banner images should be{' '}
            <strong>square 1:1</strong>, ideally <strong>1080×1080 px</strong> (min 720×720).
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

      {liveOffers.length === 0 && (
        <div className="studio-alert" role="status">
          Nothing live in Special Offers right now. Add or revive a promotion below.
        </div>
      )}

      <section className="studio-editor__section">
        <div className="studio-editor__row" style={{ justifyContent: 'space-between', gap: '0.75rem' }}>
          <h3 className="studio-editor__section-title" style={{ margin: 0 }}>
            Live in Special Offers ({liveOffers.length})
          </h3>
          <button type="button" className="studio-btn studio-btn--primary" onClick={startCreate}>
            Create new
          </button>
        </div>
        {liveOffers.length === 0 ? (
          <p className="studio-images__empty">No live offers yet.</p>
        ) : (
          <ul className="studio-featured-picker__list">
            {liveOffers.map((promo, index) => (
              <OfferPromoRow
                key={promo.id}
                promo={promo}
                index={index}
                selected={detailMode === 'edit' && selectedId === promo.id}
                status="live"
                busy={busyId === promo.id}
                primaryLabel="Edit"
                onPrimary={() => openEdit(promo)}
                onRemove={() => void removeFromOffers(promo)}
              />
            ))}
          </ul>
        )}
      </section>

      {expiredOffers.length > 0 && (
        <section className="studio-editor__section">
          <button
            type="button"
            className="studio-hero-picker__toggle"
            onClick={() => setShowExpired((v) => !v)}
            aria-expanded={showExpired}
          >
            <h3 className="studio-editor__section-title" style={{ margin: 0 }}>
              Tagged but expired ({expiredOffers.length})
            </h3>
            <span>{showExpired ? 'Hide' : 'Show'}</span>
          </button>
          {showExpired ? (
            <ul className="studio-featured-picker__list">
              {expiredOffers.map((promo, index) => (
                <OfferPromoRow
                  key={promo.id}
                  promo={promo}
                  index={index}
                  selected={detailMode === 'edit' && selectedId === promo.id}
                  status="expired"
                  busy={busyId === promo.id}
                  primaryLabel="Revive"
                  onPrimary={() => void placeOnOffers(promo, { revive: true })}
                  onEdit={() => openEdit(promo)}
                  onRemove={() => void removeFromOffers(promo)}
                />
              ))}
            </ul>
          ) : (
            <p className="studio-editor__hint studio-editor__hint--tight">
              Hidden from shoppers until revived. They keep the Special Offers placement.
            </p>
          )}
        </section>
      )}

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Add from catalog</h3>
        <p className="studio-editor__hint studio-editor__hint--tight">
          Promotions not in Special Offers yet. Add places them live (date window refreshed if
          needed).
        </p>
        <label className="studio-field studio-field--full">
          <span className="sr-only">Filter promotions</span>
          <input
            className="studio-input"
            value={catalogFilter}
            onChange={(e) => setCatalogFilter(e.target.value)}
            placeholder="Filter by title, code, or id…"
          />
        </label>
        {catalog.length === 0 ? (
          <p className="studio-images__empty">
            {catalogFilter.trim()
              ? 'No promotions match that filter.'
              : 'Every promotion is already on the Special Offers list (live or expired).'}
          </p>
        ) : (
          <ul className="studio-featured-picker__list">
            {catalog.slice(0, 20).map((promo, index) => (
              <OfferPromoRow
                key={promo.id}
                promo={promo}
                index={index}
                status="off"
                busy={busyId === promo.id}
                primaryLabel="Add"
                onPrimary={() => void placeOnOffers(promo)}
                onEdit={() => openEdit(promo)}
              />
            ))}
          </ul>
        )}
        {catalog.length > 20 ? (
          <p className="studio-editor__hint studio-editor__hint--tight">
            Showing 20 of {catalog.length}. Refine the filter to find others.
          </p>
        ) : null}
      </section>

      {showEditor && (
        <section className="studio-editor__section studio-hero-picker__detail">
          <div className="studio-editor__row" style={{ justifyContent: 'space-between', gap: '0.75rem' }}>
            <h3 className="studio-editor__section-title" style={{ margin: 0 }}>
              {detailMode === 'create'
                ? 'New special offer'
                : `Edit · ${selected?.title || `#${selectedId}`}`}
            </h3>
            <button type="button" className="studio-btn studio-btn--ghost" onClick={backToPicker}>
              Back to list
            </button>
          </div>
          {detailMode === 'create' && (
            <div className="studio-alert studio-alert--ok" role="status">
              Upload a square banner (ideally 1080×1080 px), set Starts/Ends, then create. Special
              Offers placement is applied automatically.
            </div>
          )}
          <StudioPromotionEditor
            key={`${detailMode === 'create' ? 'create' : `edit-${selected?.id ?? 'none'}`}-${editorKey}`}
            promotion={detailMode === 'create' ? null : selected}
            roleHint={detailMode === 'create' ? 'Create promotion' : 'Edit promotion'}
            defaults={detailMode === 'create' ? createDefaults : editDefaults}
            forceLocations={forceLocations}
            onSaved={async (saved) => {
              await reload();
              setDetailMode('pick');
              setSelectedId(null);
              setMsg(
                detailMode === 'create'
                  ? 'Promotion created and added to Special Offers.'
                  : 'Special offer saved.'
              );
              onSaved?.(saved);
            }}
          />
        </section>
      )}
    </div>
  );
}

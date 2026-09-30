'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createStudioPromotion,
  listStudioProducts,
  listStudioPromotionTypes,
  patchStudioPromotion,
  resolveStudioImageUrl,
  retrieveStudioProduct,
  StudioApiError,
  type StudioProduct,
  type StudioPromotion,
  type StudioPromotionType,
} from '@/lib/studio/api';

const LOCATION_OPTIONS = [
  { value: 'homepage_hero', label: 'Homepage hero', hint: 'Main carousel' },
  { value: 'stories_carousel', label: 'Stories', hint: 'Story strip' },
  { value: 'special_offers', label: 'Special offers', hint: 'Offers block' },
  { value: 'flash_sales', label: 'Flash sales', hint: 'Timed deals' },
  { value: 'cbd_ribbon', label: 'CBD ribbon', hint: 'Top ribbon' },
  { value: 'brand_banner', label: 'Brand banner', hint: 'Products brand page' },
] as const;

const PRODUCT_TYPES = [
  { value: '', label: 'None (specific products only)' },
  { value: 'PH', label: 'All phones' },
  { value: 'LT', label: 'All laptops' },
  { value: 'TB', label: 'All tablets' },
  { value: 'AC', label: 'All accessories' },
] as const;

export type StudioPromotionDefaults = {
  display_locations?: string[];
  carousel_position?: number | null;
  start_date?: string;
  end_date?: string;
  title?: string;
  description?: string;
  listing_brand?: string;
  promotion_code?: string;
};

type StudioPromotionEditorProps = {
  /** Existing promotion to edit. Omit / null for create. */
  promotion?: StudioPromotion | null;
  roleHint?: string;
  /** Seed values for create mode (and merge into edit when missing). */
  defaults?: StudioPromotionDefaults;
  /** Locations that must always stay selected (e.g. homepage_hero). */
  forceLocations?: string[];
  /** Hide the location chip picker when the surface is fixed. */
  lockLocations?: boolean;
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

function defaultSchedule(): { start: string; end: string } {
  const start = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 2);
  return { start: toDatetimeLocal(start.toISOString()), end: toDatetimeLocal(end.toISOString()) };
}

function mergeForcedLocations(locations: string[], force?: string[]): string[] {
  if (!force?.length) return locations;
  const next = [...locations];
  for (const loc of force) {
    if (!next.includes(loc)) next.push(loc);
  }
  return next;
}

export function StudioPromotionEditor({
  promotion = null,
  roleHint,
  defaults,
  forceLocations,
  lockLocations = false,
  onSaved,
}: StudioPromotionEditorProps) {
  const isCreate = !promotion?.id;
  const scheduleDefaults = useMemo(() => defaultSchedule(), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [carouselPosition, setCarouselPosition] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [promotionTypeId, setPromotionTypeId] = useState('');
  const [productType, setProductType] = useState('');
  const [listingBrand, setListingBrand] = useState('');
  const [featuredProductId, setFeaturedProductId] = useState<number | null>(null);
  const [featuredSalePrice, setFeaturedSalePrice] = useState('');
  const [productIds, setProductIds] = useState<number[]>([]);
  const [productLabels, setProductLabels] = useState<Record<number, string>>({});
  const [productSearch, setProductSearch] = useState('');
  const [productHits, setProductHits] = useState<StudioProduct[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [promotionTypes, setPromotionTypes] = useState<StudioPromotionType[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const types = await listStudioPromotionTypes();
        if (!cancelled) {
          setPromotionTypes(types.filter((t) => t.is_active !== false));
        }
      } catch {
        if (!cancelled) setPromotionTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const forced = forceLocations ?? [];
    const fromPromo = normalizeLocations(promotion?.display_locations);
    const fromDefaults = defaults?.display_locations ?? [];
    const initialLocs = mergeForcedLocations(
      fromPromo.length ? fromPromo : fromDefaults.length ? fromDefaults : forced,
      forced
    );

    setTitle(promotion?.title || defaults?.title || '');
    setDescription(promotion?.description || defaults?.description || '');
    setIsActive(promotion?.is_active ?? true);
    setDiscountPercentage(
      promotion?.discount_percentage != null ? String(promotion.discount_percentage) : ''
    );
    setDiscountAmount(
      promotion?.discount_amount != null ? String(promotion.discount_amount) : ''
    );
    setLocations(initialLocs);
    setCarouselPosition(
      promotion?.carousel_position != null
        ? String(promotion.carousel_position)
        : defaults?.carousel_position != null
          ? String(defaults.carousel_position)
          : ''
    );
    setStartDate(
      toDatetimeLocal(promotion?.start_date) ||
        toDatetimeLocal(defaults?.start_date) ||
        scheduleDefaults.start
    );
    setEndDate(
      toDatetimeLocal(promotion?.end_date) ||
        toDatetimeLocal(defaults?.end_date) ||
        scheduleDefaults.end
    );
    setPromotionCode(promotion?.promotion_code || defaults?.promotion_code || '');
    setPromotionTypeId(
      promotion?.promotion_type != null ? String(promotion.promotion_type) : ''
    );
    setProductType(promotion?.product_types || '');
    setListingBrand(promotion?.listing_brand || defaults?.listing_brand || '');
    setFeaturedProductId(
      typeof promotion?.featured_product === 'number' ? promotion.featured_product : null
    );
    setFeaturedSalePrice(
      promotion?.featured_sale_price != null ? String(promotion.featured_sale_price) : ''
    );
    const ids = Array.isArray(promotion?.products)
      ? promotion.products.map(Number).filter((n) => Number.isFinite(n))
      : [];
    if (
      typeof promotion?.featured_product === 'number' &&
      !ids.includes(promotion.featured_product)
    ) {
      ids.push(promotion.featured_product);
    }
    setProductIds(ids);
    setBannerFile(null);
    setBannerPreview(null);
    setError(null);
    setProductSearch('');
    setProductHits([]);
  }, [promotion, defaults, forceLocations, scheduleDefaults.end, scheduleDefaults.start]);

  useEffect(() => {
    if (productIds.length === 0) return;
    let cancelled = false;
    void (async () => {
      const missing = productIds.filter((id) => !productLabels[id]);
      if (missing.length === 0) return;
      const next: Record<number, string> = {};
      await Promise.all(
        missing.map(async (id) => {
          try {
            const p = await retrieveStudioProduct(id);
            next[id] = p.product_name || `Product #${id}`;
          } catch {
            next[id] = `Product #${id}`;
          }
        })
      );
      if (!cancelled) {
        setProductLabels((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds.join(',')]);

  useEffect(() => {
    const q = productSearch.trim();
    if (q.length < 2) {
      setProductHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setSearchingProducts(true);
        try {
          const data = await listStudioProducts({ search: q, pageSize: 12 });
          if (cancelled) return;
          let rows = data.results ?? [];
          if (productType) {
            rows = rows.filter((p) => p.product_type === productType);
          }
          setProductHits(rows);
        } catch {
          if (!cancelled) setProductHits([]);
        } finally {
          if (!cancelled) setSearchingProducts(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [productSearch, productType]);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const currentBanner =
    bannerPreview ||
    resolveStudioImageUrl(promotion?.banner_image_url, [promotion?.banner_image]);

  const showListingBrand = locations.includes('brand_banner');
  const needsBanner =
    locations.includes('homepage_hero') ||
    locations.includes('stories_carousel') ||
    locations.includes('brand_banner');

  const toggleLocation = (value: string) => {
    if (forceLocations?.includes(value) && locations.includes(value)) return;
    setLocations((prev) =>
      prev.includes(value) ? prev.filter((loc) => loc !== value) : [...prev, value]
    );
  };

  const addProduct = (product: StudioProduct) => {
    setProductIds((prev) => (prev.includes(product.id) ? prev : [...prev, product.id]));
    setProductLabels((prev) => ({
      ...prev,
      [product.id]: product.product_name || `Product #${product.id}`,
    }));
    setProductSearch('');
    setProductHits([]);
  };

  const removeProduct = (id: number) => {
    setProductIds((prev) => prev.filter((pid) => pid !== id));
    if (featuredProductId === id) {
      setFeaturedProductId(null);
      setFeaturedSalePrice('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalLocations = mergeForcedLocations(locations, forceLocations);
    if (finalLocations.length === 0) {
      setError('Pick at least one place this promo should appear.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required for the storefront to show this promo.');
      return;
    }
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
      setError('Start date must be before end date.');
      return;
    }
    if (discountPercentage.trim() && discountAmount.trim()) {
      setError('Use either discount % or amount, not both.');
      return;
    }
    if (featuredSalePrice.trim() && featuredProductId == null) {
      setError('Select a featured product before setting a featured sale price.');
      return;
    }
    if (isCreate && needsBanner && !bannerFile) {
      setError('Upload a banner image for this placement.');
      return;
    }
    if (!isCreate && needsBanner && !currentBanner && !bannerFile) {
      setError('Upload a banner image — this placement requires a banner.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<
        string,
        string | Blob | boolean | number | null | undefined | string[] | number[]
      > = {
        title: title.trim(),
        description: description.trim(),
        is_active: isActive,
        discount_percentage: discountPercentage.trim() || null,
        discount_amount: discountAmount.trim() || null,
        display_locations: finalLocations,
        carousel_position: carouselPosition.trim() ? Number(carouselPosition) : null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        promotion_code: promotionCode.trim() || undefined,
        product_types: productType || '',
        listing_brand: showListingBrand ? listingBrand.trim() : '',
        featured_product: featuredProductId,
        featured_sale_price: featuredSalePrice.trim() || null,
        products: productIds,
      };
      if (promotionTypeId.trim()) {
        payload.promotion_type = Number(promotionTypeId);
      } else if (!isCreate) {
        payload.promotion_type = null;
      }
      if (bannerFile) {
        payload.banner_image = bannerFile;
      }

      const saved = isCreate
        ? await createStudioPromotion(payload)
        : await patchStudioPromotion(promotion!.id, payload);
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
          <p className="studio-editor__kicker">{roleHint || (isCreate ? 'New promotion' : 'Promotion')}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            {title.trim() ||
              promotion?.title ||
              (isCreate ? 'New promotion' : `Promotion #${promotion?.id}`)}
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
          <h3>Banner{needsBanner ? ' (required)' : ''}</h3>
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
          <div className="studio-dropzone">Drop or upload a banner image</div>
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
          <div className="studio-editor__grid">
            <label className="studio-field">
              <span>Promotion type</span>
              <select
                className="studio-input"
                value={promotionTypeId}
                onChange={(e) => setPromotionTypeId(e.target.value)}
              >
                <option value="">None</option>
                {promotionTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="studio-field">
              <span>Promotion code</span>
              <input
                className="studio-input"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value)}
                placeholder="Auto if empty"
              />
            </label>
          </div>
          {showListingBrand && (
            <label className="studio-field">
              <span>Listing brand filter</span>
              <input
                className="studio-input"
                value={listingBrand}
                onChange={(e) => setListingBrand(e.target.value)}
                placeholder="e.g. Apple"
              />
              <span className="studio-field__help">
                Matches /products?brand_filter=… for brand banners
              </span>
            </label>
          )}
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
        <span className="studio-field__help">Use percentage or fixed amount — not both.</span>
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
              required
            />
          </label>
          <label className="studio-field">
            <span>Ends</span>
            <input
              className="studio-input"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
          <label className="studio-field studio-field--full">
            <span>Carousel / hero order</span>
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

      {!lockLocations && (
        <section className="studio-editor__section">
          <h3 className="studio-editor__section-title">Where it shows</h3>
          <p className="studio-editor__hint studio-editor__hint--tight">
            Toggle the surfaces that should render this promo.
          </p>
          <div className="studio-chip-grid" role="group" aria-label="Display locations">
            {LOCATION_OPTIONS.map((opt) => {
              const on = locations.includes(opt.value);
              const locked = Boolean(forceLocations?.includes(opt.value) && on);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`studio-chip${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  disabled={locked}
                  onClick={() => toggleLocation(opt.value)}
                >
                  <span className="studio-chip__label">{opt.label}</span>
                  <span className="studio-chip__hint">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Products</h3>
        <p className="studio-editor__hint studio-editor__hint--tight">
          Target specific products and/or a whole product type. Placement creatives (hero, CBD,
          brand banner) can skip this.
        </p>
        <label className="studio-field">
          <span>Product type</span>
          <select
            className="studio-input"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          >
            {PRODUCT_TYPES.map((opt) => (
              <option key={opt.value || 'none'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field" style={{ marginTop: '0.75rem' }}>
          <span>Add products</span>
          <input
            className="studio-input"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search by name…"
            autoComplete="off"
          />
        </label>
        {searchingProducts && (
          <p className="studio-editor__hint studio-editor__hint--tight">Searching…</p>
        )}
        {productHits.length > 0 && (
          <ul className="studio-hero-placement__list" style={{ marginTop: '0.45rem' }}>
            {productHits.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="studio-hero-placement__item"
                  onClick={() => addProduct(p)}
                >
                  <span className="studio-hero-placement__title">{p.product_name}</span>
                  <span className="studio-icon-btn studio-icon-btn--edit">
                    <span>Add</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {productIds.length > 0 && (
          <ul className="studio-chip-grid" style={{ marginTop: '0.75rem' }}>
            {productIds.map((id) => (
              <li key={id} style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  className="studio-chip is-on"
                  onClick={() => removeProduct(id)}
                  title="Remove"
                >
                  <span className="studio-chip__label">{productLabels[id] || `#${id}`}</span>
                  <span className="studio-chip__hint">Remove</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="studio-editor__grid" style={{ marginTop: '0.85rem' }}>
          <label className="studio-field">
            <span>Featured product (promo card)</span>
            <select
              className="studio-input"
              value={featuredProductId ?? ''}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : null;
                setFeaturedProductId(next);
                if (next != null && !productIds.includes(next)) {
                  setProductIds((prev) => [...prev, next]);
                }
                if (next == null) setFeaturedSalePrice('');
              }}
            >
              <option value="">None</option>
              {productIds.map((id) => (
                <option key={id} value={id}>
                  {productLabels[id] || `Product #${id}`}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field">
            <span>Featured sale price (KES)</span>
            <input
              className="studio-input"
              value={featuredSalePrice}
              onChange={(e) => setFeaturedSalePrice(e.target.value)}
              inputMode="decimal"
              placeholder="Optional"
              disabled={featuredProductId == null}
            />
          </label>
        </div>
      </section>

      <div className="studio-editor__footer">
        <button type="submit" className="studio-btn studio-btn--primary studio-btn--block" disabled={saving}>
          {saving ? 'Saving…' : isCreate ? 'Create promotion' : 'Save promotion'}
        </button>
      </div>
    </form>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createStudioBundle,
  createStudioBundleItem,
  deleteStudioBundle,
  deleteStudioBundleItem,
  listStudioBundleItems,
  listStudioProducts,
  patchStudioBundle,
  patchStudioBundleItem,
  resolveStudioDefaultBrandId,
  StudioApiError,
  type StudioBundle,
  type StudioBundleItem,
  type StudioProduct,
} from '@/lib/studio/api';

const PRICING_MODES = [
  { value: 'FX', label: 'Fixed' },
  { value: 'PC', label: 'Percentage' },
  { value: 'AM', label: 'Amount off' },
] as const;

function normalizePricingMode(raw?: string | null): string {
  const v = (raw || 'FX').toLowerCase();
  if (v === 'fixed' || v === 'fx') return 'FX';
  if (v === 'percentage' || v === 'percent' || v === 'pc') return 'PC';
  if (v === 'amount' || v === 'am') return 'AM';
  if (raw === 'FX' || raw === 'PC' || raw === 'AM') return raw;
  return 'FX';
}

type StudioBundleEditorProps = {
  mode?: 'create' | 'edit';
  bundle?: StudioBundle | null;
  roleHint?: string;
  onSaved?: (bundle: StudioBundle) => void;
  onDeleted?: () => void;
};

export function StudioBundleEditor({
  mode = 'edit',
  bundle = null,
  roleHint,
  onSaved,
  onDeleted,
}: StudioBundleEditorProps) {
  const isCreate = mode === 'create' || !bundle?.id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showInListings, setShowInListings] = useState(true);
  const [pricingMode, setPricingMode] = useState('FX');
  const [bundlePrice, setBundlePrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [mainProductId, setMainProductId] = useState<number | null>(null);
  const [mainProductLabel, setMainProductLabel] = useState('');
  const [items, setItems] = useState<StudioBundleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productHits, setProductHits] = useState<StudioProduct[]>([]);
  const [itemQty, setItemQty] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bundleId, setBundleId] = useState<number | null>(bundle?.id ?? null);

  useEffect(() => {
    setTitle(bundle?.title || '');
    setDescription(bundle?.description || '');
    setIsActive(bundle?.is_active ?? true);
    setShowInListings(bundle?.show_in_listings ?? true);
    setPricingMode(normalizePricingMode(bundle?.pricing_mode));
    setBundlePrice(bundle?.bundle_price != null ? String(bundle.bundle_price) : '');
    setDiscountPercentage(
      bundle?.discount_percentage != null ? String(bundle.discount_percentage) : ''
    );
    setDiscountAmount(bundle?.discount_amount != null ? String(bundle.discount_amount) : '');
    setMainProductId(typeof bundle?.main_product === 'number' ? bundle.main_product : null);
    setMainProductLabel(bundle?.main_product_name || '');
    setBundleId(bundle?.id ?? null);
    setItems(bundle?.items ?? []);
  }, [bundle]);

  useEffect(() => {
    if (!bundleId) return;
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listStudioBundleItems(bundleId);
        if (!cancelled) setItems(rows);
      } catch {
        /* keep existing */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bundleId]);

  useEffect(() => {
    const q = productSearch.trim();
    if (q.length < 2) {
      setProductHits([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await listStudioProducts({ search: q, pageSize: 10 });
          if (!cancelled) setProductHits(data.results ?? []);
        } catch {
          if (!cancelled) setProductHits([]);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [productSearch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!mainProductId) {
      setError('Select a main product.');
      return;
    }
    const mode = normalizePricingMode(pricingMode);
    if (mode === 'FX' && !bundlePrice.trim()) {
      setError('Bundle price is required for fixed pricing.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string | boolean | number | null | undefined> = {
        title: title.trim(),
        description: description.trim(),
        is_active: isActive,
        show_in_listings: showInListings,
        pricing_mode: mode,
        bundle_price: bundlePrice.trim() || null,
        discount_percentage: discountPercentage.trim() || null,
        discount_amount: discountAmount.trim() || null,
        main_product: mainProductId,
      };
      if (isCreate) {
        payload.brand = await resolveStudioDefaultBrandId();
      }
      const saved = isCreate
        ? await createStudioBundle(payload)
        : await patchStudioBundle(bundleId!, payload);
      setBundleId(saved.id);
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

  const addItem = async (product: StudioProduct) => {
    if (!bundleId) {
      setError('Save the bundle first, then add items.');
      return;
    }
    setError(null);
    try {
      const item = await createStudioBundleItem({
        bundle: bundleId,
        product: product.id,
        quantity: Number(itemQty) || 1,
        display_order: items.length + 1,
      });
      setItems((prev) => [...prev, item]);
      setProductSearch('');
      setProductHits([]);
      setItemQty('1');
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Could not add item');
    }
  };

  const removeItem = async (item: StudioBundleItem) => {
    try {
      await deleteStudioBundleItem(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Could not remove item');
    }
  };

  const updateItemQty = async (item: StudioBundleItem, quantity: number) => {
    try {
      const saved = await patchStudioBundleItem(item.id, { quantity });
      setItems((prev) => prev.map((row) => (row.id === item.id ? saved : row)));
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Could not update item');
    }
  };

  const handleDelete = async () => {
    if (!bundleId || !window.confirm('Delete this bundle?')) return;
    try {
      await deleteStudioBundle(bundleId);
      onDeleted?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <form className="studio-editor" onSubmit={handleSubmit}>
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">{isCreate ? 'Create bundle' : 'Edit bundle'}</h2>
        <p className="studio-editor__hint">
          {roleHint || 'Uses /api/inventory/bundles/ (Marketing Manager write).'}
        </p>
      </div>

      <label className="studio-field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="studio-field">
        <span>Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>
      <label className="studio-field">
        <span>Main product {mainProductLabel ? `· ${mainProductLabel}` : ''}</span>
        <input
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          placeholder="Search to set main product or add items…"
        />
      </label>
      {productHits.length > 0 && (
        <ul className="studio-hero-placement__list">
          {productHits.map((p) => (
            <li key={p.id}>
              <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
                <span className="studio-hero-placement__title">{p.product_name}</span>
                <button
                  type="button"
                  className="studio-icon-btn studio-icon-btn--edit"
                  onClick={() => {
                    setMainProductId(p.id);
                    setMainProductLabel(p.product_name);
                    setProductSearch('');
                    setProductHits([]);
                  }}
                >
                  <span>Main</span>
                </button>
                {bundleId && (
                  <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void addItem(p)}>
                    Add item
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="studio-field">
        <span>Pricing mode</span>
        <select value={pricingMode} onChange={(e) => setPricingMode(e.target.value)}>
          {PRICING_MODES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="studio-field">
        <span>Bundle price</span>
        <input value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} />
      </label>
      <label className="studio-field">
        <span>Discount %</span>
        <input value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} />
      </label>
      <label className="studio-field">
        <span>Discount amount</span>
        <input value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
      </label>
      <label className="studio-field">
        <span>Default item qty when adding</span>
        <input value={itemQty} onChange={(e) => setItemQty(e.target.value)} />
      </label>
      <label className="studio-field studio-field--checkbox">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span>Active</span>
      </label>
      <label className="studio-field studio-field--checkbox">
        <input
          type="checkbox"
          checked={showInListings}
          onChange={(e) => setShowInListings(e.target.checked)}
        />
        <span>Show in listings</span>
      </label>

      {bundleId && (
        <section className="studio-editor__section">
          <h3 className="studio-editor__section-title">Line items ({items.length})</h3>
          <ul className="studio-hero-placement__list">
            {items.map((item) => (
              <li key={item.id}>
                <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
                  <span className="studio-hero-placement__title">
                    {item.product_name || `Product #${item.product}`}
                  </span>
                  <input
                    className="studio-input"
                    style={{ width: 64 }}
                    type="number"
                    min={1}
                    value={item.quantity ?? 1}
                    onChange={(e) => void updateItemQty(item, Number(e.target.value) || 1)}
                  />
                  <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void removeItem(item)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {!items.length && (
            <p className="studio-editor__hint">Search a product above and click Add item.</p>
          )}
        </section>
      )}

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
        {saving ? 'Saving…' : isCreate ? 'Create bundle' : 'Save bundle'}
      </button>
      {!isCreate && bundleId && (
        <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete()}>
          Delete bundle
        </button>
      )}
    </form>
  );
}

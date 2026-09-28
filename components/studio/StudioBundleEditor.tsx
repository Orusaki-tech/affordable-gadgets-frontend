'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  patchStudioBundle,
  StudioApiError,
  type StudioBundle,
} from '@/lib/studio/api';

type StudioBundleEditorProps = {
  bundle: StudioBundle;
  roleHint?: string;
  onSaved?: (bundle: StudioBundle) => void;
};

export function StudioBundleEditor({ bundle, roleHint, onSaved }: StudioBundleEditorProps) {
  const [title, setTitle] = useState(bundle.title || '');
  const [description, setDescription] = useState(bundle.description || '');
  const [isActive, setIsActive] = useState(bundle.is_active ?? true);
  const [showInListings, setShowInListings] = useState(bundle.show_in_listings ?? true);
  const [pricingMode, setPricingMode] = useState(bundle.pricing_mode || 'fixed');
  const [bundlePrice, setBundlePrice] = useState(
    bundle.bundle_price != null ? String(bundle.bundle_price) : ''
  );
  const [discountPercentage, setDiscountPercentage] = useState(
    bundle.discount_percentage != null ? String(bundle.discount_percentage) : ''
  );
  const [discountAmount, setDiscountAmount] = useState(
    bundle.discount_amount != null ? String(bundle.discount_amount) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(bundle.title || '');
    setDescription(bundle.description || '');
    setIsActive(bundle.is_active ?? true);
    setShowInListings(bundle.show_in_listings ?? true);
    setPricingMode(bundle.pricing_mode || 'fixed');
    setBundlePrice(bundle.bundle_price != null ? String(bundle.bundle_price) : '');
    setDiscountPercentage(
      bundle.discount_percentage != null ? String(bundle.discount_percentage) : ''
    );
    setDiscountAmount(bundle.discount_amount != null ? String(bundle.discount_amount) : '');
  }, [bundle]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const saved = await patchStudioBundle(bundle.id, {
        title: title.trim(),
        description: description.trim(),
        is_active: isActive,
        show_in_listings: showInListings,
        pricing_mode: pricingMode,
        bundle_price: bundlePrice.trim() || null,
        discount_percentage: discountPercentage.trim() || null,
        discount_amount: discountAmount.trim() || null,
      });
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
        <h2 className="studio-editor__title">Edit bundle</h2>
        <p className="studio-editor__hint">
          {roleHint || 'Uses /api/inventory/bundles/ (Marketing Manager write).'}
        </p>
        <p className="studio-editor__hint">
          Editing: <strong>{bundle.title || `Bundle #${bundle.id}`}</strong>
          {bundle.main_product_name ? ` · ${bundle.main_product_name}` : ''}
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
        <span>Pricing mode</span>
        <select value={pricingMode} onChange={(e) => setPricingMode(e.target.value)}>
          <option value="fixed">Fixed</option>
          <option value="percentage">Percentage</option>
          <option value="amount">Amount</option>
        </select>
      </label>
      <label className="studio-field">
        <span>Bundle price</span>
        <input value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} />
      </label>
      <label className="studio-field">
        <span>Discount %</span>
        <input
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(e.target.value)}
        />
      </label>
      <label className="studio-field">
        <span>Discount amount</span>
        <input value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
      </label>
      <label className="studio-field studio-field--checkbox">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
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
      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save bundle'}
      </button>
    </form>
  );
}

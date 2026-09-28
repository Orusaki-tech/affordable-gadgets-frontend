'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  patchStudioDeliveryRate,
  StudioApiError,
  type StudioDeliveryRate,
} from '@/lib/studio/api';

type StudioDeliveryRateEditorProps = {
  rate: StudioDeliveryRate;
  roleHint?: string;
  onSaved?: (rate: StudioDeliveryRate) => void;
};

export function StudioDeliveryRateEditor({
  rate,
  roleHint,
  onSaved,
}: StudioDeliveryRateEditorProps) {
  const [county, setCounty] = useState(rate.county || '');
  const [ward, setWard] = useState(rate.ward || '');
  const [price, setPrice] = useState(rate.price != null ? String(rate.price) : '');
  const [isActive, setIsActive] = useState(rate.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCounty(rate.county || '');
    setWard(rate.ward || '');
    setPrice(rate.price != null ? String(rate.price) : '');
    setIsActive(rate.is_active ?? true);
  }, [rate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const saved = await patchStudioDeliveryRate(rate.id, {
        county: county.trim(),
        ward: ward.trim() || null,
        price: price.trim(),
        is_active: isActive,
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
        <h2 className="studio-editor__title">Edit delivery rate</h2>
        <p className="studio-editor__hint">
          {roleHint || 'Uses /api/inventory/delivery-rates/ (Order Manager write).'}
        </p>
        <p className="studio-editor__hint">
          Editing:{' '}
          <strong>
            {rate.county || 'Rate'}
            {rate.ward ? ` · ${rate.ward}` : ''}
          </strong>
        </p>
      </div>
      <label className="studio-field">
        <span>County</span>
        <input value={county} onChange={(e) => setCounty(e.target.value)} required />
      </label>
      <label className="studio-field">
        <span>Ward (Nairobi / Kiambu only)</span>
        <input value={ward} onChange={(e) => setWard(e.target.value)} />
      </label>
      <label className="studio-field">
        <span>Price (KES)</span>
        <input value={price} onChange={(e) => setPrice(e.target.value)} required />
      </label>
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
        {saving ? 'Saving…' : 'Save rate'}
      </button>
    </form>
  );
}

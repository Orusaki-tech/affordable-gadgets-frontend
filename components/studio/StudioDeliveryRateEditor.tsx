'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createStudioDeliveryRate,
  deleteStudioDeliveryRate,
  listStudioDeliveryRates,
  patchStudioDeliveryRate,
  StudioApiError,
  type StudioDeliveryRate,
} from '@/lib/studio/api';

type StudioDeliveryRateEditorProps = {
  mode?: 'create' | 'edit' | 'manage';
  rate?: StudioDeliveryRate | null;
  roleHint?: string;
  onSaved?: (rate: StudioDeliveryRate) => void;
  onDeleted?: () => void;
};

export function StudioDeliveryRateEditor({
  mode = 'edit',
  rate = null,
  roleHint,
  onSaved,
  onDeleted,
}: StudioDeliveryRateEditorProps) {
  const isManage = mode === 'manage';
  const isCreate = mode === 'create' || (!rate?.id && !isManage);
  const [rates, setRates] = useState<StudioDeliveryRate[]>([]);
  const [editing, setEditing] = useState<StudioDeliveryRate | null>(rate);
  const [creating, setCreating] = useState(isCreate && !isManage);
  const [county, setCounty] = useState('');
  const [ward, setWard] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isManage);

  const reload = async () => {
    const data = await listStudioDeliveryRates({ page: 1 });
    setRates(data.results ?? []);
  };

  useEffect(() => {
    if (!isManage) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof StudioApiError ? err.message : 'Could not load rates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isManage]);

  useEffect(() => {
    const current = creating ? null : editing || rate;
    setCounty(current?.county || '');
    setWard(current?.ward || '');
    setPrice(current?.price != null ? String(current.price) : '');
    setIsActive(current?.is_active ?? true);
  }, [rate, editing, creating]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const countyName = county.trim();
    const wardName = ward.trim();
    const needsWard =
      /nairobi/i.test(countyName) || /kiambu/i.test(countyName);
    if (wardName && !needsWard) {
      setError('Ward is only allowed for Nairobi or Kiambu counties.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        county: countyName,
        ward: needsWard ? wardName || null : null,
        price: price.trim(),
        is_active: isActive,
      };
      const currentId = creating ? null : editing?.id || rate?.id || null;
      const saved = currentId
        ? await patchStudioDeliveryRate(currentId, payload)
        : await createStudioDeliveryRate(payload);
      if (isManage) {
        await reload();
        setCreating(false);
        setEditing(saved);
      }
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

  const handleDelete = async (target?: StudioDeliveryRate | null) => {
    const row = target || editing || rate;
    if (!row?.id || !window.confirm(`Delete rate for ${row.county}?`)) return;
    try {
      await deleteStudioDeliveryRate(row.id);
      if (isManage) {
        await reload();
        setEditing(null);
        setCreating(true);
      }
      onDeleted?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Delete failed');
    }
  };

  if (isManage && loading) {
    return <p className="studio-editor__hint">Loading delivery rates…</p>;
  }

  return (
    <div className="studio-editor">
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">
          {creating ? 'Create delivery rate' : 'Edit delivery rate'}
        </h2>
        <p className="studio-editor__hint">
          {roleHint || 'Uses /api/inventory/delivery-rates/ (Order Manager write).'}
        </p>
      </div>

      {isManage && (
        <section className="studio-editor__section">
          <div className="studio-editor__row" style={{ justifyContent: 'space-between' }}>
            <p className="studio-field__label" style={{ margin: 0 }}>
              Rates ({rates.length})
            </p>
            <button
              type="button"
              className="studio-btn studio-btn--primary"
              onClick={() => {
                setCreating(true);
                setEditing(null);
              }}
            >
              Add rate
            </button>
          </div>
          <ul className="studio-hero-placement__list" style={{ marginTop: '0.55rem' }}>
            {rates.map((row) => (
              <li key={row.id}>
                <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
                  <button
                    type="button"
                    className="studio-hero-placement__title"
                    style={{ background: 'none', border: 0, textAlign: 'left', flex: 1, cursor: 'pointer' }}
                    onClick={() => {
                      setCreating(false);
                      setEditing(row);
                    }}
                  >
                    {row.county}
                    {row.ward ? ` · ${row.ward}` : ''} — {row.price}
                    {row.is_active === false ? ' (off)' : ''}
                  </button>
                  <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete(row)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={handleSubmit}>
        <label className="studio-field">
          <span>County</span>
          <input value={county} onChange={(e) => setCounty(e.target.value)} required />
        </label>
        <label className="studio-field">
          <span>Ward (Nairobi / Kiambu only)</span>
          <input
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            disabled={!/nairobi|kiambu/i.test(county)}
            placeholder={
              /nairobi|kiambu/i.test(county) ? 'Optional ward' : 'Not used for this county'
            }
          />
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
          {saving ? 'Saving…' : creating ? 'Create rate' : 'Save rate'}
        </button>
        {!creating && (editing?.id || rate?.id) && (
          <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete()}>
            Delete rate
          </button>
        )}
      </form>
    </div>
  );
}

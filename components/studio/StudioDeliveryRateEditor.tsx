'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createStudioDeliveryRate,
  deleteStudioDeliveryRate,
  listAllStudioDeliveryRates,
  patchStudioDeliveryRate,
  StudioApiError,
  type StudioDeliveryRate,
} from '@/lib/studio/api';
import { StudioCharCount } from '@/components/studio/StudioCharCount';

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
  const [rates, setRates] = useState<StudioDeliveryRate[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<StudioDeliveryRate | null>(rate);
  // Manage opens ready to add; single create/edit modes follow their props.
  const [creating, setCreating] = useState(mode === 'create' || mode === 'manage');
  const [county, setCounty] = useState('');
  const [ward, setWard] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isManage);

  const reload = async () => {
    const all = await listAllStudioDeliveryRates();
    setRates(all);
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

  const filteredRates = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rates;
    return rates.filter((row) => {
      const hay = `${row.county ?? ''} ${row.ward ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filter, rates]);

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setError(null);
    setMsg(null);
  };

  const startEdit = (row: StudioDeliveryRate) => {
    setCreating(false);
    setEditing(row);
    setError(null);
    setMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const countyName = county.trim();
    const wardName = ward.trim();
    const needsWard = /nairobi/i.test(countyName) || /kiambu/i.test(countyName);
    if (wardName && !needsWard) {
      setError('Ward is only allowed for Nairobi or Kiambu counties.');
      return;
    }
    if (!countyName) {
      setError('County is required.');
      return;
    }
    if (!price.trim()) {
      setError('Price is required.');
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

      // Creating a duplicate active county-wide rate: update the existing row instead.
      if (!currentId && isActive && !payload.ward) {
        const existing = rates.find(
          (row) =>
            (row.county || '').trim().toLowerCase() === countyName.toLowerCase() &&
            !row.ward &&
            row.is_active !== false
        );
        if (existing?.id) {
          const saved = await patchStudioDeliveryRate(existing.id, payload);
          if (isManage) {
            await reload();
            startEdit(saved);
          }
          setMsg(`Updated existing ${countyName} rate (only one active county-wide rate allowed).`);
          onSaved?.(saved);
          return;
        }
      }

      const saved = currentId
        ? await patchStudioDeliveryRate(currentId, payload)
        : await createStudioDeliveryRate(payload);
      if (isManage) {
        await reload();
        startEdit(saved);
        setMsg(currentId ? 'Rate saved.' : 'Rate added.');
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
        startCreate();
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
        {isManage ? (
          <p className="studio-editor__hint">
            {rates.length} rates loaded. Search the list, or add a new county / Nairobi–Kiambu ward.
          </p>
        ) : null}
      </div>

      {isManage && (
        <section className="studio-editor__section">
          <div className="studio-editor__row" style={{ justifyContent: 'space-between' }}>
            <p className="studio-field__label" style={{ margin: 0 }}>
              Rates ({filteredRates.length}
              {filter.trim() ? ` of ${rates.length}` : ''})
            </p>
            <button type="button" className="studio-btn studio-btn--primary" onClick={startCreate}>
              Add rate
            </button>
          </div>
          <label className="studio-field" style={{ marginTop: '0.55rem' }}>
            <span>Search</span>
            <input
              className="studio-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by county or ward…"
            />
          </label>
          <ul className="studio-hero-placement__list" style={{ marginTop: '0.55rem', maxHeight: 240, overflow: 'auto' }}>
            {filteredRates.map((row) => (
              <li key={row.id}>
                <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
                  <button
                    type="button"
                    className="studio-hero-placement__title"
                    style={{
                      background: 'none',
                      border: 0,
                      textAlign: 'left',
                      flex: 1,
                      cursor: 'pointer',
                      fontWeight: !creating && editing?.id === row.id ? 700 : undefined,
                    }}
                    onClick={() => startEdit(row)}
                  >
                    {row.county}
                    {row.ward ? ` · ${row.ward}` : ''} — {row.price}
                    {row.is_active === false ? ' (off)' : ''}
                  </button>
                  <button
                    type="button"
                    className="studio-btn studio-btn--ghost"
                    onClick={() => void handleDelete(row)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {filteredRates.length === 0 ? (
              <li>
                <p className="studio-editor__hint">No rates match that search.</p>
              </li>
            ) : null}
          </ul>
        </section>
      )}

      <form onSubmit={handleSubmit}>
        <label className="studio-field">
          <span>
            County <StudioCharCount length={county.length} max={100} />
          </span>
          <input
            className="studio-input"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            maxLength={100}
            required
          />
        </label>
        <label className="studio-field">
          <span>
            Ward (Nairobi / Kiambu only) <StudioCharCount length={ward.length} max={100} />
          </span>
          <input
            className="studio-input"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            maxLength={100}
            disabled={!/nairobi|kiambu/i.test(county)}
            placeholder={
              /nairobi|kiambu/i.test(county) ? 'Optional ward' : 'Not used for this county'
            }
          />
        </label>
        <label className="studio-field">
          <span>Price (KES)</span>
          <input
            className="studio-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            required
          />
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
        {msg && (
          <div className="studio-alert studio-alert--ok" role="status">
            {msg}
          </div>
        )}
        <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
          {saving ? 'Saving…' : creating ? 'Create rate' : 'Save rate'}
        </button>
        {isManage && !creating ? (
          <button type="button" className="studio-btn studio-btn--ghost" onClick={startCreate}>
            New rate
          </button>
        ) : null}
        {!creating && (editing?.id || rate?.id) && (
          <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete()}>
            Delete rate
          </button>
        )}
      </form>
    </div>
  );
}

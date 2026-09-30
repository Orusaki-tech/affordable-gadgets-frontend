'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createStudioFinancingOffer,
  deleteStudioFinancingOffer,
  listStudioFinancingOffers,
  listStudioFinancingProviders,
  listStudioProducts,
  patchStudioFinancingOffer,
  StudioApiError,
  type StudioFinancingOffer,
  type StudioFinancingProvider,
  type StudioProduct,
} from '@/lib/studio/api';

type StudioFinancingOffersManagerProps = {
  roleHint?: string;
  preferProviderId?: number | null;
  onSaved?: () => void;
};

const emptyForm = {
  provider: '',
  product: '',
  deposit_amount: '',
  retail_amount: '',
  term_unit: 'month' as 'day' | 'week' | 'month',
  term_count: '12',
  monthly_payment: '',
  weekly_payment: '',
  daily_payment: '',
  is_active: true,
};

export function StudioFinancingOffersManager({
  roleHint,
  preferProviderId,
  onSaved,
}: StudioFinancingOffersManagerProps) {
  const [offers, setOffers] = useState<StudioFinancingOffer[]>([]);
  const [providers, setProviders] = useState<StudioFinancingProvider[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [productSearch, setProductSearch] = useState('');
  const [productHits, setProductHits] = useState<StudioProduct[]>([]);
  const [productLabel, setProductLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = async () => {
    const [offerRows, providerRows] = await Promise.all([
      listStudioFinancingOffers(
        preferProviderId ? { provider: preferProviderId } : undefined
      ),
      listStudioFinancingProviders(),
    ]);
    setOffers(offerRows);
    setProviders(providerRows);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
        if (!cancelled && preferProviderId) {
          setForm((prev) => ({ ...prev, provider: String(preferProviderId) }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof StudioApiError ? err.message : 'Could not load offers');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferProviderId]);

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

  const startEdit = (offer: StudioFinancingOffer) => {
    setEditingId(offer.id);
    setForm({
      provider: String(offer.provider),
      product: String(offer.product),
      deposit_amount: offer.deposit_amount != null ? String(offer.deposit_amount) : '',
      retail_amount: offer.retail_amount != null ? String(offer.retail_amount) : '',
      term_unit: (offer.term_unit as 'day' | 'week' | 'month') || 'month',
      term_count: offer.term_count != null ? String(offer.term_count) : '',
      monthly_payment: offer.monthly_payment != null ? String(offer.monthly_payment) : '',
      weekly_payment: offer.weekly_payment != null ? String(offer.weekly_payment) : '',
      daily_payment: offer.daily_payment != null ? String(offer.daily_payment) : '',
      is_active: offer.is_active ?? true,
    });
    setProductLabel(offer.product_name || `Product #${offer.product}`);
    setMsg(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      provider: preferProviderId ? String(preferProviderId) : emptyForm.provider,
    });
    setProductLabel('');
    setProductSearch('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.provider || !form.product) {
      setError('Provider and product are required.');
      return;
    }
    const unit = form.term_unit;
    const payment =
      unit === 'day'
        ? form.daily_payment.trim()
        : unit === 'week'
          ? form.weekly_payment.trim()
          : form.monthly_payment.trim();
    if (!payment) {
      setError(`Enter the ${unit}ly payment amount.`);
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string | boolean | number | null | undefined> = {
        provider: Number(form.provider),
        product: Number(form.product),
        deposit_amount: form.deposit_amount.trim() || '0',
        retail_amount: form.retail_amount.trim() || '0',
        term_unit: unit,
        term_count: form.term_count.trim() ? Number(form.term_count) : null,
        daily_payment: unit === 'day' ? payment : null,
        weekly_payment: unit === 'week' ? payment : null,
        monthly_payment: unit === 'month' ? payment : null,
        is_active: form.is_active,
      };
      if (editingId) {
        await patchStudioFinancingOffer(editingId, payload);
        setMsg('Offer updated.');
      } else {
        await createStudioFinancingOffer(payload);
        setMsg('Offer created.');
        startCreate();
      }
      await reload();
      onSaved?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (offer: StudioFinancingOffer) => {
    if (!window.confirm(`Delete financing offer for ${offer.product_name || offer.product}?`)) return;
    try {
      await deleteStudioFinancingOffer(offer.id);
      if (editingId === offer.id) startCreate();
      await reload();
      setMsg('Offer deleted.');
      onSaved?.();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Delete failed');
    }
  };

  if (loading) return <p className="studio-editor__hint">Loading financing offers…</p>;

  return (
    <div className="studio-editor studio-editor--flush">
      <div className="studio-editor__toolbar">
        <div>
          <p className="studio-editor__kicker">{roleHint || 'Financing offers'}</p>
          <h2 className="studio-editor__title studio-editor__title--compact">
            {editingId ? 'Edit offer' : 'Create financing offer'}
          </h2>
        </div>
        {editingId && (
          <button type="button" className="studio-btn studio-btn--ghost" onClick={startCreate}>
            New offer
          </button>
        )}
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

      <form className="studio-editor__section" onSubmit={handleSubmit}>
        <div className="studio-editor__stack">
          <label className="studio-field">
            <span>Provider</span>
            <select
              className="studio-input"
              value={form.provider}
              onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
              required
            >
              <option value="">Select provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field">
            <span>Product {productLabel ? `· ${productLabel}` : ''}</span>
            <input
              className="studio-input"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product…"
            />
          </label>
          {productHits.length > 0 && (
            <ul className="studio-hero-placement__list">
              {productHits.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="studio-hero-placement__item"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, product: String(p.id) }));
                      setProductLabel(p.product_name);
                      setProductSearch('');
                      setProductHits([]);
                    }}
                  >
                    <span className="studio-hero-placement__title">{p.product_name}</span>
                    <span className="studio-icon-btn studio-icon-btn--edit">
                      <span>Select</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="studio-editor__grid">
            <label className="studio-field">
              <span>Deposit (KES)</span>
              <input
                className="studio-input"
                value={form.deposit_amount}
                onChange={(e) => setForm((p) => ({ ...p, deposit_amount: e.target.value }))}
                required
              />
            </label>
            <label className="studio-field">
              <span>Retail (KES)</span>
              <input
                className="studio-input"
                value={form.retail_amount}
                onChange={(e) => setForm((p) => ({ ...p, retail_amount: e.target.value }))}
                required
              />
            </label>
            <label className="studio-field">
              <span>Term unit</span>
              <select
                className="studio-input"
                value={form.term_unit}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    term_unit: e.target.value as 'day' | 'week' | 'month',
                  }))
                }
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </label>
            <label className="studio-field">
              <span>Term count</span>
              <input
                className="studio-input"
                value={form.term_count}
                onChange={(e) => setForm((p) => ({ ...p, term_count: e.target.value }))}
              />
            </label>
            <label className="studio-field">
              <span>
                {form.term_unit === 'day'
                  ? 'Daily payment'
                  : form.term_unit === 'week'
                    ? 'Weekly payment'
                    : 'Monthly payment'}{' '}
                (KES)
              </span>
              <input
                className="studio-input"
                value={
                  form.term_unit === 'day'
                    ? form.daily_payment
                    : form.term_unit === 'week'
                      ? form.weekly_payment
                      : form.monthly_payment
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({
                    ...p,
                    daily_payment: p.term_unit === 'day' ? v : '',
                    weekly_payment: p.term_unit === 'week' ? v : '',
                    monthly_payment: p.term_unit === 'month' ? v : '',
                  }));
                }}
                required
              />
            </label>
          </div>
          <label className="studio-field studio-field--checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            <span>Active</span>
          </label>
        </div>
        <button type="submit" className="studio-btn studio-btn--primary studio-btn--block" disabled={saving}>
          {saving ? 'Saving…' : editingId ? 'Save offer' : 'Create offer'}
        </button>
      </form>

      <section className="studio-editor__section">
        <h3 className="studio-editor__section-title">Offers ({offers.length})</h3>
        <ul className="studio-hero-placement__list">
          {offers.map((offer) => (
            <li key={offer.id}>
              <div className="studio-hero-placement__item" style={{ cursor: 'default' }}>
                <span className="studio-hero-placement__title">
                  {offer.product_name || `Product #${offer.product}`} ·{' '}
                  {offer.provider_name || `Provider #${offer.provider}`}
                  {offer.is_active === false ? ' (off)' : ''}
                </span>
                <button type="button" className="studio-icon-btn studio-icon-btn--edit" onClick={() => startEdit(offer)}>
                  <span>Edit</span>
                </button>
                <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete(offer)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

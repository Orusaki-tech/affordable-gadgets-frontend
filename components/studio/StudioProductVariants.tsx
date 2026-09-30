'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createStudioProductVariant,
  deleteStudioProductVariant,
  listStudioProductVariants,
  patchStudioProductVariant,
  StudioApiError,
  type StudioProductVariant,
} from '@/lib/studio/api';

type Props = {
  productId: number;
};

export function StudioProductVariants({ productId }: Props) {
  const [variants, setVariants] = useState<StudioProductVariant[]>([]);
  const [storageGb, setStorageGb] = useState('');
  const [ramGb, setRamGb] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const rows = await listStudioProductVariants(productId);
    setVariants(rows);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof StudioApiError ? err.message : 'Could not load variants');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sellingPrice.trim()) {
      setError('Selling price is required.');
      return;
    }
    try {
      await createStudioProductVariant({
        product_id: productId,
        storage_gb: storageGb.trim() ? Number(storageGb) : null,
        ram_gb: ramGb.trim() ? Number(ramGb) : null,
        default_selling_price: sellingPrice.trim(),
        default_cost_of_unit: cost.trim() || '0',
        is_active: true,
      });
      setStorageGb('');
      setRamGb('');
      setSellingPrice('');
      setCost('');
      await reload();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Could not add variant');
    }
  };

  const handleDelete = async (variant: StudioProductVariant) => {
    if (!window.confirm('Delete this variant?')) return;
    try {
      await deleteStudioProductVariant(variant.id);
      await reload();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Delete failed');
    }
  };

  const updateField = async (
    variant: StudioProductVariant,
    patch: Partial<StudioProductVariant>
  ) => {
    try {
      await patchStudioProductVariant(variant.id, {
        storage_gb: patch.storage_gb ?? variant.storage_gb ?? null,
        ram_gb: patch.ram_gb ?? variant.ram_gb ?? null,
        default_selling_price: patch.default_selling_price ?? variant.default_selling_price ?? '0',
        default_cost_of_unit: patch.default_cost_of_unit ?? variant.default_cost_of_unit ?? '0',
        is_active: patch.is_active ?? variant.is_active ?? true,
      });
      await reload();
    } catch (err) {
      setError(err instanceof StudioApiError ? err.message : 'Update failed');
    }
  };

  if (loading) return <p className="studio-editor__hint">Loading variants…</p>;

  return (
    <section className="studio-editor__section">
      <h3 className="studio-editor__section-title">Variants & cost</h3>
      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      <ul className="studio-hero-placement__list">
        {variants.map((v) => (
          <li key={v.id}>
            <div className="studio-hero-placement__item" style={{ cursor: 'default', flexWrap: 'wrap', gap: 8 }}>
              <input
                className="studio-input"
                style={{ width: 72 }}
                placeholder="Storage"
                defaultValue={v.storage_gb ?? ''}
                onBlur={(e) =>
                  void updateField(v, {
                    storage_gb: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
              <input
                className="studio-input"
                style={{ width: 72 }}
                placeholder="RAM"
                defaultValue={v.ram_gb ?? ''}
                onBlur={(e) =>
                  void updateField(v, {
                    ram_gb: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
              <input
                className="studio-input"
                style={{ width: 96 }}
                placeholder="Sell"
                defaultValue={v.default_selling_price ?? ''}
                onBlur={(e) =>
                  void updateField(v, { default_selling_price: e.target.value || '0' })
                }
              />
              <input
                className="studio-input"
                style={{ width: 96 }}
                placeholder="Cost"
                defaultValue={v.default_cost_of_unit ?? ''}
                onBlur={(e) =>
                  void updateField(v, { default_cost_of_unit: e.target.value || '0' })
                }
              />
              <button type="button" className="studio-btn studio-btn--ghost" onClick={() => void handleDelete(v)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form className="studio-editor__grid" onSubmit={handleAdd} style={{ marginTop: '0.75rem' }}>
        <label className="studio-field">
          <span>Storage GB</span>
          <input className="studio-input" value={storageGb} onChange={(e) => setStorageGb(e.target.value)} />
        </label>
        <label className="studio-field">
          <span>RAM GB</span>
          <input className="studio-input" value={ramGb} onChange={(e) => setRamGb(e.target.value)} />
        </label>
        <label className="studio-field">
          <span>Selling price</span>
          <input className="studio-input" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
        </label>
        <label className="studio-field">
          <span>Cost of unit</span>
          <input className="studio-input" value={cost} onChange={(e) => setCost(e.target.value)} />
        </label>
        <button type="submit" className="studio-btn studio-btn--primary">
          Add variant
        </button>
      </form>
    </section>
  );
}

'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import {
  createStudioProduct,
  patchStudioProduct,
  updateStudioProductContent,
  StudioApiError,
  type StudioProduct,
} from '@/lib/studio/api';
import { StudioProductImages } from '@/components/studio/StudioProductImages';

const PRODUCT_TYPES = [
  { value: 'PH', label: 'Phone' },
  { value: 'TB', label: 'Tablet' },
  { value: 'LT', label: 'Laptop' },
  { value: 'AC', label: 'Accessory' },
] as const;

const CONTENT_KEYS = new Set([
  'product_name',
  'product_description',
  'long_description',
  'meta_title',
  'meta_description',
  'slug',
  'keywords',
  'is_published',
]);

type StudioProductEditorProps = {
  mode: 'create' | 'edit';
  product?: StudioProduct | null;
  onSaved?: (product: StudioProduct) => void;
};

type FormState = {
  product_name: string;
  product_type: string;
  brand: string;
  model_series: string;
  product_description: string;
  long_description: string;
  default_selling_price: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  keywords: string;
  is_published: boolean;
  is_discontinued: boolean;
};

function toFormState(product?: StudioProduct | null): FormState {
  return {
    product_name: product?.product_name || '',
    product_type: product?.product_type || 'PH',
    brand: product?.brand || '',
    model_series: product?.model_series || '',
    product_description: product?.product_description || '',
    long_description: product?.long_description || '',
    default_selling_price:
      product?.default_selling_price != null ? String(product.default_selling_price) : '',
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
    slug: product?.slug || '',
    keywords: product?.keywords || '',
    is_published: product?.is_published ?? true,
    is_discontinued: product?.is_discontinued ?? false,
  };
}

export function StudioProductEditor({ mode, product, onSaved }: StudioProductEditorProps) {
  const { capabilities } = useStudioAuth();
  const [activeMode, setActiveMode] = useState(mode);
  const [form, setForm] = useState<FormState>(() => toFormState(product));
  const [currentProduct, setCurrentProduct] = useState<StudioProduct | null>(product ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveMode(mode);
    setForm(toFormState(product));
    setCurrentProduct(product ?? null);
  }, [mode, product]);

  const canEdit = useMemo(() => {
    if (activeMode === 'create') return capabilities.canCreate;
    return capabilities.canFullEdit || capabilities.canContentEdit;
  }, [activeMode, capabilities]);

  const contentOnly =
    activeMode === 'edit' && !capabilities.canFullEdit && capabilities.canContentEdit;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setError(null);
    setSavedMsg(null);
    setSaving(true);

    const payload: Record<string, string | boolean | null> = {
      product_name: form.product_name.trim(),
      product_type: form.product_type,
      brand: form.brand.trim(),
      model_series: form.model_series.trim(),
      product_description: form.product_description,
      long_description: form.long_description,
      default_selling_price: form.default_selling_price.trim() || null,
      meta_title: form.meta_title.trim(),
      meta_description: form.meta_description.trim(),
      slug: form.slug.trim(),
      keywords: form.keywords.trim(),
      is_published: form.is_published,
      is_discontinued: form.is_discontinued,
    };

    try {
      if (activeMode === 'create') {
        if (!payload.product_name) {
          throw new StudioApiError('Product name is required', 400, null);
        }
        const created = await createStudioProduct(payload);
        setActiveMode('edit');
        setCurrentProduct(created);
        setSavedMsg('Created — add images below, then close when done');
        onSaved?.(created);
        return;
      }

      const productId = currentProduct?.id ?? product?.id;
      if (!productId) {
        throw new StudioApiError('Missing product id', 400, null);
      }

      let saved: StudioProduct;
      if (contentOnly) {
        const contentPayload: Record<string, string | boolean | null> = {};
        Object.entries(payload).forEach(([key, value]) => {
          if (CONTENT_KEYS.has(key)) contentPayload[key] = value;
        });
        saved = await updateStudioProductContent(productId, contentPayload);
      } else {
        saved = await patchStudioProduct(productId, payload);
      }
      setCurrentProduct(saved);
      setSavedMsg('Saved');
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

  if (!canEdit && activeMode === 'create') {
    return (
      <div className="studio-alert" role="status">
        Your role cannot create products.
      </div>
    );
  }

  const fieldDisabled = !canEdit || saving;
  const inventoryDisabled = fieldDisabled || contentOnly;

  return (
    <form className="studio-editor" onSubmit={handleSubmit}>
      <div className="studio-editor__header">
        <h2 className="studio-editor__title">
          {activeMode === 'create' ? 'New product' : 'Edit product'}
        </h2>
        {contentOnly && (
          <p className="studio-editor__hint">
            Content-creator mode: name, descriptions, SEO, images, and publish.
          </p>
        )}
      </div>

      <div className="studio-editor__grid">
        <label className="studio-field studio-field--full">
          <span>Product name *</span>
          <input
            className="studio-input"
            value={form.product_name}
            onChange={(e) => setField('product_name', e.target.value)}
            disabled={fieldDisabled}
            required
          />
        </label>

        <label className="studio-field">
          <span>Type</span>
          <select
            className="studio-input"
            value={form.product_type}
            onChange={(e) => setField('product_type', e.target.value)}
            disabled={inventoryDisabled}
          >
            {PRODUCT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="studio-field">
          <span>Brand</span>
          <input
            className="studio-input"
            value={form.brand}
            onChange={(e) => setField('brand', e.target.value)}
            disabled={inventoryDisabled}
            placeholder="Apple, Samsung…"
          />
        </label>

        <label className="studio-field">
          <span>Model series</span>
          <input
            className="studio-input"
            value={form.model_series}
            onChange={(e) => setField('model_series', e.target.value)}
            disabled={inventoryDisabled}
          />
        </label>

        <label className="studio-field">
          <span>Default selling price (KSh)</span>
          <input
            className="studio-input"
            type="number"
            min={0}
            step={1}
            value={form.default_selling_price}
            onChange={(e) => setField('default_selling_price', e.target.value)}
            disabled={inventoryDisabled}
          />
        </label>

        <label className="studio-field studio-field--full">
          <span>Short description</span>
          <textarea
            className="studio-input studio-textarea"
            rows={3}
            value={form.product_description}
            onChange={(e) => setField('product_description', e.target.value)}
            disabled={fieldDisabled}
          />
        </label>

        <label className="studio-field studio-field--full">
          <span>Long description</span>
          <textarea
            className="studio-input studio-textarea"
            rows={5}
            value={form.long_description}
            onChange={(e) => setField('long_description', e.target.value)}
            disabled={fieldDisabled}
          />
        </label>

        <label className="studio-field">
          <span>Slug</span>
          <input
            className="studio-input"
            value={form.slug}
            onChange={(e) => setField('slug', e.target.value)}
            disabled={fieldDisabled}
          />
        </label>

        <label className="studio-field">
          <span>Keywords</span>
          <input
            className="studio-input"
            value={form.keywords}
            onChange={(e) => setField('keywords', e.target.value)}
            disabled={fieldDisabled}
          />
        </label>

        <label className="studio-field studio-field--full">
          <span>Meta title</span>
          <input
            className="studio-input"
            value={form.meta_title}
            onChange={(e) => setField('meta_title', e.target.value)}
            disabled={fieldDisabled}
          />
        </label>

        <label className="studio-field studio-field--full">
          <span>Meta description</span>
          <textarea
            className="studio-input studio-textarea"
            rows={2}
            value={form.meta_description}
            onChange={(e) => setField('meta_description', e.target.value)}
            disabled={fieldDisabled}
          />
        </label>

        <label className="studio-check">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setField('is_published', e.target.checked)}
            disabled={fieldDisabled}
          />
          <span>Published on storefront</span>
        </label>

        <label className="studio-check">
          <input
            type="checkbox"
            checked={form.is_discontinued}
            onChange={(e) => setField('is_discontinued', e.target.checked)}
            disabled={inventoryDisabled}
          />
          <span>Discontinued</span>
        </label>
      </div>

      {currentProduct?.id ? (
        <StudioProductImages
          productId={currentProduct.id}
          productName={currentProduct.product_name || form.product_name}
          initialImages={currentProduct.images}
          disabled={fieldDisabled}
          onChanged={(next) => {
            setCurrentProduct(next);
            setSavedMsg('Images updated');
          }}
        />
      ) : (
        activeMode === 'create' && (
          <p className="studio-editor__hint">Save the product first, then upload images.</p>
        )
      )}

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="studio-alert studio-alert--ok" role="status">
          {savedMsg}
        </div>
      )}

      {canEdit && (
        <div className="studio-editor__actions">
          <button type="submit" className="studio-btn studio-btn--lime" disabled={saving}>
            {saving ? 'Saving…' : activeMode === 'create' ? 'Create product' : 'Save changes'}
          </button>
        </div>
      )}
    </form>
  );
}

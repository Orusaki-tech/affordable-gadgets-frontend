'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useStudioAuth } from '@/components/studio/StudioAuthContext';
import {
  createStudioProduct,
  listStudioTags,
  patchStudioProduct,
  resolveStudioImageUrl,
  setStudioProductTagIds,
  updateStudioProductContent,
  StudioApiError,
  type StudioProduct,
  type StudioTag,
} from '@/lib/studio/api';
import { StudioProductImages } from '@/components/studio/StudioProductImages';
import {
  StudioProductVideos,
  videosFromProduct,
  type StudioVideoRow,
} from '@/components/studio/StudioProductVideos';
import { StudioProductVariants } from '@/components/studio/StudioProductVariants';
import { StudioProductAccessories } from '@/components/studio/StudioProductAccessories';
import { StudioCharCount } from '@/components/studio/StudioCharCount';

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
  const [videos, setVideos] = useState<StudioVideoRow[]>(() => videosFromProduct(product));
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [ogFile, setOgFile] = useState<File | null>(null);
  const [ogPreview, setOgPreview] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<StudioTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveMode(mode);
    setForm(toFormState(product));
    setCurrentProduct(product ?? null);
    setVideos(videosFromProduct(product));
    setVideoFile(null);
    setOgFile(null);
    setOgPreview(null);
    setSelectedTagIds(
      (product?.tags || [])
        .map((t) => t.id)
        .filter((id): id is number => typeof id === 'number')
    );
  }, [mode, product]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const tags = await listStudioTags();
        if (!cancelled) setAllTags(tags);
      } catch {
        if (!cancelled) setAllTags([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (ogPreview) URL.revokeObjectURL(ogPreview);
    };
  }, [ogPreview]);

  const canEdit = useMemo(() => {
    if (activeMode === 'create') return capabilities.canCreateProduct;
    return capabilities.canFullEditProduct || capabilities.canContentEditProduct;
  }, [activeMode, capabilities]);

  const contentOnly =
    activeMode === 'edit' &&
    !capabilities.canFullEditProduct &&
    capabilities.canContentEditProduct;
  const canMedia = capabilities.canManageProductMedia;
  const canFull = capabilities.canFullEditProduct;
  const canTags = capabilities.canContentEditProduct || capabilities.canFullEditProduct;

  const currentOg =
    ogPreview ||
    resolveStudioImageUrl(currentProduct?.og_image_url) ||
    null;

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

    const videoRows = videos
      .map((video, index) => ({
        url: video.url.trim(),
        title: video.title.trim(),
        display_order: index,
      }))
      .filter((video) => Boolean(video.url));
    const firstVideoUrl = videoRows[0]?.url || '';

    const payload: Record<
      string,
      string | Blob | boolean | null | undefined | unknown[]
    > = {
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
      videos: videoRows,
      product_video_url: firstVideoUrl,
    };
    if (videoFile) {
      payload.product_video_file = videoFile;
    }
    if (ogFile) {
      payload.og_image = ogFile;
    }

    try {
      if (activeMode === 'create') {
        if (!payload.product_name) {
          throw new StudioApiError('Product name is required', 400, null);
        }
        const created = await createStudioProduct(payload);
        if (canTags && selectedTagIds.length) {
          try {
            await setStudioProductTagIds(created.id, selectedTagIds);
          } catch {
            /* tag attach optional on create */
          }
        }
        setActiveMode('edit');
        setCurrentProduct(created);
        setVideos(videosFromProduct(created));
        setVideoFile(null);
        setOgFile(null);
        setSavedMsg('Created — add images/videos below, then close when done');
        onSaved?.(created);
        return;
      }

      const productId = currentProduct?.id ?? product?.id;
      if (!productId) {
        throw new StudioApiError('Missing product id', 400, null);
      }

      let saved: StudioProduct;
      if (contentOnly) {
        const contentPayload: Record<
          string,
          string | Blob | boolean | null | undefined | unknown[]
        > = {
          videos: videoRows,
          product_video_url: firstVideoUrl,
        };
        Object.entries(payload).forEach(([key, value]) => {
          if (CONTENT_KEYS.has(key)) contentPayload[key] = value as string | boolean | null;
        });
        if (videoFile) contentPayload.product_video_file = videoFile;
        if (ogFile) contentPayload.og_image = ogFile;
        saved = await updateStudioProductContent(productId, contentPayload);
      } else {
        saved = await patchStudioProduct(productId, payload);
      }
      if (canTags) {
        saved = await setStudioProductTagIds(productId, selectedTagIds);
      }
      setCurrentProduct(saved);
      setVideos(videosFromProduct(saved));
      setVideoFile(null);
      setOgFile(null);
      setSelectedTagIds(
        (saved.tags || [])
          .map((t) => t.id)
          .filter((id): id is number => typeof id === 'number')
      );
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
            Content-creator mode: name, descriptions, SEO, images, videos, and publish.
          </p>
        )}
        <p className="studio-editor__hint">{capabilities.editableSummary}</p>
      </div>

      <div className="studio-editor__grid">
        <label className="studio-field studio-field--full">
          <span>
            Product name * <StudioCharCount length={form.product_name.length} max={255} />
          </span>
          <input
            className="studio-input"
            value={form.product_name}
            onChange={(e) => setField('product_name', e.target.value)}
            disabled={fieldDisabled}
            maxLength={255}
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
          <span>
            Brand <StudioCharCount length={form.brand.length} max={50} />
          </span>
          <input
            className="studio-input"
            value={form.brand}
            onChange={(e) => setField('brand', e.target.value)}
            disabled={inventoryDisabled}
            maxLength={50}
            placeholder="Apple, Samsung…"
          />
        </label>

        <label className="studio-field">
          <span>
            Model series <StudioCharCount length={form.model_series.length} max={100} />
          </span>
          <input
            className="studio-input"
            value={form.model_series}
            onChange={(e) => setField('model_series', e.target.value)}
            disabled={inventoryDisabled}
            maxLength={100}
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
          <span>
            Slug <StudioCharCount length={form.slug.length} max={255} />
          </span>
          <input
            className="studio-input"
            value={form.slug}
            onChange={(e) => setField('slug', e.target.value)}
            disabled={fieldDisabled}
            maxLength={255}
          />
        </label>

        <label className="studio-field">
          <span>
            Keywords <StudioCharCount length={form.keywords.length} max={255} />
          </span>
          <input
            className="studio-input"
            value={form.keywords}
            onChange={(e) => setField('keywords', e.target.value)}
            disabled={fieldDisabled}
            maxLength={255}
          />
        </label>

        <label className="studio-field studio-field--full">
          <span>
            Meta title <StudioCharCount length={form.meta_title.length} max={60} />
          </span>
          <input
            className="studio-input"
            value={form.meta_title}
            onChange={(e) => setField('meta_title', e.target.value)}
            disabled={fieldDisabled}
            maxLength={60}
            placeholder="SEO title — max 60 characters"
          />
        </label>

        <label className="studio-field studio-field--full">
          <span>
            Meta description <StudioCharCount length={form.meta_description.length} max={160} />
          </span>
          <textarea
            className="studio-input studio-textarea"
            rows={2}
            value={form.meta_description}
            onChange={(e) => setField('meta_description', e.target.value)}
            disabled={fieldDisabled}
            maxLength={160}
            placeholder="SEO description — max 160 characters"
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
        <>
          {canMedia && (
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
          )}
          {canMedia && (
            <StudioProductVideos
              videos={videos}
              onChange={(next) => {
                setVideos(next);
                setSavedMsg(null);
              }}
              videoFile={videoFile}
              onVideoFileChange={(file) => {
                setVideoFile(file);
                setSavedMsg(null);
              }}
              existingFileUrl={currentProduct.product_video_file_url}
              disabled={fieldDisabled}
            />
          )}
          {canTags && (
            <section className="studio-editor__section">
              <h3 className="studio-editor__section-title">Tags</h3>
              <div className="studio-chip-grid" role="group" aria-label="Product tags">
                {allTags.map((tag) => {
                  if (!tag.id) return null;
                  const on = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`studio-chip${on ? ' is-on' : ''}`}
                      aria-pressed={on}
                      disabled={fieldDisabled}
                      onClick={() => {
                        const id = tag.id!;
                        setSelectedTagIds((prev) =>
                          prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
                        );
                        setSavedMsg(null);
                      }}
                    >
                      <span className="studio-chip__label">{tag.name || tag.slug}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          {(canMedia || canTags) && (
            <section className="studio-editor__section">
              <div className="studio-editor__section-head">
                <h3>OG image</h3>
                <label className="studio-btn studio-btn--ghost studio-images__upload">
                  {ogFile ? 'Replace' : currentOg ? 'Change' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={fieldDisabled}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (ogPreview) URL.revokeObjectURL(ogPreview);
                      setOgFile(file);
                      setOgPreview(file ? URL.createObjectURL(file) : null);
                      e.target.value = '';
                      setSavedMsg(null);
                    }}
                  />
                </label>
              </div>
              {currentOg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentOg} alt="" className="studio-images__preview" />
              ) : (
                <div className="studio-dropzone">Upload Open Graph / social share image</div>
              )}
            </section>
          )}
          {canFull && <StudioProductVariants productId={currentProduct.id} />}
          {canFull && <StudioProductAccessories productId={currentProduct.id} />}
        </>
      ) : (
        activeMode === 'create' && (
          <p className="studio-editor__hint">Save the product first, then upload images and videos.</p>
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

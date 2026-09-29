'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  deleteStudioProductImages,
  resolveStudioImageUrl,
  retrieveStudioProduct,
  setStudioProductPrimaryImage,
  StudioApiError,
  uploadStudioProductImages,
  type StudioProduct,
  type StudioProductImage,
} from '@/lib/studio/api';

type StudioProductImagesProps = {
  productId: number;
  productName?: string;
  initialImages?: StudioProduct['images'];
  disabled?: boolean;
  onChanged?: (product: StudioProduct) => void;
};

function toImageList(images?: StudioProduct['images']): StudioProductImage[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img): img is NonNullable<typeof img> & { id: number } => typeof img?.id === 'number')
    .map((img) => ({
      id: img.id,
      image_url: img.image_url,
      image: img.image,
      is_primary: img.is_primary,
      alt_text: img.alt_text,
      display_order: img.display_order,
    }))
    .sort((a, b) => {
      if (Boolean(a.is_primary) !== Boolean(b.is_primary)) {
        return a.is_primary ? -1 : 1;
      }
      return (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id;
    });
}

export function StudioProductImages({
  productId,
  productName,
  initialImages,
  disabled,
  onChanged,
}: StudioProductImagesProps) {
  const [images, setImages] = useState<StudioProductImage[]>(() => toImageList(initialImages));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setImages(toImageList(initialImages));
  }, [initialImages, productId]);

  const refresh = useCallback(async () => {
    const product = await retrieveStudioProduct(productId);
    setImages(toImageList(product.images));
    onChanged?.(product);
    return product;
  }, [onChanged, productId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    setBusy(true);
    setError(null);
    try {
      const list = Array.from(files);
      await uploadStudioProductImages(productId, list, {
        makePrimary: images.length === 0,
        altText: productName ? `${productName} product image` : undefined,
      });
      await refresh();
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Upload failed'
      );
    } finally {
      setBusy(false);
    }
  };

  const handlePrimary = async (imageId: number) => {
    if (disabled) return;
    setBusy(true);
    setError(null);
    try {
      await setStudioProductPrimaryImage(productId, imageId);
      await refresh();
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not set primary image'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (imageId: number) => {
    if (disabled) return;
    const ok = window.confirm('Delete this product image?');
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await deleteStudioProductImages(productId, [imageId]);
      await refresh();
    } catch (err) {
      setError(
        err instanceof StudioApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Delete failed'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="studio-images">
      <div className="studio-images__head">
        <h3 className="studio-images__title">
          Product images{images.length > 0 ? ` (${images.length})` : ''}
        </h3>
        <label className="studio-btn studio-btn--ghost studio-images__upload">
          {busy ? 'Working…' : 'Add images'}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={disabled || busy}
            onChange={(e) => {
              void handleUpload(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {images.length === 0 ? (
        <p className="studio-images__empty">No images yet. Upload storefront photos here.</p>
      ) : (
        <ul className="studio-images__grid">
          {images.map((image) => {
            const src = resolveStudioImageUrl(image.image_url, [image.image]);
            return (
              <li key={image.id} className="studio-images__item">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={image.alt_text || 'Product'} className="studio-images__thumb" />
                ) : (
                  <div className="studio-images__thumb studio-images__thumb--empty" />
                )}
                <div className="studio-images__meta">
                  {image.is_primary ? (
                    <span className="studio-images__badge">Primary</span>
                  ) : (
                    <button
                      type="button"
                      className="studio-images__action"
                      disabled={disabled || busy}
                      onClick={() => void handlePrimary(image.id)}
                    >
                      Make primary
                    </button>
                  )}
                  <button
                    type="button"
                    className="studio-images__action studio-images__action--danger"
                    disabled={disabled || busy}
                    onClick={() => void handleDelete(image.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

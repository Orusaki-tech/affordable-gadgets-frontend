'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  patchStudioPromotion,
  resolveStudioImageUrl,
  StudioApiError,
  type StudioPromotion,
} from '@/lib/studio/api';

type StudioPromotionEditorProps = {
  promotion: StudioPromotion;
  onSaved?: (promotion: StudioPromotion) => void;
};

export function StudioPromotionEditor({ promotion, onSaved }: StudioPromotionEditorProps) {
  const [title, setTitle] = useState(promotion.title || '');
  const [description, setDescription] = useState(promotion.description || '');
  const [isActive, setIsActive] = useState(promotion.is_active ?? true);
  const [discountPercentage, setDiscountPercentage] = useState(
    promotion.discount_percentage != null ? String(promotion.discount_percentage) : ''
  );
  const [discountAmount, setDiscountAmount] = useState(
    promotion.discount_amount != null ? String(promotion.discount_amount) : ''
  );
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(promotion.title || '');
    setDescription(promotion.description || '');
    setIsActive(promotion.is_active ?? true);
    setDiscountPercentage(
      promotion.discount_percentage != null ? String(promotion.discount_percentage) : ''
    );
    setDiscountAmount(
      promotion.discount_amount != null ? String(promotion.discount_amount) : ''
    );
    setBannerFile(null);
    setBannerPreview(null);
  }, [promotion]);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const currentBanner =
    bannerPreview ||
    resolveStudioImageUrl(promotion.banner_image_url, [promotion.banner_image]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, string | Blob | boolean | number | null | undefined> = {
        title: title.trim(),
        description: description.trim(),
        is_active: isActive,
        discount_percentage: discountPercentage.trim() || null,
        discount_amount: discountAmount.trim() || null,
      };
      if (bannerFile) {
        payload.banner_image = bannerFile;
      }
      const saved = await patchStudioPromotion(promotion.id, payload);
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
      <label className="studio-field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="studio-field">
        <span>Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </label>
      <label className="studio-field">
        <span>Discount %</span>
        <input
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(e.target.value)}
          inputMode="decimal"
        />
      </label>
      <label className="studio-field">
        <span>Discount amount (KES)</span>
        <input
          value={discountAmount}
          onChange={(e) => setDiscountAmount(e.target.value)}
          inputMode="decimal"
        />
      </label>

      <div className="studio-images studio-images--single">
        <div className="studio-images__head">
          <h3 className="studio-images__title">Banner image</h3>
          <label className="studio-btn studio-btn--ghost studio-images__upload">
            {bannerFile ? 'Change image' : 'Upload image'}
            <input
              type="file"
              accept="image/*"
              disabled={saving}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (bannerPreview) URL.revokeObjectURL(bannerPreview);
                setBannerFile(file);
                setBannerPreview(file ? URL.createObjectURL(file) : null);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {currentBanner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentBanner} alt="" className="studio-images__preview" />
        ) : (
          <p className="studio-images__empty">No banner yet.</p>
        )}
      </div>

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
        {saving ? 'Saving…' : 'Save promotion'}
      </button>
    </form>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  patchStudioFinancingProvider,
  resolveStudioImageUrl,
  StudioApiError,
  type StudioFinancingProvider,
} from '@/lib/studio/api';
import { StudioCharCount } from '@/components/studio/StudioCharCount';

type StudioFinancingProviderEditorProps = {
  provider: StudioFinancingProvider;
  roleHint?: string;
  onSaved?: (provider: StudioFinancingProvider) => void;
};

export function StudioFinancingProviderEditor({
  provider,
  roleHint,
  onSaved,
}: StudioFinancingProviderEditorProps) {
  const [name, setName] = useState(provider.name || '');
  const [slug, setSlug] = useState(provider.slug || '');
  const [isActive, setIsActive] = useState(provider.is_active ?? true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(provider.name || '');
    setSlug(provider.slug || '');
    setIsActive(provider.is_active ?? true);
    setLogoFile(null);
    setLogoPreview(null);
  }, [provider]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const currentLogo =
    logoPreview || resolveStudioImageUrl(provider.logo_url, [provider.logo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, string | Blob | boolean | null | undefined> = {
        name: name.trim(),
        slug: slug.trim(),
        is_active: isActive,
      };
      if (logoFile) payload.logo = logoFile;
      const saved = await patchStudioFinancingProvider(provider.id, payload);
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
        <h2 className="studio-editor__title">Edit financing provider</h2>
        <p className="studio-editor__hint">
          {roleHint || 'Uses /api/inventory/financing-providers/ (Inventory Manager).'}
        </p>
        <p className="studio-editor__hint">
          Editing: <strong>{provider.name || `Provider #${provider.id}`}</strong>
        </p>
      </div>
      <label className="studio-field">
        <span>
          Name <StudioCharCount length={name.length} max={100} />
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
        />
      </label>
      <label className="studio-field">
        <span>
          Slug <StudioCharCount length={slug.length} max={120} />
        </span>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          maxLength={120}
          required
        />
      </label>
      <div className="studio-images studio-images--single">
        <div className="studio-images__head">
          <h3 className="studio-images__title">Logo</h3>
          <label className="studio-btn studio-btn--ghost studio-images__upload">
            {logoFile ? 'Change logo' : 'Upload logo'}
            <input
              type="file"
              accept="image/*"
              disabled={saving}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (logoPreview) URL.revokeObjectURL(logoPreview);
                setLogoFile(file);
                setLogoPreview(file ? URL.createObjectURL(file) : null);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {currentLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentLogo} alt="" className="studio-images__preview" />
        ) : (
          <p className="studio-images__empty">No logo yet.</p>
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
        {saving ? 'Saving…' : 'Save provider'}
      </button>
    </form>
  );
}

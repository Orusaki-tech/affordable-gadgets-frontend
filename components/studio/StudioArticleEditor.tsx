'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  patchStudioArticle,
  StudioApiError,
  type StudioArticle,
} from '@/lib/studio/api';

type StudioArticleEditorProps = {
  article: StudioArticle;
  onSaved?: (article: StudioArticle) => void;
};

export function StudioArticleEditor({ article, onSaved }: StudioArticleEditorProps) {
  const [headline, setHeadline] = useState(article.headline || '');
  const [slug, setSlug] = useState(article.slug || '');
  const [seoTitle, setSeoTitle] = useState(article.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(article.seo_description || '');
  const [body, setBody] = useState(article.body || '');
  const [isPublished, setIsPublished] = useState(article.is_published ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHeadline(article.headline || '');
    setSlug(article.slug || '');
    setSeoTitle(article.seo_title || '');
    setSeoDescription(article.seo_description || '');
    setBody(article.body || '');
    setIsPublished(article.is_published ?? true);
  }, [article]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const saved = await patchStudioArticle(article.id, {
        headline: headline.trim(),
        slug: slug.trim(),
        seo_title: seoTitle.trim(),
        seo_description: seoDescription.trim(),
        body,
        is_published: isPublished,
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
      <label className="studio-field">
        <span>Headline</span>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} required />
      </label>
      <label className="studio-field">
        <span>Slug</span>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </label>
      <label className="studio-field">
        <span>SEO title</span>
        <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
      </label>
      <label className="studio-field">
        <span>SEO description</span>
        <textarea
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          rows={3}
        />
      </label>
      <label className="studio-field">
        <span>Body (markdown)</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
      </label>
      <label className="studio-field studio-field--checkbox">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        <span>Published</span>
      </label>
      {error && (
        <div className="studio-alert" role="alert">
          {error}
        </div>
      )}
      <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save article'}
      </button>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { StudioProductEditor } from '@/components/studio/StudioProductEditor';
import { StudioArticleEditor } from '@/components/studio/StudioArticleEditor';
import { StudioPromotionEditor } from '@/components/studio/StudioPromotionEditor';
import { StudioBundleEditor } from '@/components/studio/StudioBundleEditor';
import { StudioFinancingProviderEditor } from '@/components/studio/StudioFinancingProviderEditor';
import { StudioDeliveryRateEditor } from '@/components/studio/StudioDeliveryRateEditor';
import {
  StudioTaggedProductsEditor,
  type StudioSectionTagKey,
} from '@/components/studio/StudioTaggedProductsEditor';
import { StudioTaggedArticlesEditor } from '@/components/studio/StudioTaggedArticlesEditor';
import type {
  StudioArticle,
  StudioBundle,
  StudioDeliveryRate,
  StudioFinancingProvider,
  StudioProduct,
  StudioPromotion,
} from '@/lib/studio/api';

export type StudioEditResource =
  | { kind: 'product'; mode: 'create' | 'edit'; product?: StudioProduct | null }
  | { kind: 'article'; article: StudioArticle }
  | { kind: 'promotion'; promotion: StudioPromotion }
  | { kind: 'bundle'; bundle: StudioBundle }
  | { kind: 'financingProvider'; provider: StudioFinancingProvider }
  | { kind: 'deliveryRate'; rate: StudioDeliveryRate }
  | { kind: 'taggedProducts'; section: StudioSectionTagKey }
  | { kind: 'taggedArticles' }
  /** @deprecated prefer taggedProducts + section: 'featured' */
  | { kind: 'featuredProducts' };

type StudioEditDrawerProps = {
  open: boolean;
  resource: StudioEditResource | null;
  roleHint?: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

function resourceLabel(resource: StudioEditResource): string {
  switch (resource.kind) {
    case 'product':
      return resource.mode === 'create'
        ? 'New product'
        : `Product · ${resource.product?.product_name || resource.product?.id || ''}`;
    case 'article':
      return `Article · ${resource.article.headline || resource.article.slug || resource.article.id}`;
    case 'promotion':
      return resource.promotion.title || `Promotion #${resource.promotion.id}`;
    case 'bundle':
      return `Bundle · ${resource.bundle.title || resource.bundle.id}`;
    case 'financingProvider':
      return `Financing · ${resource.provider.name || resource.provider.id}`;
    case 'deliveryRate':
      return `Delivery · ${resource.rate.county || resource.rate.id}`;
    case 'featuredProducts':
      return 'Featured Product Highlights';
    case 'taggedProducts':
      return resource.section === 'video'
        ? 'Verified Tech Unboxings'
        : 'Featured Product Highlights';
    case 'taggedArticles':
      return 'Tech Buying Guides & Insights';
    default:
      return 'Edit';
  }
}

function taggedSection(resource: StudioEditResource): StudioSectionTagKey | null {
  if (resource.kind === 'taggedProducts') return resource.section;
  if (resource.kind === 'featuredProducts') return 'featured';
  return null;
}

export function StudioEditDrawer({
  open,
  resource,
  roleHint,
  onClose,
  onSaved,
}: StudioEditDrawerProps) {
  const [active, setActive] = useState<StudioEditResource | null>(resource);

  useEffect(() => {
    setActive(resource);
  }, [resource]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !active) return null;

  const label = resourceLabel(active);
  const section = taggedSection(active);

  return (
    <div className="studio-drawer" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" className="studio-drawer__backdrop" aria-label="Close" onClick={onClose} />
      <div className="studio-drawer__panel">
        <div className="studio-drawer__top">
          <div>
            <p className="studio-drawer__eyebrow">
              {active.kind === 'promotion'
                ? 'Edit promotion'
                : active.kind === 'taggedProducts' || active.kind === 'taggedArticles' || active.kind === 'featuredProducts'
                  ? 'Choose content'
                  : 'In-place edit'}
            </p>
            <p className="studio-drawer__context">{label}</p>
          </div>
          <button type="button" className="studio-icon-btn" onClick={onClose} aria-label="Close editor">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        {active.kind === 'product' && (
          <StudioProductEditor
            mode={active.mode}
            product={active.product}
            onSaved={async (saved) => {
              await onSaved();
              if (active.mode === 'create') {
                setActive({ kind: 'product', mode: 'edit', product: saved });
                return;
              }
              onClose();
            }}
          />
        )}
        {active.kind === 'article' && (
          <StudioArticleEditor
            article={active.article}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {active.kind === 'promotion' && (
          <StudioPromotionEditor
            promotion={active.promotion}
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {active.kind === 'bundle' && (
          <StudioBundleEditor
            bundle={active.bundle}
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {active.kind === 'financingProvider' && (
          <StudioFinancingProviderEditor
            provider={active.provider}
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {active.kind === 'deliveryRate' && (
          <StudioDeliveryRateEditor
            rate={active.rate}
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {section && (
          <StudioTaggedProductsEditor
            section={section}
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
            }}
          />
        )}
        {active.kind === 'taggedArticles' && (
          <StudioTaggedArticlesEditor
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
            }}
          />
        )}
      </div>
    </div>
  );
}

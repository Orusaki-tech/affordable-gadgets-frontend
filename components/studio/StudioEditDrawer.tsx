'use client';

import { useEffect, useState } from 'react';
import { StudioProductEditor } from '@/components/studio/StudioProductEditor';
import { StudioArticleEditor } from '@/components/studio/StudioArticleEditor';
import { StudioPromotionEditor } from '@/components/studio/StudioPromotionEditor';
import { StudioPromotionsManager } from '@/components/studio/StudioPromotionsManager';
import { StudioBundleEditor } from '@/components/studio/StudioBundleEditor';
import { StudioFinancingProviderEditor } from '@/components/studio/StudioFinancingProviderEditor';
import { StudioFinancingOffersManager } from '@/components/studio/StudioFinancingOffersManager';
import { StudioDeliveryRateEditor } from '@/components/studio/StudioDeliveryRateEditor';
import { StudioReviewsManager } from '@/components/studio/StudioReviewsManager';
import {
  StudioTaggedProductsEditor,
  type StudioSectionTagKey,
} from '@/components/studio/StudioTaggedProductsEditor';
import { StudioTaggedArticlesEditor } from '@/components/studio/StudioTaggedArticlesEditor';
import { StudioBrandBannerEditor } from '@/components/studio/StudioBrandBannerEditor';
import { StudioHomepageHeroEditor } from '@/components/studio/StudioHomepageHeroEditor';
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
  | { kind: 'article'; mode?: 'create' | 'edit'; article?: StudioArticle | null }
  | {
      kind: 'promotion';
      mode?: 'create' | 'edit';
      promotion?: StudioPromotion | null;
      defaults?: {
        display_locations?: string[];
        title?: string;
        description?: string;
        carousel_position?: number | null;
        listing_brand?: string;
        promotion_code?: string;
        start_date?: string;
        end_date?: string;
      };
      forceLocations?: string[];
      lockLocations?: boolean;
    }
  | { kind: 'promotionsManager' }
  | { kind: 'bundle'; mode?: 'create' | 'edit'; bundle?: StudioBundle | null }
  | { kind: 'financingProvider'; provider: StudioFinancingProvider }
  | { kind: 'financingOffers'; preferProviderId?: number | null }
  | {
      kind: 'deliveryRate';
      mode?: 'create' | 'edit' | 'manage';
      rate?: StudioDeliveryRate | null;
    }
  | { kind: 'reviewsManager'; preferProductId?: number | null }
  | { kind: 'taggedProducts'; section: StudioSectionTagKey }
  | { kind: 'taggedArticles' }
  | { kind: 'brandBanner'; brandFilter: string }
  | { kind: 'homepageHero'; preferPromotionId?: number | null }
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
      if (resource.mode === 'create' || !resource.article?.id) return 'New article';
      return `Article · ${resource.article.headline || resource.article.slug || resource.article.id}`;
    case 'promotion':
      if (resource.mode === 'create' || !resource.promotion?.id) {
        return resource.defaults?.title || 'New promotion';
      }
      return resource.promotion.title || `Promotion #${resource.promotion.id}`;
    case 'promotionsManager':
      return 'Manage promotions';
    case 'bundle':
      if (resource.mode === 'create' || !resource.bundle?.id) return 'New bundle';
      return `Bundle · ${resource.bundle.title || resource.bundle.id}`;
    case 'financingProvider':
      return `Financing · ${resource.provider.name || resource.provider.id}`;
    case 'financingOffers':
      return 'Financing offers';
    case 'deliveryRate':
      if (resource.mode === 'manage') return 'Manage delivery rates';
      if (resource.mode === 'create' || !resource.rate?.id) return 'New delivery rate';
      return `Delivery · ${resource.rate.county || resource.rate.id}`;
    case 'reviewsManager':
      return 'Manage reviews';
    case 'featuredProducts':
      return 'Featured Product Highlights';
    case 'taggedProducts':
      return resource.section === 'video'
        ? 'Verified Tech Unboxings'
        : 'Featured Product Highlights';
    case 'taggedArticles':
      return 'Tech Buying Guides & Insights';
    case 'brandBanner':
      return `${resource.brandFilter} brand banner`;
    case 'homepageHero':
      return 'Homepage hero banner';
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
            <p className="studio-drawer__eyebrow">Studio</p>
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
            mode={active.mode === 'create' || !active.article?.id ? 'create' : 'edit'}
            article={active.article}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
            onDeleted={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {active.kind === 'promotion' && (
          <StudioPromotionEditor
            promotion={active.mode === 'create' ? null : active.promotion}
            roleHint={roleHint}
            defaults={active.defaults}
            forceLocations={active.forceLocations}
            lockLocations={active.lockLocations}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
          />
        )}
        {active.kind === 'promotionsManager' && (
          <StudioPromotionsManager
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
            }}
          />
        )}
        {active.kind === 'bundle' && (
          <StudioBundleEditor
            mode={active.mode === 'create' || !active.bundle?.id ? 'create' : 'edit'}
            bundle={active.bundle}
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
              onClose();
            }}
            onDeleted={async () => {
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
        {active.kind === 'financingOffers' && (
          <StudioFinancingOffersManager
            roleHint={roleHint}
            preferProviderId={active.preferProviderId}
            onSaved={async () => {
              await onSaved();
            }}
          />
        )}
        {active.kind === 'deliveryRate' && (
          <StudioDeliveryRateEditor
            mode={active.mode || (active.rate?.id ? 'edit' : 'create')}
            rate={active.rate}
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
              if (active.mode !== 'manage') onClose();
            }}
            onDeleted={async () => {
              await onSaved();
              if (active.mode !== 'manage') onClose();
            }}
          />
        )}
        {active.kind === 'reviewsManager' && (
          <StudioReviewsManager
            roleHint={roleHint}
            preferProductId={active.preferProductId}
            onSaved={async () => {
              await onSaved();
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
        {active.kind === 'brandBanner' && (
          <StudioBrandBannerEditor
            brandFilter={active.brandFilter}
            roleHint={roleHint}
            onSaved={async () => {
              await onSaved();
            }}
          />
        )}
        {active.kind === 'homepageHero' && (
          <StudioHomepageHeroEditor
            roleHint={roleHint}
            preferPromotionId={active.preferPromotionId}
            onSaved={async () => {
              await onSaved();
            }}
          />
        )}
      </div>
    </div>
  );
}

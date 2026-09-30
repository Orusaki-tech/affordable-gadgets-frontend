'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '@/components/MaterialIcon';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { getBusinessWhatsAppUrl } from '@/lib/config/brand';
import { ApiService } from '@/lib/api/generated';
import type { PublicPromotion } from '@/lib/api/generated';
import { studioPath } from '@/lib/studio/paths';

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Kimathi+House+Room+504+Nairobi';

const THUMBS = [
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto,w_96/v1788773195/products-banners/iphone.jpg',
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto,w_96/v1781265362/products-banners/samsung.jpg',
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto,w_96/v1781354997/products-banners/google.png',
];

const FALLBACK = {
  title: 'Get KSh 500 OFF Website Prices',
  description:
    'Walk in at Kimathi House Room 504, 5th Floor. Cash, M-Pesa, Card accepted on spot.',
  whatsapp: 'Hi — I want the CBD shop KSh 500 OFF offer.',
};

function normalizeLocations(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function pickCbdPromotion(promotions: PublicPromotion[]): PublicPromotion | null {
  return (
    promotions.find((promo) =>
      normalizeLocations(promo.display_locations).includes('cbd_ribbon')
    ) ?? null
  );
}

export function HomeCbdRibbon() {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditPromotions);
  const { data } = useQuery({
    queryKey: ['promotions', { page_size: 50, display_location: 'cbd_ribbon' }],
    queryFn: () => ApiService.apiV1PublicPromotionsList('cbd_ribbon', 1, 50),
    staleTime: 60_000,
  });
  const { data: allData } = useQuery({
    queryKey: ['promotions', { page_size: 50 }],
    queryFn: () => ApiService.apiV1PublicPromotionsList(undefined, 1, 50),
    staleTime: 60_000,
    enabled: canEdit || !(data?.results?.length),
  });

  const promotion = useMemo(() => {
    const tagged = (data?.results ?? [])[0] ?? null;
    if (tagged) return tagged;
    return pickCbdPromotion(allData?.results ?? []);
  }, [data, allData]);

  const title = promotion?.title?.trim() || FALLBACK.title;
  const description = promotion?.description?.trim() || FALLBACK.description;

  const ribbon = (
    <section className="ag-bleed ag-bleed--dark ag-bleed--ribbon">
      <div className="ag-bleed__inner flex flex-col gap-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-control-icon w-control-icon shrink-0 items-center justify-center rounded-xl bg-promo-lime text-primary">
            <MaterialIcon name="shopping_bag" className="text-[1.375rem]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-white sm:text-base">{title}</p>
              <span className="ag-tag ag-tag--on-dark">Nairobi CBD</span>
            </div>
            <p className="mt-1 text-sm text-white/80">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center -space-x-2 sm:flex">
            {THUMBS.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className="h-10 w-10 rounded-lg border-2 border-obsidian-dark object-cover"
              />
            ))}
          </div>
          <a
            href={getBusinessWhatsAppUrl(FALLBACK.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="ag-btn ag-btn--lime"
          >
            <MaterialIcon name="chat" className="text-[1rem]" />
            WhatsApp shop
          </a>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ag-btn ag-btn--ghost"
          >
            Get Directions
            <MaterialIcon name="arrow_outward" className="text-[1rem]" />
          </a>
          <Link href={studioPath('/contact')} className="sr-only">
            Contact
          </Link>
        </div>
      </div>
    </section>
  );

  if (!canEdit) return ribbon;

  if (promotion?.id) {
    return (
      <StudioBlockChrome
        label={title}
        roleHint={studioEdit?.capabilities.roleLabel}
        onEdit={() => {
          void studioEdit?.openEditPromotion(promotion.id!);
        }}
      >
        {ribbon}
      </StudioBlockChrome>
    );
  }

  return (
    <StudioBlockChrome
      label="CBD ribbon"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => {
        studioEdit?.openCreatePromotion({
          title: FALLBACK.title,
          description: FALLBACK.description,
          display_locations: ['cbd_ribbon'],
          forceLocations: ['cbd_ribbon'],
          lockLocations: true,
        });
      }}
    >
      {ribbon}
    </StudioBlockChrome>
  );
}

'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { studioPath } from '@/lib/studio/paths';

export type HomeBuyingGuideCardData = {
  key: string;
  href: string;
  title: string;
  imageUrl: string | null;
  category: string;
  meta: string;
  excerpt: string;
  cta: string;
  articleId?: number | null;
  articleSlug?: string | null;
};

export function HomeBuyingGuideCard({ guide }: { guide: HomeBuyingGuideCardData }) {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.canEdit && (guide.articleId || guide.articleSlug));

  const card = (
    <Link
      href={studioPath(guide.href)}
      className="home-buying-guides__card group flex flex-col overflow-hidden rounded-2xl border border-border-hairline bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="home-buying-guides__media">
        {guide.imageUrl ? (
          <CloudinaryImage
            src={guide.imageUrl}
            alt={guide.title}
            preset="blogCard"
            fill
            fit="cover"
            className="home-buying-guides__image"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="home-buying-guides__media-fallback">
            <MaterialIcon name="article" className="text-[2.5rem] text-white/50" />
          </div>
        )}
        <span className="home-buying-guides__badge">{guide.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-medium text-secondary">{guide.meta}</p>
        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-primary sm:text-lg">
          {guide.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-secondary">{guide.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-primary">
          <span className="line-clamp-1">{guide.cta}</span>
          <MaterialIcon name="arrow_forward" className="text-[1rem] shrink-0" />
        </span>
      </div>
    </Link>
  );

  if (!canEdit) return card;

  return (
    <StudioBlockChrome
      label={guide.title}
      onEdit={() => {
        void studioEdit?.openEditArticle({
          id: guide.articleId,
          slug: guide.articleSlug,
        });
      }}
    >
      {card}
    </StudioBlockChrome>
  );
}

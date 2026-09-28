'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { formatArticleCategory } from '@/lib/utils/blogCategories';
import { brandConfig } from '@/lib/config/brand';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { studioPath } from '@/lib/studio/paths';

export interface BlogCardProps {
  imageUrl: string;
  category: string;
  title: string;
  href: string;
  articleId?: number | null;
  articleSlug?: string | null;
}

function resolveImageUrl(path?: string | null) {
  if (!path) return getPlaceholderProductImage();
  if (path.startsWith('http')) return path;
  return `${brandConfig.apiBaseUrl}${path}`;
}

export function BlogCard({
  imageUrl,
  category,
  title,
  href,
  articleId,
  articleSlug,
}: BlogCardProps) {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditArticles);
  const card = (
    <Link href={studioPath(href)} className="blog-card">
      <div className="blog-card__image-wrap">
        <CloudinaryImage
          src={resolveImageUrl(imageUrl)}
          alt={title}
          preset="productThumb"
          fill
          fit="cover"
          className="blog-card__image"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
        />
      </div>
      <div className="blog-card__body">
        <span className="blog-card__category">{formatArticleCategory(category)}</span>
        <h3 className="blog-card__title">{title}</h3>
      </div>
    </Link>
  );

  if (!canEdit || (!articleId && !articleSlug)) {
    return card;
  }

  return (
    <StudioBlockChrome
      label={title}
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => {
        void studioEdit?.openEditArticle({ id: articleId, slug: articleSlug });
      }}
    >
      {card}
    </StudioBlockChrome>
  );
}

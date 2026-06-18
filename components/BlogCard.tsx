import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { formatArticleCategory } from '@/lib/utils/blogCategories';
import { brandConfig } from '@/lib/config/brand';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';

export interface BlogCardProps {
  imageUrl: string;
  category: string;
  title: string;
  href: string;
}

function resolveImageUrl(path?: string | null) {
  if (!path) return getPlaceholderProductImage();
  if (path.startsWith('http')) return path;
  return `${brandConfig.apiBaseUrl}${path}`;
}

export function BlogCard({ imageUrl, category, title, href }: BlogCardProps) {
  return (
    <Link href={href} className="blog-card">
      <div className="blog-card__image-wrap">
        <CloudinaryImage
          src={resolveImageUrl(imageUrl)}
          alt={title}
          width={640}
          height={400}
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
}

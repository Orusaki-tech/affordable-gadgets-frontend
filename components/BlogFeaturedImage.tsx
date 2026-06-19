'use client';

import { CloudinaryImage } from '@/components/CloudinaryImage';

interface BlogFeaturedImageProps {
  src: string;
  alt: string;
}

export function BlogFeaturedImage({ src, alt }: BlogFeaturedImageProps) {
  return (
    <div className="blog-featured-image">
      <CloudinaryImage
        src={src}
        alt={alt}
        preset="productGallery"
        fill
        fit="contain"
        sizes="(max-width: 768px) 100vw, 768px"
        className="blog-featured-image__img"
        priority
      />
    </div>
  );
}

'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { CloudinaryImage } from '@/components/CloudinaryImage';

interface ProductBlogBodyProps {
  markdown: string;
}

/** Batch 033+ articles often omit a blank line after bullet lists; fix before parse. */
function normalizeBlogMarkdown(input: string): string {
  return input.replace(/^((?:- .+\n)+)(?=[A-Z])/gm, '$1\n');
}

function BlogMarkdownImage({ src, alt }: { src?: string | Blob | null; alt?: string | null }) {
  if (!src || typeof src !== 'string') return null;
  return (
    <figure className="product-blog-body__figure">
      <div className="product-blog-body__figure-inner">
        <CloudinaryImage
          src={src}
          alt={alt ?? ''}
          preset="productGallery"
          fill
          fit="contain"
          sizes="(max-width: 768px) 100vw, 768px"
          className="product-blog-body__image"
        />
      </div>
    </figure>
  );
}

const markdownComponents: Components = {
  img: ({ src, alt }) => <BlogMarkdownImage src={src} alt={alt} />,
  a: ({ href, children }) => (
    <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
      {children}
    </a>
  ),
};

export function ProductBlogBody({ markdown }: ProductBlogBodyProps) {
  return (
    <div
      className="product-blog-body max-w-none text-gray-800 
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-gray-900
        [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-gray-900
        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-gray-900
        [&_p]:leading-relaxed [&_p]:mb-4
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-2
        [&_li]:pl-1
        [&_a]:text-blue-600 [&_a]:underline [&_a]:font-medium hover:[&_a]:text-blue-800
        [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-6 [&_blockquote]:py-1 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-gray-700 [&_blockquote]:bg-gray-50 [&_blockquote]:rounded-r-lg
        [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre]:text-sm
        [&_code]:bg-gray-100 [&_code]:text-pink-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
        [&_strong]:font-semibold [&_strong]:text-gray-900
        [&_hr]:my-10 [&_hr]:border-gray-200
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
        [&_th]:bg-gray-50 [&_th]:border [&_th]:border-gray-200 [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold
        [&_td]:border [&_td]:border-gray-200 [&_td]:p-3"
    >
      <ReactMarkdown components={markdownComponents}>
        {normalizeBlogMarkdown(markdown)}
      </ReactMarkdown>
    </div>
  );
}

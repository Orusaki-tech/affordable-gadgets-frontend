'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { CloudinaryImage } from '@/components/CloudinaryImage';

interface ProductBlogBodyProps {
  markdown: string;
}

/**
 * Admin / legacy articles may store HTML fragments. ReactMarkdown shows raw tags
 * unless we convert common block/inline HTML back to markdown first.
 */
function htmlToMarkdown(input: string): string {
  if (!/<[a-z][\s\S]*>/i.test(input)) {
    return input;
  }

  let text = input.trim();

  if (/^<p[^>]*>[\s\S]*<\/p>$/i.test(text)) {
    text = text.replace(/^<p[^>]*>/i, '').replace(/<\/p>$/i, '');
  }

  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<\/?ul[^>]*>/gi, '\n')
    .replace(/<\/?ol[^>]*>/gi, '\n')
    .replace(/<div[^>]*class="product-gallery"[^>]*>([\s\S]*?)<\/div>/gi, '$1')
    .replace(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '\n\n![$2]($1)\n\n')
    .replace(/<img[^>]*src="([^"]+)"[^>]*\/?>/gi, '\n\n![]($1)\n\n')
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Blog batches often ship with missing blank lines — headings and lists glued to
 * prior paragraphs. CommonMark won't parse block elements unless we repair breaks.
 */
function normalizeBlogMarkdown(input: string): string {
  let text = htmlToMarkdown(input).replace(/\r\n/g, '\n').trim();

  // Headings glued after punctuation on the same line
  text = text.replace(/([.!?])\s+(#{2,6} )/g, '$1\n\n$2');
  // Headings glued mid-line without a break
  text = text.replace(/([^\n#])(#{2,6} )/g, '$1\n\n$2');
  // Ensure blank line before ATX headings
  text = text.replace(/([^\n])\n(#{2,6} )/g, '$1\n\n$2');

  // Lists glued after intro lines or punctuation
  text = text.replace(/([.:!?])\s*\n(- )/g, '$1\n\n$2');
  text = text.replace(/([.:!?])(- \*\*)/g, '$1\n\n$2');

  // Batch 033+ articles often omit a blank line after bullet lists
  text = text.replace(/^((?:- .+\n)+)(?=[A-Z#])/gm, '$1\n');

  // Last list item merged with following paragraph (e.g. "Phone\nPriced from…")
  text = text.replace(/^(- .+)\n([A-Z])/gm, '$1\n\n$2');

  return text.replace(/\n{3,}/g, '\n\n');
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
  h2: ({ children }) => <h2 className="product-blog-body__h2">{children}</h2>,
  h3: ({ children }) => <h3 className="product-blog-body__h3">{children}</h3>,
  p: ({ children }) => <p className="product-blog-body__p">{children}</p>,
  ul: ({ children }) => <ul className="product-blog-body__ul">{children}</ul>,
  ol: ({ children }) => <ol className="product-blog-body__ol">{children}</ol>,
  li: ({ children }) => <li className="product-blog-body__li">{children}</li>,
  strong: ({ children }) => <strong className="product-blog-body__strong">{children}</strong>,
  img: ({ src, alt }) => <BlogMarkdownImage src={src} alt={alt} />,
  a: ({ href, children }) => (
    <a
      href={href}
      className="product-blog-body__link"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
};

export function ProductBlogBody({ markdown }: ProductBlogBodyProps) {
  return (
    <div className="product-blog-body">
      <ReactMarkdown components={markdownComponents}>
        {normalizeBlogMarkdown(markdown)}
      </ReactMarkdown>
    </div>
  );
}

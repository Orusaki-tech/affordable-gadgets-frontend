'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CloudinaryImage } from '@/components/CloudinaryImage';

interface ProductBlogBodyProps {
  markdown: string;
  imageUrl?: string | null;
  imageAlt?: string;
  headline?: string;
}

interface BlogImage {
  src: string;
  alt: string;
}

interface PreparedBlogContent {
  introMarkdown: string;
  bodyMarkdown: string;
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

  text = text.replace(/([.!?])\s+(#{2,6} )/g, '$1\n\n$2');
  text = text.replace(/([^\n#])(#{2,6} )/g, '$1\n\n$2');
  text = text.replace(/([^\n])\n(#{2,6} )/g, '$1\n\n$2');
  text = text.replace(/([.:!?])\s*\n(- )/g, '$1\n\n$2');
  text = text.replace(/([.:!?])(- \*\*)/g, '$1\n\n$2');
  text = text.replace(/^((?:- .+\n)+)(?=[A-Z#])/gm, '$1\n');
  text = text.replace(/^(- .+)\n([A-Z])/gm, '$1\n\n$2');

  return text.replace(/\n{3,}/g, '\n\n');
}

function stripLeadingH1(text: string, headline?: string): string {
  const lines = text.split('\n');
  if (!lines[0]?.startsWith('# ')) {
    return text;
  }

  const h1Text = lines[0].slice(2).trim();
  if (!headline || h1Text.toLowerCase() === headline.trim().toLowerCase()) {
    return lines.slice(1).join('\n').trim();
  }

  return text;
}

/**
 * Split intro vs sections. Body images always stay in place — never lifted into a hero.
 */
export function prepareBlogContent(
  input: string,
  headline?: string,
): PreparedBlogContent {
  const normalized = normalizeBlogMarkdown(input);
  const withoutDuplicateTitle = stripLeadingH1(normalized, headline);
  const h2Index = withoutDuplicateTitle.search(/\n## /);

  if (h2Index === -1) {
    return {
      introMarkdown: withoutDuplicateTitle,
      bodyMarkdown: '',
    };
  }

  return {
    introMarkdown: withoutDuplicateTitle.slice(0, h2Index).trim(),
    bodyMarkdown: withoutDuplicateTitle.slice(h2Index).trim(),
  };
}

function BlogAsideImage({ src, alt }: BlogImage) {
  return (
    <figure className="product-blog-body__figure product-blog-body__figure--hero">
      <div className="product-blog-body__figure-inner">
        <CloudinaryImage
          src={src}
          alt={alt}
          preset="productGallery"
          fill
          fit="contain"
          sizes="(max-width: 767px) 100vw, 300px"
          className="product-blog-body__image"
        />
      </div>
    </figure>
  );
}

function BlogInlineImage({ src, alt }: BlogImage) {
  return (
    <figure className="product-blog-body__figure product-blog-body__figure--inline">
      <div className="product-blog-body__figure-inner product-blog-body__figure-inner--inline">
        <CloudinaryImage
          src={src}
          alt={alt}
          preset="productGallery"
          fill
          fit="contain"
          sizes="(max-width: 767px) 100vw, 720px"
          className="product-blog-body__image product-blog-body__image--inline"
        />
      </div>
      {alt ? <figcaption className="product-blog-body__figcaption">{alt}</figcaption> : null}
    </figure>
  );
}

function isSoleImageChild(children: React.ReactNode): boolean {
  const items = React.Children.toArray(children);
  if (items.length !== 1 || !React.isValidElement(items[0])) return false;
  return items[0].type === BlogInlineImage;
}

const markdownComponents: Components = {
  h1: ({ children }) => <h2 className="product-blog-body__h2">{children}</h2>,
  h2: ({ children }) => <h2 className="product-blog-body__h2">{children}</h2>,
  h3: ({ children }) => <h3 className="product-blog-body__h3">{children}</h3>,
  // Unwrap sole-image paragraphs so <figure> is not nested inside <p>.
  p: ({ children }) =>
    isSoleImageChild(children) ? <>{children}</> : <p className="product-blog-body__p">{children}</p>,
  ul: ({ children }) => <ul className="product-blog-body__ul">{children}</ul>,
  ol: ({ children }) => <ol className="product-blog-body__ol">{children}</ol>,
  li: ({ children }) => <li className="product-blog-body__li">{children}</li>,
  strong: ({ children }) => <strong className="product-blog-body__strong">{children}</strong>,
  em: ({ children }) => <em className="product-blog-body__em">{children}</em>,
  hr: () => <hr className="product-blog-body__hr" />,
  img: ({ src, alt }) => {
    if (!src || typeof src !== 'string') return null;
    return <BlogInlineImage src={src} alt={typeof alt === 'string' ? alt : ''} />;
  },
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
  table: ({ children }) => (
    <div className="product-blog-body__table-wrap">
      <table className="product-blog-body__table">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="product-blog-body__thead">{children}</thead>,
  tbody: ({ children }) => <tbody className="product-blog-body__tbody">{children}</tbody>,
  tr: ({ children }) => <tr className="product-blog-body__tr">{children}</tr>,
  th: ({ children }) => <th className="product-blog-body__th">{children}</th>,
  td: ({ children }) => <td className="product-blog-body__td">{children}</td>,
};

function BlogMarkdown({ children }: { children: string }) {
  if (!children.trim()) {
    return null;
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </ReactMarkdown>
  );
}

export function ProductBlogBody({
  markdown,
  imageUrl,
  imageAlt = '',
  headline,
}: ProductBlogBodyProps) {
  // No body images → product/cover fills the hero (current).
  // Body images from editing → stay exactly where placed; never moved to the hero.
  // Product/cover still shows at top when provided so the page format stays the same.
  const { introMarkdown, bodyMarkdown } = prepareBlogContent(markdown, headline);
  const asideImage = imageUrl ? { src: imageUrl, alt: imageAlt } : null;
  const hasHero = Boolean(introMarkdown || asideImage);

  return (
    <div className="product-blog-body">
      {hasHero && (
        <section className="product-blog-body__hero" aria-label="Article introduction">
          {asideImage && (
            <div className="product-blog-body__hero-media">
              <BlogAsideImage src={asideImage.src} alt={asideImage.alt} />
            </div>
          )}
          {introMarkdown && (
            <div className="product-blog-body__hero-copy">
              <BlogMarkdown>{introMarkdown}</BlogMarkdown>
            </div>
          )}
        </section>
      )}

      {bodyMarkdown && (
        <section className="product-blog-body__sections" aria-label="Article sections">
          <BlogMarkdown>{bodyMarkdown}</BlogMarkdown>
        </section>
      )}

      {!hasHero && !bodyMarkdown && <BlogMarkdown>*No content yet.*</BlogMarkdown>}
    </div>
  );
}

'use client';

import ReactMarkdown from 'react-markdown';

interface ProductBlogMarkdownProps {
  markdown: string;
}

export function ProductBlogMarkdown({ markdown }: ProductBlogMarkdownProps) {
  return (
    <div className="product-blog-markdown max-w-none text-gray-800 space-y-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-blue-600 [&_a]:underline [&_p]:leading-relaxed">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}

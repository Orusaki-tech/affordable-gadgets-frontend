'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { fetchWishlist, removeWishlistItem, type WishlistItem } from '@/lib/api/wishlist';
import { getProductHref } from '@/lib/utils/productRoutes';
import { MaterialIcon } from '@/components/MaterialIcon';

function formatKes(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return `KSh ${Math.round(value).toLocaleString('en-KE')}`;
}

export default function WishlistClient() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const results = await fetchWishlist();
        if (!cancelled) {
          setItems(results);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load wishlist');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 lg:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">Saved devices</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">Wishlist</h1>
        </div>
        <Link href="/products" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
          Continue shopping
        </Link>
      </div>

      {loading ? (
        <p className="text-secondary">Loading your saved items…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest p-10 text-center shadow-sm">
          <MaterialIcon name="favorite" className="text-[40px] text-text-muted" />
          <p className="mt-3 text-lg font-semibold text-primary">No saved devices yet</p>
          <p className="mt-1 text-sm text-secondary">Tap the heart on any product to save it here.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-promo-lime"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            const productId = product?.id ?? item.product_id;
            const href = product?.slug
              ? getProductHref({ slug: product.slug, id: product.id })
              : '/products';
            const price = formatKes(product?.min_price);
            return (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm"
              >
                <Link href={href} className="relative aspect-square bg-surface-muted p-4">
                  {product?.primary_image ? (
                    <CloudinaryImage
                      src={product.primary_image}
                      alt={product.product_name || 'Product'}
                      fill
                      className="object-contain"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      <MaterialIcon name="devices" className="text-[40px]" />
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Link href={href} className="font-semibold text-primary hover:underline">
                    {product?.product_name || 'Product'}
                  </Link>
                  {price ? <p className="text-sm font-bold text-on-surface">{price}</p> : null}
                  <button
                    type="button"
                    className="mt-auto inline-flex items-center justify-center gap-1 rounded-xl border border-border-hairline px-3 py-2 text-sm font-medium text-secondary hover:bg-surface-muted"
                    onClick={async () => {
                      if (typeof productId !== 'number') return;
                      await removeWishlistItem(productId);
                      setItems((prev) => prev.filter((row) => row.id !== item.id));
                    }}
                  >
                    <MaterialIcon name="delete" className="text-[18px]" />
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addWishlistItem, fetchWishlist, removeWishlistItem } from '@/lib/api/wishlist';

export function useWishlist() {
  const [items, setItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await fetchWishlist();
      const ids = results
        .map((item) => item.product?.id ?? item.product_id)
        .filter((id): id is number => typeof id === 'number');
      setItems(ids);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isInWishlist = useCallback(
    (productId?: number) => (typeof productId === 'number' ? items.includes(productId) : false),
    [items]
  );

  const add = useCallback(
    async (productId?: number) => {
      if (typeof productId !== 'number') return;
      if (items.includes(productId)) return;
      try {
        await addWishlistItem(productId);
        setItems((prev) => [...prev, productId]);
      } catch (err: any) {
        setError(err?.message || 'Failed to add wishlist item');
      }
    },
    [items]
  );

  const remove = useCallback(
    async (productId?: number) => {
      if (typeof productId !== 'number') return;
      try {
        await removeWishlistItem(productId);
        setItems((prev) => prev.filter((id) => id !== productId));
      } catch (err: any) {
        setError(err?.message || 'Failed to remove wishlist item');
      }
    },
    []
  );

  const toggle = useCallback(
    async (productId?: number) => {
      if (typeof productId !== 'number') return;
      if (items.includes(productId)) {
        await remove(productId);
      } else {
        await add(productId);
      }
    },
    [add, items, remove]
  );

  const value = useMemo(() => ({ items, isLoading, error, isInWishlist, add, remove, toggle, reload: loadWishlist }), [
    items,
    isLoading,
    error,
    isInWishlist,
    add,
    remove,
    toggle,
    loadWishlist,
  ]);

  return value;
}

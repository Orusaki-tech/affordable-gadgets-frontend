/**
 * Shared wishlist context so Header badge, product hearts, and /wishlist stay in sync.
 */
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { addWishlistItem, fetchWishlist, removeWishlistItem } from '@/lib/api/wishlist';

interface WishlistContextType {
  items: number[];
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId?: number) => boolean;
  add: (productId?: number) => Promise<void>;
  remove: (productId?: number) => Promise<void>;
  toggle: (productId?: number) => Promise<void>;
  reload: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<number[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await fetchWishlist();
      const ids = results
        .map((item) => item.product?.id ?? item.product_id)
        .filter((id): id is number => typeof id === 'number');
      setItems(ids);
      itemsRef.current = ids;
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
    (productId?: number) =>
      typeof productId === 'number' ? itemsRef.current.includes(productId) : false,
    []
  );

  const add = useCallback(async (productId?: number) => {
    if (typeof productId !== 'number') return;
    if (itemsRef.current.includes(productId)) return;
    const next = [...itemsRef.current, productId];
    setItems(next);
    itemsRef.current = next;
    try {
      await addWishlistItem(productId);
    } catch (err: any) {
      const rolled = itemsRef.current.filter((id) => id !== productId);
      setItems(rolled);
      itemsRef.current = rolled;
      setError(err?.message || 'Failed to add wishlist item');
    }
  }, []);

  const remove = useCallback(async (productId?: number) => {
    if (typeof productId !== 'number') return;
    const previous = itemsRef.current;
    const next = previous.filter((id) => id !== productId);
    setItems(next);
    itemsRef.current = next;
    try {
      await removeWishlistItem(productId);
    } catch (err: any) {
      setItems(previous);
      itemsRef.current = previous;
      setError(err?.message || 'Failed to remove wishlist item');
    }
  }, []);

  const toggle = useCallback(
    async (productId?: number) => {
      if (typeof productId !== 'number') return;
      if (itemsRef.current.includes(productId)) {
        await remove(productId);
      } else {
        await add(productId);
      }
    },
    [add, remove]
  );

  const value = useMemo(
    () => ({ items, isLoading, error, isInWishlist, add, remove, toggle, reload: loadWishlist }),
    [items, isLoading, error, isInWishlist, add, remove, toggle, loadWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return ctx;
}

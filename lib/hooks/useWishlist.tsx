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
import {
  addWishlistItem,
  fetchWishlist,
  removeWishlistItem,
  type WishlistItem,
} from '@/lib/api/wishlist';

interface WishlistContextType {
  items: number[];
  entries: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId?: number) => boolean;
  add: (productId?: number) => Promise<void>;
  remove: (productId?: number) => Promise<void>;
  toggle: (productId?: number) => Promise<void>;
  reload: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function productIdsFromEntries(entries: WishlistItem[]): number[] {
  return entries
    .map((item) => item.product?.id ?? item.product_id)
    .filter((id): id is number => typeof id === 'number');
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<number[]>([]);
  const entriesRef = useRef<WishlistItem[]>([]);

  const items = useMemo(() => productIdsFromEntries(entries), [entries]);

  useEffect(() => {
    itemsRef.current = items;
    entriesRef.current = entries;
  }, [items, entries]);

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await fetchWishlist();
      setEntries(results);
      entriesRef.current = results;
      itemsRef.current = productIdsFromEntries(results);
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
    const nextIds = [...itemsRef.current, productId];
    itemsRef.current = nextIds;
    // Optimistic id presence for hearts/badge; full entry arrives after reload.
    setEntries((prev) => {
      if (prev.some((row) => (row.product?.id ?? row.product_id) === productId)) {
        return prev;
      }
      const optimistic = [...prev, { id: -productId, product_id: productId } as WishlistItem];
      entriesRef.current = optimistic;
      return optimistic;
    });
    try {
      await addWishlistItem(productId);
      const results = await fetchWishlist();
      setEntries(results);
      entriesRef.current = results;
      itemsRef.current = productIdsFromEntries(results);
    } catch (err: any) {
      setEntries((prev) => {
        const rolled = prev.filter(
          (row) => (row.product?.id ?? row.product_id) !== productId
        );
        entriesRef.current = rolled;
        return rolled;
      });
      itemsRef.current = itemsRef.current.filter((id) => id !== productId);
      setError(err?.message || 'Failed to add wishlist item');
    }
  }, []);

  const remove = useCallback(async (productId?: number) => {
    if (typeof productId !== 'number') return;
    const previous = entriesRef.current;
    const previousIds = itemsRef.current;
    const next = previous.filter(
      (row) => (row.product?.id ?? row.product_id) !== productId
    );
    setEntries(next);
    entriesRef.current = next;
    itemsRef.current = previousIds.filter((id) => id !== productId);
    try {
      await removeWishlistItem(productId);
    } catch (err: any) {
      setEntries(previous);
      entriesRef.current = previous;
      itemsRef.current = previousIds;
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
    () => ({
      items,
      entries,
      isLoading,
      error,
      isInWishlist,
      add,
      remove,
      toggle,
      reload: loadWishlist,
    }),
    [items, entries, isLoading, error, isInWishlist, add, remove, toggle, loadWishlist]
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedValue } from './useDebouncedValue';

type UseDebouncedSearchParamOptions = {
  debounceMs?: number;
  /** Sync debounced search to the URL (e.g. reset page). */
  onSyncToUrl: (debouncedSearch: string) => void;
  /** Optional analytics when the user changes search (not on initial URL hydration). */
  onTrack?: (query: string) => void;
};

export function useDebouncedSearchParam({
  debounceMs = 400,
  onSyncToUrl,
  onTrack,
}: UseDebouncedSearchParamOptions) {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(search, debounceMs);
  const trackingReadyRef = useRef(false);
  const onSyncToUrlRef = useRef(onSyncToUrl);
  const onTrackRef = useRef(onTrack);
  const searchRef = useRef(search);
  const debouncedRef = useRef(debouncedSearch);
  searchRef.current = search;
  debouncedRef.current = debouncedSearch;

  useEffect(() => {
    onSyncToUrlRef.current = onSyncToUrl;
    onTrackRef.current = onTrack;
  }, [onSyncToUrl, onTrack]);

  // Copy the URL into the field only for an external navigation (back/forward,
  // a shared link). A search write updates the URL to the debounced value while
  // the user may already have typed further — adopting that URL resets the
  // field and starts another fetch.
  useEffect(() => {
    if (urlSearch === searchRef.current || urlSearch === debouncedRef.current) return;
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (debouncedSearch === urlSearch) {
      trackingReadyRef.current = true;
      return;
    }
    onSyncToUrlRef.current(debouncedSearch);
    if (debouncedSearch && trackingReadyRef.current) {
      onTrackRef.current?.(debouncedSearch);
    }
    trackingReadyRef.current = true;
  }, [debouncedSearch, urlSearch]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return { search, debouncedSearch, handleSearchChange };
}

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
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(search, debounceMs);
  const trackingReadyRef = useRef(false);
  const onSyncToUrlRef = useRef(onSyncToUrl);
  const onTrackRef = useRef(onTrack);

  useEffect(() => {
    onSyncToUrlRef.current = onSyncToUrl;
    onTrackRef.current = onTrack;
  }, [onSyncToUrl, onTrack]);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (debouncedSearch === urlSearch) {
      trackingReadyRef.current = true;
      return;
    }
    onSyncToUrlRef.current(debouncedSearch);
    if (debouncedSearch && trackingReadyRef.current) {
      onTrackRef.current?.(debouncedSearch);
    }
    trackingReadyRef.current = true;
  }, [debouncedSearch, searchParams]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return { search, debouncedSearch, handleSearchChange };
}

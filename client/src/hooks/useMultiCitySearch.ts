import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Flight, FlightSearchParams, PassengerCount, getSearchResults, searchFlights } from '@/services/flightService';

export interface SegmentInput {
  from: string;
  to: string;
  date: Date;
  fromDisplay?: string;
  toDisplay?: string;
}

export interface SearchSection {
  searchIndex: number;
  searchParams: Array<{ from: string; to: string; date: Date }>;
  flights: Flight[];
  isComplete: boolean;
  hasMore: boolean;
  loading: boolean;
  error?: string;
  visibleCount: number;
  progress: number;
  searchId?: string;
  lastAfter?: number;
}

export interface MultiCitySearchApi {
  searchSections: SearchSection[];
  startMultiSearch: (
    segments: SegmentInput[],
    passengers: PassengerCount,
    cabin?: 'e' | 'p' | 'b' | 'f',
    direct?: boolean,
  ) => Promise<void>;
  loadMore: (sectionIndex: number) => void;
}

interface PollingRef {
  timeoutId?: ReturnType<typeof setTimeout>;
  active: boolean;
  idleCount: number;
  lastFlightsCount: number;
  emptyPollCount: number;
  passengers?: PassengerCount;
}

// Module-level caches and locks (shared across hook instances)
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_IDLE_POLLS = 30; // ~60s if interval is 2s
const MAX_IDLE_POLLS_NO_RESULTS = 15; // ~30s if no results found yet
const segmentResultsCache = new Map<string, {
  flights: Flight[];
  progress: number;
  isComplete: boolean;
  lastAfter?: number;
  timestamp: number;
  searchId?: string;
}>();
interface PollingRef {
  timeoutId?: ReturnType<typeof setTimeout>;
  active: boolean;
  idleCount: number;
  lastFlightsCount: number;
  emptyPollCount: number;
  passengers?: PassengerCount;
}

const pendingSearches = new Map<string, Promise<string>>();
const pollingRefs = new Map<string, PollingRef>();

function buildSegmentKey(segment: SegmentInput, passengers: PassengerCount, cabin?: 'e' | 'p' | 'b' | 'f', direct?: boolean) {
  const fromCode = (segment.from || '').trim().toUpperCase();
  const toCode = (segment.to || '').trim().toUpperCase();
  const dateKey = format(segment.date, 'yyyy-MM-dd');
  const cabinKey = cabin || 'e';
  const directKey = direct ? '1' : '0';
  return `${fromCode}-${toCode}-${dateKey}-${cabinKey}-${directKey}-${passengers.adults}-${passengers.children}-${passengers.infants}`;
}

export function useMultiCitySearch(): MultiCitySearchApi {
  const [searchSections, setSearchSections] = useState<SearchSection[]>([]);

  // Track mounted for cleanup safety
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clear any active timers for this component instance
      pollingRefs.forEach((ref) => {
        if (ref.timeoutId) clearTimeout(ref.timeoutId);
        ref.active = false;
      });
    };
  }, []);

  const updateSection = useCallback((index: number, updater: (prev: SearchSection) => SearchSection) => {
    setSearchSections(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      updated[index] = updater(prev[index]);
      return updated;
    });
  }, []);

  const startPolling = useCallback((segmentKey: string, sectionIndex: number, searchId: string, initialAfter: number | undefined, passengers: PassengerCount) => {
    const existing = pollingRefs.get(segmentKey);
    if (existing?.active) return; // Already polling

    const newRef: PollingRef = {
      active: true,
      idleCount: 0,
      lastFlightsCount: 0,
      emptyPollCount: 0,
      passengers
    };
    pollingRefs.set(segmentKey, newRef);

    // Update section to show loading state immediately
    updateSection(sectionIndex, (prev) => ({
      ...prev,
      loading: true,
      hasMore: true,
      isComplete: false,
    }));

    // Retry helper: tries once, then retries one additional time after a short delay on failure
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const withRetryOnce = async <T>(fn: () => Promise<T>, retryDelayMs = 1500): Promise<T> => {
      try {
        return await fn();
      } catch (e) {
        await delay(retryDelayMs);
        return await fn();
      }
    };

    const pollOnce = async (after?: number) => {
      if (!mountedRef.current) return;
      try {
        const results = await withRetryOnce(() => getSearchResults(searchId, after));

        // Normalize result fields to avoid boolean coercion issues
        const normalizedComplete = typeof results.complete === 'number' ? results.complete : (results.complete ? 100 : 0);
        const normalizedLastAfter = typeof (results.last_result as unknown) === 'number' ? (results.last_result as unknown as number) : undefined;

        // Get or initialize polling ref
        const ref = pollingRefs.get(segmentKey) || {
          active: true,
          idleCount: 0,
          lastFlightsCount: 0,
          emptyPollCount: 0,
          passengers
        };

        // Handle empty results or no-results status
        if (results.status === 'no_results' || 
            (!results.result || (Array.isArray(results.result) && results.result.length === 0))) {
          // If search is complete, has no results, or status indicates no results
          if (normalizedComplete >= 100 || results.status === 'no_results') {
            updateSection(sectionIndex, (prev) => ({
              ...prev,
              loading: false,
              isComplete: true,
              hasMore: false,
              error: results.message || (prev.flights.length === 0 ? 'No flights found for this route and date.' : undefined)
            }));
            return;
          }
          
          // If we've been polling with no results for a while, be more patient before stopping.
          // Many providers can take a while to stream first results; wait longer to reduce false negatives.
          ref.emptyPollCount += 1;
          if (ref.emptyPollCount >= 30) { // ~60s with 2s interval
            updateSection(sectionIndex, (prev) => ({
              ...prev,
              loading: false,
              isComplete: true,
              hasMore: false,
              error: 'No flights found after multiple attempts. Please try different search criteria.'
            }));
            pollingRefs.set(segmentKey, { ...ref, active: false });
            return;
          }
        } else {
          // Reset empty poll count if we got results
          ref.emptyPollCount = 0;
        }

        pollingRefs.set(segmentKey, ref);

        // Override passenger counts in flights to reflect current search
        const refNow = pollingRefs.get(segmentKey);
        const segPassengers = refNow?.passengers || passengers;
        const enrichedFlights = Array.isArray(results.result)
          ? results.result.map((f) => ({
              ...f,
              search_query: {
                ...f.search_query,
                adt: segPassengers.adults,
                chd: segPassengers.children,
                inf: segPassengers.infants,
                options: {
                  ...f.search_query?.options,
                },
              },
            }))
          : [];

        // Merge new flights and update progress
        let newFlightsCountDelta = 0;
        updateSection(sectionIndex, (prev) => {
          const byId = new Map<string, Flight>();
          prev.flights.forEach(f => byId.set(f.trip_id, f));
          const beforeCount = byId.size;
          enrichedFlights.forEach((f) => byId.set(f.trip_id, f));
          const flights = Array.from(byId.values());
          const afterCount = flights.length;
          newFlightsCountDelta = Math.max(0, afterCount - beforeCount);

          const isComplete = normalizedComplete >= 100;
          const lastAfter = normalizedLastAfter;
          const progress = normalizedComplete;

          // Update cache
          segmentResultsCache.set(segmentKey, {
            flights,
            progress,
            isComplete,
            lastAfter,
            timestamp: Date.now(),
            searchId,
          });

          const hasMore = !isComplete || flights.length > prev.visibleCount;

          return {
            ...prev,
            flights,
            isComplete,
            lastAfter,
            progress,
            hasMore,
            loading: !isComplete,
          };
        });

        // Idle cutoff handling
        const pollingRef = pollingRefs.get(segmentKey) || { 
          active: false, 
          idleCount: 0, 
          lastFlightsCount: 0, 
          emptyPollCount: 0,
          passengers 
        };
        if (newFlightsCountDelta === 0 && normalizedComplete < 100) {
          pollingRef.idleCount = (pollingRef.idleCount || 0) + 1;
        } else {
          pollingRef.idleCount = 0;
        }
        pollingRef.lastFlightsCount = (pollingRef.lastFlightsCount || 0) + newFlightsCountDelta;

        // Use shorter timeout if we haven't found any results yet
        const maxIdlePolls = pollingRef.lastFlightsCount === 0 ? MAX_IDLE_POLLS_NO_RESULTS : MAX_IDLE_POLLS;

        if (pollingRef.idleCount >= maxIdlePolls) {
          // Stop polling to avoid infinite spinner; mark section complete with whatever results we have
          if (pollingRef.timeoutId) clearTimeout(pollingRef.timeoutId);
          pollingRef.active = false;
          pollingRefs.set(segmentKey, pollingRef);
          updateSection(sectionIndex, (prev) => ({ ...prev, loading: false, isComplete: true, hasMore: prev.flights.length > prev.visibleCount }));
          return;
        }

        // Check if complete and stop polling
        if (normalizedComplete >= 100) {
          if (pollingRef.timeoutId) clearTimeout(pollingRef.timeoutId);
          pollingRef.active = false;
          pollingRefs.set(segmentKey, pollingRef);
          updateSection(sectionIndex, (prev) => ({ ...prev, loading: false, isComplete: true, hasMore: prev.flights.length > prev.visibleCount }));
          return;
        }

        // Continue polling if not complete
        if (pollingRef.active !== false) {
          const timeoutId = setTimeout(() => pollOnce(normalizedLastAfter), 2000);
          pollingRef.timeoutId = timeoutId;
          pollingRef.active = true;
          pollingRefs.set(segmentKey, pollingRef);
        } else {
          if (pollingRef.timeoutId) clearTimeout(pollingRef.timeoutId);
          pollingRef.active = false;
          pollingRefs.set(segmentKey, pollingRef);
        }
      } catch (err) {
        // Stop polling on error for this segment
        const existingRef = pollingRefs.get(segmentKey);
        if (existingRef?.timeoutId) clearTimeout(existingRef.timeoutId);
        const newRef: PollingRef = {
          active: false,
          idleCount: 0,
          lastFlightsCount: 0,
          emptyPollCount: 0,
          passengers
        };
        pollingRefs.set(segmentKey, newRef);

        // If we have some results already, show them but mark as incomplete
        // Otherwise, show the error
        updateSection(sectionIndex, (prev) => ({
          ...prev,
          loading: false,
          isComplete: true,
          hasMore: false,
          error: prev.flights.length > 0 
            ? 'Could not load more results. Some flights may be missing.'
            : 'No flights found. Please try different dates or airports.',
        }));
      }
    };

    // Kick off first poll
    pollOnce(initialAfter);
  }, [updateSection]);

  const startMultiSearch = useCallback(async (
    segments: SegmentInput[],
    passengers: PassengerCount,
    cabin?: 'e' | 'p' | 'b' | 'f',
    direct?: boolean,
  ) => {
    // Clear existing searches and results
    segmentResultsCache.clear();
    pendingSearches.clear();
    pollingRefs.forEach((pollingRef) => {
      if (pollingRef.timeoutId) clearTimeout(pollingRef.timeoutId);
      pollingRef.active = false;
    });
    pollingRefs.clear();

    // Initialize sections for each provided segment
    const initialSections: SearchSection[] = segments.map((seg, idx) => {
      const displayFrom = seg.fromDisplay || seg.from;
      const displayTo = seg.toDisplay || seg.to;
      return {
        searchIndex: idx,
        searchParams: [{ from: displayFrom, to: displayTo, date: seg.date }],
        flights: [],
        isComplete: false,
        hasMore: true,
        loading: true,
        error: undefined,
        visibleCount: 4,
        progress: 0,
        searchId: undefined,
        lastAfter: undefined,
      };
    });
    setSearchSections(initialSections);

    // For each segment, reuse cache or start a new search, then poll
    await Promise.all(segments.map(async (segment, idx) => {
      const key = buildSegmentKey(segment, passengers, cabin, direct);

      // If we have fresh cache, hydrate and resume polling only if not complete
      const cached = segmentResultsCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        updateSection(idx, (prev) => ({
          ...prev,
          flights: cached.flights.map((f) => ({
            ...f,
            search_query: {
              ...f.search_query,
              adt: passengers.adults,
              chd: passengers.children,
              inf: passengers.infants,
              options: { ...f.search_query?.options },
            },
          })),
          isComplete: cached.isComplete,
          hasMore: !cached.isComplete,
          loading: !cached.isComplete,
          progress: cached.progress,
          searchId: cached.searchId,
          lastAfter: cached.lastAfter,
        }));

        if (!cached.isComplete && cached.searchId && !pollingRefs.get(key)?.active) {
          startPolling(key, idx, cached.searchId, cached.lastAfter, passengers);
        }
        return;
      }

      // Dedupe: if a search for this key is pending, await it
      let searchId: string | undefined;
      const existingPromise = pendingSearches.get(key);
      if (existingPromise) {
        try {
          searchId = await existingPromise;
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Search failed.';
          updateSection(idx, (prev) => ({ 
            ...prev, 
            loading: false, 
            isComplete: true, 
            hasMore: false, 
            error: `Unable to search flights: ${errorMessage}` 
          }));
          return;
        }
      } else {
        const searchParams: FlightSearchParams = {
          flightSegments: [
            {
              from: segment.from,
              to: segment.to,
              date: format(segment.date, 'yyyy-MM-dd'),
            },
          ],
          passengers,
          cabin,
          direct,
        };

        // Update section to show searching state
        updateSection(idx, (prev) => ({
          ...prev,
          loading: true,
          error: undefined,
          hasMore: true,
        }));
        const promise = (async () => {
          // Retry starting search once if it fails initially
          const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          try {
            const resp = await searchFlights(searchParams);
            return resp.search_id;
          } catch (e) {
            await delay(1500);
            const resp = await searchFlights(searchParams);
            return resp.search_id;
          }
        })();
        pendingSearches.set(key, promise);
        try {
          searchId = await promise;
        } catch (e) {
          pendingSearches.delete(key);
          updateSection(idx, (prev) => ({ ...prev, loading: false, isComplete: true, hasMore: false, error: 'Search failed.' }));
          return;
        }
        pendingSearches.delete(key);
      }

      if (!searchId) {
        updateSection(idx, (prev) => ({ ...prev, loading: false, isComplete: true, hasMore: false, error: 'Search initialization failed.' }));
        return;
      }

      // Save searchId in section and cache
      updateSection(idx, (prev) => ({ ...prev, searchId }));
      segmentResultsCache.set(key, {
        flights: [],
        progress: 0,
        isComplete: false,
        lastAfter: undefined,
        timestamp: Date.now(),
        searchId,
      });

      // Start polling
      startPolling(key, idx, searchId, undefined, passengers);
    }));
  }, [startPolling, updateSection]);

  const loadMore = useCallback((sectionIndex: number) => {
    updateSection(sectionIndex, (prev) => {
      const nextVisible = prev.visibleCount + 4;
      const hasMore = !prev.isComplete || prev.flights.length > nextVisible;
      return {
        ...prev,
        visibleCount: nextVisible,
        hasMore,
      };
    });
  }, [updateSection]);

  return {
    searchSections,
    startMultiSearch,
    loadMore,
  };
}

export default useMultiCitySearch;

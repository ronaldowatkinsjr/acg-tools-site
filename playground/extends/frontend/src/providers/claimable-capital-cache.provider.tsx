'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface CachedRedeemableCapital {
  value: string;
  timestamp: number;
  error?: string;
}

export interface RedeemableCapitalCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

interface RedeemableCapitalCacheContextType {
  // Cache operations
  getCachedValue: (bondId: string) => CachedRedeemableCapital | null;
  setCachedValue: (bondId: string, value: string, error?: string) => void;
  hasCachedValue: (bondId: string) => boolean;
  clearCache: () => void;
  clearCacheEntry: (bondId: string) => void;
  cleanExpiredEntries: () => void;

  // Loading state
  setLoadingState: (bondId: string, isLoading: boolean) => void;
  isLoading: (bondId: string) => boolean;

  // Request deduplication
  getInflightRequest: (bondId: string) => Promise<any> | undefined;
  setInflightRequest: (bondId: string, promise: Promise<any>) => void;
  hasInflightRequest: (bondId: string) => boolean;

  // Utilities
  getCacheStats: () => {
    size: number;
    maxSize: number;
    loadingCount: number;
    inflightCount: number;
  };
}

const RedeemableCapitalCacheContext =
  createContext<RedeemableCapitalCacheContextType | null>(null);

export function RedeemableCapitalCacheProvider({
  children,
  options = {},
}: {
  children: React.ReactNode;
  options?: RedeemableCapitalCacheOptions;
}) {
  const { ttl = 300000, maxSize = 1000 } = options; // 5 minutes default TTL
  const [cache, setCache] = useState<Map<string, CachedRedeemableCapital>>(
    new Map(),
  );
  const [loadingBonds, setLoadingBonds] = useState<Set<string>>(new Set());
  const cacheRef = useRef<Map<string, CachedRedeemableCapital>>(new Map());
  const inflightRequests = useRef<Map<string, Promise<any>>>(new Map());

  // Update ref when cache changes
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  // Automatic cleanup of expired entries
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCache((prevCache) => {
        let hasExpiredEntries = false;
        const newCache = new Map();

        prevCache.forEach((entry, bondId) => {
          if (Date.now() - entry.timestamp < ttl) {
            newCache.set(bondId, entry);
          } else {
            hasExpiredEntries = true;
          }
        });

        // Only update cache if there were expired entries
        if (hasExpiredEntries) {
          cacheRef.current = newCache;
          return newCache;
        }
        return prevCache;
      });
    }, ttl / 2); // Run cleanup every half TTL period

    return () => clearInterval(cleanupInterval);
  }, [ttl]);

  // Check if cache entry is valid (not expired)
  const isEntryValid = useCallback(
    (entry: CachedRedeemableCapital): boolean => {
      return Date.now() - entry.timestamp < ttl;
    },
    [ttl],
  );

  // Get cached value
  const getCachedValue = useCallback(
    (bondId: string): CachedRedeemableCapital | null => {
      const entry = cacheRef.current.get(bondId);
      if (entry && isEntryValid(entry)) {
        return entry;
      }
      return null;
    },
    [isEntryValid],
  );

  // Set cached value
  const setCachedValue = useCallback(
    (bondId: string, value: string, error?: string) => {
      setCache((prevCache) => {
        const newCache = new Map(prevCache);

        // Remove oldest entries if cache is full
        if (newCache.size >= maxSize) {
          let oldestKey = null;
          let oldestTimestamp = Date.now();
          newCache.forEach((entry, key) => {
            if (entry.timestamp < oldestTimestamp) {
              oldestTimestamp = entry.timestamp;
              oldestKey = key;
            }
          });
          if (oldestKey) {
            newCache.delete(oldestKey);
          }
        }

        newCache.set(bondId, {
          value,
          timestamp: Date.now(),
          error,
        });

        cacheRef.current = newCache;
        return newCache;
      });
    },
    [maxSize],
  );

  // Check if bond is in cache and valid
  const hasCachedValue = useCallback(
    (bondId: string): boolean => {
      return getCachedValue(bondId) !== null;
    },
    [getCachedValue],
  );

  // Clear entire cache
  const clearCache = useCallback(() => {
    setCache(new Map());
    cacheRef.current = new Map();
    // Also clear loading states and inflight requests
    setLoadingBonds(new Set());
    inflightRequests.current.clear();
  }, []);

  // Clear specific cache entry
  const clearCacheEntry = useCallback((bondId: string) => {
    setCache((prevCache) => {
      const newCache = new Map(prevCache);
      newCache.delete(bondId);
      cacheRef.current = newCache;
      return newCache;
    });
    // Also clear loading state for this bond
    setLoadingBonds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(bondId);
      return newSet;
    });
  }, []);

  // Clean expired entries
  const cleanExpiredEntries = useCallback(() => {
    setCache((prevCache) => {
      const newCache = new Map();
      prevCache.forEach((entry, bondId) => {
        if (isEntryValid(entry)) {
          newCache.set(bondId, entry);
        }
      });
      cacheRef.current = newCache;
      return newCache;
    });
  }, [isEntryValid]);

  // Loading state management
  const setLoadingState = useCallback((bondId: string, isLoading: boolean) => {
    setLoadingBonds((prevLoading) => {
      const newLoading = new Set(prevLoading);
      if (isLoading) {
        newLoading.add(bondId);
      } else {
        newLoading.delete(bondId);
      }
      return newLoading;
    });
  }, []);

  const isLoading = useCallback(
    (bondId: string): boolean => {
      return loadingBonds.has(bondId);
    },
    [loadingBonds],
  );

  // Request deduplication helpers
  const getInflightRequest = useCallback((bondId: string) => {
    return inflightRequests.current.get(bondId);
  }, []);

  const setInflightRequest = useCallback(
    (bondId: string, promise: Promise<any>) => {
      inflightRequests.current.set(bondId, promise);
      // Automatically clean up when promise resolves/rejects
      promise.finally(() => {
        inflightRequests.current.delete(bondId);
      });
    },
    [],
  );

  const hasInflightRequest = useCallback((bondId: string) => {
    return inflightRequests.current.has(bondId);
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      size: cache.size,
      maxSize,
      loadingCount: loadingBonds.size,
      inflightCount: inflightRequests.current.size,
    };
  }, [cache.size, maxSize, loadingBonds.size]);

  const contextValue: RedeemableCapitalCacheContextType = {
    // Cache operations
    getCachedValue,
    setCachedValue,
    hasCachedValue,
    clearCache,
    clearCacheEntry,
    cleanExpiredEntries,

    // Loading state
    setLoadingState,
    isLoading,

    // Request deduplication
    getInflightRequest,
    setInflightRequest,
    hasInflightRequest,

    // Utilities
    getCacheStats,
  };

  return (
    <RedeemableCapitalCacheContext.Provider value={contextValue}>
      {children}
    </RedeemableCapitalCacheContext.Provider>
  );
}

// Custom hook to use the cache context
export function useRedeemableCapitalCache(): RedeemableCapitalCacheContextType {
  const context = useContext(RedeemableCapitalCacheContext);
  if (!context) {
    throw new Error(
      'useRedeemableCapitalCache must be used within a RedeemableCapitalCacheProvider',
    );
  }
  return context;
}

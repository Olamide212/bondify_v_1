import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

const cacheRegistry = new Map();

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getOrCreateCache = (storageKey) => {
  if (!cacheRegistry.has(storageKey)) {
    cacheRegistry.set(storageKey, new Set());
  }
  return cacheRegistry.get(storageKey);
};

export const usePersistentUriCache = ({ storageKey, maxSize = 300 }) => {
  const cache = useMemo(() => getOrCreateCache(storageKey), [storageKey]);
  const [isHydrated, setIsHydrated] = useState(cache.size > 0);

  const trimCache = useCallback(() => {
    while (cache.size > maxSize) {
      const oldestUri = cache.values().next().value;
      if (!oldestUri) break;
      cache.delete(oldestUri);
    }
  }, [cache, maxSize]);

  const persistCache = useCallback(async () => {
    try {
      trimCache();
      await AsyncStorage.setItem(storageKey, JSON.stringify(Array.from(cache)));
    } catch (error) {
      console.warn(`Failed to persist URI cache (${storageKey}):`, error?.message || error);
    }
  }, [cache, storageKey, trimCache]);

  const touchUri = useCallback(
    async (uri) => {
      if (!uri) return;

      if (cache.has(uri)) {
        cache.delete(uri);
      }
      cache.add(uri);
      await persistCache();
    },
    [cache, persistCache]
  );

  const isUriCached = useCallback((uri) => Boolean(uri) && cache.has(uri), [cache]);

  useEffect(() => {
    let isMounted = true;

    const hydrateCache = async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        const parsed = safeParse(raw);

        if (Array.isArray(parsed)) {
          parsed
            .filter(Boolean)
            .slice(-maxSize)
            .forEach((uri) => {
              if (cache.has(uri)) {
                cache.delete(uri);
              }
              cache.add(uri);
            });

          trimCache();
        }
      } catch (error) {
        console.warn(`Failed to hydrate URI cache (${storageKey}):`, error?.message || error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrateCache();

    return () => {
      isMounted = false;
    };
  }, [cache, maxSize, storageKey, trimCache]);

  return {
    isHydrated,
    isUriCached,
    touchUri,
  };
};

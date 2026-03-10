import { useEffect, useState } from 'react';
import apiClient from '../utils/axiosInstance';

/**
 * In-memory cache shared across all hook instances.
 * Lookup data is static per session — no need to refetch
 * after the first successful call for each type.
 *
 * Shape: { [type]: { options: [...], promise: Promise|null } }
 */
const cache = {};

/**
 * useLookupOptions
 *
 * Fetches lookup options for a given type from GET /api/lookup/:type.
 * Results are cached in memory so repeated calls for the same type
 * (e.g. multiple components calling useLookupOptions('family-plans'))
 * only hit the network once.
 *
 * @param {string} type - Lookup type key, e.g. 'family-plans', 'exercise-habits'
 * @returns {{ options: Array<{value: string, label: string}>, loading: boolean, error: string|null }}
 *
 * Supported types (must match seed data):
 *   family-plans, drinking-habits, smoking-habits, exercise-habits,
 *   pets, communication-style, love-language, financial-style,
 *   relationship-status, looking-for, same-beliefs,
 *   genders, gender-preferences, interests, religions,
 *   ethnicities, languages, education, zodiac, personalities,
 *   occupations, nationality
 */
const useLookupOptions = (type) => {
  const [options, setOptions] = useState(cache[type]?.options ?? []);
  const [loading, setLoading] = useState(!cache[type]?.options);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!type) return;

    // Already cached — serve immediately, no fetch needed
    if (cache[type]?.options) {
      setOptions(cache[type].options);
      setLoading(false);
      return;
    }

    // If a fetch is already in-flight for this type, wait for it
    // instead of firing a second parallel request
    if (cache[type]?.promise) {
      cache[type].promise
        .then((opts) => {
          setOptions(opts);
          setLoading(false);
        })
        .catch((err) => {
          setError(err?.message ?? 'Failed to load options');
          setLoading(false);
        });
      return;
    }

    // First fetch for this type — kick it off and store the promise
    setLoading(true);
    setError(null);

    const promise = apiClient
      .get(`/api/lookup/${type}`)
      .then((res) => {
        // API returns { success: true, data: [...] }
        const raw = res?.data ?? res ?? [];
        const opts = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.data)
          ? raw.data
          : [];

        // Normalise to { value, label } regardless of backend shape
        const normalised = opts.map((item) => ({
          value: item.value ?? item._id ?? item.key ?? '',
          label: item.label ?? item.name ?? item.value ?? '',
          ...(item.description ? { description: item.description } : {}),
          ...(item.order      ? { order: item.order }             : {}),
        }));

        cache[type] = { options: normalised, promise: null };
        return normalised;
      })
      .catch((err) => {
        // Clear the promise so a retry is possible on next mount
        if (cache[type]) cache[type].promise = null;
        throw err;
      });

    cache[type] = { options: null, promise };

    promise
      .then((opts) => {
        setOptions(opts);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? 'Failed to load options');
        setLoading(false);
      });
  }, [type]);

  return { options, loading, error };
};

/**
 * Clear the entire lookup cache (e.g. after re-seeding in development).
 * Call this from a dev screen or useEffect if you need fresh data.
 */
export const clearLookupCache = (type) => {
  if (type) {
    delete cache[type];
  } else {
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
};

export default useLookupOptions;
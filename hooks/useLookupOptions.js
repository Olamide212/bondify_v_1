import { useMemo } from "react";
import { getLookupOptions, hasLocalLookup } from "../data/lookupData";

/**
 * Hook to get lookup options for a given type.
 * Uses local data for instant loading - no network calls needed.
 * 
 * @param {string} type - The lookup type (e.g., 'education', 'religions', etc.)
 * @returns {{ options: Array, loading: boolean, error: string|null, refresh: Function }}
 */
export const useLookupOptions = (type) => {
  const options = useMemo(() => {
    if (!type) return [];
    
    const data = getLookupOptions(type);
    
    // Log warning in dev if lookup type is not found
    if (__DEV__ && data.length === 0 && type) {
      console.warn(`[useLookupOptions] No local data found for lookup type: "${type}"`);
    }
    
    return data;
  }, [type]);

  return {
    options,
    loading: false, // Always false since data is local
    error: hasLocalLookup(type) ? null : `Unknown lookup type: ${type}`,
    refresh: () => {}, // No-op since data is local
  };
};

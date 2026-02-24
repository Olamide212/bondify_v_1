import { useCallback, useEffect, useState } from "react";
import { profileService } from "../services/profileService";

export const useLookupOptions = (type) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOptions = useCallback(async () => {
    if (!type) return;

    setLoading(true);
    setError(null);

    try {
      const lookups = await profileService.getLookups(type);
      const normalized = (lookups || []).map((item) => ({
        label: item.label,
        value: item.value,
        description: item.description || "",
      }));
      setOptions(normalized);
    } catch (err) {
      console.error(`Failed to fetch ${type} lookups:`, err);
      setError("Failed to load options");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    loading,
    error,
    refresh: fetchOptions,
  };
};

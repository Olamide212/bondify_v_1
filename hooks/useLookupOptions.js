import { useCallback, useEffect, useState } from "react";
import { profileService } from "../services/profileService";

const NEXT_LOOKUP_TYPE_MAP = {
  ethnicity: ["genders"],
  genders: ["relationship-status"],
  "relationship-status": ["gender-preferences"],
  "gender-preferences": ["looking-for"],
  "looking-for": ["religions"],
  religions: ["same-beliefs"],
  "same-beliefs": ["religion-practice"],
  "religion-practice": ["relocation-preference"],
  "relocation-preference": ["family-plans"],
  education: ["occupations"],
  occupations: ["smoking-habits"],
  "smoking-habits": ["drinking-habits"],
  "drinking-habits": ["interests"],
};

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
      const nextTypes = NEXT_LOOKUP_TYPE_MAP[type] || [];
      if (nextTypes.length > 0) {
        profileService.preloadLookups(nextTypes).catch(() => {});
      }
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

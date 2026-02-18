// hooks/useNationalities.js
import { useEffect, useState, useCallback } from "react";
import apiClient from "../utils/axiosInstance";

export const useNationalities = () => {
  const [nationalities, setNationalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNationalities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.get("/lookup", {
        params: { type: "nationality" },
        skipAuth: true, 
      });

      const lookups = res.data?.data?.lookups ?? [];
      const data = lookups.map((item) => ({
        id: item._id, // for backend
        key: item.value, // e.g. "ng"
        label: item.label, // UI text
      }));

      setNationalities(data);
    } catch (err) {
      console.error("Failed to fetch nationalities:", err);
      setError("Failed to load nationalities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNationalities();
  }, [fetchNationalities]);

  return {
    nationalities,
    loading,
    error,
    refresh: fetchNationalities,
  };
};

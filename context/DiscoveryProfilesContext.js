import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getDiscoveryProfiles } from "../services/discoverService";
import { useAuth } from "./ProfileContext";

const DiscoveryProfilesContext = createContext();

export const DiscoveryProfilesProvider = ({ children }) => {
  const { user } = useAuth?.() || {};
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchProfiles = useCallback(async (customFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = { ...customFilters };
      const data = await getDiscoveryProfiles(params);
      // Exclude logged in user if present
      const filtered = user ? data.filter((p) => p._id !== user._id) : data;
      setProfiles(filtered);
    } catch (err) {
      setError(err.message || "Failed to fetch profiles");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfiles(filters);
  }, [fetchProfiles, filters]);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <DiscoveryProfilesContext.Provider
      value={{ profiles, loading, error, filters, applyFilters, refetch: fetchProfiles }}
    >
      {children}
    </DiscoveryProfilesContext.Provider>
  );
};

export const useDiscoveryProfiles = () => useContext(DiscoveryProfilesContext);

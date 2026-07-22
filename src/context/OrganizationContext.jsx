import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { listOrganizations } from "../pages/organizations/organizationsApi";
import { setActiveOrganizationId } from "../utils/orgRequest";

const OrganizationContext = createContext(null);

export function OrganizationProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const selectOrganization = useCallback((id) => {
    setActiveOrganizationId(id);
    setSelectedOrganizationId(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizations() {
      setLoadError(null);

      try {
        const data = await listOrganizations();
        if (cancelled) return;

        setOrganizations(data);
        if (data.length > 0) {
          setSelectedOrganizationId((current) => {
            const nextId = current ?? data[0].id;
            setActiveOrganizationId(nextId);
            return nextId;
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load organizations:", err);
          setLoadError(
            err.message ??
              "Failed to load organizations. Check that the backend is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId]
  );

  const isReady = !loading && selectedOrganizationId != null;

  const value = {
    organizations,
    selectedOrganizationId,
    selectedOrganization,
    setSelectedOrganizationId: selectOrganization,
    loading,
    loadError,
    isReady,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}

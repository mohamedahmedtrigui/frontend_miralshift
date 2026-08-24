import { useState, useEffect, useCallback } from 'react';
import * as roleService from '../services/roleService';
import { useReferenceStore } from '../store/referenceStore';

export function useRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { companies, zones, agencies, fetchCompanies, fetchZones, fetchAgencies, setRoles: cacheRoles } = useReferenceStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData] = await Promise.all([
        roleService.getAll(),
        fetchCompanies(),
        fetchZones(),
        fetchAgencies(),
      ]);
      setRoles(rolesData);
      cacheRoles(rolesData);
    } catch (err) {
      console.error('Failed to fetch roles', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchCompanies, fetchZones, fetchAgencies, cacheRoles]);

  useEffect(() => { refetch(); }, [refetch]);

  const createRole = useCallback(async (data) => {
    await roleService.create(data);
    await refetch();
  }, [refetch]);

  const updateRole = useCallback(async (id, data) => {
    await roleService.update(id, data);
    await refetch();
  }, [refetch]);

  const deleteRole = useCallback(async (id) => {
    await roleService.remove(id);
    await refetch();
  }, [refetch]);

  return {
    roles,
    companies: companies || [],
    zones: zones || [],
    agencies: agencies || [],
    loading,
    error,
    refetch,
    createRole,
    updateRole,
    deleteRole,
  };
}

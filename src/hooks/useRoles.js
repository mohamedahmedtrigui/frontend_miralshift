import { useState, useEffect, useCallback } from 'react';
import * as roleService from '../services/roleService';
import { useReferenceStore } from '../store/referenceStore';

export function useRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { companies, zones, fetchCompanies, fetchZones, setRoles: cacheRoles } = useReferenceStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData] = await Promise.all([
        roleService.getAll(),
        fetchCompanies(),
        fetchZones(),
      ]);
      setRoles(rolesData);
      cacheRoles(rolesData);
    } finally {
      setLoading(false);
    }
  }, [fetchCompanies, fetchZones, cacheRoles]);

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
    loading,
    refetch,
    createRole,
    updateRole,
    deleteRole,
  };
}

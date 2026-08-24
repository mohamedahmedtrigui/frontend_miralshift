import { useState, useEffect, useCallback } from 'react';
import * as userService from '../services/userService';
import { useReferenceStore } from '../store/referenceStore';

// /users is page-specific data (always refetched); roles/companies/agencies/
// zones are the shared reference cache — reused across pages when another
// page already loaded them this session.
export function useEmployees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    roles, companies, agencies, zones, shifts,
    fetchRoles, fetchCompanies, fetchAgencies, fetchZones, fetchShifts,
  } = useReferenceStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData] = await Promise.all([
        userService.getAll(),
        fetchRoles(),
        fetchCompanies(),
        fetchAgencies(),
        fetchZones(),
        fetchShifts(),
      ]);
      setUsers(usersData);
    } finally {
      setLoading(false);
    }
  }, [fetchRoles, fetchCompanies, fetchAgencies, fetchZones, fetchShifts]);

  useEffect(() => { refetch(); }, [refetch]);

  const createUser = useCallback(async (data) => {
    await userService.create(data);
    await refetch();
  }, [refetch]);

  const updateUser = useCallback(async (id, data) => {
    await userService.update(id, data);
    await refetch();
  }, [refetch]);

  const deleteUser = useCallback(async (id) => {
    await userService.remove(id);
    await refetch();
  }, [refetch]);

  return {
    users,
    roles: roles || [],
    companies: companies || [],
    agencies: agencies || [],
    zones: zones || [],
    shifts: shifts || [],
    loading,
    refetch,
    createUser,
    updateUser,
    deleteUser,
  };
}

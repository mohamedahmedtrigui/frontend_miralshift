import { useState, useEffect, useCallback } from 'react';
import * as userService from '../services/userService';
import * as shiftService from '../services/shiftService';
import { useReferenceStore } from '../store/referenceStore';

// /users is page-specific data (always refetched); roles/companies/agencies/
// zones are the shared reference cache — reused across pages when another
// page already loaded them this session.
export function useEmployees() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    roles, companies, agencies, zones, shifts,
    fetchRoles, fetchCompanies, fetchAgencies, fetchZones, fetchShifts,
  } = useReferenceStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
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
    } catch (err) {
      console.error('Failed to fetch employees', err);
      setError(err);
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

  // Lets the employee form spawn a shift on the fly (for a company/agency
  // combo that has none yet) without navigating away to the Shifts page.
  // fetchShifts(true) forces a refresh — the cache would otherwise keep
  // serving the stale list that doesn't include the one just created.
  const createShift = useCallback(async (data) => {
    const shift = await shiftService.create(data);
    await fetchShifts(true);
    return shift;
  }, [fetchShifts]);

  return {
    users,
    roles: roles || [],
    companies: companies || [],
    agencies: agencies || [],
    zones: zones || [],
    shifts: shifts || [],
    loading,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    createShift,
  };
}

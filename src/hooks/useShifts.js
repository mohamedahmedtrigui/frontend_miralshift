import { useState, useEffect, useCallback } from 'react';
import * as shiftService from '../services/shiftService';
import { useReferenceStore } from '../store/referenceStore';

export function useShifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { companies, agencies, fetchCompanies, fetchAgencies, setShifts: cacheShifts } = useReferenceStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const shiftsData = await shiftService.getAll();
      setShifts(shiftsData);
      cacheShifts(shiftsData);
    } catch (err) {
      console.error('Failed to fetch shifts', err);
      setError(err);
      setLoading(false);
      return;
    }

    // Companies/agencies only feed the add/edit modal's dropdowns, not the
    // shifts table itself (which reads shift.companies, already embedded in
    // each shift row) — settle them independently so a role lacking read
    // access to one (a permission-matrix gap) doesn't take down the page.
    const results = await Promise.allSettled([fetchCompanies(), fetchAgencies()]);
    results.forEach((r) => {
      if (r.status === 'rejected') console.error('Failed to fetch reference data', r.reason);
    });
    setLoading(false);
  }, [fetchCompanies, fetchAgencies, cacheShifts]);

  useEffect(() => { refetch(); }, [refetch]);

  const createShift = useCallback(async (data) => {
    await shiftService.create(data);
    await refetch();
  }, [refetch]);

  const updateShift = useCallback(async (id, data) => {
    await shiftService.update(id, data);
    await refetch();
  }, [refetch]);

  const deleteShift = useCallback(async (id) => {
    await shiftService.remove(id);
    await refetch();
  }, [refetch]);

  return {
    shifts,
    companies: companies || [],
    agencies: agencies || [],
    loading,
    error,
    refetch,
    createShift,
    updateShift,
    deleteShift,
  };
}

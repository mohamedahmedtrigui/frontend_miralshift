import { useState, useEffect, useCallback } from 'react';
import * as shiftService from '../services/shiftService';
import { useReferenceStore } from '../store/referenceStore';

export function useShifts() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { companies, agencies, fetchCompanies, fetchAgencies, setShifts: cacheShifts } = useReferenceStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftsData] = await Promise.all([
        shiftService.getAll(),
        fetchCompanies(),
        fetchAgencies(),
      ]);
      setShifts(shiftsData);
      cacheShifts(shiftsData);
    } finally {
      setLoading(false);
    }
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
    refetch,
    createShift,
    updateShift,
    deleteShift,
  };
}

import { useState, useEffect, useCallback } from 'react';
import * as companyService from '../services/companyService';
import { useReferenceStore } from '../store/referenceStore';

export function useCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setCompanies: cacheCompanies } = useReferenceStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getAll();
      setCompanies(data);
      cacheCompanies(data);
    } catch (err) {
      console.error('Failed to fetch companies', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [cacheCompanies]);

  useEffect(() => { refetch(); }, [refetch]);

  const createCompany = useCallback(async (formData) => {
    await companyService.create(formData);
    await refetch();
  }, [refetch]);

  const updateCompany = useCallback(async (id, formData) => {
    await companyService.update(id, formData);
    await refetch();
  }, [refetch]);

  const deleteCompany = useCallback(async (id) => {
    await companyService.remove(id);
    await refetch();
  }, [refetch]);

  return {
    companies,
    loading,
    error,
    refetch,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}

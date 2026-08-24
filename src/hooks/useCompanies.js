import { useState, useEffect, useCallback } from 'react';
import * as companyService from '../services/companyService';
import { useReferenceStore } from '../store/referenceStore';

export function useCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setCompanies: cacheCompanies } = useReferenceStore();

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await companyService.getAll();
      setCompanies(data);
      cacheCompanies(data);
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
    refetch,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}

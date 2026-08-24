import api from '../api/axios';

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

export const getAll = async () => (await api.get('/companies')).data;

export const create = async (formData) => (await api.post('/companies', formData, MULTIPART)).data;

// Laravel doesn't parse multipart bodies on PUT, so updates POST with a
// `_method=PUT` spoof field instead.
export const update = async (id, formData) => {
  formData.append('_method', 'PUT');
  return (await api.post(`/companies/${id}`, formData, MULTIPART)).data;
};

export const remove = async (id) => (await api.delete(`/companies/${id}`)).data;

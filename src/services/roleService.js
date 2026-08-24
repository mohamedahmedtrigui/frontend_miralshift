import api from '../api/axios';

export const getAll = async () => (await api.get('/roles')).data;

export const create = async (data) => (await api.post('/roles', data)).data;

export const update = async (id, data) => (await api.put(`/roles/${id}`, data)).data;

export const remove = async (id) => (await api.delete(`/roles/${id}`)).data;

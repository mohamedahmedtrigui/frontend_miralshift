import api from '../api/axios';

export const getAll = async () => (await api.get('/shifts')).data;

export const create = async (data) => (await api.post('/shifts', data)).data;

export const update = async (id, data) => (await api.put(`/shifts/${id}`, data)).data;

export const remove = async (id) => (await api.delete(`/shifts/${id}`)).data;

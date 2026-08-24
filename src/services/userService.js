import api from '../api/axios';

export const getAll = async () => (await api.get('/users')).data;

export const create = async (data) => (await api.post('/users', data)).data;

export const update = async (id, data) => (await api.put(`/users/${id}`, data)).data;

export const remove = async (id) => (await api.delete(`/users/${id}`)).data;

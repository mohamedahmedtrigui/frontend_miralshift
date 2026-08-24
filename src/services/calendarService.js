import api from '../api/axios';

export const getAll = async () => (await api.get('/calendar')).data;

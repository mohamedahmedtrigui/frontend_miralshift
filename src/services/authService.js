import api from '../api/axios';

export const login = async (username, password) => {
  const { data } = await api.post('/login', { username, password });
  return data; // { access_token, user }
};

export const logout = async () => {
  await api.post('/logout');
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get('/user');
  return data;
};

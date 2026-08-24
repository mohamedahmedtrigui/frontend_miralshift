import { create } from 'zustand';
import * as authService from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { access_token, user } = await authService.login(username, password);

      localStorage.setItem('token', access_token);
      set({ user, token: access_token, isAuthenticated: true, loading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Échec de connexion',
        loading: false
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  fetchUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const user = await authService.fetchCurrentUser();
      set({ user, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  }
}));

import axios from 'axios';

// VITE_API_BASE_URL is baked in at build time — if it's missing, axios would
// silently default requests to the current page's own origin instead of the
// API, which looks like a working 200 response full of the wrong data
// instead of an obvious failure. Fail loudly instead.
if (!import.meta.env.VITE_API_BASE_URL) {
  console.error(
    'VITE_API_BASE_URL is not set — API requests will be sent to the wrong origin. ' +
    'Set it in this deployment\'s environment variables and rebuild.'
  );
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 on an authenticated request means the token is gone/expired server-side
// (not the same as a failed /login attempt, which also returns 401 for bad
// credentials — excluded below so the login form still shows its own error).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

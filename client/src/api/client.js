import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  // In dev: Vite proxy forwards /api → localhost:5000
  // In prod: set VITE_API_URL in Vercel env vars to https://your-app.onrender.com/api
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
});

// Giden her isteğe Supabase JWT token'ını ekle
axiosClient.interceptors.request.use((config) => {
  const session = useAuthStore.getState().session;
  
  if (session && session.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;

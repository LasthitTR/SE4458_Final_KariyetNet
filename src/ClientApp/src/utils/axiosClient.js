import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig';
import useAuthStore from '../store/useAuthStore';

const auth = getAuth(app);

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000',
});

// Giden her isteğe güncel Firebase JWT token'ını ekle
axiosClient.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      const session = useAuthStore.getState().session;
      if (session && session.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
  } catch (error) {
    console.error("Token interceptor error:", error);
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;

import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

/**
 * Axios HTTP client configured for the Prahari backend.
 * 
 * Features:
 *   - Automatic JWT token injection via request interceptor
 *   - Automatic 401 handling (redirect to login on expired tokens)
 *   - JSON content-type header
 */
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ====================================================================
// Request Interceptor — Inject JWT token
// ====================================================================
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('prahari_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ====================================================================
// Response Interceptor — Handle 401 (expired/invalid token)
// ====================================================================
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth data and redirect to login
      localStorage.removeItem('prahari_token');
      localStorage.removeItem('prahari_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;

import axios from 'axios';

let rawBase = import.meta.env.VITE_API_URL || 'https://the-alchemist-afnj.onrender.com/api';
if (rawBase.endsWith('/')) rawBase = rawBase.slice(0, -1);
if (!rawBase.endsWith('/api')) rawBase = rawBase + '/api';

const api = axios.create({
  baseURL: rawBase,
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired, trigger logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

export default api;

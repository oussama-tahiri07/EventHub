import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to catch 401/403 and handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on a protected call (not during login)
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('eventhub_token');
        localStorage.removeItem('eventhub_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

// Dynamically determine backend URL
const getBackendURL = () => {
  // In development with Vite proxy, use relative URL
  // In production, construct URL based on current host
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Development: use relative URLs (Vite proxy will handle it)
    return '';
  }
  // Production: construct full URL to backend on same host but different port
  return `http://${window.location.hostname}:5000`;
};

// Create an axios instance
const api = axios.create({
  baseURL: getBackendURL(),  // Dynamic base URL for cross-host compatibility
  withCredentials: true,      // Ensure cookies are sent with requests
});

// Add request interceptor to attach the token and fix trailing slashes
api.interceptors.request.use(
  (config) => {
    // Retrieve the token from localStorage
    const token = localStorage.getItem('token');

    // Attach the token to the request header if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure the request URL has a trailing slash (only for relative URLs)
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
      config.url += '/';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 Unauthorized errors globally to handle expired tokens
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Token may have expired - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';  // Redirect user to login page
    }
    return Promise.reject(error);
  }
);

export default api;

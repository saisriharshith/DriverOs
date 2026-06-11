import axios from 'axios';

const getApiBaseUrl = () => {
  // Check if we're running in Docker (nginx proxies /api to backend)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api/v1/';
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const baseURL = getApiBaseUrl();
          const response = await axios.post(`${baseURL}auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Redirect to login or logout user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Check if we are in app stage
          if (typeof window !== 'undefined') {
             // In a real app we would use a router or state to redirect
             // For now we'll just clear and let the app state handle it
             window.location.reload(); 
          }
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

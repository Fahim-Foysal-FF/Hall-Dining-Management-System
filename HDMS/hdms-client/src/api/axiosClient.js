import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5045/api' // adjust port if backend uses different
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Request token check:', token ? 'token found' : 'no token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401/403 errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('Response error status:', error.response?.status);
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Don't redirect automatically - let the calling code handle it
      console.warn('Unauthorized access', error.response?.status);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
import axios from 'axios';

// Create an axios instance that points to our API
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to attach auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

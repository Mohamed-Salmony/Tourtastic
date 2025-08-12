import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  timeout: 60000 // 60 seconds timeout for flight searches
});

// Add session ID to requests for anonymous users
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');
  
  // Only add token if it's valid and not expired
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp > currentTime) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Remove expired token
        localStorage.removeItem('token');
      }
    } catch (error) {
      // Invalid token format, remove it
      localStorage.removeItem('token');
    }
  } else if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  
  return config;
});

// Handle token expiration responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove expired token
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

// Add session ID to requests for anonymous users
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  
  return config;
});

export default api;

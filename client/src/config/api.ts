import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout by default
  // Add retry logic
  validateStatus: function (status) {
    // Consider only 5xx responses as errors that should trigger retries
    return status >= 200 && status < 500;
  }
});

// Add session ID to requests for anonymous users
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const sessionId = localStorage.getItem('sessionId');
  
  // Only add token if it exists
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp > currentTime) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (refreshToken) {
        // Token is expired but we have a refresh token
        // Let the response interceptor handle the refresh
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // No refresh token available, remove expired token
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
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh the token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh-token', { refreshToken });
          
          if (response.data.success) {
            // Save new tokens
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token available
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

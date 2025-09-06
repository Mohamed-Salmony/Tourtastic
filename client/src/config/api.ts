import axios, { type AxiosRequestHeaders } from 'axios';

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
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const sessionId = localStorage.getItem('sessionId');

  // If we have a token, ensure it's fresh. If expired, try to refresh synchronously.
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp > currentTime) {
          config.headers = (config.headers ?? {}) as AxiosRequestHeaders;
          (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
          return config;
        }
      }

      // Token looks expired or invalid; attempt refresh if we have a refresh token
      if (refreshToken) {
        try {
          const refreshResp = await axios.post('/api/auth/refresh-token', { refreshToken });
          if (refreshResp.data?.success && refreshResp.data.accessToken) {
            localStorage.setItem('token', refreshResp.data.accessToken);
            if (refreshResp.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshResp.data.refreshToken);
            }
            config.headers = (config.headers ?? {}) as AxiosRequestHeaders;
            (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${refreshResp.data.accessToken}`;
            return config;
          }
        } catch (refreshErr) {
          // refresh failed; fall through to clearing tokens
          console.warn('Token refresh failed', refreshErr);
        }
      }

      // If we reach here, token is not usable
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      // allow request to proceed without Authorization header (server will return 401)
      return config;
    } catch (err) {
      // If any parsing error, clear tokens and continue
      localStorage.removeItem('token');
      return config;
    }
  }

  if (sessionId) {
  config.headers = (config.headers ?? {}) as AxiosRequestHeaders;
  (config.headers as AxiosRequestHeaders)['X-Session-ID'] = sessionId;
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

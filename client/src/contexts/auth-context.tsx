import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, type User, type AuthContextType } from './auth-context-types';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/api/auth/refresh-token', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      return accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      throw error;
    }
  }, [logout]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Check if the error is due to token expiration and not already retrying
        if (error.response?.status === 401 && error.response?.data?.message?.includes('expired') && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh token fails, log out the user
            console.error('Token refresh failed:', refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        }

        // If it's a 401 but not due to expiration, or refresh failed, log out
        if (error.response?.status === 401) {
          logout();
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshAccessToken, logout]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        
        if (storedUser && storedToken && storedRefreshToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (err) {
        setError('Failed to restore session');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback((tokens: { accessToken: string; refreshToken: string }, userData: User) => {
    localStorage.setItem('token', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const token = localStorage.getItem('token');
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

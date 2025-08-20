import { createContext } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

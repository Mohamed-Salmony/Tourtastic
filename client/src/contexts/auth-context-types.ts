import { createContext } from 'react';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (tokens: { accessToken: string; refreshToken: string }, userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

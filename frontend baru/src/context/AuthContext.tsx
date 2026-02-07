import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');

      if (storedToken) {
        try {
          const response = await authAPI.me();
          setUser(response);
        } catch {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('auth_token', response.access_token);

      // Fetch user info after login
      const userInfo = await authAPI.me();
      localStorage.setItem('auth_user', JSON.stringify(userInfo));
      setUser(userInfo);
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Continue with local logout even if API fails
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

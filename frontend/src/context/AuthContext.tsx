import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import type { User } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  canAccessClass: (className: string) => boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch assigned classes for teachers
  const fetchAssignedClasses = async (token: string): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error('Failed to fetch assigned classes:', response.status);
        return [];
      }

      const data = await response.json();
      return Array.isArray(data.classes) ? data.classes : [];
    } catch (error) {
      console.error('Error fetching assigned classes:', error);
      return [];
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');

      if (storedToken) {
        try {
          const response = await authAPI.me();
          // Ensure response has role field
          if (response && typeof response === 'object') {
            const userData = response as User;

            // Fetch assigned classes for teachers
            if (userData.role === 'teacher') {
              const classes = await fetchAssignedClasses(storedToken);
              userData.assignedClasses = classes;
            }

            setUser(userData);
          }
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

      // Extract role from login response
      const role = response.role || 'teacher';

      // Fetch user info after login
      const userInfo = await authAPI.me();

      // Create User object with proper typing
      const userWithRole: User = {
        id: userInfo.id,
        username: userInfo.username,
        role: role,
        is_active: userInfo.is_active,
        created_at: userInfo.created_at,
      };

      // Fetch assigned classes for teachers
      if (role === 'teacher') {
        const classes = await fetchAssignedClasses(response.access_token);
        userWithRole.assignedClasses = classes;
      }

      localStorage.setItem('auth_user', JSON.stringify(userWithRole));
      setUser(userWithRole);
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

  const canAccessClass = (className: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.assignedClasses?.includes(className) || false;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    canAccessClass,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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

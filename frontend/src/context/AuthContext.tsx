import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../types';
import {
  getToken, setToken, removeToken,
  getRefreshToken, setRefreshToken, removeRefreshToken,
  getStoredUser, setStoredUser, removeStoredUser,
} from '../utils';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(false);

  // Rehydrate on mount
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((accessToken: string, refreshToken: string, userData: User) => {
    setToken(accessToken);
    setRefreshToken(refreshToken);
    setStoredUser(userData);
    setTokenState(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    removeRefreshToken();
    removeStoredUser();
    setTokenState(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      setStoredUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

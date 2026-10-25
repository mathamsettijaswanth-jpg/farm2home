import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Address } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  selectedAddress: Address | null;
  setSelectedAddress: (addr: Address | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const refreshUser = async () => {
    const curToken = getStoredToken();
    if (!curToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const u = await api.getMe(curToken);
      setUser(u);
      // Auto-load default address if customer
      if (u.role === 'customer') {
        const addresses = await api.getAddresses();
        const def = addresses.find(a => a.is_default) || addresses[0] || null;
        setSelectedAddress(def);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
    if (newUser.role === 'customer') {
      api.getAddresses().then(addrs => {
        const def = addrs.find(a => a.is_default) || addrs[0] || null;
        setSelectedAddress(def);
      }).catch(() => {});
    }
  };

  const logout = () => {
    api.logout().catch(() => {});
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setSelectedAddress(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        selectedAddress,
        setSelectedAddress,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

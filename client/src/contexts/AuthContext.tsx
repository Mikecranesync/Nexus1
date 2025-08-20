/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  needsOrganizationSetup: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('organizationSetup');
  };

  const isAuthenticated = user !== null;
  
  // Check if organization setup is needed
  const needsOrganizationSetup = () => {
    if (!isAuthenticated) return false;
    const orgSetup = localStorage.getItem('organizationSetup');
    return !orgSetup;
  };

  // Load user from localStorage on component mount
  useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
  });

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    needsOrganizationSetup: needsOrganizationSetup()
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider };
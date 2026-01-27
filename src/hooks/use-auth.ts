import { createContext, useContext } from 'react';
import type { User, UserRole, RegisterData } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check if user has required role(s)
export function useRequireAuth(requiredRoles?: UserRole | UserRole[]) {
  const { user, isAuthenticated, hasRole } = useAuth();
  
  if (!isAuthenticated || !user) {
    return { authorized: false, reason: 'not-authenticated' as const };
  }
  
  if (requiredRoles && !hasRole(requiredRoles)) {
    return { authorized: false, reason: 'insufficient-role' as const };
  }
  
  return { authorized: true, reason: null, user };
}

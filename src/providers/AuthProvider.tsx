import { useCallback, type ReactNode } from 'react';
import { AuthContext } from '@/hooks/use-auth';
import type { User, UserRole, RegisterData } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  logout as logoutAction,
  setCredentials,
  setUser,
} from '@/store/slices/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
  useUpdateProfileMutation,
} from '@/store/api/authApi';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // RTK Query mutations
  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [updateProfileMutation, { isLoading: isUpdateLoading }] = useUpdateProfileMutation();

  const isLoading = isLoginLoading || isRegisterLoading || isUpdateLoading;

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.access }));
      return result.user;
    },
    [loginMutation, dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const register = useCallback(
    async (data: RegisterData) => {
      const result = await registerMutation(data).unwrap();
      dispatch(setCredentials({ user: result.user, token: result.access }));
    },
    [registerMutation, dispatch]
  );

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      const updatedUser = await updateProfileMutation(data).unwrap();
      dispatch(setUser(updatedUser));
    },
    [updateProfileMutation, dispatch]
  );

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        updateProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

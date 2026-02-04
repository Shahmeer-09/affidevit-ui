import { useCallback, type ReactNode } from 'react';
import { AuthContext } from '@/hooks/use-auth';
import type { User, UserRole, RegisterData, CommissionerRegisterData } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  logout as logoutAction,
  setCredentials,
  setUser,
} from '@/store/slices/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
  useRegisterCommissionerMutation,
  useUpdateProfileMutation,
  useVerifyOtpMutation,
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
  const [registerCommissionerMutation, { isLoading: isCommissionerRegisterLoading }] = useRegisterCommissionerMutation();
  const [updateProfileMutation, { isLoading: isUpdateLoading }] = useUpdateProfileMutation();
  const [verifyOtpMutation, { isLoading: isVerifyLoading }] = useVerifyOtpMutation();

  const isLoading = isLoginLoading || isRegisterLoading || isCommissionerRegisterLoading || isUpdateLoading || isVerifyLoading;

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      const result = await loginMutation({ email, password, remember_me: rememberMe }).unwrap();
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
      // If registration returns tokens (no OTP required), log the user in
      if (result.access && result.user) {
        dispatch(setCredentials({ user: result.user, token: result.access }));
      }
      return result;
    },
    [registerMutation, dispatch]
  );

  const verifyOtp = useCallback(
    async (userId: string, code: string) => {
      const result = await verifyOtpMutation({ user_id: userId, code }).unwrap();
      if (result.access && result.user) {
        dispatch(setCredentials({ user: result.user, token: result.access }));
      }
      return result;
    },
    [verifyOtpMutation, dispatch]
  );

  const registerCommissioner = useCallback(
    async (data: CommissionerRegisterData) => {
      // Convert to FormData for file upload support
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'availability' && typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else if (key === 'profile_image' && value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      // No tokens returned - just submit for approval
      const result = await registerCommissionerMutation(formData).unwrap();
      return result;
    },
    [registerCommissionerMutation]
  );

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      const updatedUser = await updateProfileMutation(data as any).unwrap();
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
        registerCommissioner,
        verifyOtp,
        updateProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

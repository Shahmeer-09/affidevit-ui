// Auth API - RTK Query endpoints for authentication
import { baseApi } from './baseApi';
import type { User, RegisterData, LoginCredentials } from '@/types';

// Response types
export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  remember_me?: boolean;
}

export interface RegisterResponse {
  access?: string;
  refresh?: string;
  user?: User;
  message?: string;
  otp_sent?: boolean;
  user_id?: string;
}

export interface CommissionerRegisterResponse {
  access?: string;
  refresh?: string;
  user?: User;
  message: string;
  otp_sent?: boolean;
  user_id?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: User;
  refresh?: string;
  access?: string;
}

export interface GuestSignupStartRequest {
  email: string;
  full_name: string;
  phone_number?: string;
}

export interface GuestSignupStartResponse {
  message: string;
  mock_otp?: string;
}

export interface GuestSignupVerifyRequest {
  email: string;
  otp: string;
  full_name: string;
  phone_number?: string;
  affidavit_type_id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answers_json: any;
  draft_text?: string;
}

export interface GuestSignupVerifyResponse {
  user: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any;
  refresh: string;
  access: string;
  next_step?: 'review_queue' | 'select_commissioner' | 'wait_for_draft';
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  commission_number?: string;
  commission_expiry?: string;
  availability?: Record<string, unknown>;
  bio?: string;
  address?: string;
  organization?: string;
  auto_accept_appointments?: boolean;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login - obtain JWT tokens
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/token/',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Register new user
    register: builder.mutation<RegisterResponse, RegisterData>({
      query: (data) => ({
        url: '/auth/register/',
        method: 'POST',
        body: data,
      }),
    }),

    // Register new commissioner with all details
    registerCommissioner: builder.mutation<CommissionerRegisterResponse, FormData>({
      query: (formData) => ({
        url: '/auth/register/commissioner/',
        method: 'POST',
        body: formData,
      }),
    }),

    // Verify OTP
    verifyOtp: builder.mutation<VerifyOtpResponse, { user_id: string; code: string }>({
      query: (data) => ({
        url: '/auth/verify-otp/',
        method: 'POST',
        body: data,
      }),
    }),

    // Guest Signup Start
    guestSignupStart: builder.mutation<GuestSignupStartResponse, GuestSignupStartRequest>({
      query: (data) => ({
        url: '/auth/guest-signup/start/',
        method: 'POST',
        body: data,
      }),
    }),

    // Guest Signup Verify
    guestSignupVerify: builder.mutation<GuestSignupVerifyResponse, GuestSignupVerifyRequest>({
      query: (data) => ({
        url: '/auth/guest-signup/verify/',
        method: 'POST',
        body: data,
      }),
    }),

    // Get current user profile
    getProfile: builder.query<User, void>({
      query: () => '/auth/profile/',
      providesTags: ['Profile'],
    }),

    // Update user profile
    updateProfile: builder.mutation<User, ProfileUpdateRequest>({
      query: (data) => ({
        url: '/auth/profile/',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRegisterCommissionerMutation,
  useVerifyOtpMutation,
  useGuestSignupStartMutation,
  useGuestSignupVerifyMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;

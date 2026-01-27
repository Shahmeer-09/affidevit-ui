// Auth API - RTK Query endpoints for authentication
import { baseApi } from './baseApi';
import type { User, RegisterData, LoginCredentials } from '@/types';

// Response types
export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  commission_number?: string;
  commission_expiry?: string;
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

    // Get current user profile
    getProfile: builder.query<User, void>({
      query: () => '/auth/profile/',
      providesTags: ['Profile'],
    }),

    // Update user profile
    updateProfile: builder.mutation<User, ProfileUpdateRequest>({
      query: (data) => ({
        url: '/auth/profile/',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;

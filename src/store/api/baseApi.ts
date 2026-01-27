// Base API configuration with RTK Query
// Handles JWT injection, 401 logout, and error toasts
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { API_BASE_URL } from '@/lib/constants';
import { toast } from 'sonner';

// Base query with auth header injection
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Wrapper that handles 401 errors (silent logout) and shows toast for other errors
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    const status = result.error.status;

    // Handle 401 - silent logout, no toast
    if (status === 401) {
      // Import dynamically to avoid circular dependency
      const { logout } = await import('@/store/slices/authSlice');
      api.dispatch(logout());
      window.location.href = '/login';
      return result;
    }

    // For all other errors, show toast
    const errorData = result.error.data as { detail?: string; message?: string } | undefined;
    const errorMessage = errorData?.detail || errorData?.message || `Error: ${status}`;
    toast.error(errorMessage);
  }

  return result;
};

// Create a base API that other APIs will inject into
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'Profile',
    'Request',
    'MyRequests',
    'AssignedRequests',
    'AffidavitType',
    'DecisionTree',
    'Stamps',
    'PDFPreferences',
    'ReviewQueue',
    'ReviewRequest',
    'ReviewerStats',
    'AdminDashboard',
    'ConfidenceDashboard',
    'Costs',
    'TypeTrends',
    'Learning',
    'Suggestions',
    'Friction',
    'Commissioner',
    'Reviewer',
    'AIInstruction',
  ],
  endpoints: () => ({}),
});

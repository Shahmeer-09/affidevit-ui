// Commissioner API - RTK Query endpoints for commissioner operations
import { baseApi } from './baseApi';
import type { Request, Stamp, FrictionReport, PDFPreferences } from '@/types';

// Request types
export interface CompleteRequestParams {
  request_id: number;
  notes?: string;
}

export interface FrictionReportParams {
  request_id: number;
  reason: string;
  category?: string;
}

export interface PDFPreferencesRequest {
  letterhead_enabled?: boolean;
  letterhead_text?: string;
  page_size?: 'letter' | 'a4';
  signature_spacing?: 'compact' | 'standard' | 'generous';
  show_commission_number?: boolean;
  footer_text?: string;
}

export const commissionerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get requests assigned to this commissioner (where user selected them)
    getAssignedRequests: builder.query<
      { results: Request[]; count: number },
      void
    >({
      query: () => '/commissioner/my-requests/',
      providesTags: ['AssignedRequests'],
    }),

    // Find request by code
    lookupRequest: builder.query<Request, string>({
      query: (requestCode) => `/commissioner/lookup/${requestCode}/`,
      providesTags: (_result, _error, code) => [{ type: 'Request', id: code }],
    }),

    // Force takeover locked request
    takeoverRequest: builder.mutation<Request, string>({
      query: (requestCode) => ({
        url: `/commissioner/takeover/${requestCode}/`,
        method: 'POST',
      }),
    }),

    // Mark request as completed
    completeRequest: builder.mutation<
      { success: boolean; message: string; stamp: Stamp },
      CompleteRequestParams
    >({
      query: ({ request_id, notes }) => ({
        url: `/commissioner/complete/${request_id}/`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['Stamps', 'AssignedRequests'],
    }),

    // Create friction report
    createFrictionReport: builder.mutation<FrictionReport, FrictionReportParams>({
      query: ({ request_id, reason, category }) => ({
        url: `/commissioner/report/`,
        method: 'POST',
        body: { request: request_id, reason, category },
      }),
    }),

    // List commissioner's stamps
    getStamps: builder.query<
      { results: Stamp[]; count: number },
      { page?: number; pageSize?: number } | void
    >({
      query: (params) => {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 10;
        return `/commissioner/stamps/?page=${page}&page_size=${pageSize}`;
      },
      providesTags: ['Stamps'],
    }),

    // Get PDF preferences
    getPdfPreferences: builder.query<PDFPreferences, void>({
      query: () => '/commissioner/pdf-preferences/',
      providesTags: ['PDFPreferences'],
    }),

    // Update PDF preferences
    updatePdfPreferences: builder.mutation<PDFPreferences, PDFPreferencesRequest>({
      query: (data) => ({
        url: '/commissioner/pdf-preferences/',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['PDFPreferences'],
    }),
  }),
});

export const {
  useGetAssignedRequestsQuery,
  useLookupRequestQuery,
  useLazyLookupRequestQuery,
  useTakeoverRequestMutation,
  useCompleteRequestMutation,
  useCreateFrictionReportMutation,
  useGetStampsQuery,
  useGetPdfPreferencesQuery,
  useUpdatePdfPreferencesMutation,
} = commissionerApi;

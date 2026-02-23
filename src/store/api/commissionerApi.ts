// Commissioner API - RTK Query endpoints for commissioner operations
import { baseApi } from './baseApi';
import type { Request, RequestStatus, Stamp, FrictionReport, PDFPreferences } from '@/types';

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

export interface CommissionerScheduleSlot {
  id: number;
  commissioner: number;
  start_time: string;
  is_booked: boolean;
  appointment_status?: 'pending' | 'accepted' | 'rejected' | 'cancelled_by_commissioner' | 'cancelled_by_user';
  decision_at?: string;
  decision_reason?: string;
  request_details?: {
    request_code: string;
    client_name: string;
    affidavit_type: string;
    status: RequestStatus;
  };
}

export interface SlotDecisionParams {
  slot_id: number;
  reason?: string;
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

    // Get commissioner's booked schedule
    getCommissionerSchedule: builder.query<CommissionerScheduleSlot[], void>({
      query: () => '/commissioner/schedule/',
      providesTags: ['CommissionerSlot'],
      transformResponse: (response: any) => {
        return response?.results || response || [];
      },
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
      { success: boolean; message: string; stamp: Stamp; payout_message?: string },
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

    // Accept appointment slot
    acceptSlot: builder.mutation<{ success: boolean; message: string; slot: CommissionerScheduleSlot }, number>({
      query: (slotId) => ({
        url: `/slots/${slotId}/accept/`,
        method: 'POST',
      }),
      invalidatesTags: ['CommissionerSlot', 'AssignedRequests'],
    }),

    // Reject appointment slot
    rejectSlot: builder.mutation<{ success: boolean; message: string }, SlotDecisionParams>({
      query: ({ slot_id, reason }) => ({
        url: `/slots/${slot_id}/reject/`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['CommissionerSlot', 'AssignedRequests'],
    }),

    // Cancel appointment slot
    cancelSlot: builder.mutation<{ success: boolean; message: string }, SlotDecisionParams>({
      query: ({ slot_id, reason }) => ({
        url: `/slots/${slot_id}/cancel/`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['CommissionerSlot', 'AssignedRequests'],
    }),
  }),
});

export const {
  useGetAssignedRequestsQuery,
  useGetCommissionerScheduleQuery,
  useLookupRequestQuery,
  useLazyLookupRequestQuery,
  useTakeoverRequestMutation,
  useCompleteRequestMutation,
  useCreateFrictionReportMutation,
  useGetStampsQuery,
  useGetPdfPreferencesQuery,
  useUpdatePdfPreferencesMutation,
  useAcceptSlotMutation,
  useRejectSlotMutation,
  useCancelSlotMutation,
} = commissionerApi;

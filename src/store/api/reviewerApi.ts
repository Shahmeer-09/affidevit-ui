// Reviewer API - RTK Query endpoints for reviewer operations
import { baseApi } from './baseApi';
import type { Request, ReviewQueueItem, ReviewerStats } from '@/types';

// Request types
export interface ApproveRequestParams {
  request_id: number;
  final_text?: string;
  issue_type?: string;
  issue_description?: string;
}

export interface RejectRequestParams {
  request_id: number;
  reason: string;
}

export interface ClarificationParams {
  request_id: number;
  question: string;
}

export interface QAOverrideParams {
  request_id: number;
  flag_index: number;
  reason: string;
  ai_correct?: boolean; // true = AI was right, false = AI was wrong (false positive)
}

export const reviewerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get review queue - returns array (backend uses ListAPIView with pagination)
    getReviewQueue: builder.query<ReviewQueueItem[], void>({
      query: () => `/reviewer/queue/`,
      providesTags: ['ReviewQueue'],
      transformResponse: (response: any) => {
        // Handle paginated response format { results: [...] }
        return response.results || response || [];
      },
    }),

    // Get reviewer stats for dashboard
    getReviewerStats: builder.query<ReviewerStats, void>({
      query: () => `/reviewer/stats/`,
      providesTags: ['ReviewerStats'],
    }),

    // Get request for review (detailed view)
    getReviewRequest: builder.query<Request, number>({
      query: (id) => `/reviewer/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'ReviewRequest', id }],
    }),

    // Approve request (with optional edited text)
    approveRequest: builder.mutation<
      { success: boolean; message: string; request_code: string; pdf_generating: boolean },
      ApproveRequestParams
    >({
      query: ({ request_id, final_text, issue_type, issue_description }) => ({
        url: `/reviewer/${request_id}/approve/`,
        method: 'POST',
        body: { final_text, issue_type, issue_description },
      }),
      invalidatesTags: ['ReviewQueue', 'ReviewerStats'],
    }),

    // Reject request
    rejectRequest: builder.mutation<{ success: boolean; message: string }, RejectRequestParams>({
      query: ({ request_id, reason }) => ({
        url: `/reviewer/${request_id}/reject/`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['ReviewQueue', 'ReviewerStats'],
    }),

    // Request clarification from user
    requestClarification: builder.mutation<{ success: boolean; message: string }, ClarificationParams>({
      query: ({ request_id, question }) => ({
        url: `/reviewer/${request_id}/clarify/`,
        method: 'POST',
        body: { question },
      }),
      invalidatesTags: ['ReviewQueue', 'ReviewerStats'],
    }),

    // Override QA flag (AI Correct/Wrong)
    overrideQA: builder.mutation<{ success: boolean }, QAOverrideParams>({
      query: ({ request_id, flag_index, reason, ai_correct }) => ({
        url: `/reviewer/${request_id}/override-flag/`,
        method: 'POST',
        body: { flag_index, reason, ai_correct },
      }),
      invalidatesTags: (_result, _error, { request_id }) => [
        { type: 'ReviewRequest', id: request_id },
      ],
    }),
  }),
});

export const {
  useGetReviewQueueQuery,
  useGetReviewerStatsQuery,
  useGetReviewRequestQuery,
  useLazyGetReviewRequestQuery,
  useApproveRequestMutation,
  useRejectRequestMutation,
  useRequestClarificationMutation,
} = reviewerApi;

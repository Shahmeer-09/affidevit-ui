// Reviewer API - RTK Query endpoints for reviewer operations
import { baseApi } from './baseApi';
import type { Request, ReviewQueueItem, ReviewerStats } from '@/types';

// Request types
export interface AutoFeedbackPair {
  original_snippet: string;
  revised_snippet: string;
  feedback_target: 'drafter' | 'policy' | 'both' | 'skip';
}

export interface ApproveRequestParams {
  request_id: number;
  final_text?: string;
  issue_type?: string;
  issue_description?: string;
  feedback_entries?: FeedbackEntry[];
  auto_feedback_pairs?: AutoFeedbackPair[];
}

export interface FeedbackEntry {
  category: string;
  message: string;
  feedback_target: 'drafter' | 'policy' | 'both';
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

export interface FeedbackParams {
  request_id: number;
  category: string;
  message: string;
  feedback_target?: 'drafter' | 'policy' | 'both';
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
      query: ({ request_id, final_text, issue_type, issue_description, feedback_entries, auto_feedback_pairs }) => ({
        url: `/reviewer/${request_id}/approve/`,
        method: 'POST',
        body: { final_text, issue_type, issue_description, feedback_entries, auto_feedback_pairs },
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

    // Submit minimal feedback for a request
    submitFeedback: builder.mutation<
      { id: number; request: number; reviewer: number; category: string; message: string; created_at: string },
      FeedbackParams
    >({
      query: ({ request_id, category, message, feedback_target }) => ({
        url: `/reviewer/${request_id}/feedback/`,
        method: 'POST',
        body: { category, message, feedback_target },
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
  useSubmitFeedbackMutation,
} = reviewerApi;

// User API - RTK Query endpoints for user operations (requests, affidavit types, decision tree)
import { baseApi } from './baseApi';
import type {
  Request,
  AffidavitType,
  DecisionNode,
  PaginatedResponse,
} from '@/types';

// Request/Response types
export interface CreateRequestRequest {
  affidavit_type: number;
  answers_json?: Record<string, unknown>;
}

export interface CreateRequestResponse {
  id: number;
  request_code: string;
  status: string;
}

export interface AutoSaveRequest {
  answers_json: Record<string, unknown>;
}

export interface SubmitRequestResponse {
  id: number;
  status: string;
  message: string;
}

export interface AILogEntry {
  id: number;
  node_type: 'draft' | 'qa' | 'clarification';
  node_type_display: string;
  status: 'success' | 'failed' | 'timeout';
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  error_message?: string;
  created_at: string;
}

export interface ProcessingStep {
  step: number;
  label: string;
  progress: number;
}

export interface ProcessingStatusResponse {
  status: string;
  progress?: number;
  message?: string;
  draft_ready?: boolean;
  clarification_question?: string;
  ai_logs?: AILogEntry[];
  processing_step?: ProcessingStep;
}

export interface TraverseTreeRequest {
  current_node_id: number;
  answer_id: number;
}

export interface TraverseTreeResponse {
  next_node?: {
    id: number;
    question: string;
    help_text?: string;
    options: {
      id: number;
      label: string;
      next_node_id?: number;
      result_type_id?: number;
    }[];
  };
  result_type?: {
    id: number;
    name: string;
    description: string;
  };
}

// Public commissioner type (for landing page)
export interface PublicCommissioner {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  commission_number: string | null;
  profile_image_url: string | null;
  bio: string;
  organization: string | null;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // Public Commissioners (for landing page)
    // ============================================
    getPublicCommissioners: builder.query<PublicCommissioner[], void>({
      query: () => '/commissioners/',
      providesTags: ['Commissioner'],
      transformResponse: (response: any) => {
        // Handle paginated response format { results: [...] }
        return response.results || response || [];
      },
    }),

    // ============================================
    // Affidavit Types (public)
    // ============================================
    getAffidavitTypes: builder.query<AffidavitType[], void>({
      query: () => '/affidavit-types/',
      providesTags: ['AffidavitType'],
      transformResponse: (response: any) => {
        // Handle paginated response format { results: [...] }
        return response.results || response || [];
      },
    }),

    getAffidavitType: builder.query<AffidavitType, number>({
      query: (id) => `/affidavit-types/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'AffidavitType', id }],
    }),

    // ============================================
    // Decision Tree (public)
    // ============================================
    getDecisionTreeRoot: builder.query<DecisionNode[], void>({
      query: () => '/decision-tree/',
      providesTags: ['DecisionTree'],
      transformResponse: (response: any) => {
        // Handle paginated response format { results: [...] }
        const nodes = response.results || response;
        if (!Array.isArray(nodes)) return [];
        
        return nodes.map((node: any) => ({
          id: node.id,
          question: node.question_text || '',
          help_text: node.help_text,
          is_root: !node.parent_node,
          options: (node.children || []).map((child: any) => ({
            id: child.id,
            label: child.answer_value || '',
            next_node_id: child.is_leaf ? undefined : child.id,
            result_type_id: child.result_affidavit_type_id,
            result_type_name: child.result_affidavit_type_name,
          })),
        }));
      },
    }),

    getDecisionTreeNode: builder.query<DecisionNode, number>({
      query: (id) => `/decision-tree/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'DecisionTree', id }],
      transformResponse: (node: any) => ({
        id: node.id,
        question: node.question_text || '',
        help_text: node.help_text,
        is_root: !node.parent_node,
        options: (node.children || []).map((child: any) => ({
          id: child.id,
          label: child.answer_value || '',
          next_node_id: child.is_leaf ? undefined : child.id,
          result_type_id: child.result_affidavit_type_id,
          result_type_name: child.result_affidavit_type_name,
        })),
      }),
    }),

    traverseTree: builder.mutation<TraverseTreeResponse, TraverseTreeRequest>({
      query: (data) => ({
        url: '/decision-tree/traverse/',
        method: 'POST',
        body: data,
      }),
    }),

    // ============================================
    // User Requests (authenticated)
    // ============================================
    getMyRequests: builder.query<
      PaginatedResponse<Request>,
      { page?: number; pageSize?: number } | void
    >({
      query: (params) => {
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 10;
        return `/requests/my/?page=${page}&page_size=${pageSize}`;
      },
      providesTags: ['MyRequests'],
    }),

    getRequest: builder.query<Request, number>({
      query: (id) => `/requests/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Request', id }],
    }),

    createRequest: builder.mutation<CreateRequestResponse, CreateRequestRequest>({
      query: (data) => ({
        url: '/requests/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['MyRequests'],
    }),

    autoSaveRequest: builder.mutation<Request, { id: number; data: AutoSaveRequest }>({
      query: ({ id, data }) => ({
        url: `/requests/${id}/save/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Request', id }],
    }),

    submitRequest: builder.mutation<SubmitRequestResponse, number>({
      query: (id) => ({
        url: `/requests/${id}/submit/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Request', id },
        'MyRequests',
      ],
    }),

    getRequestStatus: builder.query<ProcessingStatusResponse, number>({
      query: (id) => `/requests/${id}/status/`,
    }),

    // Dev Approve (for testing - skips reviewer)
    devApproveRequest: builder.mutation<{ status: string; message: string }, number>({
      query: (id) => ({
        url: `/requests/${id}/dev-approve/`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Request', id },
        'MyRequests',
      ],
    }),

    // Submit clarification response
    submitClarification: builder.mutation<
      { status: string; message: string },
      { id: number; response: string }
    >({
      query: ({ id, response }) => ({
        url: `/requests/${id}/clarification/`,
        method: 'POST',
        body: { response },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Request', id },
        'MyRequests',
      ],
    }),

    // Select commissioner for request
    selectCommissioner: builder.mutation<
      Request,
      { id: number; commissioner_id: number }
    >({
      query: ({ id, commissioner_id }) => ({
        url: `/requests/${id}/select-commissioner/`,
        method: 'PATCH',
        body: { commissioner_id },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Request', id },
        'MyRequests',
      ],
    }),

    // Delete a request
    deleteRequest: builder.mutation<
      { success: boolean; message: string },
      number
    >({
      query: (id) => ({
        url: `/requests/${id}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MyRequests'],
    }),
  }),
});

export const {
  // Public Commissioners
  useGetPublicCommissionersQuery,
  // Affidavit Types
  useGetAffidavitTypesQuery,
  useGetAffidavitTypeQuery,
  useLazyGetAffidavitTypeQuery,
  // Decision Tree
  useGetDecisionTreeRootQuery,
  useGetDecisionTreeNodeQuery,
  useLazyGetDecisionTreeNodeQuery,
  useTraverseTreeMutation,
  // Requests
  useGetMyRequestsQuery,
  useGetRequestQuery,
  useLazyGetRequestQuery,
  useCreateRequestMutation,
  useAutoSaveRequestMutation,
  useSubmitRequestMutation,
  useGetRequestStatusQuery,
  useDevApproveRequestMutation,
  useSubmitClarificationMutation,
  useSelectCommissionerMutation,
  useDeleteRequestMutation,
} = userApi;

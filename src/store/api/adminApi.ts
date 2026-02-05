// Admin API - RTK Query endpoints for admin operations
import { baseApi } from './baseApi';
import type {
  DashboardMetrics,
  TypeMetrics,
  CostDashboard,
  WeeklyLearningReport,
  LearningSuggestion,
  FrictionReport,
  PaginatedResponse,
} from '@/types';

// Response types
export interface ConfidenceDashboard {
  types: TypeMetrics[];
  summary: {
    total_types: number;
    learning_count: number;
    controlled_count: number;
    confident_count: number;
  };
}

export interface AdminDashboard {
  metrics: DashboardMetrics;
  type_metrics: TypeMetrics[];
  recent_activity: {
    id: number;
    type: string;
    message: string;
    timestamp: string;
  }[];
}

export interface LearningExport {
  generated_at: string;
  types: {
    id: number;
    name: string;
    confidence_status: string;
    volume: number;
    approval_rate: number;
    qa_pass_rate: number;
  }[];
}

export interface FrictionDashboard {
  reports: FrictionReport[];
  summary: {
    total: number;
    resolved: number;
    pending: number;
    by_category: Record<string, number>;
  };
}

// Staff types
export interface Commissioner {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  commission_number: string | null;
  commission_expiry: string | null;
  payout_rate: string;
  pdf_preferences: Record<string, unknown>;
  profile_image: string | null;
  profile_image_url: string | null;
  bio: string;
  organization: string | null;
  address: string | null;
  is_featured: boolean;
  availability: Record<string, unknown>;
  // Bank/Payment details
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  payment_preference: string | null;
}

export interface CommissionerPaymentSummary extends Commissioner {
  amount_to_pay: string;
  unpaid_stamps_count: number;
  total_earned: string;
  total_paid: string;
}

export interface PaymentLog {
  id: number;
  commissioner: number;
  commissioner_name: string;
  amount_paid: string;
  stamps_count: number;
  paid_by: number | null;
  paid_by_name: string | null;
  payment_reference: string;
  payment_method: string;
  notes: string;
  paid_at: string;
}

export interface MarkAsPaidRequest {
  payment_reference?: string;
  payment_method?: string;
  notes?: string;
}

export interface MarkAsPaidResponse {
  detail: string;
  payment_log: PaymentLog;
  total_amount: string;
  stamps_count: number;
}

export interface SiteSettings {
  id: number;
  default_payout_amount: string;
  created_at: string;
  updated_at: string;
}

export interface Reviewer {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  date_joined: string;
}

export interface CreateStaffRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'commissioner' | 'reviewer';
  profile_image?: File;
  bio?: string;
  organization?: string;
  // Commissioner-specific
  commission_number?: string;
  commission_expiry?: string;
  payout_rate?: number;
  is_featured?: boolean;
}

export interface UpdateStaffRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  password?: string;
  profile_image?: File;
  bio?: string;
  organization?: string;
  is_active?: boolean;
  // Commissioner-specific
  commission_number?: string;
  commission_expiry?: string;
  payout_rate?: number;
  is_featured?: boolean;
}

// Type Requests (Admin viewing generated affidavits)
export interface ReviewerRejection {
  reason: string;
  reviewer: string;
  timestamp: string;
}

export interface FrictionReportItem {
  id: number;
  reason: string;
  commissioner: string;
  created_at: string;
  is_resolved: boolean;
  resolution_notes: string;
}

export interface TypeRequestItem {
  id: number;
  request_code: string;
  user: { id: number; username: string; email: string; first_name: string; last_name: string };
  affidavit_type: { id: number; name: string; tier: string };
  commissioner?: { id: number; username: string; first_name: string; last_name: string } | null;
  status: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  completed_at: string | null;
  is_paid: boolean;
  draft_text: string;
  final_text: string;
  reviewer_rejection: ReviewerRejection | null;
  friction_reports: FrictionReportItem[];
}

export interface TypeRequestsParams {
  typeId: number;
  status?: string;
  page?: number;
  search?: string;
}

// Affidavit Type Admin types
export interface AffidavitTypeAdmin {
  id: number;
  name: string;
  description: string;
  tier: 'low' | 'medium' | 'high_precision' | 'sensitive';
  default_mode: 'instant' | 'review_first' | 'intake_only';
  confidence_status: 'learning' | 'controlled' | 'confident';
  enabled_on_homepage: boolean;
  is_active: boolean;
  policy_version: number;
  prompt_pack_version: number;
  template_version: number;
  min_volume_threshold: number;
  intake_schema: IntakeQuestion[];
  scenario_library: ScenarioPattern[];
  policy_json: Record<string, unknown>;
  template_html: string;
  disallowed_phrases: string[];
  questions_count: number;
  created_at: string;
  updated_at: string;
}

export interface IntakeQuestion {
  id: string;
  field_name?: string; // Used for template placeholders, defaults to id if not set
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'number' | 'email' | 'phone';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  show_if?: {
    field: string;
    value: string | string[];
  };
  help_text?: string;
}

export interface ScenarioPattern {
  tag: string;
  label: string;
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'in' | 'gt' | 'lt';
    value: string | string[] | number;
  }[];
  guidance?: string;
}

export interface CreateAffidavitTypeRequest {
  name: string;
  description: string;
  tier: 'low' | 'medium' | 'high_precision' | 'sensitive';
  default_mode: 'instant' | 'review_first' | 'intake_only';
  enabled_on_homepage?: boolean;
  is_active?: boolean;
  intake_schema?: IntakeQuestion[];
  policy_json?: Record<string, unknown>;
  scenario_library?: ScenarioPattern[];
}

export interface UpdateAffidavitTypeRequest {
  name?: string;
  description?: string;
  tier?: 'low' | 'medium' | 'high_precision' | 'sensitive';
  default_mode?: 'instant' | 'review_first' | 'intake_only';
  enabled_on_homepage?: boolean;
  is_active?: boolean;
  intake_schema?: IntakeQuestion[];
  policy_json?: Record<string, unknown>;
  scenario_library?: ScenarioPattern[];
  template_html?: string;
  disallowed_phrases?: string[];
}

// Document upload types
export interface TemplateDocument {
  filename: string;
  file_type: string;
  uploaded_at: string;
  content_length: number;
}

export interface DocumentUploadResult {
  success: boolean;
  filename: string;
  html_content?: string;
  file_type?: string;
  parsed_at?: string;
  error?: string | Record<string, unknown>;
}

export interface DocumentUploadResponse {
  message: string;
  results: DocumentUploadResult[];
  total_documents: number;
}

export interface DocumentListResponse {
  affidavit_type_id: number;
  affidavit_type_name: string;
  documents: TemplateDocument[];
  total: number;
}

// Policy generation types
export interface PolicyGenerationRequest {
  additional_context?: string;
  auto_save?: boolean;
}

export interface DetectedField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    input_mode?: string;
    min_length?: number;
    max_length?: number;
    min?: number;
    max?: number;
    max_date?: string;
    min_date?: string;
    date_constraint?: string;
    message?: string;
    check_future_date?: boolean;
    max_year_current?: boolean;
  };
  show_if?: {
    field: string;
    value: string | string[];
  };
}

export interface PolicyGenerationResult {
  success: boolean;
  template_html: string;
  detected_fields: DetectedField[];
  disallowed_phrases: string[];
  required_sections: string[];
  validation_rules: Record<string, unknown>[];
  analysis_notes: string;
  scenario_mapping?: Record<string, string>; // Maps scenario keys to descriptions
  identified_scenarios?: string[]; // List of detected scenarios
  saved?: boolean;
  error?: string;
  save_error?: string;
  validation_details?: string | Record<string, unknown>;
}

export interface PolicyGenerationTaskResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface PolicyTaskStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: PolicyGenerationResult;
  error?: string;
  message?: string;
}

// Disallowed phrases types
export interface DisallowedPhrasesResponse {
  current_phrases: string[];
  suggestions: string[];
}

// AI Base Instruction types
export interface AIBaseInstruction {
  id: number;
  instruction_text: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: number | null;
  updated_by_name: string | null;
}

// Request types
export interface PolicyUpdateRequest {
  affidavit_type_id: number;
  policy_json: Record<string, unknown>;
}

export interface PromoteTypeRequest {
  affidavit_type_id: number;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get full dashboard with metrics
    getAdminDashboard: builder.query<AdminDashboard, void>({
      query: () => '/admin/dashboard/',
      providesTags: ['AdminDashboard'],
    }),

    // Get confidence dashboard
    getConfidenceDashboard: builder.query<ConfidenceDashboard, void>({
      query: () => '/admin/confidence/',
      providesTags: ['ConfidenceDashboard'],
    }),

    // Get cost analytics
    getCosts: builder.query<CostDashboard, { startDate?: string; endDate?: string } | void>({
      query: (params) => {
        const queryParams: string[] = [];
        if (params?.startDate) queryParams.push(`start_date=${params.startDate}`);
        if (params?.endDate) queryParams.push(`end_date=${params.endDate}`);
        return `/admin/costs/${queryParams.length ? `?${queryParams.join('&')}` : ''}`;
      },
      providesTags: ['Costs'],
    }),

    // Get type trends
    getTypeTrends: builder.query<TypeMetrics[], number | void>({
      query: (typeId) =>
        `/admin/type-trends/${typeId ? `?type_id=${typeId}` : ''}`,
      providesTags: ['TypeTrends'],
    }),

    // Get learning data export
    getLearningExport: builder.query<LearningExport, void>({
      query: () => '/admin/learning/export/',
      providesTags: ['Learning'],
    }),

    // Get weekly learning report
    getWeeklyReport: builder.query<WeeklyLearningReport, void>({
      query: () => '/admin/learning/weekly-report/',
      providesTags: ['Learning'],
    }),

    // Get AI improvement suggestions
    getSuggestions: builder.query<LearningSuggestion[], void>({
      query: () => '/admin/suggestions/',
      providesTags: ['Suggestions'],
    }),

    // Get friction reports dashboard
    getFrictionDashboard: builder.query<FrictionDashboard, void>({
      query: () => '/admin/friction/',
      providesTags: ['Friction'],
    }),

    // Update policy JSON
    updatePolicy: builder.mutation<{ success: boolean }, PolicyUpdateRequest>({
      query: ({ affidavit_type_id, policy_json }) => ({
        url: `/admin/affidavit-types/${affidavit_type_id}/policy/`,
        method: 'PUT',
        body: { policy_json },
      }),
      invalidatesTags: ['ConfidenceDashboard', 'AffidavitType'],
    }),

    // Promote type to instant mode
    promoteType: builder.mutation<{ success: boolean }, PromoteTypeRequest>({
      query: ({ affidavit_type_id }) => ({
        url: `/admin/affidavit-types/${affidavit_type_id}/promote/`,
        method: 'POST',
      }),
      invalidatesTags: ['ConfidenceDashboard', 'AdminDashboard', 'AffidavitType'],
    }),

    // =========================================================================
    // Affidavit Type CRUD
    // =========================================================================

    // Get all affidavit types (admin view with full details)
    getAdminAffidavitTypes: builder.query<AffidavitTypeAdmin[], void>({
      query: () => '/admin/types/',
      transformResponse: (response: AffidavitTypeAdmin[] | { results: AffidavitTypeAdmin[] }) => {
        // Handle both array response and paginated response
        if (Array.isArray(response)) {
          return response;
        }
        return response.results || [];
      },
      providesTags: ['AffidavitType'],
    }),

    // Get single affidavit type (admin view)
    getAdminAffidavitType: builder.query<AffidavitTypeAdmin, number>({
      query: (id) => `/admin/types/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'AffidavitType', id }],
    }),

    // Create affidavit type
    createAffidavitType: builder.mutation<AffidavitTypeAdmin, CreateAffidavitTypeRequest>({
      query: (data) => ({
        url: '/admin/types/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AffidavitType'],
    }),

    // Update affidavit type
    updateAffidavitType: builder.mutation<AffidavitTypeAdmin, { id: number; data: UpdateAffidavitTypeRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/types/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AffidavitType', id },
        'AffidavitType',
      ],
    }),

    // Delete affidavit type
    deleteAffidavitType: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/types/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AffidavitType'],
    }),

    // Duplicate affidavit type
    duplicateAffidavitType: builder.mutation<AffidavitTypeAdmin, number>({
      query: (id) => ({
        url: `/admin/types/${id}/duplicate/`,
        method: 'POST',
      }),
      invalidatesTags: ['AffidavitType'],
    }),

    // Get all requests for an affidavit type (admin view)
    getTypeRequests: builder.query<PaginatedResponse<TypeRequestItem>, TypeRequestsParams>({
      query: ({ typeId, status, page, search }) => {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.append('status', status);
        if (page) params.append('page', page.toString());
        if (search) params.append('search', search);
        return `/admin/types/${typeId}/requests/?${params.toString()}`;
      },
      providesTags: (_result, _error, { typeId }) => [
        { type: 'TypeRequests', id: typeId },
        'TypeRequests',
      ],
    }),

    // =========================================================================
    // Document Upload & Policy Generation
    // =========================================================================

    // Upload template documents
    uploadTemplateDocuments: builder.mutation<DocumentUploadResponse, { id: number; files: FormData }>({
      query: ({ id, files }) => ({
        url: `/admin/types/${id}/upload-documents/`,
        method: 'POST',
        body: files,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AffidavitType', id }],
    }),

    // Get uploaded documents list
    getTemplateDocuments: builder.query<DocumentListResponse, number>({
      query: (id) => `/admin/types/${id}/documents/`,
      providesTags: (_result, _error, id) => [{ type: 'AffidavitType', id }],
    }),

    // Delete a template document
    deleteTemplateDocument: builder.mutation<{ message: string; remaining_documents: number }, { id: number; filename: string }>({
      query: ({ id, filename }) => ({
        url: `/admin/types/${id}/documents/`,
        method: 'DELETE',
        body: { filename },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AffidavitType', id }],
    }),

    // Generate policy from uploaded documents using AI (async)
    generatePolicy: builder.mutation<PolicyGenerationTaskResponse, { id: number; data: PolicyGenerationRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/types/${id}/generate-policy/`,
        method: 'POST',
        body: data,
      }),
    }),

    // Poll for policy generation task status
    getPolicyTaskStatus: builder.query<PolicyTaskStatusResponse, { taskId: string; affidavitTypeId?: number; autoSave?: boolean }>({
      query: ({ taskId, affidavitTypeId, autoSave }) => {
        const params = new URLSearchParams();
        if (affidavitTypeId) params.append('affidavit_type_id', affidavitTypeId.toString());
        if (autoSave) params.append('auto_save', 'true');
        return `/admin/policy-task/${taskId}/?${params.toString()}`;
      },
      // Don't cache this query - always fetch fresh
      keepUnusedDataFor: 0,
      // Invalidate type when task completes successfully
      async onQueryStarted({ affidavitTypeId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.status === 'completed' && affidavitTypeId) {
            dispatch(adminApi.util.invalidateTags([{ type: 'AffidavitType', id: affidavitTypeId }]));
          }
        } catch {}
      },
    }),

    // Get disallowed phrases with suggestions
    getDisallowedPhrases: builder.query<DisallowedPhrasesResponse, number>({
      query: (id) => `/admin/types/${id}/disallowed-phrases/`,
      providesTags: (_result, _error, id) => [{ type: 'AffidavitType', id }],
    }),

    // Update disallowed phrases
    updateDisallowedPhrases: builder.mutation<{ message: string; phrases: string[] }, { id: number; phrases: string[] }>({
      query: ({ id, phrases }) => ({
        url: `/admin/types/${id}/disallowed-phrases/`,
        method: 'PUT',
        body: { phrases },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AffidavitType', id }],
    }),

    // Add phrases to disallowed list
    addDisallowedPhrases: builder.mutation<{ message: string; phrases: string[] }, { id: number; phrases: string[] }>({
      query: ({ id, phrases }) => ({
        url: `/admin/types/${id}/disallowed-phrases/`,
        method: 'POST',
        body: { phrases },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'AffidavitType', id }],
    }),

    // =========================================================================
    // AI Base Instruction
    // =========================================================================

    // Get current AI base instruction
    getAIBaseInstruction: builder.query<AIBaseInstruction, void>({
      query: () => '/admin/ai-instruction/',
      providesTags: ['AIInstruction'],
    }),

    // Update AI base instruction
    updateAIBaseInstruction: builder.mutation<AIBaseInstruction, { instruction_text: string; version?: string }>({
      query: (data) => ({
        url: '/admin/ai-instruction/',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AIInstruction'],
    }),

    // Create new version of AI base instruction
    createAIBaseInstructionVersion: builder.mutation<AIBaseInstruction, { instruction_text: string }>({
      query: (data) => ({
        url: '/admin/ai-instruction/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AIInstruction'],
    }),

    // =========================================================================
    // Staff Management - Commissioners
    // =========================================================================

    // Get all commissioners
    getCommissioners: builder.query<PaginatedResponse<Commissioner>, { page?: number; search?: string } | void>({
      query: (params) => {
        const queryParams: string[] = [];
        if (params?.page) queryParams.push(`page=${params.page}`);
        if (params?.search) queryParams.push(`search=${params.search}`);
        return `/admin/commissioners/${queryParams.length ? `?${queryParams.join('&')}` : ''}`;
      },
      providesTags: ['Commissioner'],
    }),

    // Get single commissioner
    getCommissioner: builder.query<Commissioner, number>({
      query: (id) => `/admin/commissioners/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Commissioner', id }],
    }),

    // Create commissioner
    createCommissioner: builder.mutation<Commissioner, FormData>({
      query: (formData) => ({
        url: '/admin/commissioners/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Commissioner'],
    }),

    // Update commissioner
    updateCommissioner: builder.mutation<Commissioner, { id: number; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/admin/commissioners/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Commissioner', id },
        'Commissioner',
      ],
    }),

    // Delete commissioner
    deleteCommissioner: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/commissioners/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Commissioner'],
    }),

    // Get commissioner payment summary
    getCommissionerPaymentSummary: builder.query<CommissionerPaymentSummary, number>({
      query: (id) => `/admin/commissioners/${id}/payment-summary/`,
      providesTags: (_result, _error, id) => [{ type: 'Commissioner', id }, 'PaymentLogs'],
    }),

    // Get commissioner payment history
    getCommissionerPaymentHistory: builder.query<PaginatedResponse<PaymentLog>, number>({
      query: (id) => `/admin/commissioners/${id}/payment-history/`,
      providesTags: ['PaymentLogs'],
    }),

    // Mark commissioner as paid
    markCommissionerPaid: builder.mutation<MarkAsPaidResponse, { id: number; data: MarkAsPaidRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/commissioners/${id}/mark-paid/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Commissioner', id },
        'Commissioner',
        'PaymentLogs',
      ],
    }),

    // Get all payment logs
    getAllPaymentLogs: builder.query<PaginatedResponse<PaymentLog>, { page?: number; search?: string } | void>({
      query: (params) => {
        const queryParams: string[] = [];
        if (params?.page) queryParams.push(`page=${params.page}`);
        if (params?.search) queryParams.push(`search=${params.search}`);
        return `/admin/payment-logs/${queryParams.length ? `?${queryParams.join('&')}` : ''}`;
      },
      providesTags: ['PaymentLogs'],
    }),

    // =========================================================================
    // Staff Management - Reviewers
    // =========================================================================

    // Get all reviewers
    getReviewers: builder.query<PaginatedResponse<Reviewer>, { page?: number; search?: string } | void>({
      query: (params) => {
        const queryParams: string[] = [];
        if (params?.page) queryParams.push(`page=${params.page}`);
        if (params?.search) queryParams.push(`search=${params.search}`);
        return `/admin/reviewers/${queryParams.length ? `?${queryParams.join('&')}` : ''}`;
      },
      providesTags: ['Reviewer'],
    }),

    // Get single reviewer
    getReviewer: builder.query<Reviewer, number>({
      query: (id) => `/admin/reviewers/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Reviewer', id }],
    }),

    // Create reviewer
    createReviewer: builder.mutation<Reviewer, FormData>({
      query: (formData) => ({
        url: '/admin/reviewers/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Reviewer'],
    }),

    // Update reviewer
    updateReviewer: builder.mutation<Reviewer, { id: number; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/admin/reviewers/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Reviewer', id },
        'Reviewer',
      ],
    }),

    // Delete reviewer
    deleteReviewer: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/reviewers/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reviewer'],
    }),

    // =========================================================================
    // Decision Tree Management
    // =========================================================================

    // Get all decision tree nodes (admin)
    getAdminDecisionTreeNodes: builder.query<
      import('@/types').AdminDecisionTreeNode[],
      { parent?: string; is_active?: boolean } | void
    >({
      query: (params) => {
        const queryParams: string[] = [];
        if (params?.parent) queryParams.push(`parent=${params.parent}`);
        if (params?.is_active !== undefined) queryParams.push(`is_active=${params.is_active}`);
        return `/admin/decision-tree/${queryParams.length ? `?${queryParams.join('&')}` : ''}`;
      },
      transformResponse: (response: import('@/types').AdminDecisionTreeNode[] | { results: import('@/types').AdminDecisionTreeNode[] }) => {
        // Handle both array response and paginated response
        if (Array.isArray(response)) {
          return response;
        }
        return response.results || [];
      },
      providesTags: ['DecisionTree'],
    }),

    // Get decision tree node by ID (admin)
    getAdminDecisionTreeNode: builder.query<import('@/types').AdminDecisionTreeNode, number>({
      query: (id) => `/admin/decision-tree/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'DecisionTree', id }],
    }),

    // Get question nodes (for parent selection dropdown)
    getAdminDecisionTreeQuestions: builder.query<import('@/types').AdminDecisionTreeNode[], void>({
      query: () => '/admin/decision-tree/questions/',
      providesTags: ['DecisionTree'],
    }),

    // Create decision tree node
    createAdminDecisionTreeNode: builder.mutation<
      import('@/types').AdminDecisionTreeNode,
      import('@/types').AdminDecisionTreeNodeCreate
    >({
      query: (data) => ({
        url: '/admin/decision-tree/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DecisionTree', 'AffidavitType'],
    }),

    // Update decision tree node
    updateAdminDecisionTreeNode: builder.mutation<
      import('@/types').AdminDecisionTreeNode,
      { id: number; data: Partial<import('@/types').AdminDecisionTreeNodeCreate> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/decision-tree/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DecisionTree', id },
        'DecisionTree',
        'AffidavitType',
      ],
    }),

    // Delete decision tree node
    deleteAdminDecisionTreeNode: builder.mutation<void, number>({
      query: (id) => ({
        url: `/admin/decision-tree/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DecisionTree', 'AffidavitType'],
    }),

    // Get decision tree paths for a specific affidavit type
    getAffidavitTypeDecisionPaths: builder.query<
      import('@/types').AffidavitTypeDecisionPaths,
      number
    >({
      query: (affidavitTypeId) => `/admin/types/${affidavitTypeId}/decision-nodes/`,
      providesTags: (_result, _error, id) => [
        { type: 'DecisionTree', id: `type-${id}` },
        'DecisionTree',
      ],
    }),

    // Create decision tree node for a specific affidavit type
    createDecisionNodeForType: builder.mutation<
      import('@/types').AdminDecisionTreeNode,
      { affidavitTypeId: number; data: Omit<import('@/types').AdminDecisionTreeNodeCreate, 'result_affidavit_type'> }
    >({
      query: ({ affidavitTypeId, data }) => ({
        url: `/admin/types/${affidavitTypeId}/decision-nodes/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { affidavitTypeId }) => [
        { type: 'DecisionTree', id: `type-${affidavitTypeId}` },
        'DecisionTree',
        'AffidavitType',
      ],
    }),

    // =========================================================================
    // Site Settings
    // =========================================================================
    
    // Get site settings
    getSiteSettings: builder.query<SiteSettings, void>({
      query: () => '/admin/settings/',
      providesTags: ['SiteSettings'],
    }),

    // Update site settings
    updateSiteSettings: builder.mutation<
      { success: boolean; message: string; settings: SiteSettings },
      Partial<SiteSettings>
    >({
      query: (data) => ({
        url: '/admin/settings/',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['SiteSettings'],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetConfidenceDashboardQuery,
  useGetCostsQuery,
  useGetTypeTrendsQuery,
  useGetLearningExportQuery,
  useGetWeeklyReportQuery,
  useGetSuggestionsQuery,
  useGetFrictionDashboardQuery,
  useUpdatePolicyMutation,
  usePromoteTypeMutation,
  // Affidavit Types CRUD
  useGetAdminAffidavitTypesQuery,
  useGetAdminAffidavitTypeQuery,
  useCreateAffidavitTypeMutation,
  useUpdateAffidavitTypeMutation,
  useDeleteAffidavitTypeMutation,
  useDuplicateAffidavitTypeMutation,
  // Type Requests (viewing generated affidavits)
  useGetTypeRequestsQuery,
  // Document Upload & Policy Generation
  useUploadTemplateDocumentsMutation,
  useGetTemplateDocumentsQuery,
  useDeleteTemplateDocumentMutation,
  useGeneratePolicyMutation,
  useGetPolicyTaskStatusQuery,
  useGetDisallowedPhrasesQuery,
  useUpdateDisallowedPhrasesMutation,
  useAddDisallowedPhrasesMutation,
  // AI Base Instruction
  useGetAIBaseInstructionQuery,
  useUpdateAIBaseInstructionMutation,
  useCreateAIBaseInstructionVersionMutation,
  // Commissioners
  useGetCommissionersQuery,
  useGetCommissionerQuery,
  useCreateCommissionerMutation,
  useUpdateCommissionerMutation,
  useDeleteCommissionerMutation,
  // Commissioner Payments
  useGetCommissionerPaymentSummaryQuery,
  useGetCommissionerPaymentHistoryQuery,
  useMarkCommissionerPaidMutation,
  useGetAllPaymentLogsQuery,
  // Reviewers
  useGetReviewersQuery,
  useGetReviewerQuery,
  useCreateReviewerMutation,
  useUpdateReviewerMutation,
  useDeleteReviewerMutation,
  // Decision Tree (Admin)
  useGetAdminDecisionTreeNodesQuery,
  useGetAdminDecisionTreeNodeQuery,
  useGetAdminDecisionTreeQuestionsQuery,
  useCreateAdminDecisionTreeNodeMutation,
  useUpdateAdminDecisionTreeNodeMutation,
  useDeleteAdminDecisionTreeNodeMutation,
  useGetAffidavitTypeDecisionPathsQuery,
  useCreateDecisionNodeForTypeMutation,
  // Site Settings
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} = adminApi;


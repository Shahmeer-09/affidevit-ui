// ============================================
// User & Authentication Types
// ============================================

export type UserRole = 'public' | 'commissioner' | 'reviewer' | 'admin';
export type PaymentPreference = 'bank_transfer' | 'cheque' | 'cash';

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;
}

export interface AvailabilitySchedule {
  recurring?: {
    monday?: TimeSlot[];
    tuesday?: TimeSlot[];
    wednesday?: TimeSlot[];
    thursday?: TimeSlot[];
    friday?: TimeSlot[];
    saturday?: TimeSlot[];
    sunday?: TimeSlot[];
  };
  specific_dates?: {
    date: string; // YYYY-MM-DD format
    available: boolean;
    slots?: TimeSlot[];
  }[];
  timezone?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  commission_number?: string;
  commission_expiry?: string;
  pdf_preferences?: PDFPreferences;
  is_superuser?: boolean;
  created_at: string;
  // Commissioner-specific fields
  organization?: string;
  bio?: string;
  address?: string;
  profile_image?: string;
  profile_image_url?: string;
  availability?: AvailabilitySchedule;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  payment_preference?: PaymentPreference;
  // Appointment preferences
  auto_accept_appointments?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  phone_number?: string;
}

export interface CommissionerRegisterData extends RegisterData {
  profile_image?: File;
  bio?: string;
  organization?: string;
  address?: string;
  commission_number?: string;
  commission_expiry?: string;
  availability?: AvailabilitySchedule;
  bank_name?: string;
  bank_branch?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  payment_preference?: PaymentPreference;
}

// ============================================
// Affidavit Types
// ============================================

export type AffidavitTier = 'low' | 'medium' | 'high_precision' | 'sensitive';
export type DefaultMode = 'instant' | 'review_first' | 'intake_only';
export type ConfidenceStatus = 'learning' | 'controlled' | 'confident';

export interface IntakeQuestion {
  id: string;
  field_name?: string; // Added field_name
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'number' | 'email' | 'phone'; // Added email and phone
  label: string;
  help_text?: string; // Added help_text
  placeholder?: string;
  required: boolean;
  type_locked?: boolean; // Added to prevent frontend type overrides
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
    pattern?: string;
    message?: string;
    input_mode?: 'text' | 'text_only' | 'numeric' | 'tel' | 'email';
    max_date?: string; // 'today' or ISO date
    min_date?: string; // 'today' or ISO date
    date_constraint?: 'past_only' | 'past_or_today' | 'future_only';
    check_future_date?: boolean; // Flag to check if month/year/day combo is in future
    max_year_current?: boolean; // Flag to limit year to current year max
  };
  conditional?: {
    field: string;
    value: string | string[];
  };
  show_if?: { // Added show_if to match conditional usage in code
    field: string;
    value: string | string[];
  };
  computed_fields?: string[]; // e.g. ['age'] — marks this date field as source for age computation
}

export interface AffidavitType {
  id: number;
  name: string;
  description: string;
  tier: AffidavitTier;
  default_mode: DefaultMode;
  confidence_status: ConfidenceStatus;
  enabled_on_homepage: boolean;
  policy_version: number;
  prompt_pack_version: number;
  template_version: number;
  min_volume_threshold: number;
  intake_schema: IntakeQuestion[];
  intake_schema_count?: number; // For list view (when intake_schema not included)
  policy_json?: Record<string, unknown>;
  scenario_library?: ScenarioPattern[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// ============================================
// Decision Tree Types
// ============================================

export interface DecisionNode {
  id: number;
  question: string;
  help_text?: string;
  options: DecisionOption[];
  is_root: boolean;
}

export interface DecisionOption {
  id: number;
  label: string;
  next_node_id?: number;
  result_type_id?: number;
  result_type_name?: string;
}

// Admin Decision Tree Types
export interface AdminDecisionTreeNode {
  id: number;
  question_text: string;
  help_text?: string | null;
  answer_value?: string | null;
  parent_node_id?: number | null;
  parent_question?: string | null;
  result_affidavit_type_id?: number | null;
  result_affidavit_type_name?: string | null;
  order: number;
  is_active: boolean;
  is_leaf: boolean;
  children_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminDecisionTreeNodeCreate {
  question_text: string;
  help_text?: string;
  answer_value?: string;
  parent_node?: number | null;
  result_affidavit_type?: number | null;
  order?: number;
  is_active?: boolean;
}

export interface DecisionTreePath {
  node_id: number;
  answer_label: string;
  help_text?: string | null;
  order: number;
  path: {
    id: number;
    question_text: string;
    answer_value?: string | null;
    is_root: boolean;
  }[];
}

export interface AffidavitTypeDecisionPaths {
  affidavit_type_id: number;
  affidavit_type_name: string;
  paths: DecisionTreePath[];
}

// ============================================
// Request Types
// ============================================

export type RequestStatus = 
  | 'draft'
  | 'submitted'
  | 'draft_ready'
  | 'needs_clarification'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'completed';

export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled_by_commissioner' | 'cancelled_by_user';

export interface AppointmentSlot {
  id: number;
  commissioner: number;
  start_time: string;
  is_booked: boolean;
  appointment_status?: AppointmentStatus;
  decision_at?: string;
  decision_reason?: string;
}

export interface Request {
  id: number;
  request_code: string;
  user: User;
  affidavit_type: AffidavitType;
  status: RequestStatus;
  commissioner?: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    profile_image_url?: string;
  };
  appointment_slot?: AppointmentSlot;
  answers_json: Record<string, unknown>;
  draft_text?: string;
  draft_json?: Record<string, unknown>;
  final_text?: string;
  clarification_question?: string;
  qa_passed?: boolean;
  qa_issues?: string;
  qa_flags_json?: QAFlag[];
  scenario_tags?: string[];
  new_scenario_flag?: boolean;
  qa_overridden?: boolean;
  draft_edited_significantly?: boolean;
  override_notes?: string;
  policy_version_used?: number;
  prompt_version_used?: number;
  template_version_used?: number;
  user_edits_json?: Record<string, unknown>;
  time_to_complete_seconds?: number;
  pdf_url?: string;
  pdf_file?: string;
  locked_by?: User;
  locked_at?: string;
  is_locked?: boolean;
  lock_holder_name?: string;
  is_paid?: boolean;
  user_paid_at?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
  completed_at?: string;
  appointment_date?: string;
}

export interface QAFlag {
  type?: string;
  field?: string;
  issue?: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
  suggestion?: string;
  location?: string;
  overridden?: boolean;
  overridden_by?: string;
  override_reason?: string;
  ai_correct?: boolean; // true = AI was right, false = AI was wrong (false positive)
}

export interface RequestEvent {
  id: number;
  request_id: number;
  event_type: string;
  actor?: User;
  details?: Record<string, unknown>;
  created_at: string;
}

// ============================================
// Commissioner Types
// ============================================

export interface Stamp {
  id: number;
  request: number;
  request_code: string;
  commissioner: number;
  commissioner_name: string;
  payout_amount: string;
  stamped_at: string;
  notes?: string;
}

export interface FrictionReport {
  id: number;
  request: number;
  request_code: string;
  commissioner: number;
  commissioner_name: string;
  reason: string;
  is_resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface PDFPreferences {
  letterhead_enabled?: boolean;
  letterhead_text?: string;
  page_size?: 'letter' | 'a4';
  signature_spacing?: 'compact' | 'standard' | 'generous';
  show_commission_number?: boolean;
  footer_text?: string;
}

// ============================================
// Reviewer Types
// ============================================

export interface ReviewerEdit {
  id: number;
  request: Request;
  reviewer: User;
  original_text: string;
  edited_text: string;
  edit_reason?: string;
  created_at: string;
}

// Matches backend RequestReviewerSerializer output
export interface ReviewQueueItem {
  id: number;
  request_code: string;
  affidavit_type_name: string;
  time_waiting: string; // e.g., "4h", "2d", "30 min"
  risk_flags: string[]; // e.g., ["missing_field", "low_confidence"]
  status: RequestStatus;
  created_at: string;
}

// Stats for reviewer dashboard
export interface ReviewerStats {
  pending_count: number;
  reviewed_today: number;
  approved_today: number;
  rejected_today: number;
  clarification_today: number;
  avg_review_time_minutes: number;
  approval_rate: number;
}

// ============================================
// Admin/Dashboard Types
// ============================================

export interface DashboardMetrics {
  total_requests: number;
  pending_review: number;
  approved_today: number;
  approval_rate: number;
  avg_processing_time: string;
  revenue_today: number;
  revenue_month: number;
}

export interface TypeMetrics {
  affidavit_type_id: number;
  affidavit_type_name: string;
  tier: AffidavitTier;
  total_volume: number;
  approval_rate: number;
  avg_confidence: number;
  qa_pass_rate: number;
  friction_count: number;
  is_eligible_for_promotion: boolean;
}

export interface CostDashboard {
  total_cost: number;
  cost_by_model: Record<string, number>;
  cost_by_type: Record<string, number>;
  daily_costs: { date: string; cost: number }[];
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LearningSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'prompt' | 'training' | 'threshold' | 'schema';
  title: string;
  description: string;
  affected_type?: AffidavitType;
  suggested_action: string;
  potential_impact: string;
}

export interface WeeklyLearningReport {
  period: {
    start: string;
    end: string;
  };
  types: {
    id: number;
    name: string;
    volume: number;
    overrides: number;
    override_rate: number;
    edit_patterns: Record<string, number>;
    new_scenarios_count: number;
  }[];
  top_override_reasons: { reason: string; count: number }[];
  new_scenarios: string[];
  recommendations: {
    type: string;
    affidavit_type: string;
    message: string;
  }[];
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface APIError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

// ============================================
// Ticket System Types
// ============================================

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'legal' | 'other';

export interface TicketAttachment {
  id: number;
  file: string;
  uploaded_at: string;
}

export interface TicketMessage {
  id: number;
  sender: number;
  sender_name: string;
  sender_role: UserRole;
  sender_avatar?: string;
  message: string;
  created_at: string;
  is_internal: boolean;
}

export interface Ticket {
  id: number;
  user: number;
  user_name: string;
  request?: number;
  subject: string;
  description: string;
  category: TicketCategory;
  category_display: string;
  status: TicketStatus;
  status_display: string;
  priority: TicketPriority;
  priority_display: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  request?: number;
  files?: File[];
}

export interface TicketMessagePayload {
  message: string;
  is_internal?: boolean;
}

export interface TicketStatusPayload {
  status?: TicketStatus;
  priority?: TicketPriority;
}

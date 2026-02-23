// =========================================================================
// Reviewer Feedback
// =========================================================================

export interface ReviewerFeedbackLog {
  id: number;
  request: number;
  request_code: string;
  reviewer: number;
  reviewer_name: string;
  category: string;
  feedback_target: 'drafter' | 'policy' | 'both';
  message: string;
  original_snippet: string;
  revised_snippet: string;
  summary?: string | null;
  is_active: boolean;
  times_seen: number;
  created_at: string;
}

export interface ReviewerFeedbackQueryParams {
  page?: number;
  search?: string;
  category?: string;
  request_code?: string;
  start_date?: string;
  end_date?: string;
}

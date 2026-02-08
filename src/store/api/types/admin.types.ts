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
  message: string;
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

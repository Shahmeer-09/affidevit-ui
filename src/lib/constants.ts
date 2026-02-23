// Application Constants

export const APP_NAME = 'Affidavit Express';
export const APP_DESCRIPTION = 'Professional Legal Document Preparation';

// API Configuration (will be used when integrating backend)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Route Paths
export const ROUTES = {
  // Public Routes
  HOME: '/',
  AFFIDAVIT_TYPES: '/affidavit-types',
  AFFIDAVIT_TYPE_DETAIL: '/affidavit-types/:id',
  DECISION_TREE: '/help-me-choose',
  
  // Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  REGISTER_COMMISSIONER: '/register/commissioner',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:uid/:token',
  VERIFY_OTP: '/verify-email',
  VERIFY_OTP: '/verify-otp',
  
  // User Routes (authenticated)
  MY_REQUESTS: '/my-requests',
  REQUEST_CREATE: '/request/new/:typeId',
  REQUEST_STATUS: '/request/:id',
  REQUEST_PAYMENT: '/request/:id/payment',
  REQUEST_THANK_YOU: '/request/:id/thank-you',
  REQUEST_SELECT_COMMISSIONER: '/request/:id/select-commissioner',
  REQUEST_PDF: '/request/:id/pdf',
  PROFILE: '/profile',
  SUPPORT: '/tickets',
  TICKET_DETAIL: '/tickets/:id',
  
  // Commissioner Routes
  COMMISSIONER_DASHBOARD: '/commissioner',
  COMMISSIONER_LOOKUP: '/commissioner/lookup',
  COMMISSIONER_SCHEDULE: '/commissioner/schedule',
  COMMISSIONER_REQUEST: '/commissioner/request/:code',
  COMMISSIONER_STAMPS: '/commissioner/stamps',
  COMMISSIONER_SETTINGS: '/commissioner/settings',
  
  // Reviewer Routes
  REVIEWER_DASHBOARD: '/reviewer',
  REVIEWER_QUEUE: '/reviewer/queue',
  REVIEWER_DETAIL: '/reviewer/request/:id',
  
  // Admin Routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_TYPES: '/admin/affidavit-types',
  ADMIN_TYPE_EDIT: '/admin/affidavit-types/:id',
  ADMIN_TYPE_REQUESTS: '/admin/affidavit-types/:id/requests',
  ADMIN_AI_SETTINGS: '/admin/ai-settings',
  ADMIN_DECISION_TREE: '/admin/decision-tree',
  ADMIN_COSTS: '/admin/costs',
  ADMIN_LEARNING: '/admin/learning',
  ADMIN_FRICTION: '/admin/friction',
  ADMIN_REVIEWER_FEEDBACK: '/admin/reviewer-feedback',
  ADMIN_USERS: '/admin/users',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_SUPPORT: '/admin/tickets',
  ADMIN_TICKET_DETAIL: '/admin/tickets/:id',
} as const;

// Status Configuration
export const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'secondary', icon: 'FileEdit' },
  SUBMITTED: { label: 'Submitted', color: 'info', icon: 'Send' },
  PROCESSING: { label: 'Processing', color: 'warning', icon: 'Loader' },
  DRAFT_READY: { label: 'Ready', color: 'success', icon: 'CheckCircle' },
  NEEDS_REVIEW: { label: 'In Review', color: 'warning', icon: 'Eye' },
  NEEDS_CLARIFICATION: { label: 'Clarification Needed', color: 'destructive', icon: 'AlertCircle' },
  APPROVED: { label: 'Approved', color: 'success', icon: 'Check' },
  REJECTED: { label: 'Rejected', color: 'destructive', icon: 'X' },
  COMPLETED: { label: 'Completed', color: 'success', icon: 'CheckCircle2' },
} as const;

// Tier Configuration
export const TIER_CONFIG = {
  low: { label: 'Standard', description: 'Low variability, fastest processing', threshold: 30, color: 'success' },
  medium: { label: 'Moderate', description: 'Medium variability', threshold: 50, color: 'info' },
  high_precision: { label: 'Complex', description: 'High precision required', threshold: 70, color: 'warning' },
  sensitive: { label: 'Sensitive', description: 'High-risk, always reviewed', threshold: 90, color: 'destructive' },
} as const;

// Friction Report Categories
export const FRICTION_CATEGORIES = {
  factual_error: 'Factual Error',
  formatting: 'Formatting Issue',
  legal_issue: 'Legal Issue',
  unclear: 'Unclear Content',
  other: 'Other',
} as const;

// Urgency Levels
export const URGENCY_CONFIG = {
  normal: { label: 'Normal', color: 'secondary' },
  high: { label: 'High', color: 'warning' },
  critical: { label: 'Critical', color: 'destructive' },
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

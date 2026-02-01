import type {
  User,
  AffidavitType,
  Request,
  DecisionNode,
  Stamp,
  FrictionReport,
  ReviewQueueItem,
  DashboardMetrics,
  TypeMetrics,
  CostDashboard,
  LearningSuggestion,
  WeeklyLearningReport,
} from '@/types';

// ============================================
// Mock Users
// ============================================

export const mockUsers: Record<string, User> = {
  public: {
    id: 1,
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'public',
    created_at: '2025-01-15T10:00:00Z',
  },
  commissioner: {
    id: 2,
    email: 'sarah.commissioner@notary.com',
    first_name: 'Sarah',
    last_name: 'Williams',
    role: 'commissioner',
    commission_number: 'NC-2025-12345',
    commission_expiry: '2027-12-31',
    pdf_preferences: {
      letterhead_enabled: true,
      letterhead_text: 'Sarah Williams, Notary Public',
      page_size: 'letter',
      signature_spacing: 'standard',
      show_commission_number: true,
    },
    created_at: '2024-06-01T08:00:00Z',
  },
  reviewer: {
    id: 3,
    email: 'mike.reviewer@affidavitexpress.com',
    first_name: 'Mike',
    last_name: 'Johnson',
    role: 'reviewer',
    created_at: '2024-03-15T09:00:00Z',
  },
  admin: {
    id: 4,
    email: 'admin@affidavitexpress.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
  },
};

// ============================================
// Mock Affidavit Types
// ============================================

export const mockAffidavitTypes: AffidavitType[] = [
  {
    id: 1,
    name: 'General Affidavit',
    description: 'A versatile affidavit for general sworn statements and declarations.',
    tier: 'low',
    default_mode: 'instant',
    confidence_status: 'confident',
    enabled_on_homepage: true,
    policy_version: 3,
    prompt_pack_version: 2,
    template_version: 1,
    min_volume_threshold: 30,
    is_active: true,
    intake_schema: [
      { id: 'affiant_name', type: 'text', label: 'Full Legal Name', required: true, placeholder: 'Enter your full legal name' },
      { id: 'affiant_address', type: 'textarea', label: 'Current Address', required: true, placeholder: 'Street, City, State, ZIP' },
      { id: 'statement_purpose', type: 'select', label: 'Purpose of Affidavit', required: true, options: [
        { value: 'personal', label: 'Personal Matter' },
        { value: 'business', label: 'Business Matter' },
        { value: 'legal', label: 'Legal Proceeding' },
        { value: 'government', label: 'Government Agency' },
      ]},
      { id: 'sworn_statement', type: 'textarea', label: 'Sworn Statement', required: true, placeholder: 'Enter the facts you are swearing to...' },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-01-10T14:30:00Z',
  },
  {
    id: 2,
    name: 'Identity Verification Affidavit',
    description: 'Used to verify identity when official documents are unavailable.',
    tier: 'low',
    default_mode: 'instant',
    confidence_status: 'confident',
    enabled_on_homepage: true,
    policy_version: 2,
    prompt_pack_version: 1,
    template_version: 1,
    min_volume_threshold: 30,
    is_active: true,
    intake_schema: [
      { id: 'subject_name', type: 'text', label: 'Name to Verify', required: true },
      { id: 'relationship', type: 'select', label: 'Your Relationship', required: true, options: [
        { value: 'self', label: 'This is for myself' },
        { value: 'family', label: 'Family Member' },
        { value: 'employer', label: 'Employer/Colleague' },
        { value: 'other', label: 'Other' },
      ]},
      { id: 'known_since', type: 'date', label: 'Known Since', required: true },
      { id: 'reason_needed', type: 'textarea', label: 'Reason Identity Verification Needed', required: true },
    ],
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2025-01-05T11:00:00Z',
  },
  {
    id: 3,
    name: 'Small Estate Affidavit',
    description: 'For claiming assets from a deceased person\'s estate without probate.',
    tier: 'medium',
    default_mode: 'review_first',
    confidence_status: 'controlled',
    enabled_on_homepage: true,
    policy_version: 4,
    prompt_pack_version: 2,
    template_version: 2,
    min_volume_threshold: 50,
    is_active: true,
    intake_schema: [
      { id: 'decedent_name', type: 'text', label: 'Deceased Person\'s Name', required: true },
      { id: 'date_of_death', type: 'date', label: 'Date of Death', required: true },
      { id: 'relationship', type: 'select', label: 'Your Relationship to Deceased', required: true, options: [
        { value: 'spouse', label: 'Spouse' },
        { value: 'child', label: 'Child' },
        { value: 'parent', label: 'Parent' },
        { value: 'sibling', label: 'Sibling' },
        { value: 'other', label: 'Other Heir' },
      ]},
      { id: 'estate_value', type: 'number', label: 'Total Estate Value ($)', required: true, validation: { max: 75000, message: 'Estate must be under $75,000 for small estate affidavit' }},
      { id: 'assets_description', type: 'textarea', label: 'Description of Assets to Claim', required: true },
    ],
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2025-01-18T09:15:00Z',
  },
  {
    id: 4,
    name: 'Heirship Affidavit',
    description: 'Establishes the legal heirs of a deceased person.',
    tier: 'high_precision',
    default_mode: 'review_first',
    confidence_status: 'learning',
    enabled_on_homepage: true,
    policy_version: 5,
    prompt_pack_version: 3,
    template_version: 2,
    min_volume_threshold: 70,
    is_active: true,
    intake_schema: [
      { id: 'decedent_name', type: 'text', label: 'Deceased Person\'s Full Legal Name', required: true },
      { id: 'decedent_ssn_last4', type: 'text', label: 'Last 4 Digits of SSN', required: true, validation: { pattern: '^[0-9]{4}$', message: 'Enter exactly 4 digits' }},
      { id: 'date_of_death', type: 'date', label: 'Date of Death', required: true },
      { id: 'place_of_death', type: 'text', label: 'Place of Death (City, State)', required: true },
      { id: 'marital_status', type: 'select', label: 'Marital Status at Death', required: true, options: [
        { value: 'married', label: 'Married' },
        { value: 'single', label: 'Single/Never Married' },
        { value: 'divorced', label: 'Divorced' },
        { value: 'widowed', label: 'Widowed' },
      ]},
      { id: 'surviving_spouse', type: 'text', label: 'Surviving Spouse Name (if applicable)', required: false },
      { id: 'children_info', type: 'textarea', label: 'List All Children (living and deceased)', required: true, placeholder: 'Name, Date of Birth, Living/Deceased' },
      { id: 'has_will', type: 'radio', label: 'Did Deceased Have a Will?', required: true, options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unknown', label: 'Unknown' },
      ]},
    ],
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2025-01-15T16:45:00Z',
  },
  {
    id: 5,
    name: 'Financial Affidavit',
    description: 'Sworn statement of financial status for legal proceedings.',
    tier: 'sensitive',
    default_mode: 'review_first',
    confidence_status: 'learning',
    enabled_on_homepage: true,
    policy_version: 2,
    prompt_pack_version: 1,
    template_version: 1,
    min_volume_threshold: 90,
    is_active: true,
    intake_schema: [
      { id: 'case_number', type: 'text', label: 'Court Case Number (if applicable)', required: false },
      { id: 'monthly_income', type: 'number', label: 'Monthly Gross Income ($)', required: true },
      { id: 'income_sources', type: 'textarea', label: 'List All Income Sources', required: true },
      { id: 'monthly_expenses', type: 'number', label: 'Monthly Expenses ($)', required: true },
      { id: 'assets_total', type: 'number', label: 'Total Assets Value ($)', required: true },
      { id: 'liabilities_total', type: 'number', label: 'Total Liabilities ($)', required: true },
      { id: 'supporting_docs', type: 'checkbox', label: 'I will provide supporting documentation', required: true },
    ],
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2025-01-12T10:30:00Z',
  },
  {
    id: 6,
    name: 'Name Change Affidavit',
    description: 'Supporting affidavit for legal name change proceedings.',
    tier: 'medium',
    default_mode: 'review_first',
    confidence_status: 'controlled',
    enabled_on_homepage: true,
    policy_version: 1,
    prompt_pack_version: 1,
    template_version: 1,
    min_volume_threshold: 50,
    is_active: true,
    intake_schema: [
      { id: 'current_legal_name', type: 'text', label: 'Current Legal Name', required: true },
      { id: 'proposed_name', type: 'text', label: 'Proposed New Name', required: true },
      { id: 'reason', type: 'select', label: 'Reason for Name Change', required: true, options: [
        { value: 'marriage', label: 'Marriage' },
        { value: 'divorce', label: 'Divorce' },
        { value: 'personal', label: 'Personal Preference' },
        { value: 'religious', label: 'Religious Reasons' },
        { value: 'other', label: 'Other' },
      ]},
      { id: 'reason_details', type: 'textarea', label: 'Explain Your Reason', required: true },
    ],
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2025-01-08T13:20:00Z',
  },
];

// ============================================
// Mock Decision Tree
// ============================================

export const mockDecisionTree: DecisionNode[] = [
  {
    id: 1,
    question: 'What do you need the affidavit for?',
    help_text: 'Select the category that best matches your situation.',
    is_root: true,
    options: [
      { id: 1, label: 'Estate or Inheritance Matter', next_node_id: 2 },
      { id: 2, label: 'Identity Verification', result_type_id: 2, result_type_name: 'Identity Verification Affidavit' },
      { id: 3, label: 'Financial/Legal Proceeding', next_node_id: 3 },
      { id: 4, label: 'Name Change', result_type_id: 6, result_type_name: 'Name Change Affidavit' },
      { id: 5, label: 'General Sworn Statement', result_type_id: 1, result_type_name: 'General Affidavit' },
    ],
  },
  {
    id: 2,
    question: 'What type of estate matter?',
    help_text: 'Different estate situations require different types of affidavits.',
    is_root: false,
    options: [
      { id: 6, label: 'Claiming assets from small estate (under $75,000)', result_type_id: 3, result_type_name: 'Small Estate Affidavit' },
      { id: 7, label: 'Establishing who the legal heirs are', result_type_id: 4, result_type_name: 'Heirship Affidavit' },
      { id: 8, label: 'Other estate matter', result_type_id: 1, result_type_name: 'General Affidavit' },
    ],
  },
  {
    id: 3,
    question: 'What type of legal proceeding?',
    is_root: false,
    options: [
      { id: 9, label: 'Family court (divorce, custody, etc.)', result_type_id: 5, result_type_name: 'Financial Affidavit' },
      { id: 10, label: 'Civil lawsuit', result_type_id: 1, result_type_name: 'General Affidavit' },
      { id: 11, label: 'Business matter', result_type_id: 1, result_type_name: 'General Affidavit' },
    ],
  },
];

// ============================================
// Mock Requests
// ============================================

export const mockRequests: Request[] = [
  {
    id: 1,
    request_code: 'AFF-2025-001234',
    user: mockUsers.public,
    affidavit_type: mockAffidavitTypes[0],
    status: 'completed',
    answers_json: {
      affiant_name: 'John Michael Doe',
      affiant_address: '123 Main Street, Springfield, IL 62701',
      statement_purpose: 'personal',
      sworn_statement: 'I hereby swear that I am the sole owner of the vehicle described...',
    },
    draft_text: 'STATE OF ILLINOIS\nCOUNTY OF SANGAMON\n\nGENERAL AFFIDAVIT\n\nI, John Michael Doe, being duly sworn...',
    final_text: 'STATE OF ILLINOIS\nCOUNTY OF SANGAMON\n\nGENERAL AFFIDAVIT\n\nI, John Michael Doe, being duly sworn...',
    qa_passed: true,
    created_at: '2025-01-18T09:00:00Z',
    updated_at: '2025-01-18T09:30:00Z',
    submitted_at: '2025-01-18T09:15:00Z',
    completed_at: '2025-01-18T09:30:00Z',
  },
  {
    id: 2,
    request_code: 'AFF-2025-001235',
    user: mockUsers.public,
    affidavit_type: mockAffidavitTypes[2],
    status: 'needs_review',
    answers_json: {
      decedent_name: 'Robert James Doe',
      date_of_death: '2024-12-15',
      relationship: 'child',
      estate_value: 45000,
      assets_description: 'Bank account at First National Bank, approximately $45,000',
    },
    draft_text: 'SMALL ESTATE AFFIDAVIT\n\nSTATE OF ILLINOIS...',
    qa_flags_json: [
      { field: 'estate_value', issue: 'Value close to threshold', severity: 'medium', suggestion: 'Verify exact amount' },
    ],
    qa_passed: false,
    created_at: '2025-01-19T14:00:00Z',
    updated_at: '2025-01-19T14:20:00Z',
    submitted_at: '2025-01-19T14:10:00Z',
  },
  {
    id: 3,
    request_code: 'AFF-2025-001236',
    user: mockUsers.public,
    affidavit_type: mockAffidavitTypes[1],
    status: 'draft',
    answers_json: {
      subject_name: 'Jane Doe',
      relationship: 'self',
    },
    created_at: '2025-01-20T11:00:00Z',
    updated_at: '2025-01-20T11:05:00Z',
  },
  {
    id: 4,
    request_code: 'AFF-2025-001237',
    user: mockUsers.public,
    affidavit_type: mockAffidavitTypes[3],
    status: 'approved',
    answers_json: {
      decedent_name: 'Mary Elizabeth Smith',
      decedent_ssn_last4: '5678',
      date_of_death: '2024-11-20',
      place_of_death: 'Chicago, IL',
      marital_status: 'widowed',
      children_info: 'James Smith, DOB 1975-03-15, Living\nSusan Smith, DOB 1978-08-22, Living',
      has_will: 'no',
    },
    draft_text: 'AFFIDAVIT OF HEIRSHIP\n\nSTATE OF ILLINOIS...',
    final_text: 'AFFIDAVIT OF HEIRSHIP\n\nSTATE OF ILLINOIS...',
    qa_passed: true,
    created_at: '2025-01-17T10:00:00Z',
    updated_at: '2025-01-18T15:00:00Z',
    submitted_at: '2025-01-17T10:30:00Z',
  },
];

// ============================================
// Mock Review Queue
// ============================================

export const mockReviewQueue: ReviewQueueItem[] = [
  {
    id: 4,
    request_code: 'AFF-2025-001237',
    affidavit_type_name: 'Name Change Affidavit',
    time_waiting: '4h',
    risk_flags: ['low_confidence'],
    status: 'needs_review',
    created_at: '2025-01-18T14:00:00Z',
  },
  {
    id: 5,
    request_code: 'AFF-2025-001238',
    affidavit_type_name: 'Financial Affidavit',
    time_waiting: '12h',
    risk_flags: [],
    status: 'needs_review',
    created_at: '2025-01-19T08:00:00Z',
  },
  {
    id: 6,
    request_code: 'AFF-2025-001239',
    affidavit_type_name: 'Small Estate Affidavit',
    time_waiting: '2h',
    risk_flags: [],
    status: 'needs_review',
    created_at: '2025-01-20T09:00:00Z',
  },
];

// ============================================
// Mock Stamps (Commissioner)
// ============================================

export const mockStamps: Stamp[] = [
  {
    id: 1,
    request: 1,
    request_code: 'AFF-2025-001234',
    commissioner: 2,
    commissioner_name: 'Sarah Williams',
    stamped_at: '2025-01-18T09:30:00Z',
    payout_amount: '15.00',
    notes: 'Standard notarization',
  },
  {
    id: 2,
    request: 4,
    request_code: 'AFF-2025-001237',
    commissioner: 2,
    commissioner_name: 'Sarah Williams',
    stamped_at: '2025-01-18T15:00:00Z',
    payout_amount: '25.00',
  },
];

// ============================================
// Mock Friction Reports
// ============================================

export const mockFrictionReports: FrictionReport[] = [
  {
    id: 1,
    request: 1,
    request_code: 'AFF-2025-001234',
    commissioner: 2,
    commissioner_name: 'Sarah Williams',
    reason: 'Signature line was too close to the statement text',
    is_resolved: true,
    resolution_notes: 'Updated PDF template spacing',
    resolved_at: '2025-01-19T10:00:00Z',
    created_at: '2025-01-18T10:00:00Z',
  },
  {
    id: 2,
    request: 2,
    request_code: 'AFF-2025-001235',
    commissioner: 2,
    commissioner_name: 'Sarah Williams',
    reason: 'Estate value calculation did not match supporting documents',
    is_resolved: false,
    created_at: '2025-01-19T16:00:00Z',
  },
];

// ============================================
// Mock Dashboard Metrics
// ============================================

export const mockDashboardMetrics: DashboardMetrics = {
  total_requests: 1247,
  pending_review: 23,
  approved_today: 45,
  approval_rate: 94.2,
  avg_processing_time: '12 minutes',
  revenue_today: 2340.50,
  revenue_month: 45670.00,
};

export const mockTypeMetrics: TypeMetrics[] = [
  {
    affidavit_type_id: 1,
    affidavit_type_name: 'General Affidavit',
    tier: 'low',
    total_volume: 523,
    approval_rate: 98.5,
    avg_confidence: 92,
    qa_pass_rate: 96,
    friction_count: 3,
    is_eligible_for_promotion: true,
  },
  {
    affidavit_type_id: 2,
    affidavit_type_name: 'Identity Verification Affidavit',
    tier: 'low',
    total_volume: 312,
    approval_rate: 97.2,
    avg_confidence: 89,
    qa_pass_rate: 94,
    friction_count: 5,
    is_eligible_for_promotion: true,
  },
  {
    affidavit_type_id: 3,
    affidavit_type_name: 'Small Estate Affidavit',
    tier: 'medium',
    total_volume: 187,
    approval_rate: 88.4,
    avg_confidence: 75,
    qa_pass_rate: 82,
    friction_count: 12,
    is_eligible_for_promotion: false,
  },
  {
    affidavit_type_id: 4,
    affidavit_type_name: 'Heirship Affidavit',
    tier: 'high_precision',
    total_volume: 98,
    approval_rate: 82.1,
    avg_confidence: 68,
    qa_pass_rate: 75,
    friction_count: 18,
    is_eligible_for_promotion: false,
  },
  {
    affidavit_type_id: 5,
    affidavit_type_name: 'Financial Affidavit',
    tier: 'sensitive',
    total_volume: 76,
    approval_rate: 79.5,
    avg_confidence: 62,
    qa_pass_rate: 70,
    friction_count: 22,
    is_eligible_for_promotion: false,
  },
];

// ============================================
// Mock Cost Dashboard
// ============================================

export const mockCostDashboard: CostDashboard = {
  total_cost: 847.32,
  cost_by_model: {
    'gpt-4o-mini': 234.56,
    'gpt-4o': 612.76,
  },
  cost_by_type: {
    'General Affidavit': 156.78,
    'Identity Verification': 98.45,
    'Small Estate Affidavit': 187.32,
    'Heirship Affidavit': 234.56,
    'Financial Affidavit': 170.21,
  },
  daily_costs: [
    { date: '2025-01-14', cost: 45.23 },
    { date: '2025-01-15', cost: 52.18 },
    { date: '2025-01-16', cost: 48.90 },
    { date: '2025-01-17', cost: 61.45 },
    { date: '2025-01-18', cost: 55.32 },
    { date: '2025-01-19', cost: 49.87 },
    { date: '2025-01-20', cost: 38.21 },
  ],
  token_usage: {
    prompt_tokens: 2456789,
    completion_tokens: 876543,
    total_tokens: 3333332,
  },
};

// ============================================
// Mock Learning Suggestions
// ============================================

export const mockLearningSuggestions: LearningSuggestion[] = [
  {
    id: '1',
    priority: 'high',
    category: 'prompt',
    title: 'Improve Heirship Affidavit Prompts',
    description: 'Heirship affidavits have 25% rejection rate. Common issue: missing heir verification language.',
    affected_type: mockAffidavitTypes[3],
    suggested_action: 'Add explicit heir verification checklist to system prompt',
    potential_impact: 'Could reduce rejections by 15-20%',
  },
  {
    id: '2',
    priority: 'medium',
    category: 'threshold',
    title: 'Promote Identity Verification to Instant',
    description: 'Type has exceeded volume threshold with 97%+ approval rate for 30 days.',
    affected_type: mockAffidavitTypes[1],
    suggested_action: 'Change default_mode from review to instant',
    potential_impact: 'Reduce reviewer workload by ~15 requests/day',
  },
  {
    id: '3',
    priority: 'medium',
    category: 'schema',
    title: 'Add Validation for Estate Value',
    description: 'Small Estate Affidavits frequently rejected when estate value near $75K threshold.',
    affected_type: mockAffidavitTypes[2],
    suggested_action: 'Add warning when estate_value > $65,000',
    potential_impact: 'Better user guidance, fewer clarification requests',
  },
  {
    id: '4',
    priority: 'low',
    category: 'training',
    title: 'Create Few-Shot Examples for Financial',
    description: 'Financial Affidavits have highest friction rate. Adding examples could help.',
    affected_type: mockAffidavitTypes[4],
    suggested_action: 'Add 5-10 approved examples to policy_json',
    potential_impact: 'Improved draft quality and consistency',
  },
];

// ============================================
// Mock Weekly Learning Report
// ============================================

export const mockWeeklyLearningReport: WeeklyLearningReport = {
  period: {
    start: '2025-01-13T00:00:00Z',
    end: '2025-01-19T23:59:59Z',
  },
  types: [
    {
      id: 1,
      name: 'General Affidavit',
      volume: 145,
      overrides: 3,
      override_rate: 2.1,
      edit_patterns: { 'formatting': 5, 'grammar': 3, 'legal_language': 2 },
      new_scenarios_count: 1,
    },
    {
      id: 3,
      name: 'Small Estate Affidavit',
      volume: 87,
      overrides: 12,
      override_rate: 13.8,
      edit_patterns: { 'value_verification': 8, 'heir_info': 4 },
      new_scenarios_count: 3,
    },
    {
      id: 4,
      name: 'Heirship Affidavit',
      volume: 45,
      overrides: 8,
      override_rate: 17.8,
      edit_patterns: { 'heir_verification': 6, 'legal_language': 3 },
      new_scenarios_count: 2,
    },
  ],
  top_override_reasons: [
    { reason: 'Estate value near threshold - manual verification needed', count: 8 },
    { reason: 'Additional heir discovered', count: 5 },
    { reason: 'State-specific language required', count: 4 },
    { reason: 'Complex family structure', count: 3 },
  ],
  new_scenarios: [
    'blended_family',
    'international_assets',
    'digital_estate',
    'contested_heir',
  ],
  recommendations: [
    {
      type: 'high_override_rate',
      affidavit_type: 'Heirship Affidavit',
      message: 'High override rate (17.8%). Review QA prompts for Heirship Affidavit.',
    },
    {
      type: 'high_override_rate',
      affidavit_type: 'Small Estate Affidavit',
      message: 'High override rate (13.8%). Review QA prompts for Small Estate Affidavit.',
    },
    {
      type: 'new_scenarios',
      affidavit_type: 'Small Estate Affidavit',
      message: 'Multiple new scenarios detected for Small Estate Affidavit. Consider updating scenario library.',
    },
  ],
};

// ============================================
// Helper Functions
// ============================================

export const getRequestById = (id: number): Request | undefined => {
  return mockRequests.find(r => r.id === id);
};

export const getRequestByCode = (code: string): Request | undefined => {
  return mockRequests.find(r => r.request_code === code);
};

export const getAffidavitTypeById = (id: number): AffidavitType | undefined => {
  return mockAffidavitTypes.find(t => t.id === id);
};

export const getUserRequests = (userId: number): Request[] => {
  return mockRequests.filter(r => r.user.id === userId);
};

export const getCommissionerStamps = (commissionerId: number): Stamp[] => {
  return mockStamps.filter(s => s.commissioner === commissionerId);
};

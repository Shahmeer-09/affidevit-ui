import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

// Layouts
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Public Pages
import { LandingPage } from '@/pages/public/LandingPage';
import { AffidavitTypesPage } from '@/pages/public/AffidavitTypesPage';
import { AffidavitTypeDetailPage } from '@/pages/public/AffidavitTypeDetailPage';
import { DecisionTreePage } from '@/pages/public/DecisionTreePage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { CommissionerRegisterPage } from '@/pages/auth/CommissionerRegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyOtpPage } from '@/pages/auth/VerifyOtpPage';

// User Pages
import { MyRequestsPage } from '@/pages/user/MyRequestsPage';
import { RequestCreatePage } from '@/pages/user/RequestCreatePage';
import { RequestStatusPage } from '@/pages/user/RequestStatusPage';
import { SelectCommissionerPage } from '@/pages/user/SelectCommissionerPage';
import { PaymentDetailsPage } from '@/pages/user/PaymentDetailsPage';
import { ThankYouPage } from '@/pages/user/ThankYouPage';
import { ProfilePage } from '@/pages/user/ProfilePage';
import { SupportPage } from '@/pages/user/SupportPage';
import { TicketDetailPage } from '@/pages/user/TicketDetailPage';

// Commissioner Pages
import { CommissionerDashboardPage } from '@/pages/commissioner/CommissionerDashboardPage';
import { CommissionerRequestPage } from '@/pages/commissioner/CommissionerRequestPage';
import { CommissionerStampsPage } from '@/pages/commissioner/CommissionerStampsPage';
import { CommissionerSettingsPage } from '@/pages/commissioner/CommissionerSettingsPage';
import { CommissionerSchedulePage } from '@/pages/commissioner/CommissionerSchedulePage';

// Reviewer Pages
import { ReviewerDashboardPage } from '@/pages/reviewer/ReviewerDashboardPage';
import { ReviewerQueuePage } from '@/pages/reviewer/ReviewerQueuePage';
import { ReviewerDetailPage } from '@/pages/reviewer/ReviewerDetailPage';

// Admin Pages
// import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminTypesPage } from '@/pages/admin/AdminTypesPage';
import { AdminTypeEditPage } from '@/pages/admin/AdminTypeEditPage';
import { AdminTypeRequestsPage } from '@/pages/admin/AdminTypeRequestsPage';
import { AdminAISettingsPage } from '@/pages/admin/AdminAISettingsPage';
import { AdminDecisionTreePage } from '@/pages/admin/AdminDecisionTreePage';
import { AdminCostsPage } from '@/pages/admin/AdminCostsPage';
import { AdminLearningPage } from '@/pages/admin/AdminLearningPage';
import { AdminFrictionPage } from '@/pages/admin/AdminFrictionPage';
import { AdminStaffPage } from '@/pages/admin/AdminStaffPage';
import { AdminReviewerFeedbackPage } from '@/pages/admin/AdminReviewerFeedbackPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminSupportPage } from '@/pages/admin/AdminSupportPage';

// Protected Route Wrapper
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  // Public Routes with MainLayout
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME, element: <LandingPage /> },
      { path: ROUTES.AFFIDAVIT_TYPES, element: <AffidavitTypesPage /> },
      { path: ROUTES.AFFIDAVIT_TYPE_DETAIL, element: <AffidavitTypeDetailPage /> },
      { path: ROUTES.DECISION_TREE, element: <DecisionTreePage /> },
      { path: ROUTES.REQUEST_CREATE, element: <RequestCreatePage /> },
    ],
  },
  
  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
      { path: ROUTES.REGISTER_COMMISSIONER, element: <CommissionerRegisterPage /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
      { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
      { path: ROUTES.VERIFY_OTP, element: <VerifyOtpPage /> },
    ],
  },
  
  // User Routes (requires authentication)
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.MY_REQUESTS, element: <MyRequestsPage /> },
      { path: ROUTES.REQUEST_STATUS, element: <RequestStatusPage /> },
      { path: ROUTES.REQUEST_PAYMENT, element: <PaymentDetailsPage /> },
      { path: ROUTES.REQUEST_THANK_YOU, element: <ThankYouPage /> },
      { path: ROUTES.REQUEST_SELECT_COMMISSIONER, element: <SelectCommissionerPage /> },
      { path: ROUTES.PROFILE, element: <ProfilePage /> },
      { path: ROUTES.SUPPORT, element: <SupportPage /> },
      { path: ROUTES.TICKET_DETAIL, element: <TicketDetailPage /> },
    ],
  },
  
  // Commissioner Routes
  {
    element: (
      <ProtectedRoute requiredRoles={['commissioner', 'admin']}>
        <DashboardLayout portal="commissioner" />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.COMMISSIONER_DASHBOARD, element: <Navigate to={ROUTES.COMMISSIONER_LOOKUP} replace /> },
      { path: ROUTES.COMMISSIONER_LOOKUP, element: <CommissionerDashboardPage /> },
      { path: ROUTES.COMMISSIONER_SCHEDULE, element: <CommissionerSchedulePage /> },
      { path: ROUTES.COMMISSIONER_REQUEST, element: <CommissionerRequestPage /> },
      { path: ROUTES.COMMISSIONER_STAMPS, element: <CommissionerStampsPage /> },
      { path: ROUTES.COMMISSIONER_SETTINGS, element: <CommissionerSettingsPage /> },
    ],
  },
  
  // Reviewer Routes
  {
    element: (
      <ProtectedRoute requiredRoles={['reviewer', 'admin']}>
        <DashboardLayout portal="reviewer" />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.REVIEWER_DASHBOARD, element: <ReviewerDashboardPage /> },
      { path: ROUTES.REVIEWER_QUEUE, element: <ReviewerQueuePage /> },
      { path: ROUTES.REVIEWER_DETAIL, element: <ReviewerDetailPage /> },
    ],
  },
  
  // Admin Routes
  {
    element: (
      <ProtectedRoute requiredRoles="admin">
        <DashboardLayout portal="admin" />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.ADMIN_DASHBOARD, element: <AdminTypesPage /> },
      { path: ROUTES.ADMIN_TYPES, element: <AdminTypesPage /> },
      { path: ROUTES.ADMIN_TYPE_EDIT, element: <ProtectedRoute requiredRoles="admin" requireSuperuser><AdminTypeEditPage /></ProtectedRoute> },
      { path: ROUTES.ADMIN_TYPE_REQUESTS, element: <AdminTypeRequestsPage /> },
      { path: ROUTES.ADMIN_AI_SETTINGS, element: <AdminAISettingsPage /> },
      { path: ROUTES.ADMIN_DECISION_TREE, element: <ProtectedRoute requiredRoles="admin" requireSuperuser><AdminDecisionTreePage /></ProtectedRoute> },
      { path: ROUTES.ADMIN_COSTS, element: <AdminCostsPage /> },
      { path: ROUTES.ADMIN_LEARNING, element: <AdminLearningPage /> },
      { path: ROUTES.ADMIN_FRICTION, element: <AdminFrictionPage /> },
      { path: ROUTES.ADMIN_REVIEWER_FEEDBACK, element: <AdminReviewerFeedbackPage /> },
      { path: ROUTES.ADMIN_STAFF, element: <AdminStaffPage /> },
      { path: ROUTES.ADMIN_SETTINGS, element: <AdminSettingsPage /> },
      { path: ROUTES.ADMIN_SUPPORT, element: <AdminSupportPage /> },
      { path: ROUTES.ADMIN_TICKET_DETAIL, element: <TicketDetailPage /> },
    ],
  },
  
  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to={ROUTES.HOME} replace />,
  },
]);

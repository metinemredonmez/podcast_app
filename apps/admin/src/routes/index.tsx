import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout, DashboardLayout } from '../layouts';
import { ProtectedRoute } from './ProtectedRoute';
import { PageLoader, TablePageLoader } from '../components/common/PageLoader';

// Lazy load pages for code splitting
// Auth pages (loaded eagerly as entry point)
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ApplicationPendingPage from '../pages/auth/ApplicationPendingPage';

// Legal pages
import PrivacyPage from '../pages/legal/PrivacyPage';
import TermsPage from '../pages/legal/TermsPage';

// Dashboard - loaded eagerly as main entry
import DashboardPage from '../pages/dashboard/DashboardPage';

// Podcast pages
const PodcastsPage = lazy(() => import('../pages/podcasts/PodcastsPage'));
const CreatePodcastPage = lazy(() => import('../pages/podcasts/CreatePodcastPage'));
const EditPodcastPage = lazy(() => import('../pages/podcasts/EditPodcastPage'));

// Episode pages
const EpisodesPage = lazy(() => import('../pages/episodes/EpisodesPage'));
const CreateEpisodePage = lazy(() => import('../pages/episodes/CreateEpisodePage'));
const EditEpisodePage = lazy(() => import('../pages/episodes/EditEpisodePage'));

// User management pages
const UsersPage = lazy(() => import('../pages/users/UsersPage'));
const HocasPage = lazy(() => import('../pages/hocas/HocasPage'));
const HocaApplicationsPage = lazy(() => import('../pages/hocas/HocaApplicationsPage'));

// Profile page
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));

// User pages (history, favorites)
const MyHistoryPage = lazy(() => import('../pages/user/MyHistoryPage'));
const MyFavoritesPage = lazy(() => import('../pages/user/MyFavoritesPage'));

// Content moderation pages
const CategoriesPage = lazy(() => import('../pages/categories/CategoriesPage'));
const ModerationPage = lazy(() => import('../pages/moderation/ModerationPage'));
const CommentsPage = lazy(() => import('../pages/comments/CommentsPage'));
const ReviewsPage = lazy(() => import('../pages/reviews/ReviewsPage'));

// Analytics pages
const AdvancedAnalyticsPage = lazy(() => import('../pages/analytics/AdvancedAnalyticsPage'));

// Tenant pages
const TenantsPage = lazy(() => import('../pages/tenants/TenantsPage'));
const TenantDetailPage = lazy(() => import('../pages/tenants/TenantDetailPage'));

// Notification pages
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const SendNotificationPage = lazy(() => import('../pages/notifications/SendNotificationPage'));

// Settings pages
const SystemSettingsPage = lazy(() => import('../pages/settings/SystemSettingsPage'));
const PushConfigPage = lazy(() => import('../pages/push/PushConfigPage'));
const PushLogsPage = lazy(() => import('../pages/push/PushLogsPage'));
const SocialAuthConfigPage = lazy(() => import('../pages/social-auth/SocialAuthConfigPage'));
const SmsConfigPage = lazy(() => import('../pages/sms/SmsConfigPage'));

// Live streaming pages
const LiveStreamsPage = lazy(() => import('../pages/live-stream/LiveStreamsPage'));
const LiveBroadcastPage = lazy(() => import('../pages/live-stream/LiveBroadcastPage'));
const LivePlayerPage = lazy(() => import('../pages/live-stream/LivePlayerPage'));

// Wrapper component for lazy-loaded pages
const LazyPage = ({ component: Component, loader: Loader = PageLoader }: {
  component: React.LazyExoticComponent<React.ComponentType>;
  loader?: React.ComponentType;
}) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

// Table page wrapper with skeleton loader
const LazyTablePage = ({ component: Component }: {
  component: React.LazyExoticComponent<React.ComponentType>;
}) => (
  <Suspense fallback={<TablePageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  // Legal pages (no auth required)
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  // Application pending page
  { path: '/application-pending', element: <ApplicationPendingPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Dashboard - eagerly loaded
          { path: '/', element: <DashboardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },

          // Podcasts
          { path: '/podcasts', element: <LazyTablePage component={PodcastsPage} /> },
          { path: '/podcasts/new', element: <LazyPage component={CreatePodcastPage} /> },
          { path: '/podcasts/:id', element: <LazyPage component={EditPodcastPage} /> },

          // Episodes
          { path: '/episodes', element: <LazyTablePage component={EpisodesPage} /> },
          { path: '/episodes/new', element: <LazyPage component={CreateEpisodePage} /> },
          { path: '/episodes/:id', element: <LazyPage component={EditEpisodePage} /> },

          // Categories
          { path: '/categories', element: <LazyTablePage component={CategoriesPage} /> },

          // Users
          { path: '/users', element: <LazyTablePage component={UsersPage} /> },
          { path: '/hocas', element: <LazyTablePage component={HocasPage} /> },
          { path: '/hoca-applications', element: <LazyTablePage component={HocaApplicationsPage} /> },

          // Profile & User pages
          { path: '/profile', element: <LazyPage component={ProfilePage} /> },
          { path: '/my-history', element: <LazyPage component={MyHistoryPage} /> },
          { path: '/my-favorites', element: <LazyPage component={MyFavoritesPage} /> },

          // Moderation
          { path: '/moderation', element: <LazyTablePage component={ModerationPage} /> },
          { path: '/comments', element: <LazyTablePage component={CommentsPage} /> },
          { path: '/reviews', element: <LazyTablePage component={ReviewsPage} /> },

          // Analytics
          { path: '/analytics', element: <LazyPage component={AdvancedAnalyticsPage} /> },

          // Tenants
          { path: '/tenants', element: <LazyTablePage component={TenantsPage} /> },
          { path: '/tenants/:id', element: <LazyPage component={TenantDetailPage} /> },

          // Notifications
          { path: '/notifications', element: <LazyTablePage component={NotificationsPage} /> },
          { path: '/notifications/send', element: <LazyPage component={SendNotificationPage} /> },

          // Settings
          { path: '/settings', element: <LazyPage component={SystemSettingsPage} /> },
          { path: '/push', element: <LazyPage component={PushConfigPage} /> },
          { path: '/push/logs', element: <LazyTablePage component={PushLogsPage} /> },
          { path: '/settings/social-auth', element: <LazyPage component={SocialAuthConfigPage} /> },
          { path: '/settings/sms', element: <LazyPage component={SmsConfigPage} /> },

          // Live Streaming
          { path: '/live', element: <LazyTablePage component={LiveStreamsPage} /> },
          { path: '/live/broadcast', element: <LazyPage component={LiveBroadcastPage} /> },
          { path: '/live/:streamId', element: <LazyPage component={LivePlayerPage} /> },
        ],
      },
    ],
  },
]);

import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout, DashboardLayout } from '../layouts';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import PodcastsPage from '../pages/podcasts/PodcastsPage';
import CreatePodcastPage from '../pages/podcasts/CreatePodcastPage';
import EditPodcastPage from '../pages/podcasts/EditPodcastPage';
import EpisodesPage from '../pages/episodes/EpisodesPage';
import EditEpisodePage from '../pages/episodes/EditEpisodePage';
import UsersPage from '../pages/users/UsersPage';
import HocasPage from '../pages/hocas/HocasPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import AdvancedAnalyticsPage from '../pages/analytics/AdvancedAnalyticsPage';
import CategoriesPage from '../pages/categories/CategoriesPage';
import ModerationPage from '../pages/moderation/ModerationPage';
import TenantsPage from '../pages/tenants/TenantsPage';
import TenantDetailPage from '../pages/tenants/TenantDetailPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import SendNotificationPage from '../pages/notifications/SendNotificationPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/podcasts', element: <PodcastsPage /> },
          { path: '/podcasts/new', element: <CreatePodcastPage /> },
          { path: '/podcasts/:id', element: <EditPodcastPage /> },
          { path: '/episodes', element: <EpisodesPage /> },
          { path: '/episodes/:id', element: <EditEpisodePage /> },
          { path: '/categories', element: <CategoriesPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/hocas', element: <HocasPage /> },
          { path: '/moderation', element: <ModerationPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/analytics/advanced', element: <AdvancedAnalyticsPage /> },
          { path: '/tenants', element: <TenantsPage /> },
          { path: '/tenants/:id', element: <TenantDetailPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/notifications/send', element: <SendNotificationPage /> },
        ],
      },
    ],
  },
]);

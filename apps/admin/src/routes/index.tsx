import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout, DashboardLayout } from '../layouts';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import PodcastsPage from '../pages/podcasts/PodcastsPage';
import CreatePodcastPage from '../pages/podcasts/CreatePodcastPage';
import EditPodcastPage from '../pages/podcasts/EditPodcastPage';
import EpisodesPage from '../pages/episodes/EpisodesPage';
import UsersPage from '../pages/users/UsersPage';
import HocasPage from '../pages/hocas/HocasPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
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
          { path: '/users', element: <UsersPage /> },
          { path: '/hocas', element: <HocasPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
        ],
      },
    ],
  },
]);

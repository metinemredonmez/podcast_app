import { jsx as _jsx } from "react/jsx-runtime";
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
        element: _jsx(AuthLayout, {}),
        children: [{ path: '/login', element: _jsx(LoginPage, {}) }],
    },
    {
        element: _jsx(ProtectedRoute, {}),
        children: [
            {
                element: _jsx(DashboardLayout, {}),
                children: [
                    { path: '/', element: _jsx(DashboardPage, {}) },
                    { path: '/dashboard', element: _jsx(DashboardPage, {}) },
                    { path: '/podcasts', element: _jsx(PodcastsPage, {}) },
                    { path: '/podcasts/new', element: _jsx(CreatePodcastPage, {}) },
                    { path: '/podcasts/:id', element: _jsx(EditPodcastPage, {}) },
                    { path: '/episodes', element: _jsx(EpisodesPage, {}) },
                    { path: '/users', element: _jsx(UsersPage, {}) },
                    { path: '/hocas', element: _jsx(HocasPage, {}) },
                    { path: '/analytics', element: _jsx(AnalyticsPage, {}) },
                ],
            },
        ],
    },
]);

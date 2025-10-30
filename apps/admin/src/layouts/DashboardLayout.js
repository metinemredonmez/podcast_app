import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
export const DashboardLayout = () => {
    return (_jsxs("div", { className: "dashboard-layout", children: [_jsx(Sidebar, {}), _jsx("main", { children: _jsx(Outlet, {}) })] }));
};

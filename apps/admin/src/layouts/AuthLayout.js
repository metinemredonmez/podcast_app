import { jsx as _jsx } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
export const AuthLayout = () => {
    return (_jsx("div", { className: "auth-layout", children: _jsx(Outlet, {}) }));
};

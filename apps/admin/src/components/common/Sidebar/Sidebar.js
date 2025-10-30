import { jsx as _jsx } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { routes } from '../../../routes/routes.config';
export const Sidebar = () => {
    return (_jsx("aside", { className: "sidebar", children: _jsx("nav", { children: _jsx("ul", { children: routes.map((route) => (_jsx("li", { children: _jsx(NavLink, { to: route.path, children: route.label }) }, route.path))) }) }) }));
};

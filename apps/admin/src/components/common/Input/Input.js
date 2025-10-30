import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './Input.styles';
export const Input = ({ label, ...props }) => {
    return (_jsxs("label", { className: "input", children: [label && _jsx("span", { children: label }), _jsx("input", { ...props })] }));
};

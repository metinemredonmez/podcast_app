import { jsx as _jsx } from "react/jsx-runtime";
import './Button.styles';
export const Button = ({ label, ...props }) => {
    return (_jsx("button", { className: "btn", ...props, children: label }));
};

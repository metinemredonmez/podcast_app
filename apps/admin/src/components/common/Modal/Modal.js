import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "modal", children: _jsxs("div", { className: "modal__content", children: [_jsx("button", { onClick: onClose, children: "Close" }), children] }) }));
};

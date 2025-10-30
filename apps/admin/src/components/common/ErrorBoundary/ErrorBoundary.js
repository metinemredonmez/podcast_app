import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from "react";
export class ErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error(error, info);
    }
    render() {
        if (this.state.hasError) {
            return _jsx("div", { children: "Something went wrong." });
        }
        return this.props.children;
    }
}

import { useDispatch, useSelector } from 'react-redux';
import { clearToken, setToken } from '../store/slices/authSlice';
export const useAuth = () => {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state) => Boolean(state.auth.token));
    return {
        isAuthenticated,
        login: (token) => dispatch(setToken(token)),
        logout: () => dispatch(clearToken()),
    };
};

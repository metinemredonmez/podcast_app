import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { clearToken, setToken } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => Boolean(state.auth.token));
  return {
    isAuthenticated,
    login: (token: string) => dispatch(setToken(token)),
    logout: () => dispatch(clearToken()),
  };
};

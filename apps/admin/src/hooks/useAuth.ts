import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { AppDispatch, RootState } from '../store/store';
import { clearAuth, setCredentials, setUser, User } from '../store/slices/authSlice';
import { authService } from '../api/services/auth.service';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = Boolean(token);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authService.login({ email, password });
      dispatch(
        setCredentials({
          accessToken: response.tokens.accessToken,
          refreshToken: response.tokens.refreshToken,
          user: {
            id: response.user.id,
            name: response.user.name || '',
            email: response.user.email,
            role: response.user.role,
          },
        })
      );
      return response;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(clearAuth());
    }
  }, [dispatch]);

  const updateUser = useCallback(
    (userData: User) => {
      dispatch(setUser(userData));
    },
    [dispatch]
  );

  return {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    updateUser,
  };
};

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
}

// Try to restore user from localStorage
const storedUser = localStorage.getItem('user');
const parsedUser = storedUser ? (() => {
  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
})() : null;

const initialState: AuthState = {
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: parsedUser,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: User | null }>) {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      if (action.payload.user) {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      } else {
        localStorage.removeItem('user');
      }
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearAuth(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    // Legacy support
    clearToken(state) {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, setToken, setUser, setLoading, clearAuth, clearToken } = authSlice.actions;
export const selectIsAuthenticated = (state: { auth: AuthState }) => Boolean(state.auth.token);
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export default authSlice.reducer;

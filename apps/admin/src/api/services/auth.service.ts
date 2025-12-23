import { apiClient } from '../client';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthUser {
  id: string;
  tenantId: string;
  name: string | null;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

interface LoginResponse {
  tokens: AuthTokens;
  user: AuthUser;
}

export const authService = {
  async login(payload: { email: string; password: string }): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async refreshToken() {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async register(payload: { name: string; email: string; password: string }) {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string) {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

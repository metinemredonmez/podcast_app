import { apiClient } from '../client';
export const authService = {
    async login(payload) {
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
};

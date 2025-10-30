import { apiClient } from '../client';
export const analyticService = {
    async list(params) {
        const response = await apiClient.get('/analytics', { params });
        return response.data;
    },
    async get(id) {
        const response = await apiClient.get('/analytics/' + id);
        return response.data;
    },
};

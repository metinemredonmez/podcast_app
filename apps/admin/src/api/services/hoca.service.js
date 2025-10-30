import { apiClient } from '../client';
export const hocaService = {
    async list(params) {
        const response = await apiClient.get('/hocas', { params });
        return response.data;
    },
    async get(id) {
        const response = await apiClient.get('/hocas/' + id);
        return response.data;
    },
};

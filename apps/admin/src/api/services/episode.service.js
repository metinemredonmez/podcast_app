import { apiClient } from '../client';
export const episodeService = {
    async list(params) {
        const response = await apiClient.get('/episodes', { params });
        return response.data;
    },
    async get(id) {
        const response = await apiClient.get('/episodes/' + id);
        return response.data;
    },
};

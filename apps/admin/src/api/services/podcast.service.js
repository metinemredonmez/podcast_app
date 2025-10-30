import { apiClient } from '../client';
export const podcastService = {
    async list(params) {
        const response = await apiClient.get('/podcasts', { params });
        return response.data;
    },
    async get(id) {
        const response = await apiClient.get('/podcasts/' + id);
        return response.data;
    },
};

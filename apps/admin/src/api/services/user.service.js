import { apiClient } from '../client';
export const userService = {
    async list(params) {
        const response = await apiClient.get('/users', { params });
        return response.data;
    },
    async get(id) {
        const response = await apiClient.get('/users/' + id);
        return response.data;
    },
};

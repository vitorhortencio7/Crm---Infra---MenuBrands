import { api } from './api';


export const notificationsAPI = {
    async list() {
        return api.get('/notifications/');
    },

    async markAsRead(id: string) {
        return api.put(`/notifications/${id}/read`);
    }
};

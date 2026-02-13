/**
 * Infrastructure API Service
 * Handles API calls for ServiceOrders, Expenses, and Assets
 */

import { api } from './api';



// ===== SERVICE ORDERS =====

export const serviceOrdersAPI = {
    /**
     * List service orders with filters
     */
    async list(filters?: {
        unit?: string;
        status?: string;
        owner_id?: number;
        archived?: boolean;
    }) {
        const data = await api.get('/infraestrutura/orders', { params: filters });

        // Map backend fields to frontend types
        return data.map((o: any) => ({
            ...o,
            id: o.id.toString(),
            ownerId: o.owner_id?.toString(),
            dateOpened: o.date_opened,
            dateForecast: o.date_forecast,
            dateClosed: o.date_closed,
            history: o.history?.map((h: any) => ({
                ...h,
                userId: h.user_id?.toString()
            })) || []
        }));
    },


    /**
     * Create new service order
     */
    async create(data: any) {
        return api.post('/infraestrutura/orders', data);
    },


    /**
     * Update service order
     */
    async update(id: string, data: any) {
        return api.put(`/infraestrutura/orders/${id}`, data);
    },


    /**
     * Add history log to service order
     */
    async addLog(id: string, message: string) {
        return api.post(`/infraestrutura/orders/${id}/log`, { message });
    },


    /**
     * Archive service order
     */
    async archive(id: string) {
        return api.put(`/infraestrutura/orders/${id}/archive`);
    }

};

// ===== EXPENSES =====

export const expensesAPI = {
    /**
     * List expenses with filters
     */
    async list(filters?: {
        unit?: string;
        month?: number;
        year?: number;
    }) {
        const data = await api.get('/infraestrutura/expenses', { params: filters });

        // Map backend fields to frontend types
        return data.map((e: any) => ({
            ...e,
            id: e.id.toString(),
            warrantyPartsMonths: e.warranty_parts_months,
            warrantyServiceMonths: e.warranty_service_months,
            linkedOSId: e.linked_os_id,
            paymentMethod: e.payment_method,
            paymentData: e.payment_data
        }));
    },


    /**
     * Create new expense
     */
    async create(data: any) {
        return api.post('/infraestrutura/expenses', data);
    },


    /**
     * Update expense
     */
    async update(id: string, data: any) {
        return api.put(`/infraestrutura/expenses/${id}`, data);
    },


    /**
     * Delete expense (admin only)
     */
    async delete(id: string) {
        return api.delete(`/infraestrutura/expenses/${id}`);
    }

};

// ===== ASSETS =====

export const assetsAPI = {
    /**
     * List assets with filters
     */
    async list(filters?: {
        unit?: string;
        category?: string;
        status?: string;
    }) {
        const data = await api.get('/infraestrutura/assets', { params: filters });

        // Map backend fields to frontend types
        return data.map((a: any) => ({
            ...a,
            id: a.id.toString(),
            assetTag: a.asset_tag,
            photoUrl: a.photo_url,
            registrationDate: a.registration_date,
            invoiceInfo: a.invoice_info
        }));
    },


    /**
     * Create new asset
     */
    async create(data: any) {
        return api.post('/infraestrutura/assets', data);
    },


    /**
     * Update asset
     */
    async update(id: number, data: any) {
        return api.put(`/infraestrutura/assets/${id}`, data);
    },


    /**
     * Delete asset (admin only)
     */
    async delete(id: number) {
        return api.delete(`/infraestrutura/assets/${id}`);
    },


    /**
     * Send asset to maintenance
     */
    async sendToMaintenance(data: any) {
        return api.post('/infraestrutura/assets/maintenance', data);
    },


    /**
     * Return asset from maintenance
     */
    async returnFromMaintenance(maintenanceId: number, dateReturned?: string) {
        const body = dateReturned ? { date_returned: dateReturned } : {};
        return api.put(`/infraestrutura/assets/maintenance/${maintenanceId}/return`, body);
    }

};

// ===== SUPPLIERS =====

export const suppliersAPI = {
    async list() {
        return api.get('/infraestrutura/suppliers');
    },


    async create(data: any) {
        return api.post('/infraestrutura/suppliers', data);
    },


    async update(id: number, data: any) {
        return api.put(`/infraestrutura/suppliers/${id}`, data);
    },


    async delete(id: number) {
        return api.delete(`/infraestrutura/suppliers/${id}`);
    }

};

// ===== TASKS =====

export const tasksAPI = {
    async list() {
        const data = await api.get('/infraestrutura/tasks');
        return data.map((t: any) => ({
            id: t.id.toString(),
            userId: t.user_id?.toString(),
            title: t.title,
            description: t.description,
            dueDate: t.due_date,
            priority: t.priority,
            status: t.status,
            linkedOSId: t.linked_os_id,
            createdAt: t.created_at
        }));
    },


    async create(data: any) {
        return api.post('/infraestrutura/tasks', data);
    },


    async update(id: number, data: any) {
        return api.put(`/infraestrutura/tasks/${id}`, data);
    },


    async delete(id: number) {
        return api.delete(`/infraestrutura/tasks/${id}`);
    }

};

// Export all APIs
// Export all APIs
const realInfrastructureAPI = {
    serviceOrders: serviceOrdersAPI,
    expenses: expensesAPI,
    assets: assetsAPI,
    suppliers: suppliersAPI,
    tasks: tasksAPI
};

import { USE_MOCK } from './config';
import { mockServiceOrdersAPI, mockExpensesAPI, mockAssetsAPI, mockSuppliersAPI, mockTasksAPI } from './mockServices';

export const infrastructureAPI = USE_MOCK ? {
    serviceOrders: mockServiceOrdersAPI,
    expenses: mockExpensesAPI,
    assets: mockAssetsAPI,
    suppliers: mockSuppliersAPI,
    tasks: mockTasksAPI
} : realInfrastructureAPI;

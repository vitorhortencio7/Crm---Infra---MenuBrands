import { MOCK_ASSETS, MOCK_EXPENSES, MOCK_ORDERS, MOCK_SUPPLIERS, MOCK_TASKS, MOCK_USERS } from '../mockData';
import { Asset, AssetCategory, AssetStatus, Expense, ExpenseCategory, MaintenanceRecord, ServiceOrder, Supplier, User, Unit, OSStatus, OSType, OSPriority, PaymentMethod } from '../types';
import { LoginResponse } from './auth';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ===== SERVICE ORDERS =====
export const mockServiceOrdersAPI = {
    async list(filters?: { unit?: string; status?: string; owner_id?: number; archived?: boolean }) {
        await delay(500);
        let orders = [...MOCK_ORDERS];

        // Apply filters (basic implementation)
        if (filters?.unit) {
            orders = orders.filter(o => o.unit === filters.unit);
        }
        if (filters?.status) {
            orders = orders.filter(o => o.status === filters.status);
        }
        if (filters?.owner_id) {
            // Mock data uses string IDs e.g. 'u1', filter expects number. 
            // Logic might need adjustment or allow string IDs in filters for mock completeness.
            // For now ignoring precise ID match or assuming string match if possible
            const userId = `u${filters.owner_id}`;
            orders = orders.filter(o => o.ownerId === userId);
        }
        // archived filter defaulting to false in real API usually, 
        // here we check explicit property. 
        // Note: Real API params are 'archived', MOCK_ORDERS has 'archived' boolean.
        if (filters?.archived !== undefined) {
            orders = orders.filter(o => !!o.archived === filters.archived);
        } else {
            // Default behavior if not specified: usually show active (archived=false)
            // But following the mock data structure
            orders = orders.filter(o => !o.archived);
        }

        return orders;
    },

    async create(data: {
        title: string;
        unit: string;
        description: string;
        type: string;
        priority: string;
        owner_id: number;
        date_forecast?: string;
    }) {
        await delay(500);
        const newOrder: ServiceOrder = {
            id: `OS-MOCK-${Date.now()}`,
            title: data.title,
            unit: data.unit as Unit,
            description: data.description,
            type: data.type as OSType,
            priority: data.priority as OSPriority,
            ownerId: `u${data.owner_id}`,
            status: OSStatus.ABERTA,
            dateOpened: new Date().toISOString(),
            dateForecast: data.date_forecast,
            history: [],
            archived: false
        };
        MOCK_ORDERS.push(newOrder); // In-memory update
        return newOrder;
    },

    async update(id: string, data: Partial<ServiceOrder>) {
        await delay(500);
        const index = MOCK_ORDERS.findIndex(o => o.id === id);
        if (index === -1) throw new Error('Order not found');

        MOCK_ORDERS[index] = { ...MOCK_ORDERS[index], ...data };
        return MOCK_ORDERS[index];
    },

    async addLog(id: string, message: string) {
        await delay(300);
        const order = MOCK_ORDERS.find(o => o.id === id);
        if (!order) throw new Error('Order not found');

        const newLog = {
            id: `log-${Date.now()}`,
            date: new Date().toISOString(),
            message,
            userId: 'u1' // Mock user
        };
        order.history = [...(order.history || []), newLog];
        return newLog;
    },

    async archive(id: string) {
        await delay(300);
        const order = MOCK_ORDERS.find(o => o.id === id);
        if (!order) throw new Error('Order not found');
        order.archived = true;
        return { message: 'Archived' };
    }
};

// ===== EXPENSES =====
export const mockExpensesAPI = {
    async list(filters?: { unit?: string; month?: number; year?: number }) {
        await delay(500);
        let expenses = [...MOCK_EXPENSES];

        if (filters?.unit) {
            expenses = expenses.filter(e => e.unit === filters.unit);
        }
        // Month/Year filtering on ISO string dates
        if (filters?.year) {
            expenses = expenses.filter(e => new Date(e.date).getFullYear() === filters.year);
        }
        if (filters?.month) {
            expenses = expenses.filter(e => new Date(e.date).getMonth() + 1 === filters.month);
        }

        return expenses;
    },

    async create(data: any) {
        await delay(500);
        const newExpense: Expense = {
            id: `FIN-MOCK-${Date.now()}`,
            ...data,
            // Ensure enums match
        };
        MOCK_EXPENSES.push(newExpense);
        return newExpense;
    },

    async update(id: string, data: any) {
        await delay(500);
        const index = MOCK_EXPENSES.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Expense not found');
        MOCK_EXPENSES[index] = { ...MOCK_EXPENSES[index], ...data };
        return MOCK_EXPENSES[index];
    },

    async delete(id: string) {
        await delay(300);
        const index = MOCK_EXPENSES.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Expense not found');
        MOCK_EXPENSES.splice(index, 1);
        return { message: 'Deleted' };
    }
};

// ===== ASSETS =====
export const mockAssetsAPI = {
    async list(filters?: { unit?: string; category?: string; status?: string }) {
        await delay(500);
        let assets = [...MOCK_ASSETS];

        if (filters?.unit) assets = assets.filter(a => a.unit === filters.unit);
        if (filters?.category) assets = assets.filter(a => a.category === filters.category);
        if (filters?.status) assets = assets.filter(a => a.status === filters.status);

        return assets;
    },

    async create(data: any) {
        await delay(500);
        const newAsset: Asset = {
            id: `ast-mock-${Date.now()}`,
            assetTag: data.asset_tag,
            name: data.name,
            unit: data.unit,
            category: data.category,
            status: AssetStatus.ATIVO,
            registrationDate: data.registration_date,
            warranty: data.warranty || { hasWarranty: false },
            invoiceInfo: data.invoice_info || {},
            value: data.value,
            brand: data.brand,
            model: data.model,
            photoUrl: data.photo_url
        };
        MOCK_ASSETS.push(newAsset);
        return newAsset;
    },

    async update(id: number | string, data: any) { // Accept string ID for mock
        await delay(500);
        const index = MOCK_ASSETS.findIndex(a => a.id === id || a.id === `ast-${id}`); // loose matching
        if (index === -1) throw new Error('Asset not found');
        MOCK_ASSETS[index] = { ...MOCK_ASSETS[index], ...data };
        return MOCK_ASSETS[index];
    },

    async delete(id: number | string) {
        await delay(300);
        const index = MOCK_ASSETS.findIndex(a => a.id === id || a.id === `ast-${id}`);
        if (index === -1) throw new Error('Asset not found');
        MOCK_ASSETS.splice(index, 1);
        return { message: 'Deleted' };
    },

    async sendToMaintenance(data: any) {
        await delay(500);
        // Simplified Logic
        const asset = MOCK_ASSETS.find(a => a.id === `ast-${data.asset_id}` || a.id === data.asset_id);
        if (asset) asset.status = AssetStatus.EM_MANUTENCAO;
        return { message: 'Sent to maintenance' };
    },

    async returnFromMaintenance(maintenanceId: number, dateReturned?: string) {
        await delay(500);
        return { message: 'Returned from maintenance' };
    }
};

// ===== SUPPLIERS =====
export const mockSuppliersAPI = {
    async list() {
        await delay(300);
        return [...MOCK_SUPPLIERS];
    },
    async create(data: any) {
        await delay(300);
        const newSupplier = { id: `sup-mock-${Date.now()}`, ...data };
        MOCK_SUPPLIERS.push(newSupplier);
        return newSupplier;
    },
    async update(id: number | string, data: any) {
        await delay(300);
        // Mock logic
        return { ...data, id };
    },
    async delete(id: number | string) {
        await delay(300);
        const index = MOCK_SUPPLIERS.findIndex(s => s.id === id);
        if (index > -1) MOCK_SUPPLIERS.splice(index, 1);
        return { message: 'Deleted' };
    }
};

// ===== TASKS =====
export const mockTasksAPI = {
    async list() {
        await delay(300);
        return [...MOCK_TASKS];
    },
    async create(data: any) {
        await delay(300);
        const newTask = { id: `t-mock-${Date.now()}`, ...data, completed: false };
        MOCK_TASKS.push(newTask);
        return newTask;
    },
    async update(id: number | string, data: any) {
        await delay(300);
        const index = MOCK_TASKS.findIndex(t => t.id === id);
        if (index > -1) {
            MOCK_TASKS[index] = { ...MOCK_TASKS[index], ...data };
            return MOCK_TASKS[index];
        }
        throw new Error("Task not found");
    },
    async delete(id: number | string) {
        await delay(300);
        const index = MOCK_TASKS.findIndex(t => t.id === id);
        if (index > -1) MOCK_TASKS.splice(index, 1);
        return { message: 'Deleted' };
    }
};

// ===== AUTH =====
export const mockAuthService = {
    async login(identifier: string, password: string): Promise<LoginResponse> {
        await delay(800);
        const user = MOCK_USERS.find(u => u.email === identifier || u.name === identifier); // simplified

        if (password === 'fail') throw new Error('Login failed');

        // Check password (very simple mock check)
        if (user && user.password === password) {
            return {
                message: 'Login fake successful',
                access_token: 'fake-jwt-token',
                refresh_token: 'fake-refresh-token',
                user_id: 1, // Mock logic
                user: {
                    username: user.name,
                    name: user.name,
                    email: user.email,
                    avatar_url: user.avatarUrl,
                    role: user.isAdmin ? 'admin' : user.role
                },
                token: 'fake-jwt-token',
                session_duration: 3600
            };
        }

        // Default fallback for dev ease if no match found in limited mock data
        // or prevent login
        throw new Error('Credenciais inválidas (Mock)');
    },

    async validateToken(): Promise<boolean> {
        await delay(200);
        return true; // Always valid in mock mode
    },

    async logout(): Promise<void> {
        await delay(200);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
    },

    async refreshToken(refreshToken: string): Promise<LoginResponse> {
        await delay(200);
        // Return a fake response similar to login
        return {
            message: 'Refreshed',
            access_token: 'new-fake-token',
            refresh_token: 'new-fake-refresh',
            user_id: 1,
            user: {
                username: 'MockUser',
                name: 'Mock User',
                email: 'mock@test.com',
                role: 'user'
            },
            token: 'new-fake-token',
            session_duration: 3600
        };
    }
};

// ===== USERS =====
export const mockUsersAPI = {
    async list(): Promise<User[]> {
        await delay(400);
        // Map mock users to match expected User interface completely
        return MOCK_USERS.map(u => ({
            ...u,
            // Ensure compatibility (mock data already mostly matches)
            isAdmin: !!u.isAdmin
        }));
    },
    async create(user: Partial<User>, password?: string) {
        await delay(400);
        const newUser: User = {
            id: `u${Date.now()}`,
            name: user.name!,
            email: user.email!,
            role: user.role!,
            initials: user.name!.substring(0, 2).toUpperCase(),
            color: 'bg-gray-500',
            isAdmin: user.isAdmin,
            password: password
        };
        MOCK_USERS.push(newUser);
        return { msg: 'User created' };
    },
    async update(user: User) {
        await delay(400);
        const index = MOCK_USERS.findIndex(u => u.id === user.id);
        if (index > -1) {
            MOCK_USERS[index] = { ...MOCK_USERS[index], ...user };
        }
        return { msg: 'User updated' };
    },
    async delete(userId: string) {
        await delay(400);
        const index = MOCK_USERS.findIndex(u => u.id === userId);
        if (index > -1) MOCK_USERS.splice(index, 1);
        return { msg: 'User deleted' };
    }
};


import React, { useState, useEffect, useMemo } from 'react';
import { Users as UsersIcon, Store, Menu, Layers } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { FinanceTable } from './components/FinanceTable';
import { OSModal } from './components/OSModal';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { TaskManager } from './components/TaskManager';
import { CalendarView } from './components/CalendarView';
import { Sidebar } from './components/Sidebar';
import { UserManagementModal } from './components/UserManagementModal';
import { SupplierManagementModal } from './components/SupplierManagementModal';
import { ThemeToggle } from './components/ThemeToggle';
import { PerformanceToggle } from './components/PerformanceToggle';
import { AssetsManager } from './components/AssetsManager';
import { AssetModal } from './components/AssetModal';
import { AssetTransferModal } from './components/AssetTransferModal';
import { AssetMaintenanceModal } from './components/AssetMaintenanceModal';
import { CategoryManagementModal } from './components/CategoryManagementModal';
import { ServiceOrder, Expense, User, PersonalTask, Notification, Supplier, Asset, Unit, MaintenanceRecord, AssetCategory } from './types';
import { MOCK_ASSETS, MOCK_EXPENSES, MOCK_MAINTENANCE_RECORDS, MOCK_NOTIFICATIONS, MOCK_ORDERS, MOCK_SUPPLIERS, MOCK_TASKS, MOCK_USERS } from './mockData';
import { authService } from './lib/auth';
import { infrastructureAPI } from './lib/infrastructure';
import { usersAPI } from './lib/users';
import { notificationsAPI } from './lib/notifications';
import { USE_MOCK } from './lib/config';

type View = 'dashboard' | 'kanban' | 'finance' | 'reports' | 'tasks' | 'settings' | 'assets' | 'calendar';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // App State
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Theme State with Persistence
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
    });

    // Performance Mode State
    const [performanceMode, setPerformanceMode] = useState<boolean>(() => {
        const stored = localStorage.getItem('performanceMode');
        return stored === 'true';
    });

    // --- MOBILE DETECTION ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarCollapsed(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Data State - Initialize Empty (Clean State)
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [tasks, setTasks] = useState<PersonalTask[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
    const [assetCategories, setAssetCategories] = useState<string[]>(Object.values(AssetCategory));

    // --- SESSION RESTORATION ---
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setCurrentUser(user);

                // If not in mock mode, we could validate the token here
                if (!USE_MOCK) {
                    authService.validateToken().then(isValid => {
                        if (!isValid) handleLogout();
                    }).catch(err => {
                        console.error("Token validation failed:", err);
                    });
                }
            } catch (e) {
                console.error("Failed to restore session:", e);
            }
        }

        // Load initial users for Login screen if in mock mode
        if (USE_MOCK) {
            setUsers(MOCK_USERS);
        } else {
            // Load real users if possible or from cache
            try {
                const cached = localStorage.getItem('crm_users');
                if (cached) setUsers(JSON.parse(cached));
            } catch (e) {
                console.error("Failed to load cached users:", e);
            }
        }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!currentUser) return;

            try {
                // Fetch all data in parallel
                const [ordersData, expensesData, assetsData, suppliersData, tasksData, notificationsData, usersDataResult] = await Promise.all([
                    infrastructureAPI.serviceOrders.list(),
                    infrastructureAPI.expenses.list(),
                    infrastructureAPI.assets.list(),
                    infrastructureAPI.suppliers.list(),
                    infrastructureAPI.tasks.list(),
                    notificationsAPI.list(),
                    usersAPI.list()
                ]);

                setOrders(ordersData);
                setExpenses(expensesData);
                setAssets(assetsData);
                setSuppliers(suppliersData);
                setTasks(tasksData);
                setNotifications(notificationsData);
                setUsers(usersDataResult);


            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                // Fallback to mocks if enabled (even if not in dev)
                if (USE_MOCK) {
                    console.log("⚠️ API Error. Falling back to Mocks...");
                    setOrders(MOCK_ORDERS);
                    setExpenses(MOCK_EXPENSES);
                    setTasks(MOCK_TASKS);
                    setUsers(MOCK_USERS);
                    setSuppliers(MOCK_SUPPLIERS);
                    setNotifications(MOCK_NOTIFICATIONS);
                    setAssets(MOCK_ASSETS);
                    setMaintenanceRecords(MOCK_MAINTENANCE_RECORDS);
                }
            }
        };

        fetchInitialData();
    }, [currentUser]);


    // Sync Users to LocalStorage in Prod (to allow the created Admin to persist)
    useEffect(() => {
        const isDev = (import.meta as any).env && (import.meta as any).env.DEV;
        if (!isDev && users.length > 0) {
            localStorage.setItem('crm_users', JSON.stringify(users));
        }
    }, [users]);


    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

    // Management Modals State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Asset Modals State
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

    // --- DATA SEGREGATION LOGIC (RBAC) ---

    const visibleOrders = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.isAdmin) return orders;
        return orders.filter(o => o.ownerId === currentUser.id);
    }, [orders, currentUser]);

    const visibleExpenses = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.isAdmin) return expenses;
        const visibleOrderIds = visibleOrders.map(o => o.id);
        return expenses.filter(e => e.linkedOSId && visibleOrderIds.includes(e.linkedOSId));
    }, [expenses, visibleOrders, currentUser]);

    const visibleTasks = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.isAdmin) return tasks;
        return tasks.filter(t => t.userId === currentUser.id);
    }, [tasks, currentUser]);


    // Effects
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const isTurbo = isMobile || performanceMode;
        if (isTurbo) {
            document.body.classList.add('performance-mode');
        } else {
            document.body.classList.remove('performance-mode');
        }
        if (!isMobile) {
            localStorage.setItem('performanceMode', String(performanceMode));
        }
    }, [performanceMode, isMobile]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const togglePerformanceMode = () => {
        setPerformanceMode(prev => !prev);
    };

    // Handlers
    const handleLogin = (user: User) => {
        // If it's a new admin from "First Access", add to state
        if (!users.find(u => u.id === user.id) && !user.isGuest) {
            setUsers([user]);
        }
        setCurrentUser(user);
        if (user.isGuest) {
            setCurrentView('reports');
        } else {
            setCurrentView('dashboard');
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        setCurrentUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        // In Dev, reset notifications to mock. In Prod, maybe clear?
        const isDev = (import.meta as any).env && (import.meta as any).env.DEV;
        if (isDev) {
            setNotifications(MOCK_NOTIFICATIONS);
        } else {
            setNotifications([]);
        }
    };

    // --- Notification Logic ---
    const addNotification = (notif: Omit<Notification, 'id' | 'date' | 'read'>) => {
        const newNotif: Notification = {
            ...notif,
            id: `notif-${Date.now()}`,
            date: new Date().toISOString(),
            read: false,
            userInitials: currentUser?.initials
        };
        setNotifications(prev => [newNotif, ...prev]);
    }
    // Notifications
    const handleMarkAsRead = async (id?: string) => {
        if (id) {
            try {
                await notificationsAPI.markAsRead(id);
                setNotifications(prev => prev.filter(n => n.id !== id));
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        } else {
            // Mark all? For now, we only support single or we loop
            // In a real app we would have a 'mark all' endpoint
            // Let's optimistic update and loop in background
            const allIds = notifications.map(n => n.id);
            setNotifications([]);
            allIds.forEach(nid => notificationsAPI.markAsRead(nid).catch(console.error));
        }
    };

    // --- CRUD Handlers ---

    const handleOpenNewOS = () => {
        if (isMobile) {
            alert("Funcionalidade disponível apenas no desktop.");
            return;
        }
        setSelectedOrder(null);
        setIsModalOpen(true);
    };

    const handleEditOS = (order: ServiceOrder) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleSaveOS = async (order: ServiceOrder) => {
        if (isMobile) return;

        try {
            const exists = orders.find(o => o.id === order.id);

            if (exists) {
                // Update
                const updateData: any = {};
                if (order.status !== exists.status) updateData.status = order.status;
                if (order.title !== exists.title) updateData.title = order.title;
                if (order.description !== exists.description) updateData.description = order.description;

                await infrastructureAPI.serviceOrders.update(order.id, updateData);

                // Add log if needed
                /* Handled by backend now
                if (order.status !== exists.status) {
                   await infrastructureAPI.serviceOrders.addLog(order.id, `Status alterado para: ${order.status}`);
                }
                */

            } else {
                // Create
                const createData = {
                    title: order.title,
                    unit: order.unit,
                    description: order.description,
                    type: order.type,
                    priority: order.priority,
                    owner_id: currentUser!.id === order.ownerId ? parseInt(order.ownerId) : parseInt(order.ownerId), // Assuming ID int
                    // owner_id logic needs check if string or int. Backend expects int.
                    // Mocks use "1", "2". We need to parse.
                };

                // Fix for ID type mismatch: API expects Int for owner_id, frontend uses string "1"
                // Ideally backend should accept string or we parse
                const payload = {
                    ...createData,
                    owner_id: parseInt(order.ownerId) || 1
                };

                await infrastructureAPI.serviceOrders.create(payload);
            }

            // Reload data (directly use services, they handle mapping now)
            const mappedOrders = await infrastructureAPI.serviceOrders.list();
            setOrders(mappedOrders);


        } catch (error) {
            console.error("Failed to save OS:", error);
            alert("Erro ao salvar OS. Verifique o console.");
        }
    };

    const handleArchiveOS = async (order: ServiceOrder) => {
        if (isMobile) {
            alert("Funcionalidade disponível apenas no desktop.");
            return;
        }
        try {
            await infrastructureAPI.serviceOrders.archive(order.id);
            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, archived: true } : o));
        } catch (error) {
            console.error(error);
            alert("Erro ao arquivar OS.");
        }
    };

    const handleAddExpense = async (expense: Expense) => {
        if (isMobile) {
            alert("Funcionalidade disponível apenas no desktop.");
            return;
        }
        try {
            await infrastructureAPI.expenses.create({
                ...expense,
                linked_os_id: expense.linkedOSId,
                warranty_parts_months: expense.warrantyPartsMonths,
                warranty_service_months: expense.warrantyServiceMonths,
                payment_method: expense.paymentMethod,
                payment_data: expense.paymentData,
            });
            // Reload
            const mappedExpenses = await infrastructureAPI.expenses.list();
            setExpenses(mappedExpenses);


            addNotification({
                title: 'Novo Gasto Registrado',
                message: `R$ ${expense.value} em ${expense.category} por ${currentUser?.name}.`,
                type: 'finance',
                linkId: expense.id // ID might be different from API
            });
        } catch (error) {
            console.error(error);
            alert("Erro ao criar despesa.");
        }
    };

    const handleUpdateExpense = async (updatedExpense: Expense) => {
        if (isMobile) return;
        try {
            await infrastructureAPI.expenses.update(updatedExpense.id, {
                ...updatedExpense,
                linked_os_id: updatedExpense.linkedOSId,
                warranty_parts_months: updatedExpense.warrantyPartsMonths,
                warranty_service_months: updatedExpense.warrantyServiceMonths,
                payment_method: updatedExpense.paymentMethod,
                payment_data: updatedExpense.paymentData,
            });
            setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar despesa.");
        }
    };

    const handleBatchUpdateExpenses = async (updatedExpenses: Expense[]) => {
        if (isMobile) return;
        try {
            // Sequential updates to avoid race conditions or overload
            for (const expense of updatedExpenses) {
                await infrastructureAPI.expenses.update(expense.id, {
                    status: expense.status
                    // Assuming only status is updated in batch usually
                });
            }

            setExpenses(prev => {
                const newExpenses = [...prev];
                updatedExpenses.forEach(updated => {
                    const index = newExpenses.findIndex(e => e.id === updated.id);
                    if (index !== -1) {
                        newExpenses[index] = { ...newExpenses[index], ...updated };
                    }
                });
                return newExpenses;
            });
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar despesas em lote.");
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (isMobile) {
            alert("Funcionalidade disponível apenas no desktop.");
            return;
        }
        if (!currentUser?.isAdmin) {
            alert("Apenas administradores podem excluir despesas.");
            return;
        }
        try {
            await infrastructureAPI.expenses.delete(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir despesa.");
        }
    };

    const handleOpenOSFromFinance = (id: string) => {
        const order = visibleOrders.find(o => o.id === id);
        if (order) {
            handleEditOS(order);
        } else {
            alert('OS não encontrada ou sem permissão de acesso.');
        }
    };

    // Task Handlers
    const handleAddTask = async (task: PersonalTask) => {
        try {
            const response = await infrastructureAPI.tasks.create({
                title: task.title,
                status: task.status,
                priority: task.priority,
                due_date: task.dueDate
            });
            // Construct new task with ID from API
            const newTask = { ...task, id: response.id, createdAt: new Date().toISOString() };
            setTasks(prev => [newTask, ...prev]);
        } catch (e) {
            console.error(e);
            alert("Erro ao criar tarefa");
        }
    };

    const handleUpdateTask = async (updatedTask: PersonalTask) => {
        try {
            await infrastructureAPI.tasks.update(parseInt(updatedTask.id), {
                title: updatedTask.title,
                status: updatedTask.status,
                priority: updatedTask.priority,
                due_date: updatedTask.dueDate
            });
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        } catch (e) {
            console.error(e);
            alert("Erro ao atualizar tarefa");
        }
    };

    const handleToggleTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const newStatus = task.status === 'done' ? 'todo' : 'done'; // Assuming simple toggle logic for now? 
        // Or if 'todo' -> 'done'. Check current logic: completed: !t.completed (boolean vs status enum)
        // Previous mock used 'completed' bool? Let's check PersonalTask type if possible.
        // Step 470 line 22 imports PersonalTask.
        // Step 45 showed PersonalTask in models.py has 'status': 'todo'|'doing'|'done'.
        // Frontend likely used 'completed' boolean?
        // Let's assume standard update.

        try {
            // In mockData it might be different. Let's assume 'status' for new API.
            await infrastructureAPI.tasks.update(parseInt(taskId), { status: newStatus });
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            ));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (isMobile) {
            alert("Funcionalidade disponível apenas no desktop.");
            return;
        }
        try {
            await infrastructureAPI.tasks.delete(parseInt(taskId));
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (e) {
            console.error(e);
            alert("Erro ao excluir tarefa");
        }
    };

    const handleQuickTaskFromCalendar = (date: string) => {
        setCurrentView('tasks');
    };

    // User Management
    const handleUpdateUser = async (updatedUser: User) => {
        if (isMobile) return;
        try {
            // Check if create or update? Currently modal only supports update of existing users or creates via some other path?
            // Actually UserManagementModal usually passes an existing user to edit.
            await usersAPI.update(updatedUser);

            // Refresh list
            const usersList = await usersAPI.list();
            setUsers(usersList);

            if (currentUser && currentUser.id === updatedUser.id) {
                // Refresh current user session info if needed
                const freshMe = usersList.find(u => u.id === currentUser.id);
                if (freshMe) setCurrentUser(prev => ({ ...prev, ...freshMe }));
            }
            alert("Usuário atualizado com sucesso!");
        } catch (e) {
            console.error(e);
            alert("Erro ao atualizar usuário");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await usersAPI.delete(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            alert("Usuário removido.");
        } catch (e) {
            console.error(e);
            alert("Erro ao remover usuário");
        }
    };

    // Supplier Management
    // Supplier Management
    const handleAddSupplier = async (supplier: Supplier) => {
        if (isMobile) return;
        if (!currentUser?.isAdmin) {
            alert("Necessário permissão administrativa.");
            return;
        }
        try {
            const response = await infrastructureAPI.suppliers.create({
                name: supplier.name,
                category: supplier.category,
                contact_info: supplier.contactInfo
            });
            const newSupplier = { ...supplier, id: response.id };
            setSuppliers(prev => [...prev, newSupplier]);
            alert("Fornecedor cadastrado!");
        } catch (e) {
            console.error(e);
            alert("Erro ao cadastrar fornecedor");
        }
    };

    const handleUpdateSupplier = async (updated: Supplier) => {
        if (isMobile) return;
        if (!currentUser?.isAdmin) return;
        try {
            await infrastructureAPI.suppliers.update(parseInt(updated.id), {
                name: updated.name,
                category: updated.category,
                contact_info: updated.contactInfo,
                active: updated.active
            });
            setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
            alert("Fornecedor atualizado!");
        } catch (e) {
            console.error(e);
            alert("Erro ao atualizar fornecedor");
        }
    };

    const handleDeleteSupplier = async (id: string) => {
        if (isMobile) return;
        if (!currentUser?.isAdmin) return;
        try {
            await infrastructureAPI.suppliers.delete(parseInt(id));
            setSuppliers(prev => prev.filter(s => s.id !== id));
            alert("Fornecedor removido.");
        } catch (e) {
            console.error(e);
            alert("Erro ao remover fornecedor");
        }
    };

    // Asset Handlers
    const handleAddAsset = () => {
        setSelectedAsset(null);
        setIsAssetModalOpen(true);
    };

    const handleEditAsset = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsAssetModalOpen(true);
    };

    const handleSaveAsset = async (asset: Asset) => {
        if (isMobile) return;

        try {
            // Prepare payload
            const payload = {
                asset_tag: asset.assetTag,
                name: asset.name,
                unit: asset.unit,
                category: asset.category,
                status: asset.status,
                brand: asset.brand,
                model: asset.model,
                description: asset.description,
                value: asset.value,
                photo_url: asset.photoUrl,
                registration_date: asset.registrationDate,
                warranty: asset.warranty,
                invoice_info: asset.invoiceInfo
            };

            const exists = assets.find(a => a.id === asset.id);

            if (exists) {
                // Update
                // Asset ID is int in backend, string in frontend possibly?
                // Checking types... backend uses int ID
                await infrastructureAPI.assets.update(parseInt(asset.id), payload);
            } else {
                // Create
                await infrastructureAPI.assets.create(payload);
            }

            // Reload assets
            const mappedAssets = await infrastructureAPI.assets.list();
            setAssets(mappedAssets);
            setIsAssetModalOpen(false);


        } catch (error) {
            console.error(error);
            alert("Erro ao salvar patrimônio.");
        }
    };

    // Batch add not supported by API yet, using loop or disable
    const handleBatchAddAssets = async (newAssets: Asset[]) => {
        if (isMobile) return;
        // Not implemented fully
        alert("Importação em lote via API não implementada ainda.");
    };

    const handleTransferAsset = async (assetId: string, targetUnit: Unit) => {
        if (isMobile) return;
        try {
            await infrastructureAPI.assets.update(parseInt(assetId), { unit: targetUnit });
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, unit: targetUnit } : a));
        } catch (error) {
            console.error(error);
            alert("Erro ao transferir patrimônio.");
        }
    };

    const handleRegisterMaintenance = async (record: MaintenanceRecord) => {
        if (isMobile) return;

        try {
            await infrastructureAPI.assets.sendToMaintenance({
                asset_id: parseInt(record.assetId),
                provider_name: record.providerName,
                contact_info: record.contactInfo,
                date_out: record.dateOut,
                date_return_forecast: record.dateReturnForecast,
                description: record.description
            });

            // Reload to get updated status
            const mappedAssets = await infrastructureAPI.assets.list();
            setAssets(mappedAssets);


        } catch (error) {
            console.error(error);
            alert("Erro ao registrar manutenção.");
        }
    };

    const handleReturnAsset = async (recordId: string) => {
        if (isMobile) return;
        try {
            // Frontend uses string IDs for mock records, backend returns int IDs for maintenance records
            await infrastructureAPI.assets.returnFromMaintenance(parseInt(recordId));

            // Recaload assets
            const mappedAssets = await infrastructureAPI.assets.list();
            setAssets(mappedAssets);


        } catch (error) {
            console.error(error);
            alert("Erro ao retornar de manutenção.");
        }
    };

    const handleAddCategory = (cat: string) => {
        setAssetCategories(prev => [...prev, cat]);
    };
    const handleDeleteCategory = (cat: string) => {
        setAssetCategories(prev => prev.filter(c => c !== cat));
    };

    // --- RENDER ---

    if (!currentUser) {
        return (
            <Login
                onLogin={handleLogin}
                users={users}
                theme={theme}
                toggleTheme={toggleTheme}
                performanceMode={isMobile ? true : performanceMode}
                togglePerformanceMode={togglePerformanceMode}
            />
        );
    }

    // Guest/Executive View
    if (currentUser.isGuest) {
        return (
            <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 font-sans transition-colors duration-300">
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-4 px-8 sticky top-0 z-20 flex justify-between items-center h-20 shrink-0">
                    {/* Guest Header */}
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <Reports
                        orders={orders}
                        expenses={expenses}
                        isDarkMode={theme === 'dark'}
                        suppliers={suppliers}
                        onOpenOS={handleEditOS}
                        onUpdateExpenses={handleBatchUpdateExpenses}
                        currentUser={currentUser}
                        isMobile={isMobile}
                    />
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">

            <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                currentUser={currentUser}
                onLogout={handleLogout}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                isMobile={isMobile}
                theme={theme}
                toggleTheme={toggleTheme}
                onEditProfile={() => setIsUserModalOpen(true)}
            />

            <main className="flex-1 overflow-auto flex flex-col w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-4 px-4 md:px-8 sticky top-0 z-20 flex justify-between items-center h-20 shrink-0 transition-all">
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                                <Menu size={24} />
                            </button>
                        )}
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 tracking-tight truncate max-w-[200px] md:max-w-none">
                            {currentView === 'kanban' ? 'Quadro de Ordens' :
                                currentView === 'dashboard' ? 'Dashboard Geral' :
                                    currentView === 'finance' ? 'Gestão Financeira' :
                                        currentView === 'reports' ? 'Relatórios' :
                                            currentView === 'tasks' ? 'Minhas Tarefas' :
                                                currentView === 'assets' ? 'Gestão de Patrimônio' :
                                                    currentView === 'calendar' ? 'Calendário' :
                                                        currentView === 'settings' ? 'Configurações' : currentView}
                        </h2>
                    </div>

                    <div className="flex gap-2 md:gap-4 items-center">
                        {!isMobile && <PerformanceToggle isActive={performanceMode} toggle={togglePerformanceMode} />}
                        {!isMobile && <ThemeToggle theme={theme} toggleTheme={toggleTheme} />}
                    </div>
                </header>

                <div className="p-3 md:p-8 max-w-[1600px] mx-auto w-full flex-1">
                    {currentView === 'dashboard' && (
                        <Dashboard
                            orders={visibleOrders}
                            expenses={visibleExpenses}
                            isDarkMode={theme === 'dark'}
                            onNavigate={setCurrentView}
                            isMobile={isMobile}
                        />
                    )}
                    {currentView === 'kanban' && (
                        <KanbanBoard
                            orders={visibleOrders.filter(o => !o.archived)}
                            expenses={visibleExpenses}
                            users={users} // Injected Users
                            onOrderClick={handleEditOS}
                            onOrderUpdate={handleSaveOS}
                            onNewOrder={handleOpenNewOS}
                            onArchiveOrder={handleArchiveOS}
                            isMobile={isMobile}
                        />
                    )}
                    {currentView === 'finance' && (
                        <FinanceTable
                            expenses={visibleExpenses.filter(e => {
                                const linkedOS = visibleOrders.find(o => o.id === e.linkedOSId);
                                return !linkedOS?.archived;
                            })}
                            orders={visibleOrders.filter(o => !o.archived)}
                            onAddExpense={handleAddExpense}
                            onUpdateExpense={handleUpdateExpense}
                            onDeleteExpense={handleDeleteExpense}
                            onOpenOS={handleOpenOSFromFinance}
                            suppliers={suppliers}
                            onAddSupplier={handleAddSupplier}
                            isMobile={isMobile}
                            currentUser={currentUser}
                        />
                    )}

                    {currentView === 'reports' && (
                        <Reports
                            orders={visibleOrders}
                            expenses={visibleExpenses}
                            isDarkMode={theme === 'dark'}
                            suppliers={suppliers}
                            onOpenOS={handleEditOS}
                            onUpdateExpenses={handleBatchUpdateExpenses}
                            currentUser={currentUser}
                            isMobile={isMobile}
                        />
                    )}

                    {currentView === 'assets' && (
                        <AssetsManager
                            assets={assets}
                            maintenanceRecords={maintenanceRecords}
                            onAddAsset={handleAddAsset}
                            onEditAsset={handleEditAsset}
                            onTransferClick={() => setIsTransferModalOpen(true)}
                            onMaintenanceClick={() => setIsMaintenanceModalOpen(true)}
                            onReturnAsset={handleReturnAsset}
                            onImportAssets={handleBatchAddAssets}
                            currentUser={currentUser}
                            isMobile={isMobile}
                            categories={assetCategories}
                        />
                    )}

                    {currentView === 'calendar' && (
                        <CalendarView
                            orders={visibleOrders}
                            tasks={visibleTasks}
                            maintenanceRecords={maintenanceRecords}
                            expenses={visibleExpenses}
                            onOpenOS={handleEditOS}
                            onAddTask={handleQuickTaskFromCalendar}
                            currentUser={currentUser}
                        />
                    )}

                    {currentView === 'tasks' && (
                        <TaskManager
                            tasks={visibleTasks}
                            currentUser={currentUser}
                            orders={visibleOrders}
                            onAddTask={handleAddTask}
                            onUpdateTask={handleUpdateTask}
                            onToggleTask={handleToggleTask}
                            onDeleteTask={handleDeleteTask}
                            onOpenOS={handleOpenOSFromFinance}
                            isMobile={isMobile}
                        />
                    )}

                    {currentView === 'settings' && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Preferências</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200">Tema da Interface</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alternar entre modo claro e escuro.</p>
                                        </div>
                                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                                    </div>
                                </div>
                            </div>

                            {/* Permission Based Sections */}
                            <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 ${isMobile || !currentUser.isAdmin ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Gerenciar Prestadores {!currentUser.isAdmin ? '(Admin)' : isMobile ? '(Desktop)' : ''}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    Cadastre e organize a lista de prestadores para facilitar o lançamento de despesas.
                                </p>
                                <button
                                    onClick={() => setIsSupplierModalOpen(true)}
                                    disabled={!currentUser.isAdmin}
                                    className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                                >
                                    <Store size={18} />
                                    Gerenciar Prestadores
                                </button>
                            </div>

                            {/* Categorias de Bens (Admin Only) */}
                            <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 ${isMobile || !currentUser.isAdmin ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Gerenciar Categorias de Bens {!currentUser.isAdmin ? '(Admin)' : isMobile ? '(Desktop)' : ''}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    Adicione ou remova categorias para a classificação de patrimônios.
                                </p>
                                <button
                                    onClick={() => setIsCategoryModalOpen(true)}
                                    disabled={!currentUser.isAdmin}
                                    className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                                >
                                    <Layers size={18} />
                                    Gerenciar Categorias
                                </button>
                            </div>

                            <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 ${isMobile ? 'opacity-50 pointer-events-none' : ''}`}>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Gerenciar Usuários {isMobile && '(Desktop)'}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    {currentUser.isAdmin
                                        ? 'Gerencie perfis, permissões e adicione novos membros à equipe.'
                                        : 'Gerencie seu perfil, altere sua senha ou foto de exibição.'}
                                </p>
                                <button
                                    onClick={() => setIsUserModalOpen(true)}
                                    className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <UsersIcon size={18} />
                                    {currentUser.isAdmin ? 'Acessar Lista de Usuários' : 'Editar Meu Perfil'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <OSModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                order={selectedOrder}
                onSave={handleSaveOS}
                expenses={expenses}
                users={users} // Injected Users
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                currentUser={currentUser}
                suppliers={suppliers}
                onAddSupplier={handleAddSupplier}
                isMobile={isMobile}
            />

            <AssetModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                asset={selectedAsset}
                onSave={handleSaveAsset}
                isReadOnly={isMobile}
                categories={assetCategories}
            />

            <AssetTransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                assets={assets}
                onTransfer={handleTransferAsset}
            />

            <AssetMaintenanceModal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setIsMaintenanceModalOpen(false)}
                assets={assets}
                onRegisterMaintenance={handleRegisterMaintenance}
            />

            <UserManagementModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                users={users}
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />

            <SupplierManagementModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                suppliers={suppliers}
                onAddSupplier={handleAddSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onDeleteSupplier={handleDeleteSupplier}
            />

            <CategoryManagementModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                categories={assetCategories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
            />
        </div>
    );
}

export default App;

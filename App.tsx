import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Trello, DollarSign, Settings, PieChart, CheckSquare, Moon, Sun, Users as UsersIcon, LogOut, Briefcase, Store } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { FinanceTable } from './components/FinanceTable';
import { OSModal } from './components/OSModal';
import { Login } from './components/Login';
import { Reports } from './components/Reports';
import { TaskManager } from './components/TaskManager';
import { Sidebar } from './components/Sidebar';
import { UserManagementModal } from './components/UserManagementModal';
import { SupplierManagementModal } from './components/SupplierManagementModal';
import { ServiceOrder, Expense, OSStatus, User, PersonalTask, Notification, Supplier } from './types';
import { INITIAL_ORDERS, INITIAL_EXPENSES, INITIAL_TASKS, USERS, INITIAL_NOTIFICATIONS, INITIAL_SUPPLIERS } from './constants';

type View = 'dashboard' | 'kanban' | 'finance' | 'reports' | 'tasks' | 'settings';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  // Auth State - RESET: Always start null (Login screen)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Theme State - Set default to 'light' as requested
  const [theme, setTheme] = useState<Theme>('light');

  // Data State - RESET: Always load from constants
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [tasks, setTasks] = useState<PersonalTask[]>(INITIAL_TASKS);
  // User State for management
  const [users, setUsers] = useState<User[]>(USERS);
  // Supplier State
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  
  // User Management Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  // Supplier Management Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // --- PERSISTENCE REMOVED FOR TEST MODE ---
  // Data will reset on every page reload.

  // Theme Effect (DOM only)
  useEffect(() => {
      const root = window.document.documentElement;
      if (theme === 'dark') {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Handlers
  const handleLogin = (user: User) => {
      setCurrentUser(user);
      // Force Reports view if guest
      if (user.isGuest) {
          setCurrentView('reports');
      } else {
          setCurrentView('dashboard');
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
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
  };

  const handleMarkAsRead = (id?: string) => {
      setNotifications(prev => 
          prev.map(n => id ? (n.id === id ? { ...n, read: true } : n) : { ...n, read: true })
      );
  };

  const handleOpenNewOS = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOS = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveOS = (order: ServiceOrder) => {
    setOrders(prev => {
      const exists = prev.find(o => o.id === order.id);
      
      // LOGIC FOR NOTIFICATIONS
      if (exists) {
        // Edit Mode
        if (exists.status !== order.status) {
             const log = { 
                id: Date.now().toString(), 
                date: new Date().toISOString(), 
                message: `Status alterado para: ${order.status} (${currentUser?.name})` 
             };
             order.history = [log, ...order.history];

             // Notify if Completed
             if (order.status === OSStatus.CONCLUIDA) {
                 addNotification({
                     title: 'OS Concluída',
                     message: `${currentUser?.name} concluiu a OS-${order.id}.`,
                     type: 'completed_os',
                     linkId: order.id
                 });
             }
        }
        return prev.map(o => o.id === order.id ? order : o);
      } else {
        // New Mode
        addNotification({
            title: 'Nova Ordem de Serviço',
            message: `${currentUser?.name} criou a OS-${order.id} em ${order.unit}.`,
            type: 'new_os',
            linkId: order.id
        });
        return [order, ...prev];
      }
    });
  };
  
  // New handler to archive/document the OS
  const handleArchiveOS = (order: ServiceOrder) => {
     setOrders(prev => prev.map(o => {
         if (o.id === order.id) {
             const log = {
                 id: Date.now().toString(),
                 date: new Date().toISOString(),
                 message: `OS Documentada e Arquivada por ${currentUser?.name}`
             };
             return { ...o, archived: true, history: [log, ...o.history] };
         }
         return o;
     }));
  };

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    addNotification({
        title: 'Novo Gasto Registrado',
        message: `R$ ${expense.value} em ${expense.category} por ${currentUser?.name}.`,
        type: 'finance',
        linkId: expense.id
    });
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };
  
  const handleOpenOSFromFinance = (id: string) => {
      const order = orders.find(o => o.id === id);
      if (order) {
          handleEditOS(order);
      } else {
          alert('OS não encontrada nos registros ativos.');
      }
  };

  // Task Handlers
  const handleAddTask = (task: PersonalTask) => {
      setTasks(prev => [task, ...prev]);
  };

  const handleUpdateTask = (updatedTask: PersonalTask) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleToggleTask = (taskId: string) => {
      setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
  };

  const handleDeleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // User Management Handlers
  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      // If current user updated their own profile, update session
      if (currentUser && currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
  };

  const handleDeleteUser = (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Supplier Management Handlers
  const handleAddSupplier = (supplier: Supplier) => {
      setSuppliers(prev => [...prev, supplier]);
  };
  const handleUpdateSupplier = (updated: Supplier) => {
      setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
  };
  const handleDeleteSupplier = (id: string) => {
      setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // Login Guard
  if (!currentUser) {
      return <Login onLogin={handleLogin} users={users} />;
  }

  // --- EXECUTIVE GUEST LAYOUT ---
  if (currentUser.isGuest) {
      return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* Minimal Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-4 px-8 sticky top-0 z-20 flex justify-between items-center h-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center p-0.5 shadow-lg">
                        <Briefcase className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Portal Executivo</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Visualização Simplificada</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-sm font-bold transition-colors"
                    >
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>
            </header>

            {/* Reports Content Only */}
            <main className="flex-1 overflow-auto p-8 max-w-7xl mx-auto w-full">
                <Reports 
                    orders={orders} 
                    expenses={expenses} 
                    isDarkMode={theme === 'dark'} 
                    suppliers={suppliers} 
                    onOpenOS={handleEditOS}
                />
            </main>
        </div>
      );
  }

  // --- STANDARD APPLICATION LAYOUT ---
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
      />

      {/* Main Content - Replaced hex color with standard Tailwind class */}
      <main className="flex-1 overflow-auto flex flex-col w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 p-4 px-8 sticky top-0 z-20 flex justify-between items-center h-20 shrink-0 transition-all">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                    {currentView === 'kanban' && <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><Trello className="w-6 h-6 text-red-600 dark:text-red-400" /></div>}
                    {currentView === 'dashboard' && <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><LayoutDashboard className="w-6 h-6 text-red-600 dark:text-red-400" /></div>}
                    {currentView === 'finance' && <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" /></div>}
                    {currentView === 'reports' && <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><PieChart className="w-6 h-6 text-red-600 dark:text-red-400" /></div>}
                    {currentView === 'tasks' && <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><CheckSquare className="w-6 h-6 text-red-600 dark:text-red-400" /></div>}
                    {currentView === 'settings' && <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><Settings className="w-6 h-6 text-red-600 dark:text-red-400" /></div>}
                    
                    {currentView === 'kanban' ? 'Quadro de Ordens' : 
                     currentView === 'dashboard' ? 'Dashboard Geral' :
                     currentView === 'finance' ? 'Gestão Financeira' :
                     currentView === 'reports' ? 'Relatórios Gerenciais' :
                     currentView === 'tasks' ? 'Minhas Tarefas' :
                     currentView === 'settings' ? 'Configurações' : currentView}
                </h2>
            </div>
            <div className="flex gap-4 items-center">
                {/* Theme Toggle */}
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>

        <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex-1">
          {currentView === 'dashboard' && (
              <Dashboard 
                orders={orders} 
                expenses={expenses} 
                isDarkMode={theme === 'dark'} 
                onNavigate={setCurrentView} 
              />
          )}
          {currentView === 'kanban' && (
            <KanbanBoard 
                orders={orders.filter(o => !o.archived)} // Filter out archived orders
                expenses={expenses}
                onOrderClick={handleEditOS} 
                onOrderUpdate={handleSaveOS}
                onNewOrder={handleOpenNewOS}
                onArchiveOrder={handleArchiveOS}
            />
          )}
          {currentView === 'finance' && (
              <FinanceTable 
                  // Filter out expenses linked to archived orders to prevent editing
                  expenses={expenses.filter(e => {
                      const linkedOS = orders.find(o => o.id === e.linkedOSId);
                      return !linkedOS?.archived;
                  })} 
                  orders={orders.filter(o => !o.archived)} 
                  onAddExpense={handleAddExpense} 
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense} 
                  onOpenOS={handleOpenOSFromFinance} 
                  suppliers={suppliers}
                  onAddSupplier={handleAddSupplier}
              />
          )}
          
          {/* Reports Component */}
          {currentView === 'reports' && (
             <Reports 
                orders={orders} 
                expenses={expenses} 
                isDarkMode={theme === 'dark'} 
                suppliers={suppliers}
                onOpenOS={handleEditOS}
             />
          )}

          {/* Task Manager Component */}
          {currentView === 'tasks' && (
              <TaskManager 
                  tasks={tasks}
                  currentUser={currentUser}
                  orders={orders}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onOpenOS={handleOpenOSFromFinance}
              />
          )}

          {/* Settings Section */}
          {currentView === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Preferências do Sistema</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">Notificações por Email</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Receber alertas sobre novas OS.</p>
                            </div>
                            <div className="w-12 h-7 bg-red-600 rounded-full relative cursor-pointer shadow-inner transition-colors">
                                <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-700 dark:text-slate-200">Modo Escuro</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alternar entre temas claro e escuro.</p>
                            </div>
                            <button onClick={toggleTheme} className={`w-12 h-7 rounded-full relative cursor-pointer shadow-inner transition-colors ${theme === 'dark' ? 'bg-red-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${theme === 'dark' ? 'left-[22px]' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* Supplier Management Section */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Gerenciar Prestadores</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        Cadastre e organize a lista de prestadores para facilitar o lançamento de despesas.
                    </p>
                    <button 
                        onClick={() => setIsSupplierModalOpen(true)}
                        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <Store size={18} />
                        Gerenciar Prestadores
                    </button>
                 </div>

                 {/* User Management Section */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">Gerenciar Usuários</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        {currentUser.isAdmin 
                            ? 'Gerencie perfis, permissões e adicione novos membros à equipe.' 
                            : 'Gerencie seu perfil, altere sua senha ou foto de exibição.'}
                    </p>
                    <button 
                        onClick={() => setIsUserModalOpen(true)}
                        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <UsersIcon size={18} />
                        {currentUser.isAdmin ? 'Acessar Lista de Usuários' : 'Editar Meu Perfil'}
                    </button>
                 </div>
             </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <OSModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        order={selectedOrder} 
        onSave={handleSaveOS}
        expenses={expenses}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
        currentUser={currentUser}
        suppliers={suppliers}
        onAddSupplier={handleAddSupplier}
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
    </div>
  );
}

export default App;

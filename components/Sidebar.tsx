import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Trello, DollarSign, Settings, LogOut, FileText, ChevronLeft, ChevronRight, CheckSquare, Bell, CheckCircle2, AlertCircle, FileCheck } from 'lucide-react';
import { User, Notification, NotificationType } from '../types';

type View = 'dashboard' | 'kanban' | 'finance' | 'reports' | 'tasks' | 'settings';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  currentUser: User;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id?: string) => void;
}

const SidebarBtn = ({ view, icon: Icon, label, currentView, setCurrentView, isCollapsed }: { view: View, icon: any, label: string, currentView: View, setCurrentView: (v: View) => void, isCollapsed: boolean }) => {
  const isActive = currentView === view;
  return (
    <button
      onClick={() => setCurrentView(view)}
      title={isCollapsed ? label : ''}
      className={`
            w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 group relative mb-1.5
            ${isActive
          ? 'bg-red-600 text-white shadow-lg shadow-red-500/20 translate-x-1'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'}
            ${isCollapsed ? 'justify-center px-0' : ''}
        `}
    >
      <Icon size={20} className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

      {!isCollapsed && (
        <span className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 origin-left ${isActive ? 'font-bold' : ''}`}>
          {label}
        </span>
      )}
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    setCurrentView, 
    isCollapsed, 
    setIsCollapsed, 
    currentUser, 
    onLogout, 
    notifications, 
    onMarkAsRead 
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'new_os' | 'completed_os' | 'finance'>('all');
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close notifications on click outside
  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Logic
  const filteredNotifications = notifications.filter(n => {
      if (activeTab === 'all') return true;
      if (activeTab === 'new_os') return n.type === 'new_os';
      if (activeTab === 'completed_os') return n.type === 'completed_os';
      if (activeTab === 'finance') return n.type === 'finance';
      return true;
  });

  const getIcon = (type: NotificationType) => {
      switch(type) {
          case 'new_os': return <AlertCircle size={16} className="text-blue-500" />;
          case 'completed_os': return <CheckCircle2 size={16} className="text-emerald-500" />;
          case 'finance': return <DollarSign size={16} className="text-amber-500" />;
          default: return <Bell size={16} className="text-slate-500" />;
      }
  };

  const getTimeAgo = (dateStr: string) => {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h`;
      return `${Math.floor(hours / 24)}d`;
  };

  return (
    <aside
      className={`
            flex flex-col shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] z-30 relative 
            border-r border-slate-200/60 dark:border-slate-800/60
            bg-white dark:bg-slate-900
            ${isCollapsed ? 'w-[90px]' : 'w-[280px]'}
        `}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md hover:scale-110 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
      </button>

      {/* Brand Header */}
      <div className={`p-6 flex items-center mb-2 transition-all duration-500 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center p-0.5 shadow-lg shrink-0 group hover:scale-105 transition-transform">
          <div className="bg-white w-full h-full rounded-[10px] flex items-center justify-center p-1">
            <img
              src="https://menubrands.com.br/wp-content/uploads/2020/04/Menu.png"
              alt="MenuBrands"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {!isCollapsed && (
          <div className="ml-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="font-bold text-lg tracking-tight leading-none text-slate-800 dark:text-white">MenuBrands</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-wide">Infra CRM <span className="text-red-500">v1.0</span></p>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 py-4">
        {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2 pl-3">Menu Principal</p>}
        <SidebarBtn view="dashboard" icon={LayoutDashboard} label="Dashboard" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
        <SidebarBtn view="kanban" icon={Trello} label="Quadro de Ordens" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
        <SidebarBtn view="tasks" icon={CheckSquare} label="Minhas Tarefas" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
        <SidebarBtn view="finance" icon={DollarSign} label="Finanças" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
        <SidebarBtn view="reports" icon={FileText} label="Relatórios" currentView={currentView} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
      </div>

      {/* Bottom Section */}
      <div className="p-4 mt-auto space-y-3">
        
        {/* --- NOTIFICATIONS SECTION --- */}
        <div className="relative" ref={notificationRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group
                    ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                    ${isCollapsed ? 'justify-center' : ''}
                `}
                title="Notificações"
            >
                <div className="relative">
                    <Bell size={20} className={unreadCount > 0 ? "animate-pulse-slow" : ""} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm border border-white dark:border-slate-900">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {!isCollapsed && <span className="text-sm font-medium">Notificações</span>}
            </button>

            {/* Notification Panel (Popover) */}
            {showNotifications && (
                <div className="absolute left-full bottom-0 ml-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in zoom-in-95 slide-in-from-left-4 duration-200">
                    {/* Header */}
                    <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                        <h4 className="font-bold text-slate-800 dark:text-white">Notificações</h4>
                        <button onClick={() => onMarkAsRead()} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 uppercase tracking-wide">
                            Marcar lidas
                        </button>
                    </div>

                    {/* Categories Tabs */}
                    <div className="flex items-center gap-1 p-2 bg-white dark:bg-slate-900 border-b dark:border-slate-800 overflow-x-auto scrollbar-hide">
                        <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>Geral</button>
                        <button onClick={() => setActiveTab('new_os')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'new_os' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50'}`}>Novas OS</button>
                        <button onClick={() => setActiveTab('completed_os')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'completed_os' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50'}`}>Concluídas</button>
                        <button onClick={() => setActiveTab('finance')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'finance' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:bg-slate-50'}`}>Finanças</button>
                    </div>

                    {/* List */}
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {filteredNotifications.length > 0 ? (
                            <div className="divide-y dark:divide-slate-800">
                                {filteredNotifications.map(notif => (
                                    <div 
                                        key={notif.id} 
                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 relative group ${!notif.read ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
                                        onClick={() => onMarkAsRead(notif.id)}
                                    >
                                        {!notif.read && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-red-500"></div>
                                        )}
                                        
                                        <div className={`p-2 rounded-xl h-fit shrink-0 ${
                                            notif.type === 'new_os' ? 'bg-blue-100 dark:bg-blue-900/20' : 
                                            notif.type === 'completed_os' ? 'bg-emerald-100 dark:bg-emerald-900/20' : 
                                            notif.type === 'finance' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-800'
                                        }`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{notif.title}</h5>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{getTimeAgo(notif.date)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            {notif.linkId && (
                                                <span className="inline-block mt-2 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-500">
                                                    #{notif.linkId}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs">Nenhuma notificação nesta categoria.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className={`rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-2 transition-all duration-500 ${isCollapsed ? 'bg-transparent border-transparent p-0' : ''}`}>

          {/* Settings Link */}
          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 ${currentView === 'settings' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : ''} ${isCollapsed ? 'justify-center' : ''}`}
            title="Configurações"
          >
            <Settings size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
          </button>

          {/* Divider */}
          {!isCollapsed && <div className="h-px bg-slate-200 dark:bg-slate-700 my-2 mx-2"></div>}

          {/* Profile Card */}
          <div className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${!isCollapsed ? 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm' : 'justify-center mt-2'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${!currentUser.avatarUrl ? currentUser.color : 'bg-gray-200 dark:bg-slate-700'} text-white shadow-md ring-2 ring-white dark:ring-slate-700`}>
              {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.initials} className="w-full h-full object-cover" />
              ) : (
                  currentUser.initials
              )}
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-800 dark:text-white leading-tight">{currentUser.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium">Online</p>
                </div>
              </div>
            )}

            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Collapsed Logout */}
        {isCollapsed && (
          <button
            onClick={onLogout}
            className="w-full mt-2 p-3 text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </aside>
  );
};
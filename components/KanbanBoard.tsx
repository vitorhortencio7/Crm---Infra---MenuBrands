import React, { useState, useMemo } from 'react';
import { ServiceOrder, OSStatus, OSPriority, Unit, OSType, Expense } from '../types';
import { USERS } from '../constants';
import { MapPin, Filter, PlusCircle, Wrench, Users, LayoutGrid, List, ChevronRight, Clock, CheckCircle2, Check, CalendarDays, XCircle, FileCheck } from 'lucide-react';
import { DocumentModal } from './DocumentModal';
import { getPriorityColor, getStatusBadge, getTypeBadgeStyle, formatCurrency, formatDate } from '../utils';
import { SortableHeader } from './SortableHeader';

interface KanbanBoardProps {
  orders: ServiceOrder[];
  expenses: Expense[];
  onOrderClick: (order: ServiceOrder) => void;
  onOrderUpdate: (order: ServiceOrder) => void;
  onNewOrder: () => void;
  onArchiveOrder: (order: ServiceOrder) => void;
}

// Updated Column Structure with High Contrast Dark Mode Colors and "Glow" effects
const BOARD_COLUMNS = [
  { 
    id: 'col_aberta',
    label: 'Aberta', 
    statuses: [OSStatus.ABERTA],
    // Blue: Brighter text, subtler background in dark mode, blue glow border
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)]', 
    dot: 'bg-blue-500 dark:bg-blue-400 dark:shadow-[0_0_10px_rgba(59,130,246,0.8)]', 
    text: 'text-blue-800 dark:text-blue-100 font-bold' 
  },
  { 
    id: 'col_analise', 
    label: 'Sob Análise', 
    statuses: [OSStatus.AGUARDANDO],
    // Orange: Brighter text, orange glow
    color: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800 dark:shadow-[0_0_15px_-3px_rgba(234,88,12,0.3)]', 
    dot: 'bg-orange-500 dark:bg-orange-400 dark:shadow-[0_0_10px_rgba(249,115,22,0.8)]', 
    text: 'text-orange-800 dark:text-orange-100 font-bold' 
  },
  { 
    id: 'col_progresso', 
    label: 'Em Progresso', 
    statuses: [OSStatus.EM_ANDAMENTO],
    // Purple (Lilás): Changed from Yellow to Purple as requested
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 dark:shadow-[0_0_15px_-3px_rgba(147,51,234,0.3)]', 
    dot: 'bg-purple-500 dark:bg-purple-400 dark:shadow-[0_0_10px_rgba(168,85,247,0.8)]', 
    text: 'text-purple-800 dark:text-purple-100 font-bold' 
  },
  { 
    id: 'col_encerradas', 
    label: 'Encerradas', 
    statuses: [OSStatus.CONCLUIDA, OSStatus.CANCELADA],
    // Green: Changed from Slate to Emerald/Green as requested
    color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:shadow-[0_0_15px_-3px_rgba(5,150,105,0.3)]', 
    dot: 'bg-emerald-500 dark:bg-emerald-400 dark:shadow-[0_0_10px_rgba(52,211,153,0.8)]', 
    text: 'text-emerald-800 dark:text-emerald-100 font-bold' 
  },
];

const UNIT_FILTERS = [
  { label: 'Aldeota', value: Unit.ALDEOTA, color: 'text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50' },
  { label: 'Estoque', value: Unit.ESTOQUE, color: 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80' },
  { label: 'Fábrica', value: Unit.FABRICA, color: 'text-orange-700 dark:text-orange-200 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50' },
  { label: 'Cambeba', value: Unit.CAMBEBA, color: 'text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' },
  { label: 'Parquelândia', value: Unit.PARQUELANDIA, color: 'text-sky-700 dark:text-sky-200 bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50' },
  { label: 'Eusébio', value: Unit.EUSEBIO, color: 'text-purple-700 dark:text-purple-200 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50' },
  { label: 'Administrativo', value: Unit.ADMINISTRATIVO, color: 'text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50' },
  { label: 'Poke', value: Unit.POKE, color: 'text-pink-700 dark:text-pink-200 bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/50' },
];

const TYPE_FILTERS = [
  { label: 'Manutenção Preventiva', value: OSType.PREVENTIVA },
  { label: 'Manutenção Corretiva', value: OSType.CORRETIVA },
  { label: 'Instalação', value: OSType.INSTALACAO },
];

// Helper to calculate days between dates
const calculateDuration = (start: string, end?: string) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
};

// Priority Weight for Sorting
const PRIORITY_WEIGHT = {
  [OSPriority.ALTA]: 3,
  [OSPriority.MEDIA]: 2,
  [OSPriority.BAIXA]: 1,
};

type SortKey = keyof ServiceOrder | 'ownerName' | 'totalCost';

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ orders, expenses, onOrderClick, onOrderUpdate, onNewOrder, onArchiveOrder }) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  
  // Document Modal State
  const [documentingOrder, setDocumentingOrder] = useState<ServiceOrder | null>(null);

  // Filter States (Multi-select)
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['ALL']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['ALL']);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(['ALL']);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Toggle Logic Helper
  const toggleFilter = (
    currentSelection: string[],
    setSelection: (val: string[]) => void,
    value: string
  ) => {
    if (value === 'ALL') {
        setSelection(['ALL']);
        return;
    }

    let newSelection = [...currentSelection];
    if (newSelection.includes('ALL')) {
        newSelection = [];
    }

    if (newSelection.includes(value)) {
        newSelection = newSelection.filter(item => item !== value);
    } else {
        newSelection.push(value);
    }

    if (newSelection.length === 0) {
        setSelection(['ALL']);
    } else {
        setSelection(newSelection);
    }
  };

  const getOSCost = (osId: string) => {
    return expenses
        .filter(e => e.linkedOSId === osId)
        .reduce((sum, e) => sum + e.value, 0);
  };

  const filteredOrders = useMemo(() => {
      return orders.filter(order => {
        const matchesUnit = selectedUnits.includes('ALL') || selectedUnits.includes(order.unit);
        const matchesType = selectedTypes.includes('ALL') || selectedTypes.includes(order.type);
        const matchesUser = selectedUsers.includes('ALL') || selectedUsers.includes(order.ownerId);
        return matchesUnit && matchesType && matchesUser;
      });
  }, [orders, selectedUnits, selectedTypes, selectedUsers]);

  const sortedOrders = useMemo(() => {
    if (!sortConfig) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof ServiceOrder];
      let bValue: any = b[sortConfig.key as keyof ServiceOrder];

      if (sortConfig.key === 'ownerName') {
        aValue = USERS.find(u => u.id === a.ownerId)?.name || '';
        bValue = USERS.find(u => u.id === b.ownerId)?.name || '';
      }
      
      if (sortConfig.key === 'priority') {
          aValue = PRIORITY_WEIGHT[a.priority] || 0;
          bValue = PRIORITY_WEIGHT[b.priority] || 0;
      }

      if (sortConfig.key === 'dateOpened') {
          aValue = new Date(a.dateOpened).getTime();
          bValue = new Date(b.dateOpened).getTime();
      }
      if (sortConfig.key === 'dateClosed') {
          const dateA = a.dateClosed ? new Date(a.dateClosed).getTime() : 0;
          const dateB = b.dateClosed ? new Date(b.dateClosed).getTime() : 0;
          aValue = dateA;
          bValue = dateB;
      }
      
      if (sortConfig.key === 'totalCost') {
          aValue = getOSCost(a.id);
          bValue = getOSCost(b.id);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig, expenses]);

  const handleSort = (key: string) => {
    const k = key as SortKey;
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === k && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: k, direction });
  };

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedOrderId(orderId);
    document.body.classList.add('dragging-active');
  };

  const handleDragEnd = () => {
    setDragOverColumn(null);
    setDraggedOrderId(null);
    document.body.classList.remove('dragging-active');
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setDraggedOrderId(null);

    const order = orders.find(o => o.id === orderId);
    const targetColumn = BOARD_COLUMNS.find(c => c.id === colId);

    if (order && targetColumn) {
        const newStatus = targetColumn.statuses[0];
        
        if (order.status !== newStatus) {
            const isClosing = newStatus === OSStatus.CONCLUIDA || newStatus === OSStatus.CANCELADA;
            
            const updatedOrder = { 
                ...order, 
                status: newStatus,
                dateClosed: isClosing && !order.dateClosed ? new Date().toISOString() : (isClosing ? order.dateClosed : undefined)
            };
            onOrderUpdate(updatedOrder);
        }
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex flex-col gap-4 mb-4">
        {/* Header with Title and View Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Quadro de Gestão
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie e acompanhe as solicitações.</p>
            </div>
            
            {/* View Toggle Button */}
            <div className="bg-gray-200 dark:bg-slate-700 p-1 rounded-lg flex items-center gap-1">
                <button 
                    onClick={() => setViewMode('kanban')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    title="Visualização em Colunas"
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    title="Visualização em Lista"
                >
                    <List size={18} />
                </button>
            </div>
          </div>

          <button 
            onClick={onNewOrder}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            Nova OS
          </button>
        </div>

        {/* Filters Container */}
        <div className="space-y-4 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            {/* Unit Filters */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mr-2 shrink-0">
                    <Filter size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Unidades</span>
                </div>
                
                <button
                    onClick={() => toggleFilter(selectedUnits, setSelectedUnits, 'ALL')}
                    className={`
                        flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0
                        ${selectedUnits.includes('ALL')
                            ? 'bg-gray-800 dark:bg-slate-200 text-white dark:text-slate-800 border-gray-800 dark:border-slate-200 shadow-md ring-2 ring-gray-200 dark:ring-slate-700'
                            : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300 dark:hover:border-slate-500'}
                    `}
                >
                    Todas as Unidades
                </button>

                <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 shrink-0"></div>

                {UNIT_FILTERS.map((filter) => {
                    const isSelected = selectedUnits.includes(filter.value);
                    return (
                        <button
                            key={filter.label}
                            onClick={() => toggleFilter(selectedUnits, setSelectedUnits, filter.value)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0
                                ${isSelected 
                                    ? `bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 dark:ring-indigo-900 scale-105` 
                                    : `${filter.color} opacity-80 hover:opacity-100 hover:shadow-sm`}
                            `}
                        >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                            {filter.label}
                        </button>
                    )
                })}
            </div>

            {/* Type & User Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center border-t border-gray-100 dark:border-slate-700 pt-4">
                 
                 <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide flex-1">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mr-2 shrink-0">
                        <Wrench size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Tipos</span>
                    </div>

                    <button
                        onClick={() => toggleFilter(selectedTypes, setSelectedTypes, 'ALL')}
                        className={`
                            flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0
                            ${selectedTypes.includes('ALL')
                                ? 'bg-gray-800 dark:bg-slate-200 text-white dark:text-slate-800 border-gray-800 dark:border-slate-200 shadow-md ring-2 ring-gray-200 dark:ring-slate-700'
                                : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300 dark:hover:border-slate-500'}
                        `}
                    >
                        Todas Manutenções
                    </button>

                    {TYPE_FILTERS.map((filter) => {
                        const isSelected = selectedTypes.includes(filter.value);
                        return (
                            <button
                                key={filter.label}
                                onClick={() => toggleFilter(selectedTypes, setSelectedTypes, filter.value)}
                                className={`
                                    flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all border shrink-0 whitespace-nowrap
                                    ${isSelected 
                                        ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-700 dark:border-slate-200 shadow-md ring-2 ring-slate-200 dark:ring-slate-700' 
                                        : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}
                                `}
                            >
                                {isSelected && <Check size={12} strokeWidth={3} />}
                                {filter.label}
                            </button>
                        )
                    })}
                 </div>

                 <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-slate-700"></div>

                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mr-2 shrink-0">
                        <Users size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Resp.</span>
                    </div>

                    <button
                        onClick={() => toggleFilter(selectedUsers, setSelectedUsers, 'ALL')}
                        className={`
                            px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                            ${selectedUsers.includes('ALL') 
                                ? 'bg-gray-800 dark:bg-slate-200 text-white dark:text-slate-800 border-gray-800 dark:border-slate-200' 
                                : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'}
                        `}
                    >
                        Todos
                    </button>
                    
                    <div className="flex -space-x-2 hover:space-x-1 transition-all">
                        {USERS.map(user => {
                            const isSelected = selectedUsers.includes(user.id);
                            const isAll = selectedUsers.includes('ALL');
                            
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => toggleFilter(selectedUsers, setSelectedUsers, user.id)}
                                    title={user.name}
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all ring-2 ring-white dark:ring-slate-800 relative
                                        ${user.color}
                                        ${isSelected ? 'z-10 scale-110 shadow-lg ring-indigo-500 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-slate-800' : ''}
                                        ${!isSelected && !isAll ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : ''}
                                    `}
                                >
                                    {user.initials}
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-800 rounded-full text-emerald-600 shadow-sm">
                                            <CheckCircle2 size={12} fill="currentColor" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                 </div>
            </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* VIEW MODE: KANBAN */}
        {viewMode === 'kanban' && (
            <div className="flex gap-4 h-full overflow-x-auto pb-4 pr-4 pl-1 w-full">
            {BOARD_COLUMNS.map((column) => {
                const columnOrders = filteredOrders.filter(o => column.statuses.includes(o.status));
                const isDragOver = dragOverColumn === column.id;
                
                return (
                <div 
                    key={column.id} 
                    className={`flex-1 min-w-[300px] flex flex-col h-full rounded-2xl transition-all duration-300 ${isDragOver ? 'bg-slate-100/80 dark:bg-slate-700/50 ring-2 ring-indigo-300/50' : 'bg-transparent'}`}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDrop={(e) => handleDrop(e, column.id)}
                >
                    {/* Column Header */}
                    <div className={`p-4 rounded-t-2xl border-b backdrop-blur-sm flex justify-between items-center mb-2 ${column.color}`}>
                        <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${column.dot} shadow-sm ring-1 ring-white/10`} />
                            <span className={`${column.text} text-sm tracking-wide`}>{column.label}</span>
                        </div>
                        <span className="bg-white/50 dark:bg-black/30 px-2.5 py-0.5 rounded-lg text-xs font-extrabold text-gray-700 dark:text-white/90 shadow-sm border border-white/20 dark:border-white/10">{columnOrders.length}</span>
                    </div>

                    {/* Column Body (Drop Zone) */}
                    <div className="flex-1 overflow-y-auto space-y-3 min-h-[500px] px-2 pb-2 scrollbar-hide">
                    {columnOrders.map((order) => {
                        const isBeingDragged = draggedOrderId === order.id;
                        const owner = USERS.find(u => u.id === order.ownerId);
                        
                        // Date Calculations
                        const isOpen = order.status !== OSStatus.CONCLUIDA && order.status !== OSStatus.CANCELADA;
                        const dateLabel = isOpen ? 'Abertura:' : 'Encerrada:';
                        const dateValue = isOpen ? formatDate(order.dateOpened) : formatDate(order.dateClosed);
                        const duration = calculateDuration(order.dateOpened, order.dateClosed);
                        
                        // Status Badge for 'Encerradas' column cards
                        const showStatusBadge = column.id === 'col_encerradas';

                        return (
                        <div 
                            key={order.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, order.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => onOrderClick(order)}
                            className={`
                            bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-200/60 dark:border-slate-700 cursor-grab active:cursor-grabbing 
                            hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group select-none relative
                            ${isBeingDragged ? 'opacity-40 grayscale border-dashed border-gray-400 rotate-2' : 'opacity-100'}
                            `}
                        >
                             {/* Top Row: Unit Badge + Priority */}
                            <div className="flex justify-between items-start mb-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded-full">
                                    <MapPin size={10} /> {order.unit}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wide ${getPriorityColor(order.priority)}`}>
                                    {order.priority}
                                </span>
                            </div>
                            
                            {/* Main Content: Title + Type Badge */}
                            <div className="mb-3">
                                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5">
                                    {order.title}
                                </h4>
                                <div className="flex gap-2">
                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeBadgeStyle(order.type)}`}>
                                        {order.type}
                                    </span>
                                    {showStatusBadge && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border 
                                            ${order.status === OSStatus.CONCLUIDA ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                                            {order.status === OSStatus.CONCLUIDA ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                                            {order.status === OSStatus.CONCLUIDA ? 'Concluída' : 'Cancelada'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed pl-1 border-l-2 border-gray-100 dark:border-slate-700">
                                {order.description}
                            </p>
                            
                            {/* Detailed Info Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-700 text-xs">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                        <CalendarDays size={10} /> {dateLabel} <span className="text-gray-600 dark:text-gray-300 font-medium">{dateValue}</span>
                                    </span>
                                    {/* Duration only for Closed/Cancelled (i.e., not Open) */}
                                    {!isOpen && <span className="text-[10px] text-gray-400 pl-4">{duration} dias decorridos</span>}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                     <span className="font-mono text-[10px] font-medium text-gray-400">#{order.id}</span>
                                     {owner && (
                                        <div 
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-slate-700 ${owner.color}`}
                                            title={`Responsável: ${owner.name}`}
                                        >
                                            {owner.initials}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* DOCUMENTATION BUTTON - Only if Concluída */}
                            {order.status === OSStatus.CONCLUIDA && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDocumentingOrder(order);
                                    }}
                                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
                                >
                                    <FileCheck size={14} />
                                    DOCUMENTAR
                                </button>
                            )}
                        </div>
                        );
                    })}
                    {columnOrders.length === 0 && (
                        <div className={`
                            flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl text-gray-400 text-sm transition-colors m-2
                            ${isDragOver ? 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-400' : 'border-gray-200 dark:border-slate-700'}
                        `}>
                        <span className="opacity-60 font-medium">Arraste para cá</span>
                        </div>
                    )}
                    </div>
                </div>
                );
            })}
            </div>
        )}

        {/* VIEW MODE: LIST */}
        {viewMode === 'list' && (
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                            <tr className="group">
                                <SortableHeader label="ID" sortKey="id" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} width="w-20" />
                                <SortableHeader label="Solicitação / Detalhes" sortKey="title" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                                <SortableHeader label="Unidade" sortKey="unit" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                                <SortableHeader label="Tipo" sortKey="type" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                                <SortableHeader label="Responsável" sortKey="ownerName" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} align="center" />
                                <SortableHeader label="Prioridade" sortKey="priority" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} align="center" />
                                <SortableHeader label="Status" sortKey="status" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} align="center" />
                                <SortableHeader label="Abertura" sortKey="dateOpened" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                                <SortableHeader label="Fechamento" sortKey="dateClosed" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} />
                                <SortableHeader label="Custos" sortKey="totalCost" currentSortKey={sortConfig?.key} direction={sortConfig?.direction} onSort={handleSort} align="right" />
                                <SortableHeader label="" width="w-8" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {sortedOrders.map(order => {
                                const owner = USERS.find(u => u.id === order.ownerId);
                                const cost = getOSCost(order.id);
                                const duration = calculateDuration(order.dateOpened, order.dateClosed);
                                
                                return (
                                    <tr 
                                        key={order.id} 
                                        onClick={() => onOrderClick(order)}
                                        className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-4">
                                            <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded whitespace-nowrap">{order.id}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-0.5 line-clamp-1">{order.title}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">{order.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{order.unit}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md border whitespace-nowrap ${getTypeBadgeStyle(order.type)}`}>
                                                {order.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                {owner ? (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-700 ${owner.color}`} title={owner.name}>
                                                        {owner.initials}
                                                    </div>
                                                ) : <span className="text-gray-300">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${getPriorityColor(order.priority)}`}>
                                                {order.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap inline-block ${getStatusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                <Clock size={14} className="text-gray-400 dark:text-gray-500"/>
                                                {formatDate(order.dateOpened)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {order.dateClosed ? (
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                        <CheckCircle2 size={14} className={order.status === OSStatus.CANCELADA ? "text-red-500" : "text-green-500"}/>
                                                        {formatDate(order.dateClosed)}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-5">{duration} dias decorridos</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs ml-4">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            {cost > 0 ? (
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {formatCurrency(cost)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {order.status === OSStatus.CONCLUIDA ? (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDocumentingOrder(order);
                                                    }}
                                                    className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                    title="Documentar OS"
                                                >
                                                    <FileCheck size={16} />
                                                </button>
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-transform group-hover:translate-x-1" />
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {sortedOrders.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                        Nenhuma ordem de serviço encontrada com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Mostrando {sortedOrders.length} registros</span>
                </div>
             </div>
        )}

      </div>

      {/* DOCUMENTATION MODAL */}
      <DocumentModal 
        isOpen={!!documentingOrder}
        onClose={() => setDocumentingOrder(null)}
        order={documentingOrder}
        expenses={expenses}
        onConfirm={() => {
            if(documentingOrder) onArchiveOrder(documentingOrder);
            setDocumentingOrder(null);
        }}
      />
    </div>
  );
};

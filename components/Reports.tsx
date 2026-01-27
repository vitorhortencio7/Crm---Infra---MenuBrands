import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ServiceOrder, Expense, Unit, OSStatus, OSType, ExpenseCategory, Supplier } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { FileText, Filter, Calendar, TrendingUp, DollarSign, Activity, Search, ArrowUpRight, Download, ChevronDown, Hourglass, Zap, Check, Layers, ArrowDown, ArrowUp, ArrowUpDown, FileCheck, PieChart as PieChartIcon, Contact, Phone, User as UserIcon, X, Archive, Lock, Link as LinkIcon } from 'lucide-react';

interface ReportsProps {
  orders: ServiceOrder[];
  expenses: Expense[];
  suppliers: Supplier[];
  isDarkMode?: boolean;
  onOpenOS: (order: ServiceOrder) => void;
}

// Colors adapted for better contrast and modern look
const COLORS_STATUS = {
  CONCLUIDA: '#10b981', // Emerald 500
  EM_ANDAMENTO: '#a855f7', // Purple 500
  CANCELADA: '#ef4444', // Red 500
  ABERTA: '#3b82f6', // Blue 500
  AGUARDANDO: '#f97316' // Orange 500
};

const COLORS_TYPE = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#0ea5e9', // Sky
  '#84cc16'  // Lime
];

const COLORS_UNITS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#e11d48'
];

const MONTHS_LABELS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const YEARS = [2026, 2027];

// --- CUSTOM DROPDOWN COMPONENT ---
const FilterDropdown = ({ 
    label, 
    count, 
    isOpen, 
    setIsOpen, 
    icon: Icon, 
    children,
    compact = false
}: { 
    label: string, 
    count?: number, 
    isOpen: boolean, 
    setIsOpen: (v: boolean) => void, 
    icon: any, 
    children?: React.ReactNode,
    compact?: boolean
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref, setIsOpen]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 rounded-xl border transition-all duration-300 font-medium text-sm
                    ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5'}
                    ${isOpen 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 shadow-sm ring-2 ring-indigo-100 dark:ring-indigo-900' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-700'}
                `}
            >
                <Icon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {count}
                    </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
            </button>

            {/* Dropdown Menu - z-50 ensures it floats above */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};


export const Reports: React.FC<ReportsProps> = ({ orders, expenses, suppliers, isDarkMode = false, onOpenOS }) => {
  // --- SUBMENU STATE ---
  const [activeTab, setActiveTab] = useState<'managerial' | 'financial' | 'closed_os' | 'financial_records'>('managerial');

  // --- SUPPLIER LIST MODAL STATE ---
  const [isSupplierListOpen, setIsSupplierListOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  // --- GLOBAL FILTERS STATE (CHARTS) ---
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedUnits, setSelectedUnits] = useState<Unit[]>([]); // Empty = ALL
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // Empty = ALL

  // --- TABLE SPECIFIC FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [tableYear, setTableYear] = useState<number>(2026);
  const [tableUnits, setTableUnits] = useState<Unit[]>([]);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Dropdown visibility states (Global)
  const [showYearDrop, setShowYearDrop] = useState(false);
  const [showUnitDrop, setShowUnitDrop] = useState(false);
  const [showMonthDrop, setShowMonthDrop] = useState(false);

  // Dropdown visibility states (Table)
  const [showTableYearDrop, setShowTableYearDrop] = useState(false);
  const [showTableUnitDrop, setShowTableUnitDrop] = useState(false);

  // --- TOGGLE HANDLERS (GLOBAL) ---
  const toggleUnit = (unit: Unit) => {
      setSelectedUnits(prev => 
          prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
      );
  };
  const toggleMonth = (monthIndex: number) => {
      setSelectedMonths(prev => 
          prev.includes(monthIndex) ? prev.filter(m => m !== monthIndex) : [...prev, monthIndex].sort((a,b) => a-b)
      );
  };
  const clearUnits = () => setSelectedUnits([]);
  const clearMonths = () => setSelectedMonths([]);

  // --- TOGGLE HANDLERS (TABLE) ---
  const toggleTableUnit = (unit: Unit) => {
      setTableUnits(prev => 
          prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
      );
  };
  const clearTableUnits = () => setTableUnits([]);

  // --- SORTING HANDLER ---
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  // --- DATA PREPARATION ---

  // 1. Chart Data Scope: Filter orders based on Global Year, Unit, AND Month
  const chartOrders = useMemo(() => {
    return orders.filter(o => {
      const dateRef = new Date(o.dateOpened);
      const matchYear = dateRef.getFullYear() === selectedYear;
      const matchUnit = selectedUnits.length === 0 || selectedUnits.includes(o.unit);
      const matchMonth = selectedMonths.length === 0 || selectedMonths.includes(dateRef.getMonth());
      return matchYear && matchUnit && matchMonth;
    });
  }, [orders, selectedYear, selectedUnits, selectedMonths]);

  // 2. Table Scope: Independent Filters + Sorting
  const archivedOrders = useMemo(() => {
    // Start with all archived orders
    let data = orders.filter(o => o.archived === true);

    // Filter by Table Year
    data = data.filter(o => new Date(o.dateOpened).getFullYear() === tableYear);

    // Filter by Table Unit
    if (tableUnits.length > 0) {
        data = data.filter(o => tableUnits.includes(o.unit));
    }

    // Filter by Search
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        data = data.filter(o => 
            o.title.toLowerCase().includes(lowerSearch) || 
            o.id.toLowerCase().includes(lowerSearch)
        );
    }

    // Calculate cost for sorting efficiency
    const dataWithCost = data.map(o => ({
        ...o,
        computedCost: expenses.filter(e => e.linkedOSId === o.id).reduce((acc, curr) => acc + curr.value, 0)
    }));

    // Sort Logic
    if (sortConfig) {
        dataWithCost.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortConfig.key) {
                case 'title':
                    valA = a.title.toLowerCase();
                    valB = b.title.toLowerCase();
                    break;
                case 'unit':
                    valA = a.unit.toLowerCase();
                    valB = b.unit.toLowerCase();
                    break;
                case 'date':
                    // Prefer dateClosed, fallback to dateOpened
                    valA = a.dateClosed ? new Date(a.dateClosed).getTime() : 0;
                    valB = b.dateClosed ? new Date(b.dateClosed).getTime() : 0;
                    break;
                case 'cost':
                    valA = a.computedCost;
                    valB = b.computedCost;
                    break;
                default:
                    return 0;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return dataWithCost;
  }, [orders, expenses, searchTerm, tableYear, tableUnits, sortConfig]);

  // 3. Link Expenses to filtered context (Charts)
  const filteredExpenses = useMemo(() => {
      return expenses.filter(e => {
          const eDate = new Date(e.date);
          const matchYear = eDate.getFullYear() === selectedYear;
          const matchUnit = selectedUnits.length === 0 || selectedUnits.includes(e.unit);
          const matchMonth = selectedMonths.length === 0 || selectedMonths.includes(eDate.getMonth());
          return matchYear && matchUnit && matchMonth;
      });
  }, [expenses, selectedYear, selectedUnits, selectedMonths]);

  // 4. Supplier Search Filter
  const filteredSuppliers = useMemo(() => {
      if(!supplierSearch) return suppliers;
      const lower = supplierSearch.toLowerCase();
      return suppliers.filter(s => 
          s.name.toLowerCase().includes(lower) || 
          s.category.toLowerCase().includes(lower) ||
          (s.contactName && s.contactName.toLowerCase().includes(lower))
      );
  }, [suppliers, supplierSearch]);

  // 5. Archived Expenses (Financial Records Tab)
  const archivedExpenses = useMemo(() => {
      let data = expenses.filter(e => {
          const linkedOS = orders.find(o => o.id === e.linkedOSId);
          return linkedOS?.archived === true;
      });

      // Apply Table Filters (Year, Unit, Search)
      data = data.filter(e => new Date(e.date).getFullYear() === tableYear);
      
      if (tableUnits.length > 0) {
          data = data.filter(e => tableUnits.includes(e.unit));
      }

      if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          data = data.filter(e => 
              e.item.toLowerCase().includes(lowerSearch) ||
              e.supplier.toLowerCase().includes(lowerSearch) ||
              e.id.toLowerCase().includes(lowerSearch) ||
              (e.linkedOSId && e.linkedOSId.toLowerCase().includes(lowerSearch))
          );
      }

      // Sort
      if (sortConfig) {
          data.sort((a, b) => {
              let valA: any = '';
              let valB: any = '';

              switch(sortConfig.key) {
                  case 'item': valA = a.item.toLowerCase(); valB = b.item.toLowerCase(); break;
                  case 'value': valA = a.value; valB = b.value; break;
                  case 'date': valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); break;
                  case 'unit': valA = a.unit.toLowerCase(); valB = b.unit.toLowerCase(); break;
                  case 'linkedOSId': valA = a.linkedOSId || ''; valB = b.linkedOSId || ''; break;
                  default: return 0;
              }
              if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
              if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }

      return data;
  }, [expenses, orders, tableYear, tableUnits, searchTerm, sortConfig]);


  // --- CALCULATIONS & KPIs ---
  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);
  const totalOrders = chartOrders.length;
  const avgCost = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // PMA Calculation
  const pmaValue = useMemo(() => {
    const closedOrders = chartOrders.filter(o => o.dateClosed && o.dateOpened);
    const durations = closedOrders.map(o => {
            const start = new Date(o.dateOpened).getTime();
            const end = new Date(o.dateClosed!).getTime();
            return Math.ceil(Math.abs(end - start) / (1000 * 3600 * 24));
        })
        .sort((a, b) => a - b);

    if (durations.length === 0) return 0;
    const mid = Math.floor(durations.length / 2);
    return durations.length % 2 !== 0 ? durations[mid] : Number(((durations[mid - 1] + durations[mid]) / 2).toFixed(1)); 
  }, [chartOrders]);


  // --- CHARTS DATA GENERATION ---
  // (Logic remains same as previous version, relying on chartOrders)
  const statusData = useMemo(() => {
      const counts: Record<string, number> = { [OSStatus.CONCLUIDA]: 0, [OSStatus.EM_ANDAMENTO]: 0, [OSStatus.ABERTA]: 0, [OSStatus.AGUARDANDO]: 0, [OSStatus.CANCELADA]: 0 };
      chartOrders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });
      return [
          { name: 'Concluídas', value: counts[OSStatus.CONCLUIDA], color: COLORS_STATUS.CONCLUIDA },
          { name: 'Em Andamento', value: counts[OSStatus.EM_ANDAMENTO], color: COLORS_STATUS.EM_ANDAMENTO },
          { name: 'Abertas', value: counts[OSStatus.ABERTA], color: COLORS_STATUS.ABERTA },
          { name: 'Análise', value: counts[OSStatus.AGUARDANDO], color: COLORS_STATUS.AGUARDANDO },
          { name: 'Canceladas', value: counts[OSStatus.CANCELADA], color: COLORS_STATUS.CANCELADA },
      ].filter(d => d.value > 0);
  }, [chartOrders]);

  const typeData = useMemo(() => {
      const counts: Record<string, number> = { [OSType.PREVENTIVA]: 0, [OSType.CORRETIVA]: 0, [OSType.INSTALACAO]: 0, [OSType.OUTROS]: 0 };
      chartOrders.forEach(o => { if (counts[o.type] !== undefined) counts[o.type]++; else counts[OSType.OUTROS]++; });
      return [
          { name: 'Preventiva', value: counts[OSType.PREVENTIVA], color: COLORS_TYPE[0] },
          { name: 'Corretiva', value: counts[OSType.CORRETIVA], color: COLORS_TYPE[1] },
          { name: 'Instalação', value: counts[OSType.INSTALACAO], color: COLORS_TYPE[2] },
          { name: 'Outros', value: counts[OSType.OUTROS], color: COLORS_TYPE[3] },
      ].filter(d => d.value > 0);
  }, [chartOrders]);

  const unitData = useMemo(() => {
      const counts: Record<string, number> = {};
      chartOrders.forEach(o => { counts[o.unit] = (counts[o.unit] || 0) + 1; });
      const sorted = Object.keys(counts).map((key, index) => ({ name: key, value: counts[key], color: COLORS_UNITS[index % COLORS_UNITS.length] })).sort((a, b) => b.value - a.value);
      if (sorted.length > 6) {
          const top5 = sorted.slice(0, 5);
          const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
          return [...top5, { name: 'Outros', value: others, color: '#94a3b8' }];
      }
      return sorted;
  }, [chartOrders]);

  const monthlyData = useMemo(() => {
    const data = new Array(12).fill(0).map((_, i) => ({ name: SHORT_MONTHS[i], valor: 0, fullDate: i }));
    filteredExpenses.forEach(e => { const month = new Date(e.date).getMonth(); data[month].valor += e.value; });
    if (selectedMonths.length > 0) return data.filter(d => selectedMonths.includes(d.fullDate));
    return data;
  }, [filteredExpenses, selectedMonths]);

  // Expenses by Category Data
  const categoryData = useMemo(() => {
      const counts: Record<string, number> = {};
      filteredExpenses.forEach(e => {
          counts[e.category] = (counts[e.category] || 0) + e.value;
      });
      return Object.keys(counts).map(key => ({
          name: key,
          value: counts[key]
      })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);


  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label, type }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 shadow-2xl rounded-xl text-xs border border-slate-700/50 backdrop-blur-md z-50">
          <p className="font-bold mb-2 opacity-90 border-b border-white/10 pb-1">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: entry.payload.color || entry.color }} />
                 <span className="opacity-80 text-slate-300 font-medium">{entry.name}</span>
              </div>
              <span className="font-bold font-mono">
                  {type === 'currency' || entry.name === 'Valor' || entry.dataKey === 'valor'
                   ? Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                   : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- CSV EXPORT FUNCTIONALITY ---
  const handleExportCSV = () => {
      const headers = ['ID', 'Data', 'Categoria', 'Item', 'Valor', 'Unidade', 'Fornecedor', 'Pagamento'];
      const rows = filteredExpenses.map(e => [
          e.id,
          new Date(e.date).toLocaleDateString('pt-BR'),
          e.category,
          `"${e.item.replace(/"/g, '""')}"`, // Escape quotes
          e.value.toFixed(2),
          e.unit,
          e.supplier,
          e.paymentMethod
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + 
          [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `financeiro_menubrands_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Helper for Sortable Table Headers
  const SortableHeader = ({ label, sortKey, align = 'left', width, className }: { label: string, sortKey?: string, align?: 'left' | 'center' | 'right', width?: string, className?: string }) => (
    <th 
      className={`
          px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors select-none
          ${width ? width : ''} 
          ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}
          ${sortKey ? 'cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-700/80 hover:text-indigo-600 dark:hover:text-indigo-400 group' : 'text-slate-400 dark:text-slate-500'}
          ${sortConfig?.key === sortKey ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
          ${className || ''}
      `}
      onClick={() => sortKey && handleSort(sortKey)}
    >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {label}
            {sortKey && (
                <span className={`flex flex-col ${sortConfig?.key === sortKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} transition-opacity`}>
                   {sortConfig?.key === sortKey ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                   ) : (
                        <ArrowUpDown size={12} />
                   )}
                </span>
            )}
        </div>
    </th>
  );

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header & SUBMENU */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start xl:items-center">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Relatórios</h2>
                    
                    {/* Supplier Directory Button (Read-Only) */}
                    <button 
                        onClick={() => setIsSupplierListOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-xs font-bold shadow-sm"
                        title="Ver lista de contatos"
                    >
                        <Contact size={14} /> Lista de Fornecedores
                    </button>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Análise detalhada da operação e finanças.</p>
            </div>
            
            {/* Global Filter Bar (Visible only for Managerial and Financial Tabs) */}
            {activeTab !== 'closed_os' && activeTab !== 'financial_records' && (
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-2 pr-3 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 relative z-40">
                    {/* Year Dropdown */}
                    <FilterDropdown 
                        label={selectedYear.toString()} 
                        isOpen={showYearDrop} 
                        setIsOpen={setShowYearDrop} 
                        icon={Calendar}
                    >
                        <div className="flex flex-col p-1">
                            {YEARS.map(year => (
                                <button
                                    key={year}
                                    onClick={() => { setSelectedYear(year); setShowYearDrop(false); }}
                                    className={`px-4 py-2 text-left rounded-xl text-sm font-semibold transition-colors ${selectedYear === year ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </FilterDropdown>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                    {/* Months Dropdown */}
                    <FilterDropdown 
                        label={selectedMonths.length === 0 ? "Ano Completo" : selectedMonths.length === 1 ? SHORT_MONTHS[selectedMonths[0]] : "Meses"} 
                        count={selectedMonths.length > 0 ? selectedMonths.length : undefined}
                        isOpen={showMonthDrop} 
                        setIsOpen={setShowMonthDrop} 
                        icon={Layers}
                    >
                        <div className="flex flex-col">
                            <div className="p-2 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">Selecionar</span>
                                {selectedMonths.length > 0 && (
                                    <button onClick={clearMonths} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium px-2">Limpar</button>
                                )}
                            </div>
                            <div className="p-2 grid grid-cols-2 gap-1">
                                {MONTHS_LABELS.map((m, idx) => {
                                    const isSelected = selectedMonths.includes(idx);
                                    return (
                                        <button
                                            key={m}
                                            onClick={() => toggleMonth(idx)}
                                            className={`
                                                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                                                ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                            `}
                                        >
                                            {isSelected ? <Check size={12} strokeWidth={3} /> : <div className="w-3" />}
                                            {m}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </FilterDropdown>

                    {/* Units Dropdown */}
                    <FilterDropdown 
                        label={selectedUnits.length === 0 ? "Todas Unidades" : selectedUnits.length === 1 ? selectedUnits[0] : "Unidades"} 
                        count={selectedUnits.length > 0 ? selectedUnits.length : undefined}
                        isOpen={showUnitDrop} 
                        setIsOpen={setShowUnitDrop} 
                        icon={Filter}
                    >
                        <div className="flex flex-col">
                            <div className="p-2 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">Filtrar Lojas</span>
                                {selectedUnits.length > 0 && (
                                    <button onClick={clearUnits} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium px-2">Limpar</button>
                                )}
                            </div>
                            <div className="p-2 space-y-1">
                                {Object.values(Unit).map((u) => {
                                    const isSelected = selectedUnits.includes(u);
                                    return (
                                        <button
                                            key={u}
                                            onClick={() => toggleUnit(u)}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group
                                                ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium'}
                                            `}
                                        >
                                            <span>{u}</span>
                                            {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </FilterDropdown>
                </div>
            )}
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit flex-wrap">
            <button 
                onClick={() => setActiveTab('managerial')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'managerial' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <PieChartIcon size={16} />
                Relatórios Gerenciais
            </button>
            <button 
                onClick={() => setActiveTab('financial')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'financial' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <DollarSign size={16} />
                Financeiro
            </button>
            <button 
                onClick={() => setActiveTab('closed_os')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'closed_os' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <FileCheck size={16} />
                OS Concluídas
            </button>
            <button 
                onClick={() => setActiveTab('financial_records')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'financial_records' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <Archive size={16} />
                Histórico Financeiro
            </button>
        </div>
      </div>

      {/* --- CONTENT: MANAGERIAL --- */}
      {activeTab === 'managerial' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* KPI CARDS (Operational Focused) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* PMA */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-800 dark:to-violet-900 p-6 rounded-3xl shadow-[0_10px_40px_-10px_rgba(99,102,241,0.5)] dark:shadow-none relative overflow-hidden group text-white transform hover:-translate-y-1 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-indigo-400 opacity-20 blur-xl"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/10"><Hourglass className="w-6 h-6 text-white" /></div>
                        <div className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-indigo-100 flex items-center gap-1"><Zap size={10} className="fill-yellow-400 text-yellow-400" /> KPI Principal</div>
                    </div>
                    <div className="relative z-10 text-center">
                        <h3 className="text-5xl font-extrabold text-white tracking-tight leading-none mb-1">{pmaValue.toString().replace('.', ',')}</h3>
                        <p className="text-sm font-medium text-indigo-100 opacity-80 uppercase tracking-widest">PMA (Dias)</p>
                    </div>
                </div>
                
                {/* Volume */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow relative overflow-hidden group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl"><Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total de OS</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{totalOrders}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Demandas geradas</p>
                    </div>
                </div>

                {/* Efficiency KPI (Mock) */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow relative overflow-hidden group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl"><Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Taxa Conclusão</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                            {totalOrders > 0 ? Math.round((statusData.find(d => d.name === 'Concluídas')?.value || 0) / totalOrders * 100) : 0}%
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Eficiência operacional</p>
                    </div>
                </div>

                {/* Units Active */}
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow relative overflow-hidden group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl"><Layers className="w-6 h-6 text-orange-600 dark:text-orange-400" /></div></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Lojas Ativas</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{unitData.length}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Com solicitações no período</p>
                    </div>
                </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col items-center h-96 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-0.5 w-full text-left">Manutenções</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider w-full text-left">Status Geral das Ordens</p>
                    <div className="w-full flex-1 min-h-0 relative mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} cornerRadius={8} dataKey="value" stroke="none">
                                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" align="center" height={40} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500, color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-3xl font-extrabold text-slate-800 dark:text-white leading-none">{totalOrders}</span>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Total</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col items-center h-96 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-0.5 w-full text-left">Tipos de OS</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider w-full text-left">Classificação Técnica</p>
                    <div className="w-full flex-1 min-h-0 relative mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={typeData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} cornerRadius={8} dataKey="value" stroke="none">
                                    {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" align="center" height={40} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500, color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-3xl font-extrabold text-slate-800 dark:text-white leading-none">{totalOrders}</span>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Total</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col items-center h-96 hover:shadow-lg transition-shadow duration-300">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-0.5 w-full text-left">Volume por Loja</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider w-full text-left">Distribuição das Demandas</p>
                    <div className="w-full flex-1 min-h-0 relative mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={unitData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} cornerRadius={4} dataKey="value" stroke="none">
                                    {unitData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" align="center" height={40} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 500, color: isDarkMode ? '#94a3b8' : '#64748b' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-3xl font-extrabold text-slate-800 dark:text-white leading-none">{totalOrders}</span>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Total</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- CONTENT: FINANCIAL --- */}
      {activeTab === 'financial' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            <div className="flex justify-end">
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-300 dark:shadow-none hover:shadow-xl active:scale-95 text-sm font-bold group" 
                >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    Exportar Relatório CSV
                </button>
            </div>

            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Investido */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow relative overflow-hidden group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl"><DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /></div></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Total Gasto</p>
                        <h3 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">{totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">No período selecionado</p>
                    </div>
                </div>
                {/* Ticket Medio */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow relative overflow-hidden group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl"><TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Ticket Médio</p>
                        <h3 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">{avgCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Por manutenção realizada</p>
                    </div>
                </div>
            </div>

            {/* Financial Evolution */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Evolução Financeira</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Histórico de gastos mensais.</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-full text-sm font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
                        <Calendar size={14} />
                        {selectedYear}
                    </div>
                </div>
                <div className="w-full h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#94a3b8', fontWeight: 600}} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#94a3b8', fontWeight: 600}} tickFormatter={(value) => `R$${value/1000}k`} dx={-10} />
                            <Tooltip content={<CustomTooltip type="currency" />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Area type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValor)" name="Valor Gasto" activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Expenses by Category (New Chart) */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gastos por Categoria</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Onde os recursos estão sendo alocados.</p>
                    </div>
                </div>
                <div className="w-full h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#334155' : '#f0f0f0'} />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={100} 
                                tick={{fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600}} 
                            />
                            <Tooltip content={<CustomTooltip type="currency" />} cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}} />
                            <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={32} name="Valor">
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS_TYPE[index % COLORS_TYPE.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      {/* --- CONTENT: CLOSED OS TABLE --- */}
      {activeTab === 'closed_os' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative animate-in slide-in-from-bottom-4 duration-500">
            {/* Enhanced Toolbar */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Ordens de Serviços Concluídas</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acervo completo de manutenções finalizadas.</p>
                    </div>
                    {/* Filters... (Same as before) */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Buscar título ou ID..." 
                                className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl leading-5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-150 ease-in-out text-xs font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Table Specific Year & Units... */}
                        {/* (Dropdowns reused from original code) */}
                        <FilterDropdown label={tableYear.toString()} isOpen={showTableYearDrop} setIsOpen={setShowTableYearDrop} icon={Calendar} compact>
                            <div className="flex flex-col p-1">{YEARS.map(year => (<button key={year} onClick={() => { setTableYear(year); setShowTableYearDrop(false); }} className={`px-4 py-2 text-left rounded-xl text-sm font-semibold transition-colors ${tableYear === year ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{year}</button>))}</div>
                        </FilterDropdown>
                        <FilterDropdown label={tableUnits.length === 0 ? "Todas Sedes" : tableUnits.length === 1 ? tableUnits[0] : "Sedes"} count={tableUnits.length > 0 ? tableUnits.length : undefined} isOpen={showTableUnitDrop} setIsOpen={setShowTableUnitDrop} icon={Filter} compact>
                            <div className="flex flex-col">
                                <div className="p-2 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10"><span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">Filtrar</span>{tableUnits.length > 0 && (<button onClick={clearTableUnits} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium px-2">Limpar</button>)}</div>
                                <div className="p-2 space-y-1">{Object.values(Unit).map((u) => {const isSelected = tableUnits.includes(u); return (<button key={u} onClick={() => toggleTableUnit(u)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium'}`}><span>{u}</span>{isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}</button>)})}</div>
                            </div>
                        </FilterDropdown>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto p-4 rounded-b-3xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider rounded-l-xl select-none">OS ID</th>
                            <SortableHeader label="Detalhes" sortKey="title" />
                            <SortableHeader label="Unidade" sortKey="unit" />
                            <SortableHeader label="Datas" sortKey="date" />
                            <SortableHeader label="Custo Final" sortKey="cost" align="right" className="rounded-r-xl" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {archivedOrders.map(os => {
                            const osCost = (os as any).computedCost || 0;
                            const duration = os.dateClosed ? Math.ceil(Math.abs(new Date(os.dateClosed).getTime() - new Date(os.dateOpened).getTime()) / (1000 * 3600 * 24)) : 0;
                            return (
                                <tr key={os.id} onClick={() => onOpenOS(os)} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-5"><span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{os.id}</span></td>
                                    <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400"><FileText size={16} /></div><div><div className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-0.5">{os.title}</div><div className="text-xs text-slate-500 dark:text-slate-400 font-medium inline-block bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{os.type}</div></div></div></td>
                                    <td className="px-6 py-5"><span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{os.unit}</span></td>
                                    <td className="px-6 py-5"><div className="flex flex-col gap-1"><span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Calendar size={12} /> {os.dateClosed ? new Date(os.dateClosed).toLocaleDateString('pt-BR') : '-'}</span><span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{duration} dias ativos</span></div></td>
                                    <td className="px-6 py-5 text-right"><span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">{osCost > 0 ? osCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span></td>
                                </tr>
                            );
                        })}
                        {archivedOrders.length === 0 && (<tr><td colSpan={5} className="px-6 py-20 text-center"><div className="flex flex-col items-center justify-center opacity-40"><div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4"><Search className="w-8 h-8 text-slate-400 dark:text-slate-500" /></div><p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum registro encontrado.</p><p className="text-sm text-slate-400 dark:text-slate-500">Ordens arquivadas aparecerão aqui.</p></div></td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- CONTENT: FINANCIAL RECORDS (FROZEN EXPENSES) --- */}
      {activeTab === 'financial_records' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative animate-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Histórico Financeiro
                            <Lock size={16} className="text-slate-400" />
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Registros consolidados de ordens finalizadas (Somente Leitura).</p>
                    </div>
                    
                    {/* Reuse Filters */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl leading-5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-150 ease-in-out text-xs font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <FilterDropdown label={tableYear.toString()} isOpen={showTableYearDrop} setIsOpen={setShowTableYearDrop} icon={Calendar} compact>
                            <div className="flex flex-col p-1">{YEARS.map(year => (<button key={year} onClick={() => { setTableYear(year); setShowTableYearDrop(false); }} className={`px-4 py-2 text-left rounded-xl text-sm font-semibold transition-colors ${tableYear === year ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{year}</button>))}</div>
                        </FilterDropdown>
                        <FilterDropdown label={tableUnits.length === 0 ? "Todas Sedes" : tableUnits.length === 1 ? tableUnits[0] : "Sedes"} count={tableUnits.length > 0 ? tableUnits.length : undefined} isOpen={showTableUnitDrop} setIsOpen={setShowTableUnitDrop} icon={Filter} compact>
                            <div className="flex flex-col">
                                <div className="p-2 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10"><span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">Filtrar</span>{tableUnits.length > 0 && (<button onClick={clearTableUnits} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium px-2">Limpar</button>)}</div>
                                <div className="p-2 space-y-1">{Object.values(Unit).map((u) => {const isSelected = tableUnits.includes(u); return (<button key={u} onClick={() => toggleTableUnit(u)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all group ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium'}`}><span>{u}</span>{isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}</button>)})}</div>
                            </div>
                        </FilterDropdown>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto p-4 rounded-b-3xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 dark:bg-slate-700/50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider rounded-l-xl select-none">ID</th>
                            <SortableHeader label="Item / Serviço" sortKey="item" />
                            <SortableHeader label="Data" sortKey="date" />
                            <SortableHeader label="Unidade" sortKey="unit" />
                            <SortableHeader label="OS Vinculada" sortKey="linkedOSId" />
                            <SortableHeader label="Valor" sortKey="value" align="right" className="rounded-r-xl" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {archivedExpenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{expense.id}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{expense.item}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{expense.supplier}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{expense.unit}</td>
                                <td className="px-6 py-4">
                                    {expense.linkedOSId ? (
                                        <span className="flex items-center gap-1 text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded w-fit">
                                            <LinkIcon size={10} /> {expense.linkedOSId}
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                    {expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                        ))}
                        {archivedExpenses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                            <Archive className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum registro encontrado.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- SUPPLIER LIST MODAL (READ-ONLY) --- */}
      {isSupplierListOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Contact className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Diretório de Prestadores
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lista de contatos para consulta rápida.</p>
                    </div>
                    <button 
                        onClick={() => { setIsSupplierListOpen(false); setSupplierSearch(''); }}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, categoria ou contato..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700 dark:text-white placeholder-slate-400"
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/20">
                    <div className="space-y-3">
                        {filteredSuppliers.map(sup => (
                            <div key={sup.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-2 hover:border-indigo-200 dark:hover:border-slate-600 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{sup.name}</h4>
                                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                                        {sup.category}
                                    </span>
                                </div>
                                
                                <div className="flex flex-col gap-1 mt-1">
                                    {sup.contactName && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                            <UserIcon size={12} className="text-slate-400" />
                                            <span>{sup.contactName}</span>
                                        </div>
                                    )}
                                    {sup.contact && (
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                                            <Phone size={12} className="text-emerald-500" />
                                            <span>{sup.contact}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredSuppliers.length === 0 && (
                            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                                <p className="text-sm">Nenhum prestador encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Footer Tip */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Para editar ou adicionar novos, acesse <strong>Configurações &gt; Gerenciar Prestadores</strong>.
                    </p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

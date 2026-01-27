import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Expense, ExpenseCategory, Unit, ServiceOrder, PaymentMethod, Supplier } from '../types';
import { Plus, Search, Trash2, Link as LinkIcon, Filter, CalendarDays, X, Save, Check, ArrowUp, ArrowDown, ArrowUpDown, Pencil, Store } from 'lucide-react';

interface FinanceTableProps {
  expenses: Expense[];
  orders: ServiceOrder[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenOS: (osId: string) => void;
  suppliers?: Supplier[];
  onAddSupplier?: (supplier: Supplier) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Updated Years as requested
const YEARS = [2026, 2027];

export const FinanceTable: React.FC<FinanceTableProps> = ({ expenses, orders, onAddExpense, onUpdateExpense, onDeleteExpense, onOpenOS, suppliers = [], onAddSupplier }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Date Filters State - Multi-select
  const [selectedYear, setSelectedYear] = useState(2026); // Default to 2026
  const [selectedMonths, setSelectedMonths] = useState<number[]>([-1]); // -1 represents 'ALL'

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // OS Search State for the Modal
  const [osSearchTerm, setOsSearchTerm] = useState('');
  const [isOsDropdownOpen, setIsOsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Supplier Search State for the Modal
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    unit: Unit.ALDEOTA,
    category: ExpenseCategory.PECAS,
    paymentMethod: PaymentMethod.PIX,
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOsDropdownOpen(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Logic for Main Table
  const filteredExpenses = useMemo(() => {
      return expenses.filter(e => {
        const expenseDate = new Date(e.date);
        // 1. Filter by Year
        const matchYear = expenseDate.getFullYear() === selectedYear;
        
        // 2. Filter by Month (Multi-select)
        const matchMonth = selectedMonths.includes(-1) || selectedMonths.includes(expenseDate.getMonth());

        // 3. Filter by Search Term
        const matchSearch = 
        e.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.unit.toLowerCase().includes(searchTerm.toLowerCase());

        return matchYear && matchMonth && matchSearch;
    });
  }, [expenses, selectedYear, selectedMonths, searchTerm]);

  // Sorting Logic
  const sortedExpenses = useMemo(() => {
    let data = [...filteredExpenses];
    if (sortConfig !== null) {
      data.sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        switch (sortConfig.key) {
            case 'item':
                aValue = a.item.toLowerCase();
                bValue = b.item.toLowerCase();
                break;
            case 'value':
                aValue = a.value;
                bValue = b.value;
                break;
            case 'date':
                aValue = new Date(a.date).getTime();
                bValue = new Date(b.date).getTime();
                break;
            case 'unit':
                aValue = a.unit.toLowerCase();
                bValue = b.unit.toLowerCase();
                break;
            case 'payment':
                aValue = (a.paymentMethod || '').toLowerCase();
                bValue = (b.paymentMethod || '').toLowerCase();
                break;
            default:
                return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [filteredExpenses, sortConfig]);

  const totalFiltered = filteredExpenses.reduce((acc, curr) => acc + curr.value, 0);

  // Sorting Handler
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Toggle Month Logic
  const toggleMonth = (monthIndex: number) => {
    if (monthIndex === -1) {
        setSelectedMonths([-1]);
        return;
    }

    let newSelection = [...selectedMonths];
    
    // If we are selecting a specific month, remove 'ALL' if it's there
    if (newSelection.includes(-1)) {
        newSelection = [];
    }

    // Toggle logic
    if (newSelection.includes(monthIndex)) {
        newSelection = newSelection.filter(m => m !== monthIndex);
    } else {
        newSelection.push(monthIndex);
    }

    // If nothing selected, revert to ALL
    if (newSelection.length === 0) {
        setSelectedMonths([-1]);
    } else {
        setSelectedMonths(newSelection);
    }
  };

  // Filter Logic for OS Dropdown inside Modal
  const filteredOSList = orders.filter(os => 
    os.id.toLowerCase().includes(osSearchTerm.toLowerCase()) ||
    os.title.toLowerCase().includes(osSearchTerm.toLowerCase())
  );

  // Filter Logic for Supplier Dropdown inside Modal
  const filteredSuppliersList = suppliers?.filter(s =>
    s.name.toLowerCase().includes((newExpense.supplier || '').toLowerCase()) ||
    s.category.toLowerCase().includes((newExpense.supplier || '').toLowerCase())
  ) || [];

  const handleEditClick = (expense: Expense) => {
      setNewExpense({
          ...expense,
          date: new Date(expense.date).toISOString().split('T')[0]
      });
      setEditingId(expense.id);
      
      if(expense.linkedOSId) {
          const os = orders.find(o => o.id === expense.linkedOSId);
          setOsSearchTerm(os ? `${os.id} - ${os.title}` : expense.linkedOSId);
      } else {
          setOsSearchTerm('');
      }
      
      setIsAdding(true);
  };

  const handleSave = () => {
    if (!newExpense.item || !newExpense.value || !newExpense.supplier) {
        alert("Preencha os campos obrigatórios: Item, Valor e Prestador");
        return;
    }
    
    // Correct date handling to prevent timezone shifts
    // If we have a YYYY-MM-DD string, append noon UTC to ensure it stays on that day in most timezones
    const dateToSave = newExpense.date 
        ? new Date(newExpense.date + 'T12:00:00').toISOString() 
        : new Date().toISOString();

    const expense: Expense = {
      id: editingId || `FIN-${Date.now().toString().slice(-4)}`,
      item: newExpense.item,
      value: Number(newExpense.value),
      date: dateToSave,
      supplier: newExpense.supplier,
      warrantyPartsMonths: Number(newExpense.warrantyPartsMonths) || 0,
      warrantyServiceMonths: Number(newExpense.warrantyServiceMonths) || 0,
      category: newExpense.category as ExpenseCategory,
      paymentMethod: newExpense.paymentMethod as PaymentMethod,
      unit: newExpense.unit as Unit,
      linkedOSId: newExpense.linkedOSId || undefined
    };

    if (editingId) {
        onUpdateExpense(expense);
    } else {
        onAddExpense(expense);
    }

    handleCloseModal();
  };

  const handleCloseModal = () => {
      setIsAdding(false);
      setEditingId(null);
      // Reset form
      setNewExpense({
          unit: Unit.ALDEOTA,
          category: ExpenseCategory.PECAS,
          paymentMethod: PaymentMethod.PIX,
          warrantyPartsMonths: 0,
          warrantyServiceMonths: 0,
          date: new Date().toISOString().split('T')[0],
          linkedOSId: ''
      });
      setOsSearchTerm('');
  };

  const handleSelectOS = (os: ServiceOrder | null) => {
      if (os) {
        setNewExpense({ ...newExpense, linkedOSId: os.id });
        setOsSearchTerm(`${os.id} - ${os.title}`);
      } else {
        setNewExpense({ ...newExpense, linkedOSId: '' });
        setOsSearchTerm('');
      }
      setIsOsDropdownOpen(false);
  };

  const handleSelectSupplier = (supplierName: string) => {
      setNewExpense({ ...newExpense, supplier: supplierName });
      setIsSupplierDropdownOpen(false);
  };

  const handleQuickAddSupplier = () => {
      if (!newExpense.supplier || !onAddSupplier) return;
      
      const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          name: newExpense.supplier,
          category: 'Geral', // Default category
          contact: ''
      };
      
      onAddSupplier(newSup);
      setIsSupplierDropdownOpen(false);
  };

  // Helper for Sortable Table Headers
  const SortableHeader = ({ label, sortKey, align = 'left', width }: { label: string, sortKey?: string, align?: 'left' | 'center' | 'right', width?: string }) => (
    <th 
      className={`
          px-6 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors select-none group
          ${width ? width : ''} 
          ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}
          ${sortConfig?.key === sortKey ? 'bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white' : ''}
      `}
      onClick={() => sortKey && handleSort(sortKey)}
    >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {label}
            {sortKey && (
                <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                    {sortConfig?.key === sortKey ? (
                        sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : (
                        <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" />
                    )}
                </span>
            )}
        </div>
    </th>
  );

  // Styles
  const inputClass = "w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 mt-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500";
  const numberInputClass = `${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

  const getSelectedMonthLabel = () => {
      if (selectedMonths.includes(-1)) return 'Todos os meses';
      if (selectedMonths.length === 1) return MONTHS[selectedMonths[0]];
      return `${selectedMonths.length} meses selecionados`;
  };

  return (
    <div className="space-y-6">
      {/* Header Area with Year Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Controle Financeiro</h2>
             <div className="relative">
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="appearance-none bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 font-bold text-lg rounded-lg py-1 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <CalendarDays className="w-4 h-4 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
             </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie gastos de manutenção e peças.</p>
        </div>
        <button 
          onClick={() => {
              setEditingId(null);
              setIsAdding(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Gasto
        </button>
      </div>

      {/* Multi-select Month Filter */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
         <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mr-2 shrink-0">
                <Filter size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Período</span>
            </div>

            <button
                onClick={() => toggleMonth(-1)}
                className={`
                    px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0
                    ${selectedMonths.includes(-1) 
                        ? 'bg-gray-800 dark:bg-slate-200 text-white dark:text-slate-800 border-gray-800 dark:border-slate-200 shadow-md ring-2 ring-gray-200 dark:ring-slate-700' 
                        : 'bg-white dark:bg-slate-700 text-gray-500 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300 dark:hover:border-slate-500'}
                `}
            >
                Ano Todo
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1 flex-shrink-0" />
            
            {MONTHS.map((m, index) => {
                const isSelected = selectedMonths.includes(index);
                return (
                    <button
                        key={m}
                        onClick={() => toggleMonth(index)}
                        className={`
                            flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all border shrink-0 whitespace-nowrap
                            ${isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 dark:ring-indigo-900 scale-105' 
                                : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400'}
                        `}
                    >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                        {m.substring(0, 3)}
                    </button>
                )
            })}
         </div>
      </div>

      {/* Modal Overlay for New Expense */}
      {isAdding && (
        // z-[100] and darkened background to fix visual glitch against sticky headers
        <div className="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 rounded-t-xl shrink-0">
                 <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                    {editingId ? 'Editar Gasto' : 'Adicionar Novo Gasto'}
                 </h3>
                 <button onClick={handleCloseModal} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Modal Body - Added pb-32 to allow scrolling space for dropdown */}
              <div className="p-8 bg-white dark:bg-slate-800 overflow-y-auto flex-1">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-32">
                    
                    {/* Row 1: Core Info */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Item/Serviço</label>
                        <input 
                            type="text" 
                            className={inputClass}
                            value={newExpense.item || ''}
                            onChange={e => setNewExpense({...newExpense, item: e.target.value})}
                            placeholder="Ex: Torneira, Reparo Elétrico..."
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Valor (R$)</label>
                        <input 
                            type="number" 
                            className={numberInputClass}
                            value={newExpense.value || ''}
                            onChange={e => setNewExpense({...newExpense, value: Number(e.target.value)})}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Data</label>
                        <input 
                            type="date" 
                            className={inputClass}
                            value={newExpense.date}
                            onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                        />
                    </div>

                    {/* Row 2: Supplier & Classification */}
                    <div className="lg:col-span-2 relative" ref={supplierDropdownRef}>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Prestador de Serviço</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                className={inputClass}
                                value={newExpense.supplier || ''}
                                onChange={e => {
                                    setNewExpense({...newExpense, supplier: e.target.value});
                                    setIsSupplierDropdownOpen(true);
                                }}
                                onFocus={() => setIsSupplierDropdownOpen(true)}
                                placeholder="Digite para buscar ou cadastrar..."
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <Search size={14} />
                            </div>
                        </div>

                        {isSupplierDropdownOpen && (newExpense.supplier || filteredSuppliersList.length > 0) && (
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {filteredSuppliersList.length > 0 ? (
                                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                                        {filteredSuppliersList.map(sup => (
                                            <li 
                                                key={sup.id}
                                                className="px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer flex justify-between items-center"
                                                onClick={() => handleSelectSupplier(sup.name)}
                                            >
                                                <span>{sup.name}</span>
                                                <span className="text-[10px] bg-gray-100 dark:bg-slate-600 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-300">{sup.category}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                
                                {/* Quick Add Option if typed name doesn't match perfectly */}
                                {newExpense.supplier && !filteredSuppliersList.some(s => s.name.toLowerCase() === newExpense.supplier?.toLowerCase()) && (
                                    <div 
                                        className="p-2 border-t dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50"
                                    >
                                        <button 
                                            onClick={handleQuickAddSupplier}
                                            className="w-full text-left px-2 py-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md flex items-center gap-2"
                                        >
                                            <Plus size={14} />
                                            Cadastrar "{newExpense.supplier}"
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Unidade</label>
                        <select 
                            className={inputClass}
                            value={newExpense.unit}
                            onChange={e => setNewExpense({...newExpense, unit: e.target.value as Unit})}
                        >
                            {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Categoria</label>
                        <select 
                            className={inputClass}
                            value={newExpense.category}
                            onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})}
                        >
                            {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Row 3: Technical Details & Payment */}
                    
                    {/* Searchable OS Selection (2 cols) */}
                    <div className="lg:col-span-2 relative" ref={dropdownRef}>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">OS Vinculada (Opcional)</label>
                        <div className="relative">
                            <input 
                                type="text"
                                className={inputClass}
                                placeholder="Busque por Título ou ID (Ex: 002, Ralo...)"
                                value={osSearchTerm}
                                onChange={(e) => {
                                    setOsSearchTerm(e.target.value);
                                    setIsOsDropdownOpen(true);
                                    if(e.target.value === '') setNewExpense({...newExpense, linkedOSId: ''});
                                }}
                                onFocus={() => setIsOsDropdownOpen(true)}
                            />
                            {newExpense.linkedOSId && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                                    <Check className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        
                        {isOsDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                                    <li 
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer text-gray-500 dark:text-gray-400 italic"
                                        onClick={() => handleSelectOS(null)}
                                    >
                                        Nenhuma
                                    </li>
                                    {filteredOSList.map(os => (
                                        <li 
                                            key={os.id}
                                            className="px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer flex flex-col border-b border-gray-50 dark:border-slate-600 last:border-0"
                                            onClick={() => handleSelectOS(os)}
                                        >
                                            <div className="font-semibold flex items-center justify-between">
                                                <span>{os.id}</span>
                                                <span className="text-[10px] bg-gray-100 dark:bg-slate-600 px-1.5 rounded text-gray-500 dark:text-gray-300">{os.unit}</span>
                                            </div>
                                            <div className="text-xs truncate">{os.title}</div>
                                        </li>
                                    ))}
                                    {filteredOSList.length === 0 && (
                                        <li className="px-4 py-3 text-center text-gray-400 dark:text-gray-500 text-xs">
                                            Nenhuma OS encontrada.
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tipo de Pagamento</label>
                        <select 
                            className={inputClass}
                            value={newExpense.paymentMethod}
                            onChange={e => setNewExpense({...newExpense, paymentMethod: e.target.value as PaymentMethod})}
                        >
                            {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* Split Warranty Fields */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Garantia Peças (Meses)</label>
                        <input 
                            type="number" 
                            className={numberInputClass}
                            value={newExpense.warrantyPartsMonths}
                            onChange={e => setNewExpense({...newExpense, warrantyPartsMonths: Number(e.target.value)})}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Garantia Serviço (Meses)</label>
                        <input 
                            type="number" 
                            className={numberInputClass}
                            value={newExpense.warrantyServiceMonths}
                            onChange={e => setNewExpense({...newExpense, warrantyServiceMonths: Number(e.target.value)})}
                            placeholder="0"
                        />
                    </div>

                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t dark:border-slate-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl shrink-0">
                 <button onClick={handleCloseModal} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                 <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors">
                    <Save className="w-4 h-4" /> {editingId ? 'Salvar Alterações' : 'Salvar Gasto'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="w-full pl-9 pr-4 py-2 border dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Total em <span className="text-gray-900 dark:text-white font-bold">{getSelectedMonthLabel()} de {selectedYear}</span>:
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">{totalFiltered.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-100 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3">ID</th>
                <SortableHeader label="Item" sortKey="item" />
                <SortableHeader label="Valor" sortKey="value" />
                <SortableHeader label="Data" sortKey="date" />
                <SortableHeader label="Unidade" sortKey="unit" />
                <SortableHeader label="Pagamento" sortKey="payment" />
                <th className="px-6 py-3">OS Vinculada</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.map((expense) => (
                <tr key={expense.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{expense.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{expense.item} <div className="text-xs text-gray-400 dark:text-gray-500">{expense.supplier}</div></td>
                  <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">{expense.unit}</td>
                  <td className="px-6 py-4">
                      <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">{expense.paymentMethod || 'Pix'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {expense.linkedOSId ? (
                        <button onClick={() => onOpenOS(expense.linkedOSId!)} className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline">
                             <LinkIcon className="w-3 h-3" /> {expense.linkedOSId}
                        </button>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                        <button 
                            onClick={() => handleEditClick(expense)}
                            className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => {
                                if(window.confirm('Tem certeza que deseja apagar este gasto?')) onDeleteExpense(expense.id);
                            }}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedExpenses.length === 0 && (
                  <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center w-full">
                         <Filter className="w-8 h-8 mb-2 opacity-20" />
                         <span>Nenhum gasto encontrado para este período.</span>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ServiceOrder, OSStatus, OSPriority, Unit, OSType, HistoryLog, Expense, User, ExpenseCategory, PaymentMethod, Supplier } from '../types';
import { USERS } from '../constants';
import { X, Save, MessageSquare, Calendar, ArrowRightLeft, Plus, DollarSign, Trash2, AlertOctagon, Send, Clock, MapPin, Wrench, Paperclip, User as UserIcon, Lock, Search } from 'lucide-react';

interface OSModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onSave: (order: ServiceOrder) => void;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  currentUser: User;
  suppliers?: Supplier[];
  onAddSupplier?: (supplier: Supplier) => void;
}

const STATUS_STYLES: Record<OSStatus, string> = {
    [OSStatus.ABERTA]: 'bg-blue-100 text-blue-700 border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    [OSStatus.AGUARDANDO]: 'bg-orange-100 text-orange-700 border-orange-200 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
    [OSStatus.EM_ANDAMENTO]: 'bg-purple-100 text-purple-700 border-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    [OSStatus.CONCLUIDA]: 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    [OSStatus.CANCELADA]: 'bg-red-100 text-red-700 border-red-200 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
};

export const OSModal: React.FC<OSModalProps> = ({ isOpen, onClose, order, onSave, expenses, onAddExpense, onDeleteExpense, currentUser, suppliers = [], onAddSupplier }) => {
  const [formData, setFormData] = useState<Partial<ServiceOrder>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'finance'>('details');
  
  // Chat State
  const [newLog, setNewLog] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delegation State
  const [isDelegating, setIsDelegating] = useState(false);
  const [selectedDelegate, setSelectedDelegate] = useState<string>('');

  // Finance State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [newExpenseData, setNewExpenseData] = useState<Partial<Expense>>({
    category: ExpenseCategory.PECAS,
    paymentMethod: PaymentMethod.PIX,
    warrantyPartsMonths: 0,
    warrantyServiceMonths: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Supplier Dropdown State
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Click Outside Handler for Dropdown
  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
              setIsSupplierDropdownOpen(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Data
  useEffect(() => {
    if (isOpen) {
        if (order) {
            setFormData({ ...order });
        } else {
            setFormData({
                id: `OS-${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                status: OSStatus.ABERTA,
                priority: OSPriority.MEDIA,
                unit: Unit.ALDEOTA,
                type: OSType.CORRETIVA,
                dateOpened: new Date().toISOString(),
                ownerId: currentUser.id,
                history: [],
                title: '',
                description: ''
            });
        }
        setNewLog('');
        setActiveTab('details');
        setIsDelegating(false);
        setIsAddingExpense(false);
        setExpenseToDelete(null);
        setNewExpenseData({ 
            category: ExpenseCategory.PECAS, 
            paymentMethod: PaymentMethod.PIX, 
            warrantyPartsMonths: 0, 
            warrantyServiceMonths: 0,
            date: new Date().toISOString().split('T')[0]
        });
    }
  }, [isOpen, order, currentUser]);

  // Auto-scroll chat
  useEffect(() => {
      if (activeTab === 'history' && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [formData.history, activeTab]);

  if (!isOpen) return null;

  // Derived Data
  const linkedExpenses = expenses.filter(e => e.linkedOSId === formData.id);
  const totalCost = linkedExpenses.reduce((acc, cur) => acc + cur.value, 0);
  const owner = USERS.find(u => u.id === formData.ownerId);
  const isEditing = !!order; 
  const isClosedStatus = formData.status === OSStatus.CONCLUIDA || formData.status === OSStatus.CANCELADA;
  
  // Read-Only Logic: If Archived OR Status is Concluded/Cancelled
  const isReadOnly = formData.archived || (isEditing && isClosedStatus);

  // Filter Logic for Supplier Dropdown
  const filteredSuppliersList = suppliers?.filter(s =>
    s.name.toLowerCase().includes((newExpenseData.supplier || '').toLowerCase()) ||
    s.category.toLowerCase().includes((newExpenseData.supplier || '').toLowerCase())
  ) || [];

  const handleSelectSupplier = (supplierName: string) => {
      setNewExpenseData({ ...newExpenseData, supplier: supplierName });
      setIsSupplierDropdownOpen(false);
  };

  const handleQuickAddSupplier = () => {
      if (!newExpenseData.supplier || !onAddSupplier) return;
      
      const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          name: newExpenseData.supplier,
          category: 'Geral', // Default category
          contact: ''
      };
      
      onAddSupplier(newSup);
      setIsSupplierDropdownOpen(false);
  };

  // Handlers
  const handleSave = () => {
    if (isReadOnly) return; // Prevent save if read-only

    if (!formData.title) {
      alert("Preencha o Título da OS");
      return;
    }

    // Handle Closing Date Logic
    // Fix: Ensure dates coming from date inputs (YYYY-MM-DD) are saved as noon UTC to avoid timezone issues
    let finalDateClosed = formData.dateClosed;
    
    // Process dateClosed if it exists and looks like a YYYY-MM-DD string (length 10)
    if (finalDateClosed && finalDateClosed.length === 10) {
        finalDateClosed = new Date(finalDateClosed + 'T12:00:00').toISOString();
    } else if (isClosedStatus && !finalDateClosed) {
        finalDateClosed = new Date().toISOString();
    } else if (!isClosedStatus) {
        finalDateClosed = undefined;
    }

    // Process dateOpened
    let finalDateOpened = formData.dateOpened || new Date().toISOString();
    if (finalDateOpened.length === 10) {
        finalDateOpened = new Date(finalDateOpened + 'T12:00:00').toISOString();
    }

    const savedOrder: ServiceOrder = {
      id: formData.id!,
      title: formData.title || '',
      unit: formData.unit || Unit.ALDEOTA,
      description: formData.description || '',
      status: formData.status || OSStatus.ABERTA,
      type: formData.type || OSType.CORRETIVA,
      priority: formData.priority || OSPriority.MEDIA,
      dateOpened: finalDateOpened,
      ownerId: formData.ownerId || currentUser.id,
      dateForecast: formData.dateForecast,
      dateClosed: finalDateClosed,
      history: formData.history || [],
      archived: formData.archived || false
    };

    if (!order) {
        savedOrder.history.push({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            message: `OS Criada`,
            userId: currentUser.id
        });
    }

    onSave(savedOrder);
    onClose();
  };

  const handleDelegate = () => {
     if(isReadOnly) return;
     if(!selectedDelegate) return;
     const newOwner = USERS.find(u => u.id === selectedDelegate);
     if(!newOwner) return;

     if (order) {
         if(window.confirm(`Delegar para ${newOwner.name}?`)) {
             const log: HistoryLog = {
                 id: Date.now().toString(),
                 date: new Date().toISOString(),
                 message: `Responsabilidade transferida para ${newOwner.name}`,
                 userId: currentUser.id
             };
             setFormData(prev => ({
                 ...prev,
                 ownerId: newOwner.id,
                 history: [log, ...(prev.history || [])]
             }));
             setIsDelegating(false);
         }
     } else {
         setFormData(prev => ({ ...prev, ownerId: newOwner.id }));
         setIsDelegating(false);
     }
  };

  const handleAddLog = async () => {
    if (isReadOnly) return;
    if (!newLog.trim()) return;
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 300)); 
    const log: HistoryLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      message: newLog,
      userId: currentUser.id
    };
    setFormData(prev => ({ ...prev, history: [...(prev.history || []), log] }));
    setNewLog('');
    setIsSending(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const log: HistoryLog = {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              message: `📎 Arquivo anexado: ${file.name} (Simulação)`,
              userId: currentUser.id
          };
          setFormData(prev => ({ ...prev, history: [...(prev.history || []), log] }));
      }
  };

  const handleSaveExpense = () => {
      if (isReadOnly) return;
      if (!newExpenseData.item || !newExpenseData.value || !newExpenseData.supplier || !newExpenseData.date) {
          alert('Preencha campos obrigatórios (*)');
          return;
      }
      
      const dateToSave = newExpenseData.date 
        ? new Date(newExpenseData.date + 'T12:00:00').toISOString() 
        : new Date().toISOString();

      const expenseToSave: Expense = {
          id: `FIN-${Date.now().toString().slice(-4)}`,
          item: newExpenseData.item,
          value: Number(newExpenseData.value),
          supplier: newExpenseData.supplier,
          category: newExpenseData.category as ExpenseCategory,
          paymentMethod: newExpenseData.paymentMethod as PaymentMethod,
          date: dateToSave,
          warrantyPartsMonths: Number(newExpenseData.warrantyPartsMonths) || 0,
          warrantyServiceMonths: Number(newExpenseData.warrantyServiceMonths) || 0,
          linkedOSId: formData.id,
          unit: formData.unit as Unit,
      };
      onAddExpense(expenseToSave);
      setNewExpenseData({ 
          category: ExpenseCategory.PECAS, 
          paymentMethod: PaymentMethod.PIX, 
          warrantyPartsMonths: 0, 
          warrantyServiceMonths: 0,
          date: new Date().toISOString().split('T')[0]
      });
      setIsAddingExpense(false);
  };

  const getGroupedHistory = () => {
      const history = formData.history || [];
      const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const groups: { dateLabel: string, logs: HistoryLog[] }[] = [];
      
      sortedHistory.forEach(log => {
          const date = new Date(log.date);
          const today = new Date();
          const isToday = date.toDateString() === today.toDateString();
          const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
          const isYesterday = date.toDateString() === yesterday.toDateString();

          let dateLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
          if (isToday) dateLabel = 'Hoje';
          if (isYesterday) dateLabel = 'Ontem';

          const lastGroup = groups[groups.length - 1];
          if (lastGroup && lastGroup.dateLabel === dateLabel) {
              lastGroup.logs.push(log);
          } else {
              groups.push({ dateLabel, logs: [log] });
          }
      });
      return groups;
  };

  const inputClass = `w-full border border-gray-200 dark:border-slate-600 rounded-xl p-3 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all placeholder-gray-400 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`;
  const numberInputClass = `${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
  const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      
      {/* Delete Expense Confirmation */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-[60] bg-red-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm border border-red-500 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-red-500 p-4 flex justify-center"><AlertOctagon className="w-10 h-10 text-white" /></div>
                <div className="p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Excluir Despesa?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Remover <strong>{expenseToDelete.item}</strong>?</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setExpenseToDelete(null)} className="py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold text-sm">Cancelar</button>
                        <button onClick={() => { onDeleteExpense(expenseToDelete.id); setExpenseToDelete(null); }} className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm">Excluir</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Modal Container - MORE VERTICAL (max-w-3xl) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700 relative overflow-hidden h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b dark:border-slate-700 flex justify-between items-start bg-white dark:bg-slate-800 shrink-0">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {order ? `Editar ${formData.id}` : 'Nova Ordem de Serviço'}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 uppercase tracking-wide ${STATUS_STYLES[formData.status || OSStatus.ABERTA]}`}>
                       <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                       {formData.status || 'Nova'}
                    </span>
                    {isReadOnly && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600 flex items-center gap-1">
                            <Lock size={10} /> Arquivada
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Owner / Delegate */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-full pl-1 pr-3 py-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white dark:ring-slate-700 ${owner?.color || 'bg-gray-400'}`}>
                        {owner?.avatarUrl ? (
                            <img src={owner.avatarUrl} alt={owner.initials} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            owner?.initials || '?'
                        )}
                      </div>
                      <div className="flex flex-col leading-none">
                          <span className="text-[8px] text-slate-400 uppercase font-bold">Resp.</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{owner?.name.split(' ')[0] || '-'}</span>
                      </div>
                      {!isReadOnly && (
                        <button 
                            onClick={() => { setIsDelegating(true); setSelectedDelegate(''); }} 
                            className="ml-1 p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-400 hover:text-indigo-500 transition-colors"
                            title="Trocar Responsável"
                        >
                            <ArrowRightLeft size={12}/>
                        </button>
                      )}
                </div>
                
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-slate-700 px-6 bg-white dark:bg-slate-800 shrink-0 gap-4">
            <button onClick={() => setActiveTab('details')} className={`py-3 text-sm font-bold border-b-[3px] transition-all ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Detalhes</button>
            {order && (
                <>
                <button onClick={() => setActiveTab('history')} className={`py-3 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Chat <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full">{formData.history?.length || 0}</span>
                </button>
                <button onClick={() => setActiveTab('finance')} className={`py-3 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 ${activeTab === 'finance' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Finanças <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full">{linkedExpenses.length}</span>
                </button>
                </>
            )}
        </div>

        {/* Body Content */}
        <div className={`flex-1 overflow-y-auto relative ${activeTab === 'history' ? 'bg-slate-100 dark:bg-slate-900' : 'bg-white dark:bg-slate-800 p-6'}`}>
            
            {/* Delegation Overlay */}
            {isDelegating && !isReadOnly && (
                <div className="absolute inset-0 bg-white/95 dark:bg-slate-800/95 z-40 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                         <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                         {order ? 'Delegar Responsabilidade' : 'Definir Responsável'}
                    </h4>
                    <p className="text-center text-gray-500 text-sm mb-4 max-w-xs">
                        {order 
                            ? "Transfira esta ordem para outro membro da equipe. Isso será registrado no histórico."
                            : "Selecione quem será o responsável pela execução desta nova solicitação."
                        }
                    </p>
                    <select className={inputClass + " max-w-xs mb-4"} value={selectedDelegate} onChange={(e) => setSelectedDelegate(e.target.value)}>
                        <option value="">Selecione...</option>
                        {USERS.filter(u => u.id !== formData.ownerId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button onClick={() => setIsDelegating(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
                        <button onClick={handleDelegate} disabled={!selectedDelegate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Confirmar</button>
                    </div>
                </div>
            )}

            {/* TAB: DETAILS */}
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Information Column */}
                     <div className="space-y-5">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2 text-sm">Dados Principais</h4>
                        <div>
                            <label className={labelClass}>Título</label>
                            <input 
                                type="text" 
                                className={`${inputClass} text-base font-medium`} 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})} 
                                placeholder="Ex: Conserto do Ar Condicionado"
                                autoFocus 
                                disabled={isReadOnly}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Unidade</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select className={`${inputClass} pl-10`} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as Unit})} disabled={isReadOnly}>
                                        {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Tipo</label>
                                <div className="relative">
                                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select className={`${inputClass} pl-10`} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as OSType})} disabled={isReadOnly}>
                                        {Object.values(OSType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Descrição Detalhada</label>
                            <textarea rows={5} className={inputClass} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Descreva o problema com detalhes..." disabled={isReadOnly} />
                        </div>
                     </div>

                     {/* Status & Dates Column */}
                     <div className="space-y-5">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 pb-2 text-sm">Controle & Prazos</h4>
                        
                        <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-600 space-y-4">
                            <div>
                                <label className={labelClass}>Status Atual</label>
                                <select className={`${inputClass} font-semibold`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as OSStatus})} disabled={isReadOnly}>
                                    {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Prioridade</label>
                                <select className={inputClass} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as OSPriority})} disabled={isReadOnly}>
                                    {Object.values(OSPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            
                            {isClosedStatus ? (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mb-1.5"><Calendar size={12}/> Data de Fechamento</label>
                                    <input type="date" className={inputClass} value={formData.dateClosed ? new Date(formData.dateClosed).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} onChange={e => setFormData({...formData, dateClosed: e.target.value})} disabled={isReadOnly} />
                                </div>
                            ) : (
                                <div>
                                    <label className={labelClass}>Abertura de OS</label>
                                    <input type="date" className={inputClass} value={formData.dateOpened ? new Date(formData.dateOpened).toISOString().split('T')[0] : ''} onChange={e => setFormData({...formData, dateOpened: e.target.value})} disabled={isReadOnly} />
                                </div>
                            )}
                        </div>
                        
                        {/* Costs Summary */}
                        {linkedExpenses.length > 0 && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5"/> Total em Custos
                                    </span>
                                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            </div>
                        )}
                     </div>
                </div>
            )}

            {/* TAB: CHAT (SIMPLE AND ROBUST) */}
            {activeTab === 'history' && (
                <div className="flex flex-col h-full absolute inset-0 bg-slate-100 dark:bg-slate-900">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                        {(!formData.history || formData.history.length === 0) && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                                <MessageSquare size={48} />
                                <p className="text-sm mt-2">Sem mensagens ainda.</p>
                            </div>
                        )}
                        {getGroupedHistory().map((group, idx) => (
                            <div key={idx} className="relative">
                                {/* Date Badge */}
                                <div className="sticky top-0 z-10 flex justify-center mb-4 pt-2">
                                    <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-3 py-1 rounded-full text-slate-500 dark:text-slate-400 uppercase shadow-sm">
                                        {group.dateLabel}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {group.logs.map(log => {
                                        const isMe = log.userId === currentUser.id;
                                        const logUser = USERS.find(u => u.id === log.userId);
                                        const time = new Date(log.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});

                                        return (
                                            <div key={log.id} className={`flex w-full items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                
                                                {/* Avatar */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 border-2 border-white dark:border-slate-800 shadow-sm ${logUser?.color || 'bg-gray-400'}`}>
                                                    {logUser?.avatarUrl ? (
                                                        <img src={logUser.avatarUrl} alt={logUser.initials} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        logUser?.initials || <UserIcon size={12} />
                                                    )}
                                                </div>

                                                {/* Bubble */}
                                                <div className={`
                                                    max-w-[85%] px-4 py-2 relative shadow-sm
                                                    ${isMe 
                                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-none' 
                                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none'}
                                                `}>
                                                    {!isMe && <span className="block text-[10px] font-bold text-indigo-500 dark:text-indigo-400 mb-0.5">{logUser?.name || 'Sistema'}</span>}
                                                    <p className="text-sm leading-snug whitespace-pre-wrap">{log.message}</p>
                                                    <span className={`text-[9px] block text-right mt-1 opacity-70 ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>{time}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Input Area */}
                    {!isReadOnly && (
                    <div className="p-3 bg-white dark:bg-slate-800 border-t dark:border-slate-700 shrink-0">
                        <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <button 
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                title="Anexar arquivo"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Paperclip size={20} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileSelect}
                            />
                            <textarea 
                                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 resize-none py-2 max-h-32"
                                placeholder="Digite sua mensagem..."
                                rows={1}
                                value={newLog}
                                onChange={e => setNewLog(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddLog();
                                    }
                                }}
                            />
                            <button 
                                onClick={handleAddLog} 
                                disabled={!newLog.trim() || isSending} 
                                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors shadow-sm mb-0.5"
                            >
                                {isSending ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                            </button>
                        </div>
                    </div>
                    )}
                </div>
            )}

            {/* TAB: FINANCE */}
            {activeTab === 'finance' && (
                <div className="space-y-4">
                     <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                         <span className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2"><DollarSign size={20}/> Custo Total</span>
                         <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                     </div>
                     
                     {!isAddingExpense && !isReadOnly ? (
                         <button onClick={() => setIsAddingExpense(true)} className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl text-gray-500 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-center gap-2">
                             <Plus size={18} /> Adicionar Despesa
                         </button>
                     ) : isAddingExpense && (
                         <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-600 animate-in fade-in slide-in-from-top-2 pb-32">
                             <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200"><DollarSign size={18}/> Novo Gasto</h4>
                             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                 <div className="col-span-2 lg:col-span-3">
                                     <label className={labelClass}>Item*</label>
                                     <input type="text" className={inputClass} placeholder="Ex: Peça X" value={newExpenseData.item || ''} onChange={e => setNewExpenseData({...newExpenseData, item: e.target.value})} />
                                 </div>
                                 <div><label className={labelClass}>Valor*</label><input type="number" className={numberInputClass} value={newExpenseData.value || ''} onChange={e => setNewExpenseData({...newExpenseData, value: parseFloat(e.target.value)})} /></div>
                                 <div><label className={labelClass}>Data*</label><input type="date" className={inputClass} value={newExpenseData.date || ''} onChange={e => setNewExpenseData({...newExpenseData, date: e.target.value})} /></div>
                                 <div>
                                     <label className={labelClass}>Categoria*</label>
                                     <select className={inputClass} value={newExpenseData.category} onChange={e => setNewExpenseData({...newExpenseData, category: e.target.value as ExpenseCategory})}>
                                         {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                     </select>
                                 </div>
                                 
                                 {/* Custom Supplier Dropdown */}
                                 <div className="col-span-2 relative" ref={supplierDropdownRef}>
                                     <label className={labelClass}>Prestador*</label>
                                     <div className="relative">
                                         <input 
                                            type="text" 
                                            className={inputClass} 
                                            value={newExpenseData.supplier || ''} 
                                            onChange={e => {
                                                setNewExpenseData({...newExpenseData, supplier: e.target.value});
                                                setIsSupplierDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsSupplierDropdownOpen(true)}
                                            placeholder="Busque ou cadastre..."
                                         />
                                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <Search size={14} />
                                         </div>
                                     </div>

                                     {isSupplierDropdownOpen && (newExpenseData.supplier || filteredSuppliersList.length > 0) && (
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
                                            
                                            {/* Quick Add Option - Always visible if there is input text, offering to create a new one even if matches found */}
                                            {newExpenseData.supplier && (
                                                <div className="p-2 border-t dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 sticky bottom-0">
                                                    <button 
                                                        onClick={handleQuickAddSupplier}
                                                        className="w-full text-left px-2 py-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md flex items-center gap-2"
                                                    >
                                                        <Plus size={14} />
                                                        Cadastrar "{newExpenseData.supplier}"
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                     )}
                                 </div>

                                 <div>
                                     <label className={labelClass}>Pagamento*</label>
                                     <select className={inputClass} value={newExpenseData.paymentMethod} onChange={e => setNewExpenseData({...newExpenseData, paymentMethod: e.target.value as PaymentMethod})}>
                                         {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                     </select>
                                 </div>
                             </div>
                             <div className="flex justify-end gap-3">
                                 <button onClick={() => setIsAddingExpense(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                                 <button onClick={handleSaveExpense} className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">Salvar</button>
                             </div>
                         </div>
                     )}

                     <div className="border dark:border-slate-600 rounded-2xl overflow-hidden shadow-sm">
                         <table className="w-full text-sm text-left">
                             <thead className="bg-gray-100 dark:bg-slate-700 text-xs uppercase text-gray-500">
                                 <tr>
                                     <th className="px-5 py-3">Data</th>
                                     <th className="px-5 py-3">Item</th>
                                     <th className="px-5 py-3">Valor</th>
                                     <th className="px-5 py-3"></th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y dark:divide-slate-700">
                                 {linkedExpenses.map(e => (
                                     <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 group">
                                         <td className="px-5 py-3 text-xs text-gray-500">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                                         <td className="px-5 py-3">
                                             <div className="font-bold text-slate-700 dark:text-slate-200">{e.item}</div>
                                             <div className="text-[10px] text-gray-400">{e.supplier}</div>
                                         </td>
                                         <td className="px-5 py-3 font-bold text-emerald-600">{e.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                                         <td className="px-5 py-3 text-right">
                                             {!isReadOnly && (
                                                <button onClick={() => setExpenseToDelete(e)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                             )}
                                         </td>
                                     </tr>
                                 ))}
                                 {linkedExpenses.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">Nenhum custo registrado.</td></tr>}
                             </tbody>
                         </table>
                     </div>
                </div>
            )}
        </div>

        {/* Footer (Hidden in Chat to maximize space) */}
        {activeTab !== 'history' && (
            <div className="p-5 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-3xl shrink-0">
                {isReadOnly ? (
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white rounded-xl text-sm font-bold transition-colors">Fechar</button>
                ) : (
                    <>
                        <button onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                            <Save className="w-4 h-4" /> Salvar Alterações
                        </button>
                    </>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

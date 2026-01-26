import React, { useState, useMemo } from 'react';
import { PersonalTask, User, ServiceOrder } from '../types';
import { CheckSquare, Plus, Calendar, Flag, Trash2, Search, Link as LinkIcon, CheckCircle2, AlertCircle, X, Check, Pencil } from 'lucide-react';

interface TaskManagerProps {
  tasks: PersonalTask[];
  currentUser: User;
  orders: ServiceOrder[];
  onAddTask: (task: PersonalTask) => void;
  onUpdateTask: (task: PersonalTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenOS: (osId: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ 
    tasks, 
    currentUser, 
    orders, 
    onAddTask,
    onUpdateTask,
    onToggleTask, 
    onDeleteTask,
    onOpenOS
}) => {
    
  // Local State for New Task Form
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [newTask, setNewTask] = useState<Partial<PersonalTask>>({
      priority: 'medium',
      title: '',
      description: '',
      linkedOSId: '',
      dueDate: ''
  });
  
  // OS Search Logic for dropdown
  const [osSearchTerm, setOsSearchTerm] = useState('');
  const [isOsDropdownOpen, setIsOsDropdownOpen] = useState(false);

  // Filtering State
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  const closeForm = () => {
      setIsAdding(false);
      setEditingTaskId(null);
      setNewTask({ priority: 'medium', title: '', description: '', linkedOSId: '', dueDate: '' });
      setOsSearchTerm('');
  };

  const handleEditClick = (task: PersonalTask) => {
      setNewTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate || '',
          linkedOSId: task.linkedOSId
      });
      if(task.linkedOSId) {
          const os = orders.find(o => o.id === task.linkedOSId);
          setOsSearchTerm(os ? `${os.id} - ${os.title}` : task.linkedOSId);
      } else {
          setOsSearchTerm('');
      }
      setEditingTaskId(task.id);
      setIsAdding(true);
  };

  // Logic to save task (Create or Update)
  const handleSaveTask = () => {
      if (!newTask.title?.trim()) {
          alert('Digite o título da tarefa.');
          return;
      }

      const taskData: PersonalTask = {
          id: editingTaskId || `TASK-${Date.now()}`,
          userId: currentUser.id,
          title: newTask.title!, // Assertion used here to satisfy TS
          description: newTask.description,
          dueDate: newTask.dueDate,
          priority: (newTask.priority as 'high' | 'medium' | 'low') || 'medium',
          completed: false, // Status preserved via App logic if needed
          linkedOSId: newTask.linkedOSId
      };

      if (editingTaskId) {
          // If editing, preserve the completed status from original task
          const originalTask = tasks.find(t => t.id === editingTaskId);
          if (originalTask) {
              taskData.completed = originalTask.completed;
          }
          onUpdateTask(taskData);
      } else {
          onAddTask(taskData);
      }
      
      closeForm();
  };

  // Logic to search OS
  const filteredOSList = orders.filter(os => 
      os.id.toLowerCase().includes(osSearchTerm.toLowerCase()) ||
      os.title.toLowerCase().includes(osSearchTerm.toLowerCase())
  ).slice(0, 5); // Limit to 5 results

  // My Tasks Logic (Filter by User and Status)
  const myTasks = useMemo(() => {
      let userTasks = tasks.filter(t => t.userId === currentUser.id);
      
      // Sort: Pending first, then by date (soonest first)
      userTasks.sort((a, b) => {
          if (a.completed === b.completed) {
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          return a.completed ? 1 : -1;
      });

      if (filterStatus === 'pending') return userTasks.filter(t => !t.completed);
      if (filterStatus === 'completed') return userTasks.filter(t => t.completed);
      
      return userTasks;
  }, [tasks, currentUser.id, filterStatus]);

  // Priority Colors
  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'high': return 'text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/20';
          case 'medium': return 'text-orange-600 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-900/20';
          case 'low': return 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-900/20';
          default: return 'text-gray-600 bg-gray-50';
      }
  };

  // Date Formatting
  const formatDate = (dateString?: string) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const isTomorrow = new Date(today.setDate(today.getDate() + 1)).toDateString() === date.toDateString();
      
      if (isToday) return 'Hoje';
      if (isTomorrow) return 'Amanhã';
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };
  
  const isOverdue = (dateString?: string) => {
      if(!dateString) return false;
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0,0,0,0);
      return date < today;
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-6 h-6 text-red-600 dark:text-red-400" />
                    Minhas Tarefas
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Organize seu dia a dia e não perca prazos.</p>
            </div>
            
            <div className="flex gap-3">
                <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border shadow-sm dark:border-slate-700">
                    <button 
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'all' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    >
                        Todas
                    </button>
                    <button 
                         onClick={() => setFilterStatus('pending')}
                         className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    >
                        Pendentes
                    </button>
                    <button 
                         onClick={() => setFilterStatus('completed')}
                         className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'completed' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                    >
                        Feitas
                    </button>
                </div>
                
                <button 
                    onClick={() => {
                        setEditingTaskId(null);
                        setNewTask({ priority: 'medium', title: '', description: '', linkedOSId: '', dueDate: '' });
                        setIsAdding(!isAdding);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-bold"
                >
                    <Plus className="w-4 h-4" />
                    Nova Tarefa
                </button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden">
            
            {/* Left Column: Input Form */}
            {isAdding && (
                <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-red-100 dark:border-slate-700 shadow-xl h-fit animate-in slide-in-from-left-4 duration-300 z-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white">{editingTaskId ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                        <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={18} /></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">O que precisa ser feito?</label>
                            <input 
                                type="text" 
                                className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                placeholder="Ex: Ligar para fornecedor..."
                                value={newTask.title}
                                onChange={e => setNewTask({...newTask, title: e.target.value})}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Detalhes (Opcional)</label>
                            <textarea 
                                className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 mt-1 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none transition-all"
                                rows={3}
                                placeholder="Adicione notas, telefones ou observações..."
                                value={newTask.description}
                                onChange={e => setNewTask({...newTask, description: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Prazo</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg py-2 pl-9 pr-2 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                                    />
                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                             </div>
                             <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Prioridade</label>
                                <select 
                                    className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg py-2 px-2 text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
                                    value={newTask.priority}
                                    onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                                >
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                </select>
                             </div>
                        </div>

                        {/* OS Linking */}
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Vincular OS (Opcional)</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg py-2 pl-9 pr-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                    placeholder="Buscar OS..."
                                    value={osSearchTerm}
                                    onChange={e => {
                                        setOsSearchTerm(e.target.value);
                                        setIsOsDropdownOpen(true);
                                        if (e.target.value === '') setNewTask({...newTask, linkedOSId: ''});
                                    }}
                                    onFocus={() => setIsOsDropdownOpen(true)}
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                {newTask.linkedOSId && <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                            </div>
                            
                            {isOsDropdownOpen && osSearchTerm && (
                                <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-xl rounded-lg mt-1 z-20 max-h-40 overflow-y-auto">
                                    {filteredOSList.map(os => (
                                        <div 
                                            key={os.id} 
                                            onClick={() => {
                                                setNewTask({...newTask, linkedOSId: os.id});
                                                setOsSearchTerm(`${os.id} - ${os.title}`);
                                                setIsOsDropdownOpen(false);
                                            }}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-slate-700 cursor-pointer border-b dark:border-slate-700 last:border-0 text-sm"
                                        >
                                            <span className="font-bold text-gray-700 dark:text-gray-200">{os.id}</span>
                                            <span className="text-gray-500 dark:text-gray-400 text-xs block truncate">{os.title}</span>
                                        </div>
                                    ))}
                                    {filteredOSList.length === 0 && (
                                        <div className="p-3 text-xs text-gray-400 text-center">Nenhuma OS encontrada.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleSaveTask}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 dark:shadow-none mt-2 transition-all active:scale-95"
                        >
                            {editingTaskId ? 'Salvar Alterações' : 'Criar Tarefa'}
                        </button>
                    </div>
                </div>
            )}

            {/* Main Column: Task List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
                {myTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <CheckSquare className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-600 dark:text-slate-400">Tudo limpo!</h3>
                        <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs">Você não tem tarefas com esse filtro. Que tal adicionar uma nova?</p>
                        <button 
                            onClick={() => {
                                setEditingTaskId(null);
                                setIsAdding(true);
                            }}
                            className="mt-6 text-red-600 font-bold text-sm hover:underline"
                        >
                            Criar primeira tarefa
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myTasks.map(task => {
                            const isLate = !task.completed && isOverdue(task.dueDate);
                            return (
                                <div 
                                    key={task.id} 
                                    className={`
                                        group bg-white dark:bg-slate-800 p-4 rounded-xl border transition-all duration-200 relative overflow-hidden
                                        ${task.completed ? 'opacity-60 border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800' : 'border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 hover:shadow-md'}
                                    `}
                                >
                                    {/* Left Border Status Indicator */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.completed ? 'bg-emerald-400' : isLate ? 'bg-red-500' : 'bg-gray-200 dark:bg-slate-600'}`}></div>

                                    <div className="flex items-start gap-4 pl-2">
                                        {/* Checkbox */}
                                        <button 
                                            onClick={() => onToggleTask(task.id)}
                                            className={`
                                                mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                                                ${task.completed 
                                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                    : 'border-gray-300 dark:border-slate-500 hover:border-red-400 dark:hover:border-red-400 text-transparent hover:text-red-100 dark:hover:text-red-900'}
                                            `}
                                        >
                                            <Check size={14} strokeWidth={4} />
                                        </button>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold text-base ${task.completed ? 'text-gray-500 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-white'}`}>
                                                    {task.title}
                                                </h4>
                                                
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                     <button 
                                                        onClick={() => handleEditClick(task)}
                                                        className="text-gray-300 dark:text-slate-600 hover:text-indigo-500 transition-colors p-1"
                                                        title="Editar"
                                                     >
                                                         <Pencil size={16} />
                                                     </button>
                                                     <button 
                                                        onClick={() => onDeleteTask(task.id)}
                                                        className="text-gray-300 dark:text-slate-600 hover:text-red-500 transition-colors p-1"
                                                        title="Excluir"
                                                     >
                                                         <Trash2 size={16} />
                                                     </button>
                                                </div>
                                            </div>

                                            {task.description && (
                                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                                            )}
                                            
                                            {/* Meta Tags */}
                                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                                {/* Date */}
                                                {task.dueDate && (
                                                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md ${isLate && !task.completed ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                                                        {isLate ? <AlertCircle size={12} /> : <Calendar size={12} />}
                                                        {formatDate(task.dueDate)}
                                                    </span>
                                                )}

                                                {/* Priority */}
                                                <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getPriorityColor(task.priority)}`}>
                                                    <Flag size={10} />
                                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                                </span>

                                                {/* Linked OS */}
                                                {task.linkedOSId && (
                                                    <button 
                                                        onClick={() => onOpenOS(task.linkedOSId!)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                    >
                                                        <LinkIcon size={10} />
                                                        {task.linkedOSId}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
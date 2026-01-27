import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ServiceOrder, Expense, OSStatus, Unit } from '../types';
import { AlertCircle, CheckCircle, Clock, DollarSign, Activity, Calendar, ArrowRight, BarChart3, PieChart as PieIcon, TrendingUp, Filter } from 'lucide-react';

interface DashboardProps {
  orders: ServiceOrder[];
  expenses: Expense[];
  isDarkMode?: boolean;
  onNavigate: (view: any) => void;
}

const COLORS = ['#3B82F6', '#A855F7', '#10B981', '#FF8042', '#8884d8'];

// Custom Tooltip for professional look
const CustomTooltip = ({ active, payload, label, type }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 shadow-xl rounded-xl min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
        <p className="font-bold text-slate-800 dark:text-slate-100 mb-2 border-b dark:border-slate-700 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-500 dark:text-slate-400 capitalize">{entry.name}:</span>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-200">
                {type === 'currency' 
                    ? Number(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : entry.value
                }
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Reusable Filter Component
const UnitFilter = ({ value, onChange }: { value: string, onChange: (val: Unit | 'ALL') => void }) => (
    <div className="relative">
        <Filter className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <select 
            value={value}
            onChange={(e) => onChange(e.target.value as Unit | 'ALL')}
            className="pl-6 pr-2 py-1 text-xs border border-gray-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 text-gray-600 dark:text-gray-300 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors max-w-[130px] truncate"
        >
            <option value="ALL">Todas Lojas</option>
            {Object.values(Unit).map(u => (
                <option key={u} value={u}>{u}</option>
            ))}
        </select>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ orders, expenses, isDarkMode = false, onNavigate }) => {
  const [statusUnitFilter, setStatusUnitFilter] = useState<Unit | 'ALL'>('ALL');
  const [osVolumeFilter, setOsVolumeFilter] = useState<Unit | 'ALL'>('ALL');
  const [expensesFilter, setExpensesFilter] = useState<Unit | 'ALL'>('ALL');
  const [alertsFilter, setAlertsFilter] = useState<Unit | 'ALL'>('ALL');

  // Stats Calculation
  const totalOpen = orders.filter(o => o.status === OSStatus.ABERTA).length;
  const totalInProgress = orders.filter(o => o.status === OSStatus.EM_ANDAMENTO || o.status === OSStatus.AGUARDANDO).length;
  const totalClosed = orders.filter(o => o.status === OSStatus.CONCLUIDA).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalMonthlyExpense = monthlyExpenses.reduce((acc, curr) => acc + curr.value, 0);

  // --- Data Preparation & Filtering ---

  // 1. Chart: OS Volume by Unit
  const ordersByUnitRaw = Object.values(Unit).map(unit => {
    return {
      name: unit,
      Abertas: orders.filter(o => o.unit === unit && o.status !== OSStatus.CONCLUIDA && o.status !== OSStatus.CANCELADA).length,
      Concluidas: orders.filter(o => o.unit === unit && o.status === OSStatus.CONCLUIDA).length,
    };
  });
  
  const filteredOrdersByUnit = osVolumeFilter === 'ALL' 
    ? ordersByUnitRaw 
    : ordersByUnitRaw.filter(item => item.name === osVolumeFilter);

  const totalOrdersInVolumeChart = filteredOrdersByUnit.reduce((acc, curr) => acc + curr.Abertas + curr.Concluidas, 0);


  // 2. Chart: Expenses by Unit
  const expenseByUnitRaw = Object.values(Unit).map(unit => {
    const val = monthlyExpenses.filter(e => e.unit === unit).reduce((acc, curr) => acc + curr.value, 0);
    return { name: unit, valor: val };
  });

  const filteredExpenseByUnit = expensesFilter === 'ALL'
    ? expenseByUnitRaw
    : expenseByUnitRaw.filter(item => item.name === expensesFilter);

  const totalExpensesInChart = filteredExpenseByUnit.reduce((acc, curr) => acc + curr.valor, 0);


  // 3. Chart: Status Geral (Already implemented logic, kept consistent)
  const filteredOrdersForStatus = statusUnitFilter === 'ALL' 
    ? orders 
    : orders.filter(o => o.unit === statusUnitFilter);

  const statusOpenFiltered = filteredOrdersForStatus.filter(o => o.status === OSStatus.ABERTA).length;
  const statusProgressFiltered = filteredOrdersForStatus.filter(o => o.status === OSStatus.EM_ANDAMENTO || o.status === OSStatus.AGUARDANDO).length;
  const statusClosedFiltered = filteredOrdersForStatus.filter(o => o.status === OSStatus.CONCLUIDA).length;
  const totalFilteredStatus = filteredOrdersForStatus.length;

  const statusData = [
    { name: 'Abertas', value: statusOpenFiltered, color: '#3B82F6' }, // Blue
    { name: 'Em Andamento', value: statusProgressFiltered, color: '#A855F7' }, // Purple
    { name: 'Concluídas', value: statusClosedFiltered, color: '#10B981' }, // Emerald
  ];

  // 4. List: Recent Alerts
  const filteredAlerts = orders
    .filter(o => o.status !== OSStatus.CONCLUIDA)
    .filter(o => alertsFilter === 'ALL' || o.unit === alertsFilter)
    .slice(0, 5);


  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Dashboard Geral
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visão geral dos indicadores de performance e manutenção.</p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 pr-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
             <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2.5 rounded-lg hidden sm:block">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
             </div>
             <div className="flex flex-col items-end sm:items-start">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Resumo de</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-center min-w-[120px]">
                        {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-400">Dados consolidados.</span>
                    <button 
                        onClick={() => onNavigate('reports')}
                        className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-0.5 transition-colors hover:underline"
                    >
                        Clique aqui para conferir detalhes e relatórios <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                </div>
             </div>
        </div>
      </div>

      {/* Summary Cards (Global Stats - Unaffected by filters for big picture context) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-l-4 border-l-blue-500 border-y-slate-100 dark:border-y-slate-700 border-r-slate-100 dark:border-r-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">OS Abertas</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalOpen}</p>
          </div>
          <AlertCircle className="w-10 h-10 text-blue-100 dark:text-blue-900 bg-blue-500 rounded-lg p-2" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-l-4 border-l-purple-500 border-y-slate-100 dark:border-y-slate-700 border-r-slate-100 dark:border-r-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Em Andamento</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalInProgress}</p>
          </div>
          <Clock className="w-10 h-10 text-purple-100 dark:text-purple-900 bg-purple-500 rounded-lg p-2" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500 border-y-slate-100 dark:border-y-slate-700 border-r-slate-100 dark:border-r-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Concluídas (Mês)</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalClosed}</p>
          </div>
          <CheckCircle className="w-10 h-10 text-green-100 dark:text-green-900 bg-green-500 rounded-lg p-2" />
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-l-4 border-l-red-500 border-y-slate-100 dark:border-y-slate-700 border-r-slate-100 dark:border-r-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Gasto Atual</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {totalMonthlyExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <DollarSign className="w-10 h-10 text-red-100 dark:text-red-900 bg-red-500 rounded-lg p-2" />
        </div>
      </div>

      {/* Main Charts Section - Stacked for 768p Notebooks */}
      <div className="flex flex-col gap-8">
        
        {/* Chart 1: OS Status by Unit (Horizontal) */}
        <div className="bg-white dark:bg-slate-800 p-0 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-xl">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Volume de OS por Unidade</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Comparativo entre demandas abertas e entregas.</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <UnitFilter value={osVolumeFilter} onChange={setOsVolumeFilter} />
                <div className="bg-white dark:bg-slate-700 px-3 py-1 rounded-lg border dark:border-slate-600 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                    Total: <span className="font-bold text-gray-900 dark:text-white">{totalOrdersInVolumeChart}</span>
                </div>
             </div>
          </div>
          
          <div className="w-full h-[320px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredOrdersByUnit} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke={isDarkMode ? '#334155' : '#f0f0f0'} />
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 500}} 
                    interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Abertas" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} stackId="a" />
                <Bar dataKey="Concluidas" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expenses by Unit (Horizontal) */}
        <div className="bg-white dark:bg-slate-800 p-0 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-xl">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Gastos por Unidade (Mês Atual)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Alocação de recursos financeiros por loja.</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <UnitFilter value={expensesFilter} onChange={setExpensesFilter} />
                <div className="bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg border border-red-100 dark:border-red-900/30 text-xs font-medium text-red-700 dark:text-red-300 shadow-sm">
                    Total: <span className="font-bold">{totalExpensesInChart.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
             </div>
          </div>

          <div className="w-full h-[320px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredExpenseByUnit} layout="vertical" margin={{ top: 5, right: 50, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDarkMode ? '#334155' : '#f0f0f0'} />
                <XAxis type="number" tickFormatter={(value) => `R$ ${value}`} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120} 
                    tick={{fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 500}} 
                />
                <Tooltip content={<CustomTooltip type="currency" />} cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}} />
                <Bar dataKey="valor" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={24} name="Valor Gasto">
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

       {/* Secondary Charts Row */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Status Chart - Improved UI with Filter */}
          <div className="bg-white dark:bg-slate-800 p-0 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-80 lg:col-span-1 flex flex-col overflow-hidden">
             {/* Header with Filter */}
             <div className="flex items-center justify-between p-5 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className="bg-white dark:bg-slate-700 p-1.5 rounded-md shadow-sm">
                        <PieIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white">Status Geral</h3>
                </div>
                <UnitFilter value={statusUnitFilter} onChange={setStatusUnitFilter} />
             </div>

             <div className="flex flex-row items-center justify-center flex-1 min-h-0 p-4 gap-2 w-full">
                {/* Chart Side */}
                <div className="relative w-1/2 h-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <span className="text-2xl font-bold text-gray-800 dark:text-white block leading-none">{totalFilteredStatus}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Total</span>
                    </div>
                </div>

                {/* Legend Side - Custom Layout */}
                <div className="w-1/2 flex flex-col justify-center space-y-3 pr-2">
                    {statusData.map((item, idx) => {
                        const percentage = totalFilteredStatus > 0 ? ((item.value / totalFilteredStatus) * 100).toFixed(0) : 0;
                        return (
                            <div key={idx} className="flex flex-col">
                                <div className="flex items-center justify-between text-xs mb-0.5">
                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-medium">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        {item.name}
                                    </div>
                                    <span className="font-bold text-gray-800 dark:text-white">{item.value}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className="h-full rounded-full" 
                                        style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                    ></div>
                                </div>
                                <div className="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-0.5">{percentage}%</div>
                            </div>
                        )
                    })}
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-0 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-80 lg:col-span-2 flex flex-col overflow-hidden">
             <div className="flex items-center justify-between p-5 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 z-10">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Alertas Recentes
                </h3>
                <div className="flex items-center gap-3">
                    <UnitFilter value={alertsFilter} onChange={setAlertsFilter} />
                    <button onClick={() => alert('Ver todos')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
                        Ver todos <ArrowRight size={12} />
                    </button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                {filteredAlerts.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                        {filteredAlerts.map(alert => (
                            <div key={alert.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${alert.priority === 'Alta' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'}`}>
                                        <AlertCircle size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{alert.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            <span className="font-semibold">{alert.unit}</span>
                                            <span>•</span>
                                            <span>{new Date(alert.dateOpened).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        alert.status === OSStatus.ABERTA ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                        'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                                    }`}>
                                        {alert.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <CheckCircle size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">Nenhum alerta pendente.</p>
                    </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};

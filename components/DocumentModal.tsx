import React from 'react';
import { ServiceOrder, Expense } from '../types';
import { FileCheck, Calendar, DollarSign, AlertTriangle, Archive, X } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  order: ServiceOrder | null;
  expenses: Expense[];
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ isOpen, onClose, onConfirm, order, expenses }) => {
  if (!isOpen || !order) return null;

  const linkedExpenses = expenses.filter(e => e.linkedOSId === order.id);
  const totalCost = linkedExpenses.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-indigo-100 dark:border-slate-700">
        
        {/* Header */}
        <div className="bg-indigo-600 dark:bg-indigo-700 p-6 text-white flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileCheck className="w-6 h-6" />
                    Documentar OS
                </h3>
                <p className="text-indigo-100 text-sm mt-1">
                    Confirmação de encerramento e arquivamento.
                </p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg">
                <div className="flex gap-3">
                    <AlertTriangle className="text-yellow-600 dark:text-yellow-400 w-5 h-5 shrink-0" />
                    <div>
                        <h4 className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">Atenção</h4>
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                            Ao confirmar, esta OS sairá do quadro ativo e será movida para a aba <strong>Relatórios</strong>. Esta ação é definitiva para fins de organização.
                        </p>
                    </div>
                </div>
            </div>

            {/* Resume Data */}
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">OS ID</span>
                        <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{order.id}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Tipo</span>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{order.type}</p>
                    </div>
                </div>

                <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Título da Solicitação</span>
                    <p className="text-slate-800 dark:text-slate-100 font-medium border-b border-slate-100 dark:border-slate-700 pb-2">{order.title}</p>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Calendar size={16} /> Data de Abertura
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{new Date(order.dateOpened).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                     <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Calendar size={16} /> Data de Encerramento
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {order.dateClosed ? new Date(order.dateClosed).toLocaleDateString('pt-BR') : 'Hoje'}
                    </span>
                </div>

                {/* Financial Summary */}
                <div className="mt-4">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                        <DollarSign size={16} className="text-emerald-600" /> Resumo Financeiro
                    </h4>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Total Gasto</span>
                            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 opacity-80">
                            {linkedExpenses.length} registro(s) financeiro(s) vinculado(s).
                        </p>
                    </div>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-700/30 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={onConfirm}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
                <Archive size={16} />
                Confirmar Arquivamento
            </button>
        </div>

      </div>
    </div>
  );
};
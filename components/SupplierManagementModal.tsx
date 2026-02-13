import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';
import { X, Pencil, Trash2, Plus, Store, Phone, Tag, User as UserIcon } from 'lucide-react';

interface SupplierManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    suppliers: Supplier[];
    onAddSupplier: (supplier: Supplier) => void;
    onUpdateSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (id: string) => void;
}

export const SupplierManagementModal: React.FC<SupplierManagementModalProps> = ({
    isOpen,
    onClose,
    suppliers,
    onAddSupplier,
    onUpdateSupplier,
    onDeleteSupplier
}) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState<Partial<Supplier>>({});

    useEffect(() => {
        if (isOpen) {
            setView('list');
            setEditingSupplier(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleEditClick = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({ ...supplier });
        setView('form');
    };

    const handleAddClick = () => {
        setEditingSupplier(null);
        setFormData({
            name: '',
            category: '',
            contactInfo: ''
        });
        setView('form');
    };

    const handleBack = () => {
        setView('list');
        setEditingSupplier(null);
        setFormData({});
    };

    const handleSave = () => {
        if (!formData.name) return alert('Nome da empresa é obrigatório.');

        if (editingSupplier) {
            onUpdateSupplier({ ...editingSupplier, ...formData } as Supplier);
        } else {
            onAddSupplier({
                id: `sup-${Date.now()}`,
                name: formData.name!,
                category: formData.category || 'Geral',
                contactInfo: formData.contactInfo || '',
                active: true
            } as Supplier);
        }
        handleBack();
    };

    const handleDelete = () => {
        if (editingSupplier) {
            if (confirm(`Excluir prestador ${editingSupplier.name}?`)) {
                onDeleteSupplier(editingSupplier.id);
                handleBack();
            }
        }
    };

    const inputClass = "w-full border border-gray-300 dark:border-slate-600 rounded-xl p-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500";

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        {view === 'list' ? 'Prestadores de Serviço' : (editingSupplier ? 'Editar Prestador' : 'Novo Prestador')}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800">

                    {/* VIEW: LIST */}
                    {view === 'list' && (
                        <div className="space-y-4">
                            <button
                                onClick={handleAddClick}
                                className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-bold flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Adicionar Prestador
                            </button>

                            <div className="space-y-2">
                                {suppliers.map(sup => (
                                    <div key={sup.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 hover:shadow-md transition-all group">
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white text-base">{sup.name}</h4>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-600 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-500">{sup.category}</span>
                                                {sup.contactInfo && <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium flex items-center gap-1"><Phone size={10} /> {sup.contactInfo}</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEditClick(sup)}
                                            className="p-2 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-lg text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors shadow-sm"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </div>
                                ))}
                                {suppliers.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">Nenhum prestador cadastrado.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VIEW: FORM */}
                    {view === 'form' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Nome da Empresa</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className={`${inputClass} pl-10`}
                                        placeholder="Ex: Slim Frios"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Categoria</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className={`${inputClass} pl-10`}
                                        placeholder="Ex: Refrigeração, Elétrica..."
                                        value={formData.category || ''}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">Informações de Contato</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className={`${inputClass} pl-10`}
                                        placeholder="Nome, Telefone, Email..."
                                        value={formData.contactInfo || ''}
                                        onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between">
                    {view === 'form' ? (
                        <>
                            {editingSupplier ? (
                                <button onClick={handleDelete} className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                    <Trash2 size={16} /> Excluir
                                </button>
                            ) : (
                                <div></div>
                            )}
                            <div className="flex gap-2">
                                <button onClick={handleBack} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors">
                                    Salvar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex justify-end">
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                                Fechar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

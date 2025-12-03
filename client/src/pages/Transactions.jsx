import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2, Search, Filter } from 'lucide-react';
import clsx from 'clsx';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: 'IN',
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error("Erro ao carregar transações", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/transactions', formData);
            setIsModalOpen(false);
            setFormData({
                type: 'IN',
                description: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchTransactions();
        } catch (error) {
            alert('Erro ao salvar transação');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
            try {
                await api.delete(`/transactions/${id}`);
                fetchTransactions();
            } catch (error) {
                alert('Erro ao excluir transação');
            }
        }
    };

    const totalBalance = transactions.reduce((acc, t) => {
        return t.type === 'IN' ? acc + Number(t.amount) : acc - Number(t.amount);
    }, 0);

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Fluxo de Caixa</h2>
                        <p className="text-slate-500">Gerencie todas as entradas e saídas.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={20} />
                        Nova Transação
                    </button>
                </div>

                {/* Resumo Rápido */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500 mb-1">Saldo Atual</p>
                        <h3 className={clsx("text-2xl font-bold", totalBalance >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBalance)}
                        </h3>
                    </div>
                </div>

                {/* Lista de Transações */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Data</th>
                                    <th className="px-6 py-4 font-medium">Descrição</th>
                                    <th className="px-6 py-4 font-medium">Categoria</th>
                                    <th className="px-6 py-4 font-medium">Tipo</th>
                                    <th className="px-6 py-4 font-medium">Valor</th>
                                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(t.date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{t.description}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                                {t.category || 'Geral'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.type === 'IN' ? (
                                                <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                                    <ArrowUpCircle size={14} /> Entrada
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full w-fit">
                                                    <ArrowDownCircle size={14} /> Saída
                                                </span>
                                            )}
                                        </td>
                                        <td className={clsx("px-6 py-4 font-bold", t.type === 'IN' ? "text-emerald-600" : "text-red-600")}>
                                            {t.type === 'OUT' ? '-' : '+'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                            Nenhuma transação registrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Nova Transação */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Nova Transação</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'IN' })}
                                        className={clsx(
                                            "p-3 rounded-lg border flex items-center justify-center gap-2 transition-all",
                                            formData.type === 'IN'
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/20"
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        <ArrowUpCircle size={20} /> Entrada
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'OUT' })}
                                        className={clsx(
                                            "p-3 rounded-lg border flex items-center justify-center gap-2 transition-all",
                                            formData.type === 'OUT'
                                                ? "bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20"
                                                : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        <ArrowDownCircle size={20} /> Saída
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ex: Conta de Luz"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ex: Despesas Fixas"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Transactions;

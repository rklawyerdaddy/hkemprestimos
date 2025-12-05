import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Partners = () => {
    const { addToast } = useToast();
    const [partners, setPartners] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', pixKey: '', commissionRate: '' });

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        try {
            const response = await api.get('/partners');
            setPartners(response.data);
        } catch (error) {
            console.error(error);
            addToast({ message: 'Erro ao carregar parceiros', type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/partners', formData);
            setShowForm(false);
            setFormData({ name: '', pixKey: '', commissionRate: '' });
            loadPartners();
            addToast({ message: 'Parceiro criado com sucesso!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao criar parceiro', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este parceiro?')) return;
        try {
            await api.delete(`/partners/${id}`);
            loadPartners();
            addToast({ message: 'Parceiro excluído!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao excluir parceiro', type: 'error' });
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100">Parceiros & Indicações</h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Novo Parceiro
                    </button>
                </div>

                {showForm && (
                    <div className="glass-card p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold mb-4 text-slate-100">Novo Parceiro</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Nome do Parceiro"
                                className="input-premium"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Chave Pix"
                                className="input-premium"
                                value={formData.pixKey}
                                onChange={e => setFormData({ ...formData, pixKey: e.target.value })}
                            />
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Comissão (%)"
                                    className="input-premium w-full"
                                    value={formData.commissionRate}
                                    onChange={e => setFormData({ ...formData, commissionRate: e.target.value })}
                                />
                                <span className="absolute right-3 top-3 text-slate-400">%</span>
                            </div>

                            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:bg-white/10 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="glass-card rounded-2xl overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950/50 text-slate-400 font-medium border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Chave Pix</th>
                                <th className="px-6 py-4">Comissão Padrão</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {partners.map((partner) => (
                                <tr key={partner.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20">
                                            <Users size={16} />
                                        </div>
                                        {partner.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{partner.pixKey || '-'}</td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {partner.commissionRate ? `${partner.commissionRate}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(partner.id)}
                                            className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {partners.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                                        Nenhum parceiro cadastrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Partners;

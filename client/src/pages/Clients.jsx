import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, Search, BarChart2, X, MessageCircle, Pencil, Star, Trash2 } from 'lucide-react';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', whatsapp: '', cpf: '', address: '', rating: 5 });
    const [editingClient, setEditingClient] = useState(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        const response = await api.get('/clients');
        setClients(response.data);
    };

    const handleDelete = async (client) => {
        if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) {
            try {
                await api.delete(`/clients/${client.id}`);
                loadClients();
            } catch (error) {
                const msg = error.response?.data?.error || 'Erro ao excluir cliente';
                alert(msg);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await api.put(`/clients/${editingClient.id}`, formData);
            } else {
                await api.post('/clients', formData);
            }

            setShowForm(false);
            setFormData({ name: '', whatsapp: '', cpf: '', address: '', rating: 5 });
            setEditingClient(null);
            loadClients();
        } catch (error) {
            const msg = error.response?.data?.error || 'Erro ao salvar cliente';
            alert(msg);
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            whatsapp: client.whatsapp || '',
            cpf: client.cpf || '',
            address: client.address || '',
            rating: client.rating || 5
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingClient(null);
        setFormData({ name: '', whatsapp: '', cpf: '', address: '', rating: 5 });
    };

    const [statsModal, setStatsModal] = useState({ open: false, data: null, clientName: '' });
    const [whatsappModal, setWhatsappModal] = useState({ open: false, client: null });

    const openStats = async (client) => {
        try {
            const response = await api.get(`/clients/${client.id}/stats`);
            setStatsModal({
                open: true,
                data: response.data,
                clientName: client.name
            });
        } catch (error) {
            alert('Erro ao carregar estatísticas');
        }
    };

    const handleWhatsappClick = (client) => {
        setWhatsappModal({ open: true, client });
    };

    const sendWhatsapp = (template) => {
        const { client } = whatsappModal;
        if (!client || !client.whatsapp) return;

        let message = '';
        const phone = client.whatsapp.replace(/\D/g, '');

        switch (template) {
            case 'due_today':
                message = `Olá ${client.name}, seu empréstimo vence hoje. Por favor, realize o pagamento.`;
                break;
            case 'late':
                message = `Olá ${client.name}, constatamos um atraso no seu pagamento. Por favor entre em contato para regularizar.`;
                break;
            case 'custom':
                message = `Olá ${client.name}, `;
                break;
            default:
                break;
        }

        const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        setWhatsappModal({ open: false, client: null });
    };

    const renderStars = (count) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={`${star <= count ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
                    <button
                        onClick={() => {
                            setEditingClient(null);
                            setFormData({ name: '', whatsapp: '', cpf: '', address: '', rating: 5 });
                            setShowForm(!showForm);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={20} />
                        Novo Cliente
                    </button>
                </div>

                {showForm && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold mb-4 text-slate-800">{editingClient ? 'Editar Cliente' : 'Novo Cadastro'}</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Nome Completo"
                                className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="WhatsApp (apenas números)"
                                className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.whatsapp}
                                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="CPF"
                                className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Endereço Completo"
                                className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-600">Classificação de Risco (Estrelas)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating: star })}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={24}
                                                className={`${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                                            />
                                        </button>
                                    ))}
                                    <span className="ml-2 text-sm text-slate-500 self-center">
                                        {formData.rating === 1 ? '(Alto Risco)' : formData.rating === 5 ? '(Baixo Risco)' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                <button type="button" onClick={handleCancel} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md">Salvar</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Risco</th>
                                <th className="px-6 py-4">WhatsApp</th>
                                <th className="px-6 py-4">Endereço</th>
                                <th className="px-6 py-4">Empréstimos Ativos</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{client.name}</td>
                                    <td className="px-6 py-4">
                                        {renderStars(client.rating || 5)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{client.whatsapp || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]">{client.address || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold text-xs">
                                            {client.loans?.filter(l => l.status === 'ACTIVE').length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(client)}
                                            className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        {client.whatsapp && (
                                            <button
                                                onClick={() => handleWhatsappClick(client)}
                                                className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                                                title="Enviar Mensagem"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openStats(client)}
                                            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm flex items-center gap-1 font-medium transition-colors"
                                        >
                                            <BarChart2 size={16} />
                                            Detalhes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal de Estatísticas */}
                {statsModal.open && statsModal.data && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 relative">
                            <button
                                onClick={() => setStatsModal({ open: false, data: null, clientName: '' })}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="font-bold text-xl mb-1 text-slate-800">{statsModal.clientName}</h3>
                            <p className="text-sm text-slate-500 mb-6">Resumo Financeiro</p>

                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Emprestado</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsModal.data.totalLoaned)}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Total Pago</p>
                                        <p className="text-lg font-bold text-green-700 mt-1">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsModal.data.totalPaid)}
                                        </p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                        <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Dívida Atual</p>
                                        <p className="text-lg font-bold text-red-700 mt-1">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsModal.data.totalDebt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                                    <p className="text-sm text-blue-800 font-medium">Empréstimos Ativos</p>
                                    <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm font-bold">
                                        {statsModal.data.activeLoansCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de WhatsApp */}
                {whatsappModal.open && whatsappModal.client && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200 relative">
                            <button
                                onClick={() => setWhatsappModal({ open: false, client: null })}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Enviar Mensagem</h3>
                                    <p className="text-sm text-slate-500">Para {whatsappModal.client.name}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => sendWhatsapp('due_today')}
                                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                >
                                    <p className="font-medium text-slate-800 group-hover:text-blue-700">Cobrança de Vencimento</p>
                                    <p className="text-xs text-slate-500 mt-1">"Seu empréstimo vence hoje..."</p>
                                </button>

                                <button
                                    onClick={() => sendWhatsapp('late')}
                                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50 transition-all group"
                                >
                                    <p className="font-medium text-slate-800 group-hover:text-red-700">Cobrança de Atraso</p>
                                    <p className="text-xs text-slate-500 mt-1">"Constatamos um atraso..."</p>
                                </button>

                                <button
                                    onClick={() => sendWhatsapp('custom')}
                                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                                >
                                    <p className="font-medium text-slate-800 group-hover:text-green-700">Mensagem Personalizada</p>
                                    <p className="text-xs text-slate-500 mt-1">Abre o chat em branco</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Clients;

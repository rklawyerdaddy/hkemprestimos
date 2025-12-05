import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, Search, BarChart2, X, MessageCircle, Pencil, Star, Trash2, Upload, FileText, Download } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Clients = () => {
    const { addToast } = useToast();
    const [clients, setClients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', whatsapp: '', cpf: '', address: '', group: '', rating: 5 });
    const [editingClient, setEditingClient] = useState(null);

    // Estado para documentos
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error("Erro ao carregar clientes");
        }
    };

    const handleDelete = async (client) => {
        if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}?`)) {
            try {
                await api.delete(`/clients/${client.id}`);
                loadClients();
                addToast({ message: 'Cliente excluído com sucesso', type: 'success' });
            } catch (error) {
                const msg = error.response?.data?.error || 'Erro ao excluir cliente';
                addToast({ message: msg, type: 'error' });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await api.put(`/clients/${editingClient.id}`, { ...formData, rating: parseInt(formData.rating) });
                addToast({ message: 'Cliente atualizado com sucesso', type: 'success' });
            } else {
                await api.post('/clients', { ...formData, rating: parseInt(formData.rating) });
                addToast({ message: 'Cliente criado com sucesso', type: 'success' });
            }

            setShowForm(false);
            setFormData({ name: '', whatsapp: '', cpf: '', address: '', group: '', rating: 5 });
            setEditingClient(null);
            loadClients();
        } catch (error) {
            const msg = error.response?.data?.error || 'Erro ao salvar cliente';
            addToast({ message: msg, type: 'error' });
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            whatsapp: client.whatsapp || '',
            cpf: client.cpf || '',
            address: client.address || '',
            group: client.group || '',
            rating: client.rating || 5
        });
        setDocuments(client.documents || []);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingClient(null);
        setFormData({ name: '', whatsapp: '', cpf: '', address: '', group: '', rating: 5 });
        setDocuments([]);
    };

    const handleFileUpload = async (e) => {
        if (!editingClient) {
            addToast({ message: 'Salve o cliente antes de anexar documentos', type: 'warning' });
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('file', file);

        setUploading(true);
        try {
            const response = await api.post(`/clients/${editingClient.id}/documents`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocuments([...documents, response.data]);
            addToast({ message: 'Documento anexado!', type: 'success' });
            loadClients(); // Recarregar para atualizar a lista principal também
        } catch (error) {
            addToast({ message: 'Erro ao enviar documento', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!confirm('Excluir este documento?')) return;
        try {
            await api.delete(`/documents/${docId}`);
            setDocuments(documents.filter(d => d.id !== docId));
            addToast({ message: 'Documento excluído', type: 'success' });
            loadClients();
        } catch (error) {
            addToast({ message: 'Erro ao excluir documento', type: 'error' });
        }
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
            addToast({ message: 'Erro ao carregar estatísticas', type: 'error' });
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
                        className={`${star <= count ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100">Clientes</h2>
                    <button
                        onClick={() => {
                            setEditingClient(null);
                            setFormData({ name: '', whatsapp: '', cpf: '', address: '', rating: 5 });
                            setDocuments([]);
                            setShowForm(!showForm);
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Novo Cliente
                    </button>
                </div>

                {showForm && (
                    <div className="glass-card p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold mb-4 text-slate-100">{editingClient ? 'Editar Cliente' : 'Novo Cadastro'}</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Nome Completo"
                                className="input-premium"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="WhatsApp (apenas números)"
                                className="input-premium"
                                value={formData.whatsapp}
                                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="CPF"
                                className="input-premium"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Endereço Completo"
                                className="input-premium"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Grupo / Categoria (Ex: VIP, Família)"
                                className="input-premium"
                                value={formData.group}
                                onChange={e => setFormData({ ...formData, group: e.target.value })}
                            />

                            <div className="md:col-span-2 flex flex-col gap-2">
                                <label className="text-sm font-medium text-slate-400">Classificação de Risco (Estrelas)</label>
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
                                                className={`${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                                            />
                                        </button>
                                    ))}
                                    <span className="ml-2 text-sm text-slate-500 self-center">
                                        {(() => {
                                            switch (formData.rating) {
                                                case 1: return '(Alto Risco)';
                                                case 2: return '(Risco Elevado)';
                                                case 3: return '(Risco Moderado)';
                                                case 4: return '(Risco Baixo)';
                                                case 5: return '(Muito Baixo Risco)';
                                                default: return '';
                                            }
                                        })()}
                                    </span>
                                </div>
                            </div>

                            {/* Seção de Documentos (Apenas na Edição) */}
                            {editingClient && (
                                <div className="md:col-span-2 mt-4 border-t pt-4 border-slate-700">
                                    <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-2">
                                        <FileText size={18} />
                                        Documentos Anexados
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                        {documents.map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-400 hover:underline truncate max-w-[200px]"
                                                >
                                                    {doc.name}
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                    className="text-red-400 hover:bg-red-900/20 p-1 rounded"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {documents.length === 0 && <p className="text-sm text-slate-500 italic">Nenhum documento anexado.</p>}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-700">
                                            <Upload size={18} />
                                            {uploading ? 'Enviando...' : 'Anexar Documento'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                        <span className="text-xs text-slate-500">PDF, Imagens (Max 5MB)</span>
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2 flex justify-end gap-2 mt-6">
                                <button type="button" onClick={handleCancel} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
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
                                <th className="px-6 py-4">Grupo</th>
                                <th className="px-6 py-4">Risco</th>
                                <th className="px-6 py-4">WhatsApp</th>
                                <th className="px-6 py-4">Endereço</th>
                                <th className="px-6 py-4">Empréstimos Ativos</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200">{client.name}</td>
                                    <td className="px-6 py-4">
                                        {client.group ? (
                                            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md text-xs font-medium border border-slate-700">
                                                {client.group}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {renderStars(client.rating || 5)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{client.whatsapp || '-'}</td>
                                    <td className="px-6 py-4 text-slate-400 truncate max-w-[200px]">{client.address || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-bold text-xs border border-blue-500/20">
                                            {client.loans?.filter(l => l.status === 'ACTIVE').length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(client)}
                                            className="text-slate-400 hover:bg-white/10 p-2 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client)}
                                            className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        {client.whatsapp && (
                                            <button
                                                onClick={() => handleWhatsappClick(client)}
                                                className="text-green-400 hover:bg-green-500/10 p-2 rounded-lg transition-colors"
                                                title="Enviar Mensagem"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openStats(client)}
                                            className="text-blue-400 hover:bg-blue-500/10 px-3 py-1 rounded-lg text-sm flex items-center gap-1 font-medium transition-colors"
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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 rounded-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 relative bg-slate-950 border-white/10">
                            <button
                                onClick={() => setStatsModal({ open: false, data: null, clientName: '' })}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="font-bold text-xl mb-1 text-slate-100">{statsModal.clientName}</h3>
                            <p className="text-sm text-slate-400 mb-6">Resumo Financeiro</p>

                            <div className="space-y-4">
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Emprestado</p>
                                    <p className="text-2xl font-bold text-slate-100 mt-1">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsModal.data.totalLoaned)}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                                        <p className="text-xs text-green-400 uppercase font-bold tracking-wider">Total Pago</p>
                                        <p className="text-lg font-bold text-green-400 mt-1">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsModal.data.totalPaid)}
                                        </p>
                                    </div>
                                    <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                                        <p className="text-xs text-red-400 uppercase font-bold tracking-wider">Dívida Atual</p>
                                        <p className="text-lg font-bold text-red-400 mt-1">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(statsModal.data.totalDebt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex justify-between items-center">
                                    <p className="text-sm text-blue-300 font-medium">Empréstimos Ativos</p>
                                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm font-bold border border-blue-500/30">
                                        {statsModal.data.activeLoansCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de WhatsApp */}
                {whatsappModal.open && whatsappModal.client && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 rounded-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200 relative bg-slate-950 border-white/10">
                            <button
                                onClick={() => setWhatsappModal({ open: false, client: null })}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 border border-green-500/20">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-100">Enviar Mensagem</h3>
                                    <p className="text-sm text-slate-400">Para {whatsappModal.client.name}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => sendWhatsapp('due_today')}
                                    className="w-full text-left p-4 rounded-xl border border-slate-800 hover:border-blue-500 hover:bg-blue-500/10 transition-all group"
                                >
                                    <p className="font-medium text-slate-200 group-hover:text-blue-400">Cobrança de Vencimento</p>
                                    <p className="text-xs text-slate-500 mt-1">"Seu empréstimo vence hoje..."</p>
                                </button>

                                <button
                                    onClick={() => sendWhatsapp('late')}
                                    className="w-full text-left p-4 rounded-xl border border-slate-800 hover:border-red-500 hover:bg-red-500/10 transition-all group"
                                >
                                    <p className="font-medium text-slate-200 group-hover:text-red-400">Cobrança de Atraso</p>
                                    <p className="text-xs text-slate-500 mt-1">"Constatamos um atraso..."</p>
                                </button>

                                <button
                                    onClick={() => sendWhatsapp('custom')}
                                    className="w-full text-left p-4 rounded-xl border border-slate-800 hover:border-green-500 hover:bg-green-500/10 transition-all group"
                                >
                                    <p className="font-medium text-slate-200 group-hover:text-green-400">Mensagem Personalizada</p>
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

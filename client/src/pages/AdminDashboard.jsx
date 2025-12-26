import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Users, DollarSign, Activity, Shield, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const AdminDashboard = () => {
    const { addToast } = useToast();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [planData, setPlanData] = useState({ name: '', price: '', description: '', maxClients: 100, maxLoans: 100 });
    const [showUserForm, setShowUserForm] = useState(false);
    const [userData, setUserData] = useState({ name: '', username: '', password: '', role: 'USER', planId: '' });

    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserData({
            name: user.name || '',
            username: user.username,
            password: '', // Senha vazia para não alterar
            role: user.role,
            planId: user.plan?.id || user.planId || '' // Tenta pegar do objeto plan ou direto do planId
        });
        setShowUserForm(true);
    };

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        console.log('Starting loadData...');

        try {
            // Stats
            try {
                const statsRes = await api.get('/admin/stats');
                setStats(statsRes.data);
            } catch (e) {
                console.error('Error fetching stats:', e);
                addToast({ message: 'Erro ao carregar estatísticas', type: 'error' });
            }

            // Users
            try {
                const usersRes = await api.get('/admin/users');
                console.log('Users response:', usersRes.data);
                if (Array.isArray(usersRes.data)) {
                    setUsers(usersRes.data);
                } else {
                    console.error('Users response is not an array:', usersRes.data);
                    setUsers([]);
                }
            } catch (e) {
                console.error('Error fetching users:', e);
                addToast({ message: 'Erro ao carregar usuários: ' + (e.response?.data?.error || e.message), type: 'error' });
            }

            // Plans
            try {
                const plansRes = await api.get('/admin/plans');
                if (Array.isArray(plansRes.data)) {
                    setPlans(plansRes.data);
                } else {
                    setPlans([]);
                }
            } catch (e) {
                console.error('Error fetching plans:', e);
                addToast({ message: 'Erro ao carregar planos', type: 'error' });
            }

        } catch (error) {
            console.error('Critical error in loadData:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/toggle-status`);
            addToast({ message: 'Status do usuário atualizado', type: 'success' });
            loadData(true);
        } catch (error) {
            addToast({ message: 'Erro ao atualizar status', type: 'error' });
        }
    };

    const handleDeleteUser = async (user) => {
        if (!confirm(`Tem certeza que deseja excluir o usuário "${user.username}"? Esta ação não pode ser desfeita e apagará todos os dados vinculados.`)) return;

        try {
            await api.delete(`/admin/users/${user.id}`);
            addToast({ message: 'Usuário excluído com sucesso', type: 'success' });
            loadData(true);
        } catch (error) {
            console.error('Error deleting user:', error);
            const msg = error.response?.data?.error || 'Erro ao excluir usuário';
            addToast({ message: msg, type: 'error' });
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            console.log('Saving user:', userData);
            const payload = {
                ...userData,
                planId: userData.planId === "" ? null : userData.planId
            };

            if (editingUser) {
                await api.put(`/admin/users/${editingUser.id}`, payload);
                addToast({ message: 'Usuário atualizado com sucesso', type: 'success' });
            } else {
                await api.post('/admin/users', payload);
                addToast({ message: 'Usuário criado com sucesso', type: 'success' });
            }

            setShowUserForm(false);
            setEditingUser(null);
            setUserData({ name: '', username: '', password: '', role: 'USER', planId: '' });
            loadData(true);
        } catch (error) {
            console.error('Error saving user:', error);
            const msg = error.response?.data?.error || 'Erro ao salvar usuário';
            addToast({ message: msg, type: 'error' });
        }
    };

    const handleCreatePlan = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/plans', planData);
            addToast({ message: 'Plano criado com sucesso', type: 'success' });
            setShowPlanForm(false);
            setPlanData({ name: '', price: '', description: '', maxClients: 100, maxLoans: 100 });
            loadData();
        } catch (error) {
            addToast({ message: 'Erro ao criar plano', type: 'error' });
        }
    };

    const handleDeletePlan = async (id) => {
        if (!confirm('Excluir este plano?')) return;
        try {
            await api.delete(`/admin/plans/${id}`);
            addToast({ message: 'Plano excluído', type: 'success' });
            loadData();
        } catch (error) {
            addToast({ message: 'Erro ao excluir plano', type: 'error' });
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-gold-500/10 rounded-lg border border-gold-500/20">
                            <Shield className="text-gold-400" size={28} />
                        </div>
                        Painel Administrativo
                    </h2>
                    <p className="text-slate-400 mt-1 ml-1">Gerenciamento global do sistema SaaS</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass-card p-6 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">Total de Usuários</p>
                                <h3 className="text-2xl font-bold text-slate-100">{stats?.totalUsers}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">Total de Clientes</p>
                                <h3 className="text-2xl font-bold text-slate-100">{stats?.totalClients}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">Total de Empréstimos</p>
                                <h3 className="text-2xl font-bold text-slate-100">{stats?.totalLoans}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gold-500/10 text-gold-400 rounded-xl border border-gold-500/20">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">Volume Total</p>
                                <h3 className="text-xl font-bold text-slate-100">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalLoaned || 0)}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plans Management */}
                <div className="glass-card p-8 rounded-xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-xl text-slate-100">Planos de Assinatura</h3>
                        <button
                            onClick={() => setShowPlanForm(!showPlanForm)}
                            className="btn-primary text-sm font-bold shadow-lg shadow-gold-900/20"
                        >
                            {showPlanForm ? 'Cancelar' : 'Novo Plano'}
                        </button>
                    </div>

                    {showPlanForm && (
                        <form onSubmit={handleCreatePlan} className="bg-slate-950/50 p-6 rounded-xl border border-white/5 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text" placeholder="Nome do Plano (Ex: Básico)"
                                className="input-premium"
                                value={planData.name} onChange={e => setPlanData({ ...planData, name: e.target.value })} required
                            />
                            <input
                                type="number" placeholder="Preço (R$)"
                                className="input-premium"
                                value={planData.price} onChange={e => setPlanData({ ...planData, price: e.target.value })} required
                            />
                            <input
                                type="text" placeholder="Descrição"
                                className="input-premium md:col-span-2"
                                value={planData.description} onChange={e => setPlanData({ ...planData, description: e.target.value })}
                            />
                            <input
                                type="number" placeholder="Max Clientes"
                                className="input-premium"
                                value={planData.maxClients} onChange={e => setPlanData({ ...planData, maxClients: e.target.value })} required
                            />
                            <input
                                type="number" placeholder="Max Empréstimos"
                                className="input-premium"
                                value={planData.maxLoans} onChange={e => setPlanData({ ...planData, maxLoans: e.target.value })} required
                            />
                            <button type="submit" className="bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 md:col-span-2 shadow-lg shadow-green-900/20">
                                Salvar Plano
                            </button>
                        </form>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array.isArray(plans) && plans.map(plan => (
                            <div key={plan.id} className="border border-white/5 rounded-2xl p-6 hover:border-gold-500/30 transition-all relative group bg-slate-950/30 hover:bg-slate-900/50">
                                <button
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Ban size={16} />
                                </button>
                                <h4 className="font-bold text-lg text-slate-100">{plan.name}</h4>
                                <p className="text-2xl font-bold text-gold-400 my-2">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                                    <span className="text-sm text-slate-400 font-normal">/mês</span>
                                </p>
                                <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                                <div className="space-y-1 text-sm text-slate-400">
                                    <p>• Até {plan.maxClients} clientes</p>
                                    <p>• Até {plan.maxLoans} empréstimos</p>
                                </div>
                            </div>
                        ))}
                        {(!Array.isArray(plans) || plans.length === 0) && <p className="text-slate-500 italic">Nenhum plano cadastrado.</p>}
                    </div>
                </div>

                {/* Users Management */}
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/30">
                        <h3 className="font-bold text-lg text-slate-100">Usuários do Sistema</h3>
                        <button
                            onClick={() => {
                                setShowUserForm(!showUserForm);
                                setEditingUser(null);
                                setUserData({ name: '', username: '', password: '', role: 'USER', planId: '' });
                            }}
                            className="btn-primary text-sm font-bold"
                        >
                            {showUserForm ? 'Cancelar' : 'Novo Usuário'}
                        </button>
                    </div>

                    {showUserForm && (
                        <form onSubmit={handleSaveUser} className="bg-slate-950/50 p-6 border-b border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text" placeholder="Nome Completo"
                                className="input-premium"
                                value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} required
                            />
                            <input
                                type="text" placeholder="Usuário (Login)"
                                className="input-premium"
                                value={userData.username} onChange={e => setUserData({ ...userData, username: e.target.value })} required
                            />
                            <input
                                type="password" placeholder={editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                                className="input-premium"
                                value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })}
                                required={!editingUser}
                            />
                            <select
                                className="input-premium"
                                value={userData.role} onChange={e => setUserData({ ...userData, role: e.target.value })}
                            >
                                <option value="USER">Usuário Comum</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                            <select
                                className="input-premium md:col-span-2"
                                value={userData.planId} onChange={e => setUserData({ ...userData, planId: e.target.value })}
                            >
                                <option value="">Selecione um Plano (Opcional)</option>
                                {Array.isArray(plans) && plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>{plan.name} - R$ {plan.price}</option>
                                ))}
                            </select>
                            <button type="submit" className="bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 md:col-span-2 shadow-lg shadow-green-900/20">
                                {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                            </button>
                        </form>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-950/50 text-slate-400 font-medium border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Plano</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Uso (Clientes/Empréstimos)</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Array.isArray(users) && users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-200">
                                            {user.username}
                                            <div className="text-xs text-slate-400 font-normal">{user.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.plan?.name ? (
                                                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md text-xs font-bold border border-blue-500/20">
                                                    {user.plan.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs">Sem Plano</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                                {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {user._count?.clients || 0} / {user._count?.loans || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.active ? (
                                                <span className="flex items-center gap-1 text-green-400 font-medium">
                                                    <CheckCircle size={14} /> Ativo
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 font-medium">
                                                    <Ban size={14} /> Bloqueado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                                            >
                                                Editar
                                            </button>
                                            {user.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => toggleUserStatus(user.id)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors border ${user.active
                                                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                                                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20'
                                                        }`}
                                                >
                                                    {user.active ? 'Bloquear' : 'Ativar'}
                                                </button>
                                            )}
                                            {user.username !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="bg-red-500/10 text-red-400 p-2 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20"
                                                    title="Excluir Usuário"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!Array.isArray(users) || users.length === 0) && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-slate-500">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Gateway Configuration Placeholder */}
                <div className="glass-card p-8 rounded-xl">
                    <h3 className="font-bold text-lg text-slate-100 mb-4">Configuração de Pagamentos (Gateway)</h3>
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-white/5">
                        <p className="text-sm text-slate-400 mb-4">
                            Para ativar pagamentos automáticos (SaaS), configure as chaves de API do seu gateway preferido no arquivo <code>.env</code> do servidor.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Gateway Ativo</label>
                                <select className="input-premium w-full" disabled>
                                    <option>Manual (Padrão)</option>
                                    <option>Asaas (Em Breve)</option>
                                    <option>Mercado Pago (Em Breve)</option>
                                    <option>Stripe (Em Breve)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Status da Integração</label>
                                <div className="flex items-center gap-2 text-gold-400 bg-gold-500/10 p-3 rounded-lg border border-gold-500/20">
                                    <Activity size={16} />
                                    <span className="text-sm font-medium">Aguardando Configuração</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    );
};

export default AdminDashboard;

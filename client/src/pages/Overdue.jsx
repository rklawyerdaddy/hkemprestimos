import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { AlertCircle, Calendar, DollarSign, User, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Overdue = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [overdueInstallments, setOverdueInstallments] = useState([]);
    const [stats, setStats] = useState({
        totalAmount: 0,
        totalCount: 0,
        uniqueClients: 0
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/dashboard/alerts');
            // A rota retorna { dueToday: [], late: [] }. Queremos apenas 'late'.
            const lateItems = response.data.late || [];

            // Calcular estatísticas
            const totalAmount = lateItems.reduce((acc, item) => acc + Number(item.amount), 0);
            const clientsSet = new Set(lateItems.map(item => item.loan.clientId));

            setStats({
                totalAmount,
                totalCount: lateItems.length,
                uniqueClients: clientsSet.size
            });

            // Ordenar por data de vencimento (mais antigo primeiro)
            const sortedItems = [...lateItems].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            setOverdueInstallments(sortedItems);

        } catch (error) {
            console.error("Erro ao carregar atrasados", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getDaysOverdue = (dueDate) => {
        const days = differenceInDays(new Date(), parseISO(dueDate));
        return days;
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <AlertTriangle className="text-red-500" size={32} />
                        Controle de Atrasados
                    </h2>
                    <p className="text-slate-400 mt-1">Gestão de pagamentos pendentes e cobrança</p>
                </div>
                <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gold-400">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-400 shadow-lg shadow-red-500/10">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Total em Atraso</p>
                        <h3 className="text-2xl font-bold text-slate-100">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalAmount)}
                        </h3>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 shadow-lg shadow-orange-500/10">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Parcelas Vencidas</p>
                        <h3 className="text-2xl font-bold text-slate-100">{stats.totalCount}</h3>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-slate-800 text-slate-400">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 font-medium">Clientes Devedores</p>
                        <h3 className="text-2xl font-bold text-slate-100">{stats.uniqueClients}</h3>
                    </div>
                </div>
            </div>

            {/* Lista de Atrasados */}
            <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-red-500/5">
                    <h3 className="text-lg font-bold text-red-200">Relação de Pendências</h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Carregando...</div>
                ) : overdueInstallments.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-500">
                            <AlertCircle size={32} />
                        </div>
                        <p className="text-lg font-medium text-slate-300">Nenhum pagamento em atraso!</p>
                        <p className="text-sm">Todos os clientes estão em dia.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Contato</th>
                                    <th className="px-6 py-4">Parcela</th>
                                    <th className="px-6 py-4">Vencimento</th>
                                    <th className="px-6 py-4">Dias Atraso</th>
                                    <th className="px-6 py-4">Valor Original</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {overdueInstallments.map((item) => {
                                    const daysLate = getDaysOverdue(item.dueDate);

                                    return (
                                        <tr key={item.id} className="hover:bg-red-500/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                                                        {item.loan.client.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-slate-200">{item.loan.client.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {item.loan.client.whatsapp || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                <span className="px-2 py-1 bg-slate-800 rounded text-xs font-mono">
                                                    {item.number}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {format(parseISO(item.dueDate), 'dd/MM/yyyy')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded text-xs">
                                                    {daysLate} dias
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-200">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate('/loans', { state: { highlightLoanId: item.loanId } })}
                                                    className="p-2 bg-slate-800 hover:bg-gold-500 hover:text-slate-900 rounded-lg transition-colors group-hover:bg-slate-700"
                                                    title="Ver Empréstimo"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Overdue;

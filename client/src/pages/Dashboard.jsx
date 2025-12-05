import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { AlertCircle, Clock, DollarSign, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Users, TrendingDown, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StatCard = ({ icon: Icon, label, value, color, isCurrency }) => (
    <div className="glass-card p-6 rounded-xl flex items-center gap-4 transition-transform hover:scale-105">
        <div className={`p-3 rounded-xl ${color} shadow-lg shadow-black/20`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-400 font-medium">{label}</p>
            <h3 className="text-2xl font-bold text-slate-100">
                {isCurrency
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                    : value}
            </h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        monthlyIncome: 0,
        netProfit: 0,
        expenses: 0,
        newClients: 0
    });
    const [recentLoans, setRecentLoans] = useState([]);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [transactionsRes, clientsRes, loansRes, alertsRes, summaryRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/clients'),
                api.get('/loans'),
                api.get('/dashboard/alerts'),
                api.get('/dashboard/summary')
            ]);

            const transactions = transactionsRes.data;
            const clients = clientsRes.data;
            const loans = loansRes.data;
            const alerts = alertsRes.data;
            const summary = summaryRes.data;

            // 1. Calcular Stats do Mês Atual
            const now = new Date();
            const currentMonthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), now));

            const monthlyIncome = currentMonthTransactions
                .filter(t => t.type === 'IN')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            const monthlyExpenses = currentMonthTransactions
                .filter(t => t.type === 'OUT')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);

            // Tentar filtrar novos clientes (assumindo que existe createdAt, senão usa total)
            const newClientsCount = clients.filter(c => c.createdAt && isSameMonth(parseISO(c.createdAt), now)).length;
            const displayClients = newClientsCount > 0 ? newClientsCount : clients.length;

            setStats({
                monthlyIncome,
                expenses: monthlyExpenses,
                netProfit: monthlyIncome - monthlyExpenses,
                newClients: displayClients,
                estimatedProfit: Number(summary.totalReceivable) - Number(summary.totalInvested),
                overdueValues: Number(summary.totalLate)
            });

            // 2. Processar Gráfico (Últimos 6 meses)
            const chartData = [];
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(now, i);
                const monthTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), date));

                const income = monthTransactions
                    .filter(t => t.type === 'IN')
                    .reduce((acc, curr) => acc + Number(curr.amount), 0);

                const expense = monthTransactions
                    .filter(t => t.type === 'OUT')
                    .reduce((acc, curr) => acc + Number(curr.amount), 0);

                chartData.push({
                    name: format(date, 'MMM', { locale: ptBR }),
                    income,
                    expense
                });
            }
            setChartData(chartData);

            // 3. Empréstimos Recentes (Top 5)
            setRecentLoans(loans.slice(0, 5).map(loan => ({
                id: loan.id,
                clientName: loan.client?.name || 'Cliente Removido',
                amount: loan.amount,
                status: loan.status,
                date: format(parseISO(loan.startDate), 'dd/MM/yyyy')
            })));

            // 4. Alertas Recentes
            const formattedAlerts = [];

            if (alerts.late && alerts.late.length > 0) {
                alerts.late.forEach(inst => {
                    formattedAlerts.push({
                        id: `late-${inst.id}`,
                        message: `Atraso: ${inst.loan.client.name} - Parc. ${inst.number}`,
                        date: format(parseISO(inst.dueDate), 'dd/MM'),
                        type: 'error'
                    });
                });
            }

            if (alerts.dueToday && alerts.dueToday.length > 0) {
                alerts.dueToday.forEach(inst => {
                    formattedAlerts.push({
                        id: `today-${inst.id}`,
                        message: `Vence Hoje: ${inst.loan.client.name} - Parc. ${inst.number}`,
                        date: 'Hoje',
                        type: 'warning'
                    });
                });
            }

            setRecentAlerts(formattedAlerts.slice(0, 5));

        } catch (error) {
            console.error("Erro ao carregar dashboard", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100">Dashboard</h2>
                    <p className="text-slate-400">Visão geral financeira</p>
                </div>
                <button onClick={loadDashboardData} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gold-400">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    icon={Wallet}
                    label="Receita Mensal"
                    value={stats.monthlyIncome}
                    color="bg-gradient-to-br from-gold-500 to-gold-700"
                    isCurrency
                />
                <StatCard
                    icon={TrendingUp}
                    label="Lucro Líquido (Mês)"
                    value={stats.netProfit}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-700"
                    isCurrency
                />
                <StatCard
                    icon={DollarSign}
                    label="Estimativa de Lucro Total"
                    value={stats.estimatedProfit}
                    color="bg-gradient-to-br from-blue-500 to-blue-700"
                    isCurrency
                />
                <StatCard
                    icon={TrendingDown}
                    label="Despesas (Mês)"
                    value={stats.expenses}
                    color="bg-gradient-to-br from-red-500 to-red-700"
                    isCurrency
                />
                <StatCard
                    icon={AlertCircle}
                    label="Valores em Atraso"
                    value={stats.overdueValues}
                    color="bg-gradient-to-br from-orange-500 to-orange-700"
                    isCurrency
                />
                <StatCard
                    icon={Users}
                    label="Clientes Totais"
                    value={stats.newClients}
                    color="bg-gradient-to-br from-slate-600 to-slate-800"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-100 mb-6">Fluxo de Caixa (Últimos 6 Meses)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#c9af6b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#c9af6b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                    formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                />
                                <Area type="monotone" dataKey="income" name="Receitas" stroke="#c9af6b" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-100 mb-6">Alertas Recentes</h3>
                    <div className="space-y-4">
                        {recentAlerts.map(alert => (
                            <div key={alert.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/30 border border-white/5 hover:bg-slate-900/50 transition-colors">
                                <div className={`p-2 rounded-lg ${alert.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-gold-500/10 text-gold-400'}`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-200">{alert.message}</p>
                                    <p className="text-sm text-slate-500">{alert.date}</p>
                                </div>
                            </div>
                        ))}
                        {recentAlerts.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <AlertCircle size={48} className="mb-4 opacity-20" />
                                <p>Nenhum alerta pendente</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-slate-100">Empréstimos Recentes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Valor</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentLoans.map((loan) => (
                                <tr key={loan.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200">{loan.clientName}</td>
                                    <td className="px-6 py-4 text-slate-300">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(loan.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${loan.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                                            {loan.status === 'ACTIVE' ? 'ATIVO' :
                                                loan.status === 'COMPLETED' ? 'FINALIZADO' :
                                                    loan.status === 'RENEGOTIATED' ? 'RENEGOCIADO' : loan.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{loan.date}</td>
                                </tr>
                            ))}
                            {recentLoans.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-slate-500">
                                        Nenhum empréstimo registrado.
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

export default Dashboard;

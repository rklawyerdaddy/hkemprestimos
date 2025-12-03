import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { AlertCircle, Clock, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className={`p-4 rounded-full ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
            <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            </h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [summary, setSummary] = useState({ totalInvested: 0, totalReceivable: 0, totalLate: 0, totalReceived: 0 });
    const [alerts, setAlerts] = useState({ dueToday: [], late: [] });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, alertsRes, transactionsRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/dashboard/alerts'),
                    api.get('/transactions')
                ]);
                setSummary(summaryRes.data);
                setAlerts(alertsRes.data);
                setTransactions(transactionsRes.data);
            } catch (error) {
                console.error("Erro ao carregar dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Processar dados para o gráfico (agrupado por mês)
    const chartData = transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthYear = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

        const existing = acc.find(item => item.name === monthYear);
        if (existing) {
            if (t.type === 'IN') existing.Entradas += Number(t.amount);
            else existing.Saídas += Number(t.amount);
        } else {
            acc.push({
                name: monthYear,
                Entradas: t.type === 'IN' ? Number(t.amount) : 0,
                Saídas: t.type === 'OUT' ? Number(t.amount) : 0
            });
        }
        return acc;
    }, []).reverse().slice(0, 6).reverse(); // Últimos 6 meses

    const profit = summary.totalReceived - summary.totalInvested;

    if (loading) return <Layout>Carregando...</Layout>;

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Dashboard Gerencial</h2>
                    <p className="text-slate-500">Visão geral do seu negócio hoje.</p>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <StatCard
                        title="Total Recebido"
                        value={summary.totalReceived}
                        icon={DollarSign}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Total Investido"
                        value={summary.totalInvested}
                        icon={DollarSign}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Lucro Estimado"
                        value={profit}
                        icon={Wallet}
                        color={profit >= 0 ? "bg-indigo-500" : "bg-red-500"}
                    />
                    <StatCard
                        title="A Receber"
                        value={summary.totalReceivable}
                        icon={TrendingUp}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Em Atraso"
                        value={summary.totalLate}
                        icon={AlertCircle}
                        color="bg-red-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Gráfico de Fluxo de Caixa */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-6">Fluxo de Caixa (Últimos 6 Meses)</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Vencendo Hoje */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-orange-500" />
                                Vencendo Hoje
                            </h3>
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                                {alerts.dueToday.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto max-h-[320px]">
                            {alerts.dueToday.length === 0 ? (
                                <p className="p-6 text-slate-500 text-center">Nenhum vencimento para hoje.</p>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <tbody className="divide-y divide-slate-100">
                                        {alerts.dueToday.map((inst) => (
                                            <tr key={inst.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-slate-900">{inst.loan.client.name}</p>
                                                    <p className="text-xs text-slate-500">Parcela {inst.number}</p>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-700 text-right">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Atrasados */}
                {alerts.late.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <AlertCircle size={20} className="text-red-500" />
                                Em Atraso
                            </h3>
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                                {alerts.late.length}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Cliente</th>
                                        <th className="px-6 py-3">Vencimento</th>
                                        <th className="px-6 py-3">Valor</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {alerts.late.map((inst) => (
                                        <tr key={inst.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{inst.loan.client.name}</td>
                                            <td className="px-6 py-4 text-red-600">
                                                {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                                    Atrasado
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Dashboard;

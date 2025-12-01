import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { AlertCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, alertsRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/dashboard/alerts')
                ]);
                setSummary(summaryRes.data);
                setAlerts(alertsRes.data);
            } catch (error) {
                console.error("Erro ao carregar dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Layout>Carregando...</Layout>;

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Dashboard Gerencial</h2>
                    <p className="text-slate-500">Visão geral do seu negócio hoje.</p>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        title="Total a Receber"
                        value={summary.totalReceivable}
                        icon={TrendingUp}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Total em Atraso"
                        value={summary.totalLate}
                        icon={AlertCircle}
                        color="bg-red-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Vencendo Hoje */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-orange-500" />
                                Vencendo Hoje
                            </h3>
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                                {alerts.dueToday.length}
                            </span>
                        </div>
                        <div className="p-0">
                            {alerts.dueToday.length === 0 ? (
                                <p className="p-6 text-slate-500 text-center">Nenhum vencimento para hoje.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left min-w-[500px]">
                                        <thead className="bg-slate-50 text-slate-500">
                                            <tr>
                                                <th className="px-6 py-3">Cliente</th>
                                                <th className="px-6 py-3">Parcela</th>
                                                <th className="px-6 py-3">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {alerts.dueToday.map((inst) => (
                                                <tr key={inst.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{inst.loan.client.name}</td>
                                                    <td className="px-6 py-4">{inst.number}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-700">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Atrasados */}
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
                        <div className="p-0">
                            {alerts.late.length === 0 ? (
                                <p className="p-6 text-slate-500 text-center">Nenhum pagamento atrasado.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left min-w-[500px]">
                                        <thead className="bg-slate-50 text-slate-500">
                                            <tr>
                                                <th className="px-6 py-3">Cliente</th>
                                                <th className="px-6 py-3">Vencimento</th>
                                                <th className="px-6 py-3">Valor</th>
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
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;

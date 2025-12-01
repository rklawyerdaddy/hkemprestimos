import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, ChevronDown, ChevronUp, CheckCircle, Pencil, X, Save, Copy, Trash } from 'lucide-react';

const Loans = () => {
    const [loans, setLoans] = useState([]);
    const [clients, setClients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [expandedLoan, setExpandedLoan] = useState(null);

    // Estados para edição
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // Estado para Modal de Renovação (Só Juros)
    const [renewalModal, setRenewalModal] = useState({
        open: false,
        installmentId: null,
        amount: 0,
        nextDueDate: ''
    });

    const [formData, setFormData] = useState({
        clientId: '',
        amount: '',
        totalAmount: '',
        installmentsCount: '1',
        startDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadLoans();
        loadClients();
    }, []);

    const loadLoans = async () => {
        const response = await api.get('/loans');
        setLoans(response.data);
    };

    const loadClients = async () => {
        const response = await api.get('/clients');
        setClients(response.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/loans', formData);
            setShowForm(false);
            loadLoans();
        } catch (error) {
            alert('Erro ao criar empréstimo');
        }
    };

    const handlePayment = async (installmentId, amount, type, nextDueDate = null) => {
        try {
            await api.post(`/installments/${installmentId}/pay`, {
                amountPaid: amount,
                type, // 'FULL' or 'INTEREST_ONLY'
                nextDueDate
            });
            loadLoans();
            setRenewalModal({ open: false, installmentId: null, amount: 0, nextDueDate: '' });
        } catch (error) {
            alert('Erro ao registrar pagamento');
        }
    };

    const handleDuplicate = async (installmentId) => {
        if (!confirm('Deseja duplicar esta parcela para o próximo mês?')) return;
        try {
            await api.post(`/installments/${installmentId}/duplicate`);
            loadLoans();
        } catch (error) {
            alert('Erro ao duplicar parcela');
        }
    };

    const handleDelete = async (installmentId) => {
        if (!confirm('Tem certeza que deseja excluir esta parcela?')) return;
        try {
            await api.delete(`/installments/${installmentId}`);
            loadLoans();
        } catch (error) {
            alert('Erro ao excluir parcela');
        }
    };

    const [paymentModal, setPaymentModal] = useState({
        open: false,
        installmentId: null,
        amount: 0
    });

    const openPaymentModal = (inst) => {
        setPaymentModal({
            open: true,
            installmentId: inst.id,
            amount: inst.amount
        });
    };

    const confirmPayment = async () => {
        await handlePayment(paymentModal.installmentId, paymentModal.amount, 'FULL');
        setPaymentModal({ open: false, installmentId: null, amount: 0 });
    };

    const openRenewalModal = (inst, loan) => {
        // Calcula data sugerida (1 mês depois)
        const currentDue = new Date(inst.dueDate);
        const nextMonth = new Date(currentDue.setMonth(currentDue.getMonth() + 1));

        // Calcula valor sugerido (Apenas Juros)
        // Juros Total = Total - Principal
        // Juros Parcela = Juros Total / Num Parcelas
        const totalInterest = loan.totalAmount - loan.amount;
        const interestPerInstallment = totalInterest / loan.installments.length;

        setRenewalModal({
            open: true,
            installmentId: inst.id,
            amount: interestPerInstallment.toFixed(2),
            nextDueDate: nextMonth.toISOString().split('T')[0]
        });
    };

    const startEditing = (inst) => {
        setEditingId(inst.id);
        setEditData({
            status: inst.status,
            amount: inst.amount,
            paidDate: inst.paidDate ? inst.paidDate.split('T')[0] : '',
            dueDate: inst.dueDate ? inst.dueDate.split('T')[0] : ''
        });
    };

    const saveEdit = async () => {
        try {
            const payload = { ...editData };

            // Se estiver marcando como PAGO ou SÓ JUROS, assume que o valor pago é o valor editado
            if (editData.status === 'PAID' || editData.status === 'INTEREST_PAID') {
                payload.paidAmount = editData.amount;
            }

            await api.put(`/installments/${editingId}`, payload);
            setEditingId(null);
            loadLoans();
        } catch (error) {
            alert('Erro ao atualizar parcela');
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Empréstimos</h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-secondary hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                    >
                        <Plus size={20} />
                        Novo Empréstimo
                    </button>
                </div>

                {/* Modal de Renovação */}
                {renewalModal.open && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-lg w-96 animate-in fade-in zoom-in duration-200">
                            <h3 className="font-bold text-lg mb-4 text-slate-800">Renovar Parcela</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Ao pagar apenas os juros, uma nova parcela será criada. Confirme a data de vencimento desta nova parcela:
                            </p>

                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor dos Juros (R$)</label>
                            <input
                                type="number"
                                className="border p-2 rounded w-full mb-4"
                                value={renewalModal.amount}
                                onChange={e => setRenewalModal({ ...renewalModal, amount: e.target.value })}
                            />

                            <label className="block text-sm font-medium text-slate-700 mb-1">Nova Data de Vencimento</label>
                            <input
                                type="date"
                                className="border p-2 rounded w-full mb-6"
                                value={renewalModal.nextDueDate}
                                onChange={e => setRenewalModal({ ...renewalModal, nextDueDate: e.target.value })}
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setRenewalModal({ ...renewalModal, open: false })}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handlePayment(renewalModal.installmentId, renewalModal.amount || 0, 'INTEREST_ONLY', renewalModal.nextDueDate)}
                                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                                >
                                    Confirmar Renovação
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Pagamento Total */}
                {paymentModal.open && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-lg w-96 animate-in fade-in zoom-in duration-200">
                            <h3 className="font-bold text-lg mb-4 text-slate-800">Confirmar Pagamento</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Confirme o valor do pagamento total desta parcela.
                            </p>

                            <label className="block text-sm font-medium text-slate-700 mb-1">Valor Pago (R$)</label>
                            <input
                                type="number"
                                className="border p-2 rounded w-full mb-6"
                                value={paymentModal.amount}
                                onChange={e => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setPaymentModal({ ...paymentModal, open: false })}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmPayment}
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showForm && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold mb-4">Novo Empréstimo</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                className="border p-2 rounded"
                                value={formData.clientId}
                                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                required
                            >
                                <option value="">Selecione o Cliente</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <input
                                type="number"
                                placeholder="Valor Emprestado (R$)"
                                className="border p-2 rounded"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />

                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Valor Total a Pagar (R$)"
                                    className="border p-2 rounded w-1/2"
                                    value={formData.totalAmount}
                                    onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Parcelas"
                                    className="border p-2 rounded w-1/2"
                                    value={formData.installmentsCount}
                                    onChange={e => setFormData({ ...formData, installmentsCount: e.target.value })}
                                    required
                                />
                            </div>

                            <input
                                type="date"
                                className="border p-2 rounded"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />

                            {formData.totalAmount && formData.installmentsCount && (
                                <div className="md:col-span-2 bg-blue-50 p-3 rounded text-sm text-blue-800">
                                    Previsão: {formData.installmentsCount}x de
                                    <strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.totalAmount / formData.installmentsCount)}</strong>
                                </div>
                            )}

                            <div className="md:col-span-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500">Cancelar</button>
                                <button type="submit" className="bg-primary text-white px-6 py-2 rounded hover:bg-slate-800">Gerar Empréstimo</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-4">
                    {loans.map((loan) => (
                        <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        {expandedLoan === loan.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{loan.client.name}</h4>
                                        <p className="text-sm text-slate-500">
                                            {new Date(loan.startDate).toLocaleDateString('pt-BR')} • {loan.installments.length}x
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(loan.totalAmount)}
                                    </p>
                                    <p className="text-xs text-slate-500">Total a Pagar</p>
                                </div>
                            </div>

                            {expandedLoan === loan.id && (
                                <div className="bg-slate-50 p-4 border-t border-slate-100">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-slate-500 text-left">
                                                <th className="pb-2">Parcela</th>
                                                <th className="pb-2">Vencimento</th>
                                                <th className="pb-2">Valor</th>
                                                <th className="pb-2">Status</th>
                                                <th className="pb-2 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {loan.installments.map((inst) => (
                                                <tr key={inst.id}>
                                                    <td className="py-3">{inst.number}</td>
                                                    <td className="py-3">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>

                                                    {editingId === inst.id ? (
                                                        <>
                                                            <td className="py-3">
                                                                <input
                                                                    type="number"
                                                                    className="border p-1 rounded w-24 mb-1 block"
                                                                    value={editData.amount}
                                                                    onChange={e => setEditData({ ...editData, amount: e.target.value })}
                                                                />
                                                                <input
                                                                    type="date"
                                                                    className="border p-1 rounded w-32 text-xs"
                                                                    value={editData.dueDate}
                                                                    onChange={e => setEditData({ ...editData, dueDate: e.target.value })}
                                                                />
                                                            </td>
                                                            <td className="py-3">
                                                                <select
                                                                    className="border p-1 rounded"
                                                                    value={editData.status}
                                                                    onChange={e => setEditData({ ...editData, status: e.target.value })}
                                                                >
                                                                    <option value="PENDING">PENDENTE</option>
                                                                    <option value="PAID">PAGO</option>
                                                                    <option value="INTEREST_PAID">SÓ JUROS</option>
                                                                </select>
                                                            </td>
                                                            <td className="py-3 text-right flex justify-end gap-2">
                                                                <button onClick={saveEdit} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={16} /></button>
                                                                <button onClick={() => setEditingId(null)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={16} /></button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="py-3 font-medium">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount)}
                                                            </td>
                                                            <td className="py-3">
                                                                <span className={
                                                                    `px-2 py-1 rounded-full text-xs font-bold 
                                                                    ${inst.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                                        inst.status === 'INTEREST_PAID' ? 'bg-yellow-100 text-yellow-700' :
                                                                            new Date(inst.dueDate) < new Date() ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`
                                                                }>
                                                                    {inst.status === 'PAID' ? 'PAGO' :
                                                                        inst.status === 'INTEREST_PAID' ? 'SÓ JUROS' :
                                                                            new Date(inst.dueDate) < new Date() ? 'ATRASADO' : 'PENDENTE'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-right flex justify-end gap-2">
                                                                <button onClick={() => startEditing(inst)} className="text-slate-400 hover:text-slate-600 p-1">
                                                                    <Pencil size={16} />
                                                                </button>
                                                                {inst.status === 'PENDING' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => openPaymentModal(inst)}
                                                                            className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs border border-green-200"
                                                                        >
                                                                            Pagar Total
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openRenewalModal(inst, loan)}
                                                                            className="text-orange-600 hover:bg-orange-50 px-2 py-1 rounded text-xs border border-orange-200"
                                                                        >
                                                                            Só Juros
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDuplicate(inst.id)}
                                                                            className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                                                                            title="Duplicar Parcela"
                                                                        >
                                                                            <Copy size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(inst.id)}
                                                                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                                                                            title="Excluir Parcela"
                                                                        >
                                                                            <Trash size={16} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default Loans;

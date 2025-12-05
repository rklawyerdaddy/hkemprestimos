import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, ChevronDown, ChevronUp, Pencil, X, Save, Copy, Trash, RefreshCw, AlertTriangle, Edit, MessageCircle, FileText, Printer } from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../contexts/ToastContext';

const Loans = () => {
    const { addToast } = useToast();
    const [loans, setLoans] = useState([]);
    const [clients, setClients] = useState([]);
    const [partners, setPartners] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [expandedLoan, setExpandedLoan] = useState(null);

    // Estados para edição de parcela
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // Estado para Edição do Empréstimo (Header)
    const [editLoanModal, setEditLoanModal] = useState({
        open: false,
        loanId: null,
        totalAmount: '',
        startDate: '',
        partnerId: ''
    });

    // Estado para Modal de Renovação (Só Juros)
    const [renewalModal, setRenewalModal] = useState({
        open: false,
        installmentId: null,
        amount: 0,
        nextDueDate: ''
    });

    // Estado para Modal de Renegociação Total
    const [renegotiateModal, setRenegotiateModal] = useState({
        open: false,
        loan: null,
        newTotalAmount: '',
        newInstallmentsCount: '',
        newStartDate: '',
        paidAmountEntry: ''
    });

    // Estado para Modal de Recibo
    const [receiptModal, setReceiptModal] = useState({
        open: false,
        data: null
    });

    const [formData, setFormData] = useState({
        clientId: '',
        partnerId: '',
        amount: '',
        totalAmount: '',
        installmentsCount: '',
        startDate: new Date().toISOString().split('T')[0],
        interestRate: ''
    });

    useEffect(() => {
        loadLoans();
        loadClients();
        loadPartners();
    }, []);

    const loadLoans = async () => {
        try {
            const response = await api.get('/loans');
            const sortedLoans = (response.data || []).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            setLoans(sortedLoans);
        } catch (error) {
            console.error("Erro ao carregar empréstimos", error);
            setLoans([]);
            addToast({ message: 'Erro ao carregar empréstimos', type: 'error' });
        }
    };

    const loadClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data || []);
        } catch (error) {
            console.error("Erro ao carregar clientes");
        }
    };

    const loadPartners = async () => {
        try {
            const response = await api.get('/partners');
            setPartners(response.data || []);
        } catch (error) {
            console.error("Erro ao carregar parceiros");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/loans', {
                ...formData,
                installmentsCount: formData.installmentsCount || 1
            });
            setShowForm(false);
            setFormData({
                clientId: '',
                partnerId: '',
                amount: '',
                totalAmount: '',
                installmentsCount: '',
                startDate: new Date().toISOString().split('T')[0],
                interestRate: ''
            });
            loadLoans();
            addToast({ message: 'Empréstimo criado com sucesso!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao criar empréstimo', type: 'error' });
        }
    };

    const handleUpdateLoan = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/loans/${editLoanModal.loanId}`, {
                totalAmount: editLoanModal.totalAmount,
                startDate: editLoanModal.startDate,
                partnerId: editLoanModal.partnerId
            });
            setEditLoanModal({ open: false, loanId: null, totalAmount: '', startDate: '', partnerId: '' });
            loadLoans();
            addToast({ message: 'Empréstimo atualizado!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao atualizar empréstimo', type: 'error' });
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
            addToast({ message: 'Pagamento registrado!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao registrar pagamento', type: 'error' });
        }
    };

    const handleDuplicate = async (installmentId) => {
        if (!confirm('Deseja duplicar esta parcela para o próximo mês?')) return;
        try {
            await api.post(`/installments/${installmentId}/duplicate`);
            loadLoans();
            addToast({ message: 'Parcela duplicada!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao duplicar parcela', type: 'error' });
        }
    };

    const handleDeleteInstallment = async (installmentId) => {
        if (!confirm('Tem certeza que deseja excluir esta parcela?')) return;
        try {
            await api.delete(`/installments/${installmentId}`);
            loadLoans();
            addToast({ message: 'Parcela excluída!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao excluir parcela', type: 'error' });
        }
    };

    const handleDeleteLoan = async (loanId) => {
        if (!confirm('ATENÇÃO: Tem certeza que deseja excluir este empréstimo COMPLETO? Todas as parcelas e histórico serão apagados.')) return;
        try {
            await api.delete(`/loans/${loanId}`);
            loadLoans();
            addToast({ message: 'Empréstimo excluído!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao excluir empréstimo', type: 'error' });
        }
    };

    const handleRenegotiate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/loans/${renegotiateModal.loan.id}/renegotiate`, {
                newTotalAmount: renegotiateModal.newTotalAmount,
                newInstallmentsCount: renegotiateModal.newInstallmentsCount,
                newStartDate: renegotiateModal.newStartDate,
                paidAmountEntry: renegotiateModal.paidAmountEntry
            });
            setRenegotiateModal({ open: false, loan: null, newTotalAmount: '', newInstallmentsCount: '', newStartDate: '', paidAmountEntry: '' });
            loadLoans();
            addToast({ message: 'Empréstimo renegociado com sucesso!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao renegociar empréstimo', type: 'error' });
        }
    };

    const handleWhatsAppCharge = (inst, loan) => {
        if (!loan.client?.whatsapp) {
            addToast({ message: 'Cliente sem WhatsApp cadastrado', type: 'warning' });
            return;
        }

        const phone = loan.client.whatsapp.replace(/\D/g, '');
        const dueDate = new Date(inst.dueDate).toLocaleDateString('pt-BR');
        const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount);

        const message = `Olá ${loan.client.name}, lembrete da parcela ${inst.number} no valor de ${amount} com vencimento em ${dueDate}.`;
        const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const openReceipt = (inst, loan) => {
        setReceiptModal({
            open: true,
            data: {
                clientName: loan.client?.name,
                amount: inst.paidAmount || inst.amount,
                date: inst.paidDate || new Date(),
                number: inst.number,
                totalInstallments: loan.installments?.length
            }
        });
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
        const currentDue = new Date(inst.dueDate);
        const nextMonth = new Date(currentDue.setMonth(currentDue.getMonth() + 1));
        const totalInterest = loan.totalAmount - loan.amount;
        const interestPerInstallment = totalInterest / (loan.installments?.length || 1);

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
            if (editData.status === 'PAID' || editData.status === 'INTEREST_PAID') {
                payload.paidAmount = editData.amount;
            }
            await api.put(`/installments/${editingId}`, payload);
            setEditingId(null);
            loadLoans();
            addToast({ message: 'Parcela atualizada!', type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao atualizar parcela', type: 'error' });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100">Empréstimos</h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Novo Empréstimo
                    </button>
                </div>

                {/* Modal de Recibo */}
                {receiptModal.open && receiptModal.data && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-950 border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 relative print:shadow-none print:w-full print:bg-white print:text-black">
                            <button
                                onClick={() => setReceiptModal({ open: false, data: null })}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 print:hidden"
                            >
                                <X size={24} />
                            </button>

                            <div className="text-center mb-8 border-b pb-4 border-dashed border-slate-700 print:border-slate-300">
                                <h2 className="text-2xl font-bold text-slate-100 print:text-black">RECIBO DE PAGAMENTO</h2>
                                <p className="text-slate-400 text-sm print:text-slate-500">HK Empréstimos</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between">
                                    <span className="text-slate-400 print:text-slate-500">Pagador:</span>
                                    <span className="font-bold text-slate-100 print:text-black">{receiptModal.data.clientName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 print:text-slate-500">Valor:</span>
                                    <span className="font-bold text-slate-100 text-xl print:text-black">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receiptModal.data.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 print:text-slate-500">Data:</span>
                                    <span className="font-medium text-slate-100 print:text-black">
                                        {new Date(receiptModal.data.date).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400 print:text-slate-500">Referente à:</span>
                                    <span className="font-medium text-slate-100 print:text-black">
                                        Parcela {receiptModal.data.number}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-12 pt-4 border-t border-slate-700 print:border-slate-300 text-center">
                                <p className="font-script text-2xl text-slate-400 print:text-slate-600 mb-2">HK Empréstimos</p>
                                <p className="text-xs text-slate-500 print:text-slate-400 uppercase">Assinatura do Recebedor</p>
                            </div>

                            <div className="mt-8 flex justify-center print:hidden">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                                >
                                    <Printer size={20} />
                                    Imprimir Recibo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {editLoanModal.open && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 rounded-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 bg-slate-950 border-white/10">
                            <h3 className="font-bold text-lg mb-4 text-slate-100">Editar Empréstimo</h3>
                            <form onSubmit={handleUpdateLoan}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Total a Pagar</label>
                                        <input
                                            type="number"
                                            className="input-premium w-full"
                                            value={editLoanModal.totalAmount}
                                            onChange={e => setEditLoanModal({ ...editLoanModal, totalAmount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Data Início</label>
                                        <input
                                            type="date"
                                            className="input-premium w-full"
                                            value={editLoanModal.startDate}
                                            onChange={e => setEditLoanModal({ ...editLoanModal, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Parceiro</label>
                                        <select
                                            className="input-premium w-full"
                                            value={editLoanModal.partnerId || ''}
                                            onChange={e => setEditLoanModal({ ...editLoanModal, partnerId: e.target.value })}
                                        >
                                            <option value="">Sem parceiro</option>
                                            {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditLoanModal({ ...editLoanModal, open: false })}
                                        className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Salvar Alterações
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {renewalModal.open && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 rounded-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 bg-slate-950 border-white/10">
                            <h3 className="font-bold text-lg mb-4 text-slate-100">Renovar Parcela (Só Juros)</h3>
                            <p className="text-sm text-slate-400 mb-4">
                                Ao pagar apenas os juros, uma nova parcela será criada para o próximo mês.
                            </p>

                            <label className="block text-sm font-medium text-slate-400 mb-1">Valor dos Juros (R$)</label>
                            <input
                                type="number"
                                className="input-premium w-full mb-4"
                                value={renewalModal.amount}
                                onChange={e => setRenewalModal({ ...renewalModal, amount: e.target.value })}
                            />

                            <label className="block text-sm font-medium text-slate-400 mb-1">Nova Data de Vencimento</label>
                            <input
                                type="date"
                                className="input-premium w-full mb-6"
                                value={renewalModal.nextDueDate}
                                onChange={e => setRenewalModal({ ...renewalModal, nextDueDate: e.target.value })}
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setRenewalModal({ ...renewalModal, open: false })}
                                    className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handlePayment(renewalModal.installmentId, renewalModal.amount || 0, 'INTEREST_ONLY', renewalModal.nextDueDate)}
                                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Confirmar Renovação
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {renegotiateModal.open && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 rounded-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 bg-slate-950 border-white/10">
                            <div className="flex items-center gap-3 mb-4 text-purple-400">
                                <RefreshCw size={24} />
                                <h3 className="font-bold text-lg text-slate-100">Renegociar Empréstimo</h3>
                            </div>

                            <div className="bg-purple-500/10 p-4 rounded-xl mb-4 text-sm text-purple-300 border border-purple-500/20">
                                <p className="font-bold">Atenção:</p>
                                <p>Isso encerrará o empréstimo atual e criará um novo com o saldo devedor restante.</p>
                            </div>

                            <form onSubmit={handleRenegotiate}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Entrada (Opcional)</label>
                                        <input
                                            type="number"
                                            placeholder="Valor pago na renegociação"
                                            className="input-premium w-full focus:ring-purple-500"
                                            value={renegotiateModal.paidAmountEntry}
                                            onChange={e => setRenegotiateModal({ ...renegotiateModal, paidAmountEntry: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-1/2">
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Novo Total a Pagar</label>
                                            <input
                                                type="number"
                                                required
                                                className="input-premium w-full focus:ring-purple-500"
                                                value={renegotiateModal.newTotalAmount}
                                                onChange={e => setRenegotiateModal({ ...renegotiateModal, newTotalAmount: e.target.value })}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Juros %</label>
                                            <select
                                                className="input-premium w-full focus:ring-purple-500"
                                                onChange={e => {
                                                    const rate = e.target.value;
                                                    if (!rate) return;

                                                    const debt = renegotiateModal.loan.installments
                                                        .filter(i => i.status === 'PENDING')
                                                        .reduce((acc, curr) => acc + Number(curr.amount), 0);

                                                    const entry = renegotiateModal.paidAmountEntry ? parseFloat(renegotiateModal.paidAmountEntry) : 0;
                                                    const principal = debt - entry;

                                                    const total = (principal + (principal * (parseFloat(rate) / 100))).toFixed(2);
                                                    setRenegotiateModal({ ...renegotiateModal, newTotalAmount: total });
                                                }}
                                            >
                                                <option value="">Calc. Juros</option>
                                                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(r => (
                                                    <option key={r} value={r}>{r}%</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Parcelas</label>
                                            <input
                                                type="number"
                                                required
                                                className="input-premium w-full focus:ring-purple-500"
                                                value={renegotiateModal.newInstallmentsCount}
                                                onChange={e => setRenegotiateModal({ ...renegotiateModal, newInstallmentsCount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">1ª Parcela</label>
                                            <input
                                                type="date"
                                                required
                                                className="input-premium w-full focus:ring-purple-500"
                                                value={renegotiateModal.newStartDate}
                                                onChange={e => setRenegotiateModal({ ...renegotiateModal, newStartDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setRenegotiateModal({ ...renegotiateModal, open: false })}
                                        className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20"
                                    >
                                        Confirmar Renegociação
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {paymentModal.open && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card p-6 rounded-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 bg-slate-950 border-white/10">
                            <h3 className="font-bold text-lg mb-4 text-slate-100">Confirmar Pagamento</h3>
                            <p className="text-sm text-slate-400 mb-4">
                                Confirme o valor do pagamento total desta parcela.
                            </p>

                            <label className="block text-sm font-medium text-slate-400 mb-1">Valor Pago (R$)</label>
                            <input
                                type="number"
                                className="input-premium w-full mb-6 focus:ring-green-500"
                                value={paymentModal.amount}
                                onChange={e => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setPaymentModal({ ...paymentModal, open: false })}
                                    className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmPayment}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                                >
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showForm && (
                    <div className="glass-card p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold mb-4 text-slate-100">Novo Empréstimo</h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <select
                                className="input-premium"
                                value={formData.clientId}
                                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                required
                            >
                                <option value="">Selecione o Cliente</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select
                                className="input-premium"
                                value={formData.partnerId}
                                onChange={e => setFormData({ ...formData, partnerId: e.target.value })}
                            >
                                <option value="">Parceiro / Indicação (Opcional)</option>
                                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>

                            <div className="flex gap-2">
                                <div className="w-1/2">
                                    <input
                                        type="number"
                                        placeholder="Valor Emprestado (R$)"
                                        className="input-premium w-full"
                                        value={formData.amount}
                                        onChange={e => {
                                            const amount = e.target.value;
                                            let total = formData.totalAmount;
                                            if (formData.interestRate && amount) {
                                                total = (parseFloat(amount) + (parseFloat(amount) * (parseFloat(formData.interestRate) / 100))).toFixed(2);
                                            }
                                            setFormData({ ...formData, amount, totalAmount: total });
                                        }}
                                        required
                                    />
                                </div>
                                <div className="w-1/2">
                                    <select
                                        className="input-premium w-full"
                                        value={formData.interestRate || ''}
                                        onChange={e => {
                                            const rate = e.target.value;
                                            let total = formData.totalAmount;
                                            if (rate && formData.amount) {
                                                total = (parseFloat(formData.amount) + (parseFloat(formData.amount) * (parseFloat(rate) / 100))).toFixed(2);
                                            }
                                            setFormData({ ...formData, interestRate: rate, totalAmount: total });
                                        }}
                                    >
                                        <option value="">Juros % (Opcional)</option>
                                        {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(r => (
                                            <option key={r} value={r}>{r}%</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Total a Pagar (R$)"
                                    className="input-premium w-1/2"
                                    value={formData.totalAmount}
                                    onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="(Nº Parcelas)"
                                    className="input-premium w-1/2"
                                    value={formData.installmentsCount}
                                    onChange={e => setFormData({ ...formData, installmentsCount: e.target.value })}
                                    required
                                />
                            </div>

                            <input
                                type="date"
                                className="input-premium"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />

                            {formData.totalAmount && formData.installmentsCount && (
                                <div className="md:col-span-2 bg-blue-500/10 p-4 rounded-xl text-sm text-blue-300 border border-blue-500/20">
                                    Previsão: {formData.installmentsCount}x de
                                    <strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.totalAmount / formData.installmentsCount)}</strong>
                                </div>
                            )}

                            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="btn-primary">Gerar Empréstimo</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-4">
                    {loans.map((loan) => (
                        <div key={loan.id} className={clsx(
                            "glass-card rounded-2xl overflow-hidden transition-all",
                            loan.status === 'RENEGOTIATED' ? "border-purple-500/30 opacity-75" : ""
                        )}>
                            <div
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/5 transition-colors gap-4"
                                onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "p-2 rounded-lg",
                                        loan.status === 'RENEGOTIATED' ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"
                                    )}>
                                        {expandedLoan === loan.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-100 flex flex-wrap items-center gap-2">
                                            {loan.client?.name || 'Cliente Removido'}
                                            {loan.status === 'RENEGOTIATED' ? (
                                                <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                                                    Renegociado
                                                </span>
                                            ) : loan.status === 'PAID' ? (
                                                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                                                    Pago
                                                </span>
                                            ) : loan.status === 'ACTIVE' && loan.installments?.some(i => new Date(i.dueDate) < new Date() && i.status === 'PENDING') ? (
                                                <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                                    Atrasado
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                                    Em Dia
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-sm text-slate-400">
                                            {formatDate(loan.startDate)} • {loan.installments?.length || 0}x
                                            {loan.partner && <span className="ml-2 text-blue-400 block sm:inline">• Indicação: {loan.partner.name}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right pl-14 sm:pl-0">
                                    <p className="font-bold text-slate-100 text-lg">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(loan.totalAmount)}
                                    </p>
                                    <p className="text-xs text-slate-400">Total a Pagar</p>
                                </div>
                            </div>

                            {expandedLoan === loan.id && (
                                <div className="bg-slate-950/30 p-4 border-t border-white/5">
                                    <div className="flex justify-end gap-2 mb-4">
                                        {loan.status === 'ACTIVE' && (
                                            <>
                                                <button
                                                    onClick={() => setEditLoanModal({
                                                        open: true,
                                                        loanId: loan.id,
                                                        totalAmount: loan.totalAmount,
                                                        startDate: loan.startDate ? loan.startDate.split('T')[0] : '',
                                                        partnerId: loan.partnerId || ''
                                                    })}
                                                    className="flex items-center gap-2 text-blue-400 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-500/20 transition-colors"
                                                >
                                                    <Edit size={16} />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => setRenegotiateModal({
                                                        open: true,
                                                        loan: loan,
                                                        newTotalAmount: '',
                                                        newInstallmentsCount: '',
                                                        newStartDate: new Date().toISOString().split('T')[0],
                                                        paidAmountEntry: ''
                                                    })}
                                                    className="flex items-center gap-2 text-purple-400 hover:bg-purple-500/10 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-500/20 transition-colors"
                                                >
                                                    <RefreshCw size={16} />
                                                    Renegociar Dívida
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDeleteLoan(loan.id)}
                                            className="flex items-center gap-2 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-500/20 transition-colors"
                                        >
                                            <Trash size={16} />
                                            Excluir
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm min-w-[600px]">
                                            <thead>
                                                <tr className="text-slate-400 text-left border-b border-white/5">
                                                    <th className="pb-2">Parcela</th>
                                                    <th className="pb-2">Vencimento</th>
                                                    <th className="pb-2">Valor</th>
                                                    <th className="pb-2">Status</th>
                                                    <th className="pb-2 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {loan.installments?.map((inst) => (
                                                    <tr key={inst.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-3 text-slate-300">{inst.number}</td>
                                                        <td className="py-3 text-slate-300">{formatDate(inst.dueDate)}</td>

                                                        {editingId === inst.id ? (
                                                            <>
                                                                <td className="py-3">
                                                                    <input
                                                                        type="number"
                                                                        className="border border-slate-700 bg-slate-950 text-white p-1 rounded w-24 mb-1 block"
                                                                        value={editData.amount}
                                                                        onChange={e => setEditData({ ...editData, amount: e.target.value })}
                                                                    />
                                                                    <input
                                                                        type="date"
                                                                        className="border border-slate-700 bg-slate-950 text-white p-1 rounded w-32 text-xs"
                                                                        value={editData.dueDate}
                                                                        onChange={e => setEditData({ ...editData, dueDate: e.target.value })}
                                                                    />
                                                                </td>
                                                                <td className="py-3">
                                                                    <select
                                                                        className="border border-slate-700 bg-slate-950 text-white p-1 rounded"
                                                                        value={editData.status}
                                                                        onChange={e => setEditData({ ...editData, status: e.target.value })}
                                                                    >
                                                                        <option value="PENDING">PENDENTE</option>
                                                                        <option value="PAID">PAGO</option>
                                                                        <option value="INTEREST_PAID">SÓ JUROS</option>
                                                                    </select>
                                                                </td>
                                                                <td className="py-3 text-right flex justify-end gap-2">
                                                                    <button onClick={saveEdit} className="text-green-400 hover:bg-green-900/20 p-1 rounded"><Save size={16} /></button>
                                                                    <button onClick={() => setEditingId(null)} className="text-red-400 hover:bg-red-900/20 p-1 rounded"><X size={16} /></button>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="py-3 font-medium text-slate-200">
                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount)}
                                                                </td>
                                                                <td className="py-3">
                                                                    <span className={
                                                                        `px-2 py-1 rounded-full text-xs font-bold 
                                                                        ${inst.status === 'PAID' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                                            inst.status === 'INTEREST_PAID' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                                                new Date(inst.dueDate) < new Date() ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}`
                                                                    }>
                                                                        {inst.status === 'PAID' ? 'PAGO' :
                                                                            inst.status === 'INTEREST_PAID' ? 'SÓ JUROS' :
                                                                                new Date(inst.dueDate) < new Date() ? 'ATRASADO' : 'PENDENTE'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 text-right flex justify-end gap-2">
                                                                    <button onClick={() => startEditing(inst)} className="text-slate-500 hover:text-slate-300 p-1">
                                                                        <Pencil size={16} />
                                                                    </button>

                                                                    {/* Botão de Cobrança WhatsApp (Se Pendente) */}
                                                                    {inst.status === 'PENDING' && (
                                                                        <button
                                                                            onClick={() => handleWhatsAppCharge(inst, loan)}
                                                                            className="text-green-400 hover:bg-green-500/10 p-1 rounded"
                                                                            title="Cobrar no WhatsApp"
                                                                        >
                                                                            <MessageCircle size={16} />
                                                                        </button>
                                                                    )}

                                                                    {/* Botão de Recibo (Se Pago) */}
                                                                    {(inst.status === 'PAID' || inst.status === 'INTEREST_PAID') && (
                                                                        <button
                                                                            onClick={() => openReceipt(inst, loan)}
                                                                            className="text-slate-400 hover:bg-white/10 p-1 rounded"
                                                                            title="Gerar Recibo"
                                                                        >
                                                                            <FileText size={16} />
                                                                        </button>
                                                                    )}

                                                                    {inst.status === 'PENDING' && loan.status === 'ACTIVE' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => openPaymentModal(inst)}
                                                                                className="text-green-400 hover:bg-green-500/10 px-2 py-1 rounded text-xs border border-green-500/20"
                                                                            >
                                                                                Pagar
                                                                            </button>
                                                                            <button
                                                                                onClick={() => openRenewalModal(inst, loan)}
                                                                                className="text-orange-400 hover:bg-orange-500/10 px-2 py-1 rounded text-xs border border-orange-500/20"
                                                                            >
                                                                                Juros
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDuplicate(inst.id)}
                                                                                className="text-blue-400 hover:bg-blue-500/10 p-1 rounded"
                                                                                title="Duplicar Parcela"
                                                                            >
                                                                                <Copy size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteInstallment(inst.id)}
                                                                                className="text-red-400 hover:bg-red-500/10 p-1 rounded"
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
                                </div>
                            )}
                        </div>
                    ))
                    }
                </div >
            </div >
        </Layout >
    );
};

export default Loans;

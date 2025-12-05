import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import clsx from 'clsx';

const Calendar = () => {
    const { addToast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, [currentDate]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            // Buscar empréstimos para extrair parcelas
            const response = await api.get('/loans');
            const loans = response.data;

            const monthEvents = [];
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            loans.forEach(loan => {
                loan.installments.forEach(inst => {
                    const dueDate = new Date(inst.dueDate);
                    // Filtrar apenas para o mês atual (opcional, mas bom para performance se tiver muitos dados)
                    if (dueDate.getMonth() === month && dueDate.getFullYear() === year) {
                        monthEvents.push({
                            id: inst.id,
                            date: dueDate,
                            title: `${loan.client?.name || 'Cliente'} - Parc. ${inst.number}`,
                            amount: inst.amount,
                            status: inst.status,
                            type: 'installment'
                        });
                    }
                });
            });

            setEvents(monthEvents);
        } catch (error) {
            console.error("Erro ao carregar calendário", error);
            addToast({ message: 'Erro ao carregar eventos', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getEventsForDay = (day) => {
        return events.filter(e => e.date.getDate() === day);
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <CalendarIcon className="text-gold-400" />
                        Calendário de Vencimentos
                    </h2>
                    <div className="flex items-center gap-4 glass-card p-2 rounded-xl">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="font-bold text-lg min-w-[150px] text-center capitalize text-slate-100">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="glass-card rounded-2xl overflow-x-auto">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-7 bg-slate-950/50 border-b border-white/5">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                <div key={day} className="py-3 text-center text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 auto-rows-fr">
                            {blanksArray.map((_, i) => (
                                <div key={`blank-${i}`} className="min-h-[120px] bg-slate-950/30 border-b border-r border-white/5" />
                            ))}

                            {daysArray.map(day => {
                                const dayEvents = getEventsForDay(day);
                                return (
                                    <div
                                        key={day}
                                        className={clsx(
                                            "min-h-[120px] p-2 border-b border-r border-white/5 transition-colors hover:bg-white/5",
                                            isToday(day) && "bg-gold-500/5"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={clsx(
                                                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                                isToday(day) ? "bg-gold-500 text-white shadow-lg shadow-gold-500/30" : "text-slate-400"
                                            )}>
                                                {day}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <span className="text-xs font-bold text-slate-500">
                                                    {dayEvents.length}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className={clsx(
                                                        "text-[10px] p-1.5 rounded border truncate cursor-help group relative",
                                                        event.status === 'PAID' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                                            event.status === 'INTEREST_PAID' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                                                new Date(event.date) < new Date() && event.status === 'PENDING' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                                                    "bg-slate-800 border-slate-700 text-slate-300"
                                                    )}
                                                    title={`${event.title} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.amount)}`}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {event.status === 'PAID' ? <CheckCircle size={10} /> :
                                                            new Date(event.date) < new Date() && event.status === 'PENDING' ? <AlertCircle size={10} /> :
                                                                <Clock size={10} />}
                                                        <span className="font-bold">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="truncate opacity-75">{event.title}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Calendar;

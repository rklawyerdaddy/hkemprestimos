import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Banknote, ArrowRightLeft, LogOut, Menu, X, Calendar, Shield, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const SidebarItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                isActive
                    ? 'text-white shadow-lg shadow-gold-900/10'
                    : 'text-slate-400 hover:text-gold-200 hover:bg-white/5'
            )}
        >
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-gold-600/20 to-gold-400/5 border-l-2 border-gold-500" />
            )}
            <Icon size={20} className={clsx('relative z-10 transition-colors', isActive ? 'text-gold-400' : 'text-slate-500 group-hover:text-gold-400')} />
            <span className="font-medium relative z-10">{label}</span>
        </Link>
    );
};

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const userName = localStorage.getItem('user') || 'Usuário';
    const userRole = localStorage.getItem('role');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans selection:bg-gold-500/30">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-gold-500 text-slate-900 rounded-lg shadow-lg"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar com Glassmorphism */}
            <aside className={clsx(
                "fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-950/50 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-8">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20 text-slate-950">
                            <span className="font-black text-xl">H</span>
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-extrabold tracking-tight">
                            HK CONTROLE
                        </span>
                    </h1>
                </div>

                <div className="px-6 mb-8">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Bem-vindo</p>
                        <p className="font-semibold text-slate-200 truncate">{userName}</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {userRole === 'ADMIN' && (
                        <SidebarItem to="/admin" icon={Shield} label="Administração" />
                    )}
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/clients" icon={Users} label="Clientes" />
                    <SidebarItem to="/loans" icon={Banknote} label="Empréstimos" />
                    <SidebarItem to="/overdue" icon={AlertTriangle} label="Atrasados" />
                    <SidebarItem to="/calendar" icon={Calendar} label="Calendário" />
                    <SidebarItem to="/transactions" icon={ArrowRightLeft} label="Fluxo de Caixa" />
                    <SidebarItem to="/partners" icon={Users} label="Parceiros" />
                </nav>

                <div className="p-6 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors group"
                    >
                        <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
                        <span className="font-medium">Sair do Sistema</span>
                    </button>
                    <p className="text-center text-xs text-slate-600 mt-6 font-medium">v1.2.0 Modern Gold</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative w-full bg-slate-950">
                {/* Background Gradient Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-900/10 via-slate-950 to-slate-950 pointer-events-none" />

                <div className="p-4 md:p-8 max-w-7xl mx-auto pt-16 md:pt-8 relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;

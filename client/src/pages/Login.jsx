import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, User, ArrowRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/login', { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', response.data.name);
            localStorage.setItem('role', response.data.role); // Save role
            api.defaults.headers.Authorization = `Bearer ${response.data.token}`;
            if (response.data.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 400) {
                setError('Usuário ou senha incorretos');
            } else if (err.response && err.response.status === 403) {
                setError(err.response.data.error || 'Conta inativa ou sem permissão.');
            } else {
                setError('Erro de conexão com o servidor. Tente novamente.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-600/20 via-slate-950 to-slate-950 pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="glass-card p-10 rounded-3xl w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500 border-white/10 shadow-2xl shadow-black/50">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-500/20 mx-auto mb-6">
                        <span className="text-slate-950 font-black text-2xl">HK</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2 tracking-tight">Bem-vindo de volta</h1>
                    <p className="text-slate-400">Acesse sua conta para continuar</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Usuário</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="text-slate-500 group-focus-within:text-gold-400 transition-colors" size={20} />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-premium w-full pl-11 py-3.5 bg-slate-950/50 border-slate-800 focus:border-gold-500/50 focus:ring-gold-500/20"
                                placeholder="Digite seu usuário"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Senha</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="text-slate-500 group-focus-within:text-gold-400 transition-colors" size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-premium w-full pl-11 py-3.5 bg-slate-950/50 border-slate-800 focus:border-gold-500/50 focus:ring-gold-500/20"
                                placeholder="Digite sua senha"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-lg shadow-xl shadow-gold-900/20 hover:shadow-gold-900/40 mt-2"
                    >
                        Entrar
                        <ArrowRight size={20} />
                    </button>
                </form>

                {/* Registration disabled temporarily
                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Não tem uma conta?{' '}
                        <Link to="/register" className="text-gold-400 font-bold hover:text-gold-300 transition-colors">
                            Criar Conta
                        </Link>
                    </p>
                </div>
                */}
            </div>
        </div>
    );
};

export default Login;

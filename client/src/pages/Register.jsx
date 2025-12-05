import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, Lock, User, CheckCircle } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/register', { username, password, name });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError('Erro ao criar conta. Tente outro usuário.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-600/20 via-slate-950 to-slate-950"></div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="glass-card w-full max-w-md p-10 rounded-3xl animate-in fade-in zoom-in duration-300 relative z-10 border-white/10 shadow-2xl shadow-black/50">
                <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-gold-400 to-gold-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-gold-500/20 rotate-3">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Crie sua Conta</h1>
                    <p className="text-slate-400">Comece a gerenciar seus empréstimos hoje</p>
                </div>

                {success ? (
                    <div className="bg-green-500/10 text-green-400 p-4 rounded-xl flex items-center gap-3 mb-6 border border-green-500/20">
                        <CheckCircle size={24} />
                        <div>
                            <p className="font-bold">Conta criada!</p>
                            <p className="text-sm">Redirecionando para o login...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm text-center border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <div className="group relative">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-gold-400 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Seu nome"
                                    className="input-premium w-full pl-11 py-3.5 focus:border-gold-500/50 focus:ring-gold-500/20"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="group relative">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Usuário</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-gold-400 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Seu usuário"
                                    className="input-premium w-full pl-11 py-3.5 focus:border-gold-500/50 focus:ring-gold-500/20"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="group relative">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-gold-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Sua senha"
                                    className="input-premium w-full pl-11 py-3.5 focus:border-gold-500/50 focus:ring-gold-500/20"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full py-3.5 text-lg shadow-xl shadow-gold-900/20 hover:shadow-gold-900/40 mt-2"
                        >
                            Criar Conta
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-gold-400 font-bold hover:text-gold-300 transition-colors">
                            Fazer Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, AlertCircle } from 'lucide-react';

export default function Login() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(emailRef.current.value, passwordRef.current.value);
            navigate('/');
        } catch (err) {
            setError('Falha no login. Verifique suas credenciais.');
            console.error(err);
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-card rounded-2xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex bg-primary-600 p-3 rounded-2xl text-white shadow-lg shadow-primary-200 mb-4">
                        <img src="/goat-icon.png" alt="Goat Dieta" className="w-8 h-8 object-contain" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Bem-vindo de volta</h2>
                    <p className="text-slate-500">Acesse sua conta para continuar seu progresso</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                        <input
                            type="email"
                            ref={emailRef}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Senha</label>
                        <input
                            type="password"
                            ref={passwordRef}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-200 active:scale-[0.98] disabled:opacity-70"
                        type="submit"
                    >
                        Entrar
                    </button>
                </form>

                <div className="text-center text-sm text-slate-600">
                    Não tem uma conta?{' '}
                    <Link to="/signup" className="text-primary-600 font-semibold hover:text-primary-700">
                        Cadastre-se
                    </Link>
                </div>
            </div>
        </div>
    );
}

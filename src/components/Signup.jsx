import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, AlertCircle } from 'lucide-react';

export default function Signup() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('As senhas não coincidem');
        }

        try {
            setError('');
            setLoading(true);
            await signup(emailRef.current.value, passwordRef.current.value);
            // TODO: Create initial user profile in Firestore here
            navigate('/settings'); // Redirect to settings to complete profile
        } catch (err) {
            setError('Falha ao criar conta. Tente novamente.');
            console.error(err);
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-card rounded-2xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex bg-primary-600 p-3 rounded-2xl text-white shadow-lg shadow-primary-200 mb-4">
                        <Utensils size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Crie sua conta</h2>
                    <p className="text-slate-500">Comece sua jornada saudável hoje</p>
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

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Confirmar Senha</label>
                        <input
                            type="password"
                            ref={passwordConfirmRef}
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
                        Cadastrar
                    </button>
                </form>

                <div className="text-center text-sm text-slate-600">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                        Entrar
                    </Link>
                </div>
            </div>
        </div>
    );
}

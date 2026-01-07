import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Activity, Flame, Droplet, Wheat, ChevronRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 60 });
    const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // 1. Fetch User Goals
        const userRef = doc(db, 'users', currentUser.uid);
        getDoc(userRef).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.macros) setGoals(data.macros);
            }
        });

        // 2. Listen to Today's Logs (Realtime)
        const today = new Date().toISOString().split('T')[0];
        const logRef = doc(db, 'users', currentUser.uid, 'days', today);

        const unsubscribe = onSnapshot(logRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setConsumed(data.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
            } else {
                setConsumed({ calories: 0, protein: 0, carbs: 0, fat: 0 });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const macroData = [
        { name: 'Proteína', value: consumed.protein, max: goals.protein, color: '#3b82f6', icon: Activity },
        { name: 'Carboidratos', value: consumed.carbs, max: goals.carbs, color: '#22c55e', icon: Wheat },
        { name: 'Gorduras', value: consumed.fat, max: goals.fat, color: '#eab308', icon: Droplet },
    ];

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando dashboard...</div>;

    const caloriesPercent = Math.min(100, Math.round((consumed.calories / goals.calories) * 100));

    return (
        <div className="space-y-8 pb-20">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
                <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
                    Hoje, {new Date().toLocaleDateString('pt-BR')}
                </span>
            </div>

            {/* Calories Main Card */}
            <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="flex items-center gap-2 text-primary-600 font-semibold mb-1 justify-center md:justify-start">
                            <Flame size={20} className="fill-current" />
                            <span>Calorias Diárias</span>
                        </div>
                        <div className="text-5xl font-black text-slate-900 tracking-tight">
                            {consumed.calories} <span className="text-2xl text-slate-400 font-medium">/ {goals.calories}</span>
                        </div>
                        <p className="text-slate-500">Você consumiu {caloriesPercent}% da sua meta diária.</p>
                    </div>

                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex justify-between text-sm font-medium text-slate-600">
                            <span>Progresso</span>
                            <span>{caloriesPercent}%</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${caloriesPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Macros Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                {macroData.map((macro) => {
                    const percent = Math.min(100, Math.round((macro.value / macro.max) * 100)) || 0;
                    const Icon = macro.icon;
                    return (
                        <div key={macro.name} className="glass-panel p-6 rounded-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl text-white shadow-md" style={{ backgroundColor: macro.color }}>
                                        <Icon size={18} />
                                    </div>
                                    <span className="font-semibold text-slate-700">{macro.name}</span>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">{percent}%</span>
                            </div>

                            <div className="flex items-end gap-1">
                                <span className="text-3xl font-bold text-slate-900">{macro.value}</span>
                                <span className="text-sm text-slate-500 font-medium mb-1.5">/ {macro.max}g</span>
                            </div>

                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${percent}%`, backgroundColor: macro.color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CTA Section */}
            <div className="grid md:grid-cols-2 gap-6">
                <Link to="/log" className="group glass-card p-6 rounded-2xl flex items-center justify-between hover:border-primary-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-4 rounded-full text-green-600 group-hover:scale-110 transition-transform">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Registrar Refeição</h3>
                            <p className="text-sm text-slate-500">Adicione o que você comeu agora</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                </Link>

                <Link to="/assistant" className="group glass-card p-6 rounded-2xl flex items-center justify-between hover:border-primary-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 p-4 rounded-full text-purple-600 group-hover:scale-110 transition-transform">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Falar com Assistente</h3>
                            <p className="text-sm text-slate-500">Tire dúvidas sobre sua dieta</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                </Link>
            </div>

        </div>
    );
}

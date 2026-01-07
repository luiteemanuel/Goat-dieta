import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { analyzeFood } from '../services/ai'; // Will implement later

export default function AddMealModal({ isOpen, onClose, initialData }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        amount: '',
        time: new Date().toTimeString().slice(0, 5),
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        description: '' // for AI
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name,
                amount: initialData.amount,
                time: initialData.time,
                calories: initialData.macros.calories,
                protein: initialData.macros.protein,
                carbs: initialData.macros.carbs,
                fat: initialData.macros.fat,
                description: ''
            });
        } else {
            setForm({
                name: '',
                amount: '',
                time: new Date().toTimeString().slice(0, 5),
                calories: '',
                protein: '',
                carbs: '',
                fat: '',
                description: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    async function handleAiAnalysis() {
        if (!form.description) return;
        setAiLoading(true);

        try {
            const data = await analyzeFood(form.description);
            setForm(prev => ({
                ...prev,
                name: data.name,
                amount: data.amount || '1 porção',
                calories: data.calories,
                protein: data.protein,
                carbs: data.carbs,
                fat: data.fat
            }));
        } catch (error) {
            console.error("AI Error:", error);
            alert(`Erro na IA: ${error.message || "Erro desconhecido"}`);
        }

        setAiLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const today = new Date().toISOString().split('T')[0];
        const logRef = doc(db, 'users', currentUser.uid, 'days', today);

        // Check if doc exists first to initialize if needed
        // Actually setDoc with merge handles nicely but increments on non-existing fields is tricky.
        // Better to ensure it exists.

        const mealEntry = {
            id: initialData?.id || Date.now().toString(),
            name: form.name,
            amount: form.amount,
            time: form.time,
            macros: {
                calories: parseFloat(form.calories) || 0,
                protein: parseFloat(form.protein) || 0,
                carbs: parseFloat(form.carbs) || 0,
                fat: parseFloat(form.fat) || 0
            }
        };

        try {
            const docSnap = await getDoc(logRef);

            if (!docSnap.exists()) {
                await setDoc(logRef, {
                    entries: [mealEntry],
                    totals: mealEntry.macros
                });
            } else {
                // If editing, remove old entry and subtract totals first
                if (initialData) {
                    await updateDoc(logRef, {
                        entries: arrayRemove(initialData),
                        "totals.calories": increment(-initialData.macros.calories),
                        "totals.protein": increment(-initialData.macros.protein),
                        "totals.carbs": increment(-initialData.macros.carbs),
                        "totals.fat": increment(-initialData.macros.fat)
                    });
                }

                // Add new/updated entry
                await updateDoc(logRef, {
                    entries: arrayUnion(mealEntry),
                    "totals.calories": increment(mealEntry.macros.calories),
                    "totals.protein": increment(mealEntry.macros.protein),
                    "totals.carbs": increment(mealEntry.macros.carbs),
                    "totals.fat": increment(mealEntry.macros.fat)
                });
            }

            onClose();
        } catch (error) {
            console.error("Error saving meal:", error);
        }
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {initialData ? 'Editar Refeição' : 'Nova Refeição'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* AI Input Section */}
                {!initialData && (
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Descreva seu prato para IA calcular
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                className="flex-1 px-4 py-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50 placeholder-purple-300"
                                placeholder='"200g de frango com batata doce"'
                            />
                            <button
                                onClick={handleAiAnalysis}
                                disabled={aiLoading || !form.description}
                                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-all shadow-lg shadow-purple-200 disabled:opacity-70 disabled:shadow-none"
                            >
                                {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Alimento</label>
                            <input
                                required
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Ex: Café da Manhã"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                            <input
                                name="amount"
                                value={form.amount}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Ex: 1 prato"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                            <input
                                type="time"
                                name="time"
                                value={form.time}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            Informações Nutricionais
                        </h3>

                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Calorias</label>
                                <input
                                    type="number"
                                    name="calories"
                                    value={form.calories}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 pl-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800"
                                />
                                <span className="absolute right-4 bottom-2.5 text-slate-400 text-sm">kcal</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs uppercase font-bold text-blue-600 mb-1">Proteína</label>
                                    <input
                                        type="number"
                                        name="protein"
                                        value={form.protein}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-bold text-green-600 mb-1">Carbos</label>
                                    <input
                                        type="number"
                                        name="carbs"
                                        value={form.carbs}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-bold text-yellow-600 mb-1">Gorduras</label>
                                    <input
                                        type="number"
                                        name="fat"
                                        value={form.fat}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-yellow-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? 'Salvando...' : 'Salvar Refeição'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

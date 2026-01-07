import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayRemove, increment } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Coffee, Sun, Moon, Utensils } from 'lucide-react';
import AddMealModal from './AddMealModal';

export default function FoodLog() {
    const { currentUser } = useAuth();
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null); // For editing

    useEffect(() => {
        if (!currentUser) return;

        const today = new Date().toISOString().split('T')[0];
        const logRef = doc(db, 'users', currentUser.uid, 'days', today);

        const unsubscribe = onSnapshot(logRef, (docSnap) => {
            if (docSnap.exists()) {
                setMeals(docSnap.data().entries || []);
            } else {
                setMeals([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    async function handleDelete(meal) {
        if (!confirm('Tem certeza que deseja remover este alimento?')) return;

        const today = new Date().toISOString().split('T')[0];
        const logRef = doc(db, 'users', currentUser.uid, 'days', today);

        try {
            await updateDoc(logRef, {
                entries: arrayRemove(meal),
                "totals.calories": increment(-meal.macros.calories),
                "totals.protein": increment(-meal.macros.protein),
                "totals.carbs": increment(-meal.macros.carbs),
                "totals.fat": increment(-meal.macros.fat)
            });
        } catch (error) {
            console.error("Error deleting meal:", error);
        }
    }

    function handleEdit(meal) {
        setSelectedMeal(meal);
        setIsModalOpen(true);
    }

    function handleCloseModal() {
        setIsModalOpen(false);
        setSelectedMeal(null);
    }

    const getMealIcon = (time) => {
        const hour = parseInt(time.split(':')[0]);
        if (hour < 10) return <Coffee size={20} className="text-yellow-600" />;
        if (hour < 16) return <Sun size={20} className="text-orange-500" />;
        return <Moon size={20} className="text-indigo-500" />;
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Diário Alimentar</h1>
                    <p className="text-slate-500">Registre suas refeições de hoje</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-200 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    <span className="hidden md:inline">Adicionar Refeição</span>
                    <span className="md:hidden">Adicionar</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Carregando refeições...</div>
            ) : meals.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center space-y-4">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Utensils size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Nenhuma refeição registrada</h3>
                        <p className="text-slate-500">Comece adicionando seu café da manhã!</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {meals.sort((a, b) => a.time.localeCompare(b.time)).map((meal, index) => (
                        <div key={index} className="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:border-primary-200 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-100 p-3 rounded-xl">
                                    {getMealIcon(meal.time)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{meal.name}</h3>
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <span>{meal.time}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span>{meal.amount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <div className="font-bold text-slate-900">{meal.macros.calories} kcal</div>
                                    <div className="text-xs text-slate-500 space-x-2">
                                        <span className="text-blue-600 font-medium">P: {meal.macros.protein}g</span>
                                        <span className="text-green-600 font-medium">C: {meal.macros.carbs}g</span>
                                        <span className="text-yellow-600 font-medium">G: {meal.macros.fat}g</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(meal)}
                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(meal)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <AddMealModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    initialData={selectedMeal}
                />
            )}
        </div>
    );
}

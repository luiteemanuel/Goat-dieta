import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, User, Calculator, Target, Sparkles, Ruler, Calendar } from 'lucide-react';
import { calculateNutritionalProfile } from '../services/ai';

export default function Settings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const [profile, setProfile] = useState({
        name: '',
        weight: '',
        height: '',
        age: '',
        gender: 'male',
        basal: '', // Taxa Metabólica Basal
        tmb: '', // Usaremos este campo para persistir o valor do Basal como meta inicial
        proteinMult: '2.0', // 1.4 to 2.0
        goal: 'maintain', // cut, maintain, bulk
    });

    const [macros, setMacros] = useState({
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
    });

    useEffect(() => {
        async function loadUserData() {
            if (!currentUser) return;

            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile(data.profile || profile);
                setMacros(data.macros || macros);
            }
        }
        loadUserData();
    }, [currentUser]);

    // Auto-calculate macros when profile changes
    useEffect(() => {
        if (!profile.weight || !profile.tmb) return;

        const weight = parseFloat(profile.weight);
        const tdee = parseFloat(profile.tmb);
        const proteinMult = parseFloat(profile.proteinMult);

        // 1. Protein
        const proteinGrams = Math.round(weight * proteinMult);
        const proteinCals = proteinGrams * 4;

        // 2. Fat (usually 0.8-1g per kg, let's aim for ~25-30% of TDEE or simple multiplier)
        // Let's use a standard percentage of TDEE for Fats if not specified, say 30%
        // Or fixed by weight: 1g per kg
        const fatGrams = Math.round(weight * 1.0);
        const fatCals = fatGrams * 9;

        // 3. Carbs (Remainder)
        const remainingCals = tdee - (proteinCals + fatCals);
        const carbsGrams = Math.max(0, Math.round(remainingCals / 4));

        setMacros({
            calories: tdee,
            protein: proteinGrams,
            fat: fatGrams,
            carbs: carbsGrams
        });

    }, [profile.weight, profile.tmb, profile.proteinMult]);

    function handleProfileChange(e) {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    }

    function handleMacroChange(e) {
        const { name, value } = e.target;
        setMacros(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }

    async function handleAiCalculate() {
        if (!profile.weight || !profile.height || !profile.age) {
            alert('Por favor, preencha Peso, Altura e Idade primeiro.');
            return;
        }

        setLoading(true);
        try {
            const data = await calculateNutritionalProfile(profile);

            setProfile(prev => ({
                ...prev,
                basal: data.tmb,
                tmb: data.tmb // Set goal to Basal as requested
            }));

            // We do NOT set macros here anymore. 
            // The useEffect above detects the change in profile.tmb and auto-calculates macros 
            // using the strict formulas (Weight * ProteinMult).

            setSuccessMessage(`Calculado! Seu Basal é: ${data.tmb}kcal`);
        } catch (error) {
            alert('Erro ao calcular: ' + error.message);
        }
        setLoading(false);
    }

    async function handleSave(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await setDoc(doc(db, 'users', currentUser.uid), {
                profile,
                macros,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setSuccessMessage('Configurações salvas com sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
        }
        setLoading(false);
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Perfil e Metas</h1>
                    <p className="text-slate-500">Configure seus dados corporais e objetivos nutricionais</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary-200 active:scale-95 disabled:opacity-70"
                >
                    <Save size={20} />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {successMessage && (
                <div className="bg-green-100 text-green-700 p-4 rounded-xl border border-green-200 animate-fade-in font-medium">
                    {successMessage}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">

                {/* Profile Card */}
                <div className="glass-card p-6 rounded-2xl space-y-6 h-fit">
                    <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg border-b border-slate-100 pb-4">
                        <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                            <User size={20} />
                        </div>
                        Dados Pessoais
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Exibição</label>
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={profile.weight}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="0.0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={profile.height}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="175"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Idade</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={profile.age}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="25"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gênero</label>
                                <select
                                    name="gender"
                                    value={profile.gender}
                                    onChange={handleProfileChange}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                >
                                    <option value="male">Masculino</option>
                                    <option value="female">Feminino</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Atividade</label>
                            <select
                                name="activityLevel"
                                value={profile.activityLevel}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            >
                                <option value="sedentary">Sedentário (Pouco ou nenhum exercício)</option>
                                <option value="lightly_active">Levemente Ativo (1-3 dias/semana)</option>
                                <option value="moderately_active">Moderadamente Ativo (3-5 dias/semana)</option>
                                <option value="very_active">Muito Ativo (6-7 dias/semana)</option>
                                <option value="super_active">Super Ativo (físico pesado/atleta)</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleAiCalculate}
                                disabled={loading}
                                className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-purple-200"
                            >
                                {loading ? <span className="animate-spin">✨</span> : <Sparkles size={18} />}
                                Calcular Basal & Macros com IA
                            </button>
                        </div>

                        <div className="relative border-t border-slate-100 pt-4 mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                                <span>Meta Calórica (TDEE)</span>
                                <span className="text-xs text-slate-400 font-normal">Calculado ou Manual</span>
                            </label>
                            <input
                                type="number"
                                name="tmb"
                                value={profile.tmb}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="2000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Multiplicador de Proteína</label>
                            <select
                                name="proteinMult"
                                value={profile.proteinMult}
                                onChange={handleProfileChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            >
                                <option value="1.4">1.4g/kg (Sedentário)</option>
                                <option value="1.6">1.6g/kg (Atividade Moderada)</option>
                                <option value="1.8">1.8g/kg (Atividade Alta)</option>
                                <option value="2.0">2.0g/kg (Atleta/Hipertrofia)</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Define quanto de proteína você ingere por kg.</p>
                        </div>
                    </div>
                </div>

                {/* Macros Card */}
                <div className="glass-card p-6 rounded-2xl space-y-6 h-fit effect-shine">
                    <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg border-b border-slate-100 pb-4">
                        <div className="p-2 bg-secondary-100 text-secondary-600 rounded-lg">
                            <Target size={20} />
                        </div>
                        Metas de Macronutrientes
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <Calculator size={16} />
                            <span>Cálculo Automático</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Os valores abaixo são calculados automaticamente com base no seu peso e TDEE, mas você pode editá-los manualmente se preferir.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Calorias Totais</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="calories"
                                    value={macros.calories}
                                    onChange={handleMacroChange}
                                    className="w-full px-4 py-2 pl-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-secondary-500 outline-none font-bold text-slate-800"
                                />
                                <span className="absolute right-4 top-2 text-slate-400 text-sm font-medium">kcal</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-blue-600 uppercase">Proteína</label>
                                <input
                                    type="number"
                                    name="protein"
                                    value={macros.protein}
                                    onChange={handleMacroChange}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <span className="text-xs text-slate-400">g</span>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-green-600 uppercase">Carboidratos</label>
                                <input
                                    type="number"
                                    name="carbs"
                                    value={macros.carbs}
                                    onChange={handleMacroChange}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                                />
                                <span className="text-xs text-slate-400">g</span>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-yellow-600 uppercase">Gorduras</label>
                                <input
                                    type="number"
                                    name="fat"
                                    value={macros.fat}
                                    onChange={handleMacroChange}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-yellow-500 outline-none"
                                />
                                <span className="text-xs text-slate-400">g</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

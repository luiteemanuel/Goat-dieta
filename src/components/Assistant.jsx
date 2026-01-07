import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { chatWithNutritionist } from '../services/ai';
import clsx from 'clsx';

export default function Assistant() {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [userContext, setUserContext] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        async function loadContext() {
            if (!currentUser) return;

            const today = new Date().toISOString().split('T')[0];
            const userRef = doc(db, 'users', currentUser.uid);
            const logRef = doc(db, 'users', currentUser.uid, 'days', today);

            try {
                const [userSnap, logSnap] = await Promise.all([
                    getDoc(userRef),
                    getDoc(logRef)
                ]);

                const profile = userSnap.exists() ? userSnap.data().profile : {};
                const goals = userSnap.exists() ? userSnap.data().macros : {};
                const consumed = logSnap.exists() ? logSnap.data().totals : { calories: 0 };

                setUserContext({ profile, goals, consumed });

                // Initial greeting
                setMessages([
                    {
                        role: 'model',
                        text: `Olá ${profile.name || 'Nutri'}! Sou seu assistente nutricional. Vi que você consumiu ${consumed?.calories || 0} calorias hoje. Como posso te ajudar a atingir sua meta de ${profile.tmb || goals.calories || 2000} kcal?`
                    }
                ]);
            } catch (error) {
                console.error("Error loading context:", error);
            }
        }
        loadContext();
    }, [currentUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    async function handleSend(e) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            // Format history for Gemini (excluding the last user message we just added visually)
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const responseText = await chatWithNutritionist(history, userMessage, userContext);

            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Desculpe, tive um problema ao processar sua resposta. Tente novamente." }]);
        }
        setLoading(false);
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col glass-card rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="bg-white/50 p-4 border-b border-white/20 flex items-center gap-3 backdrop-blur-md">
                <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-900">Assistente Nutricional</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Online e contextualizado
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div
                            key={idx}
                            className={clsx(
                                "flex gap-3 max-w-[85%]",
                                isUser ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div
                                className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                                    isUser ? "bg-slate-200 text-slate-600" : "bg-purple-600 text-white"
                                )}
                            >
                                {isUser ? <UserIcon size={16} /> : <Bot size={16} />}
                            </div>

                            <div
                                className={clsx(
                                    "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                    isUser
                                        ? "bg-slate-800 text-white rounded-tr-sm"
                                        : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm"
                                )}
                            >
                                {msg.text}
                            </div>
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/50 border-t border-white/20 backdrop-blur-md">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Pergunte sobre sua dieta, alimentos ou receitas..."
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none bg-white transition-all disabled:bg-slate-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:shadow-none active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </form>
        </div>
    );
}

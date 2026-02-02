
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Lock, MessageSquare, ChevronDown, User, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth-store';
import { API_URL } from '../../config/api';
import { UpgradeModal } from '../common/upgrade-modal';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export function AIPincWidget({ userProfile, context = 'MY_REPORT' }: { userProfile: any, context?: string }) {
    const { user, token } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Greeting vs History
    useEffect(() => {
        if (isOpen) {
            const fetchHistory = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/v1/ai/history?context=${context}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const history = await res.json();
                        if (history.length > 0) {
                            setMessages(history.map((h: any) => ({
                                id: h.id,
                                role: h.role,
                                content: h.content
                            })));
                        } else if (messages.length === 0) {
                            // Se não tem histórico, mostra saudação
                            const greeting = `Olá ${user?.name?.split(' ')[0] || ''}! Sou a PINC, sua coach de carreira prática. Vi seus resultados e tenho alguns insights 
                            reais para você crescer. O que você gostaria de explorar hoje?`;
                            setMessages([{ id: 'welcome', role: 'assistant', content: greeting }]);
                        }
                    }
                } catch (e) {
                    console.error("Erro carregando histórico", e);
                }
            };
            fetchHistory();
        }
    }, [isOpen, user, context]); // Dependência de context adicionada

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        // CHECK PERMISSION (Business Logic)
        const isPro = user?.plan === 'PRO' || user?.plan === 'BUSINESS' || user?.role === 'SUPER_ADMIN';

        if (!isPro) {
            setIsUpgradeModalOpen(true);
            return;
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setIsLoading(true);

        // Prepare history synchronously (state update is async)
        const currentHistory = [...messages, newMessage];

        try {
            const res = await fetch(`${API_URL}/api/v1/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: newMessage.content,
                    history: currentHistory.map(m => ({ role: m.role, content: m.content })),
                    profileContext: userProfile,
                    context: context // Envia o contexto para o backend
                })
            });

            if (!res.ok) throw new Error('Falha na IA');

            const data = await res.json();

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message.content
            };

            setMessages(prev => [...prev, aiResponse]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Desculpe, tive um problema de conexão. Tente novamente em instantes.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const isPro = user?.plan === 'PRO' || user?.plan === 'BUSINESS' || user?.role === 'SUPER_ADMIN';

    return (
        <>
            {/* FLOATING ACTION BUTTON */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 bg-slate-900 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 group border border-purple-500/30"
                >
                    <div className="relative">
                        <Sparkles size={24} className="text-purple-400 group-hover:animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                        </span>
                    </div>
                    <span className="font-bold pr-2 hidden md:block">Falar com PINC</span>
                </motion.button>
            )}

            {/* CHAT WINDOW (DRAWER/MODAL) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full h-full md:w-[480px] md:h-[750px] md:max-h-[85vh] bg-white md:rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-purple-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center border-2 border-slate-800">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">PINC Coach</h3>
                                    <p className="text-xs text-purple-300 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Online agora
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                                    <ChevronDown size={20} />
                                </button>
                            </div>
                        </div>

                        {/* MESSAGES AREA */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                            ? 'bg-slate-900 text-white rounded-br-none'
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                            part.startsWith('**') && part.endsWith('**') ? (
                                                <strong key={i} className={msg.role === 'assistant' ? 'text-purple-700 font-bold' : 'font-bold'}>
                                                    {part.slice(2, -2)}
                                                </strong>
                                            ) : (
                                                part
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-purple-600" />
                                        <span className="text-xs text-slate-400">PINC está digitando...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* INPUT AREA */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            {!isPro && messages.length > 0 ? (
                                // BLOCKED STATE
                                <div className="text-center space-y-3">
                                    <p className="text-xs text-slate-500">
                                        Desbloqueie a Mentoria IA completa com o plano PRO.
                                    </p>
                                    <button
                                        onClick={() => setIsUpgradeModalOpen(true)}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 animate-pulse"
                                    >
                                        <Lock size={16} /> Desbloquear PINC Coach
                                    </button>
                                </div>
                            ) : (
                                // ACTIVE STATE
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Pergunte sobre seu perfil..."
                                        className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-400"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-900/20"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UPGRADE MODAL */}
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        </>
    );
}

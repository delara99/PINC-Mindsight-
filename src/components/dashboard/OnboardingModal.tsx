'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, CreditCard, ArrowRight, Wallet } from 'lucide-react';
import { useAuthStore } from '@/src/store/auth-store';
import Link from 'next/link';

export function OnboardingModal() {
    const [isVisible, setIsVisible] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        // Show if user is logged in, has 0 or low credits (e.g. < 2), and hasn't dismissed it
        // OR better: use a localStorage key to only show once per session or "first time" logic.
        // The user request implies: "assim que ele escolher o plano ... e depois ao acessar a plataforma, preciso que este cliente receba um popup"
        // Let's rely on a simplified logic: 
        // If credits <= 1 (typically just the starter) show info about buying more.
        
        const hasSeen = localStorage.getItem('onboarding_payment_seen');
        if (user && !hasSeen) {
             setIsVisible(true);
        }
    }, [user]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('onboarding_payment_seen', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleDismiss}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-primary p-6 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet size={100} />
                        </div>
                        <h3 className="text-2xl font-bold relative z-10">Bem-vindo(a)! 🎉</h3>
                        <p className="opacity-90 mt-1 relative z-10">Veja como ativar seus créditos</p>
                        <button onClick={handleDismiss} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4 mb-6">
                            <div className="flex gap-4 items-start">
                                <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">1. Cadastro Realizado</h4>
                                    <p className="text-sm text-gray-600">Sua conta já está ativa e pronta para uso.</p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">2. Adicionar Créditos</h4>
                                    <p className="text-sm text-gray-600">
                                        Para realizar avaliações, você precisa de créditos.
                                        Acesse a área de <strong>Planos e Faturamento</strong> ou clique no botão abaixo para recarregar sua conta via cartão ou PIX.
                                    </p>
                                </div>
                            </div>
                            
                             <div className="flex gap-4 items-start">
                                <div className="bg-purple-100 p-2 rounded-full text-purple-600 shrink-0">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">3. Liberação Imediata</h4>
                                    <p className="text-sm text-gray-600">
                                        Assim que o pagamento for confirmado, seus créditos ficam disponíveis na hora para enviar testes.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Link href="/dashboard/settings?tab=pricing" onClick={handleDismiss} className="block w-full">
                            <button className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all">
                                Comprar Créditos Agora <ArrowRight size={20} />
                            </button>
                        </Link>
                        
                        <button onClick={handleDismiss} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-800 text-center py-2">
                            Pular por enquanto
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

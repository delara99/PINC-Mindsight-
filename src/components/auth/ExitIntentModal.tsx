'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, ArrowRight } from 'lucide-react';

export function ExitIntentModal() {
    const [isVisible, setIsVisible] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !hasTriggered) {
                setIsVisible(true);
                setHasTriggered(true);
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [hasTriggered]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsVisible(false)}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10"
                    >
                        {/* Header Image/Pattern */}
                        <div className="h-28 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>

                            <h3 className="text-2xl font-bold text-white relative z-10 text-center px-6 leading-tight">
                                Sua análise comportamental <br />
                                <span className="text-purple-400">está 90% pronta</span>
                            </h3>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="absolute top-3 right-3 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors z-20"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8">
                            <p className="text-slate-600 text-sm md:text-base mb-6 text-center leading-relaxed">
                                Você está a um passo de desbloquear seu relatório completo do <strong>TalkingTo</strong>. Finalize agora para acessar:
                            </p>

                            <ul className="space-y-3 mb-8">
                                {[
                                    'Resultado instantâneo TalkingTo',
                                    'Análise de perfil profissional',
                                    'Dashboard de autoconhecimento'
                                ].map((benefit, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                            <CheckCircle className="text-green-600" size={12} />
                                        </div>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-900/10 flex items-center justify-center gap-2 transform transition-all hover:-translate-y-0.5"
                            >
                                Finalizar Cadastro Gratuito <ArrowRight size={18} />
                            </button>

                            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-semibold">
                                Sem cartão de crédito • Acesso imediato
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

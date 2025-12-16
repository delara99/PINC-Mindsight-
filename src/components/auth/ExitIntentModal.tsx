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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header Image/Pattern */}
                        <div className="h-32 bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-extrabold text-white relative z-10 text-center px-4">
                                Espere! Não vá embora ainda...
                            </h3>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-1 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            <p className="text-gray-600 text-lg mb-6 text-center">
                                Você está a um passo de transformar a gestão da sua equipe. 
                                <br />
                                <strong>Termine seu cadastro e garanta:</strong>
                            </p>

                            <ul className="space-y-3 mb-8">
                                {[
                                    'Acesso imediato ao teste Big Five',
                                    'Relatórios de compatibilidade detalhados',
                                    'Dashboard analítico completo'
                                ].map((benefit, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-gray-700">
                                        <CheckCircle className="text-green-500 shrink-0" size={20} />
                                        <span className="font-medium">{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Continuar Meu Cadastro <ArrowRight size={20} />
                            </button>
                            
                            <p className="text-center text-xs text-gray-400 mt-4">
                                Sem compromisso. Cancele a qualquer momento.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

'use client';

import { X, CheckCircle, Crown, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
                        >
                            {/* Header com Gradiente */}
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-center text-white relative overflow-hidden">
                                <button 
                                    onClick={onClose} 
                                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                                
                                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                    <Rocket size={200} className="absolute -left-10 -top-10 rotate-12" />
                                </div>

                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30"
                                >
                                    <Crown size={32} className="text-yellow-300 fill-yellow-300" />
                                </motion.div>

                                <h2 className="text-2xl font-bold mb-2">Desbloqueie o Networking PRO</h2>
                                <p className="text-purple-100">Eleve suas conexões para o próximo nível.</p>
                            </div>

                            {/* Conteúdo */}
                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-gray-900 font-semibold text-center">
                                        Por que fazer o upgrade?
                                    </h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-gray-600">
                                            <CheckCircle className="text-green-500 shrink-0" size={20} />
                                            <span>Acesso ilimitado ao menu <strong>Minhas Conexões</strong></span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-600">
                                            <CheckCircle className="text-green-500 shrink-0" size={20} />
                                            <span>Conecte-se com profissionais <strong>PRO e Business</strong></span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-600">
                                            <CheckCircle className="text-green-500 shrink-0" size={20} />
                                            <span>Visualização completa de perfis e compatibilidade</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-4 text-center">
                                    <p className="text-3xl font-bold text-gray-900 mb-1">
                                        R$ 59,90 <span className="text-sm font-normal text-gray-500">/único</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mb-6">Acesso vitalício ao plano PRO</p>

                                    <button 
                                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                        onClick={() => window.open('https://checkout.stripe.com/c/pay/test_upgrade_pro', '_blank')} 
                                    >
                                        <Rocket size={20} />
                                        <span>Quero ser PRO Agora</span>
                                    </button>
                                    <p className="text-xs text-gray-400 mt-4">
                                        Clique para ir ao checkout seguro. A ativação é automática.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

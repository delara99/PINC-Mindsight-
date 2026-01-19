'use client';

import { X, Users, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        onClose();
        router.push('/dashboard/plans');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header Image/Gradient */}
                        <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-50"></div>
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl opacity-50"></div>

                            <div className="relative z-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                                <Users className="text-white" size={32} />
                            </div>

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors z-20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-8">
                            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                                Networking Inteligente
                            </h2>
                            <p className="text-center text-gray-500 text-sm mb-8 leading-relaxed">
                                O menu <strong>Minhas Conexões</strong> utiliza nossa IA para cruzar seu perfil com outros membros e sugerir parcerias estratégicas.
                            </p>

                            <div className="space-y-4 mb-8">
                                <div className="flex gap-4 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50/50 transition-colors">
                                    <div className="h-10 w-10 shrink-0 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-600">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Match Profissional</h4>
                                        <p className="text-xs text-gray-500">Encontre pessoas com traits complementares aos seus.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50/50 transition-colors">
                                    <div className="h-10 w-10 shrink-0 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-600">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Acesso Exclusivo</h4>
                                        <p className="text-xs text-gray-500">Disponível apenas para membros PRO e Business.</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleUpgrade}
                                className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all group"
                            >
                                Ver Planos de Acesso
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                            </button>

                            <p className="mt-4 text-center text-xs text-gray-400">
                                Sem compromisso. Você pode cancelar a qualquer momento.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

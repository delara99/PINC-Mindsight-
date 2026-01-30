'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle2, Play } from 'lucide-react';

// --- COMPONENTS ---

// Navbar Transparente apenas para compor o visual
const NavbarSimple = () => (
    <nav className="fixed top-0 w-full z-50 py-6 px-8 flex justify-between items-center text-white mix-blend-plus-lighter">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-white rounded-lg flex items-center justify-center font-bold">P</div>
            <span className="font-bold tracking-widest text-sm">PINC</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium opacity-80">
            <span>Metodologia</span>
            <span>Planos</span>
            <span>Login</span>
            <span className="border border-white/30 px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer">Começar</span>
        </div>
    </nav>
);

// Card 3D Interativo
const FloatingCard = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    return (
        <motion.div
            className="relative perspective-1000"
            style={{ x, y, rotateX, rotateY, cursor: 'grab' }}
            whileHover={{ scale: 1.05 }}
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            dragElastic={0.1}
        >
            {/* Glow Behind Card */}
            <div className="absolute inset-0 bg-blue-500 blur-[60px] opacity-40 rounded-full transform translate-y-10 scale-90"></div>

            {/* Main Card Body - Glassmorphism */}
            <div className="relative bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-2xl w-[380px] md:w-[420px] text-slate-800">

                {/* Header do Card */}
                <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#EC1B8E] to-purple-600 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {/* Placeholder Avatar */}
                            <span className="font-bold text-[#EC1B8E]">HD</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg leading-tight">Henrique De Lara</h4>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">CEO da Sued.in</p>
                        </div>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-500">98%</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Compatibilidade</span>
                    </div>
                </div>

                {/* Body do Card (Barras) */}
                <div className="space-y-5">
                    <TraitBar label="Extroversão" score={85} color="bg-blue-500" />
                    <TraitBar label="Amabilidade" score={92} color="bg-green-500" />
                    <TraitBar label="Conscienciosidade" score={78} color="bg-purple-500" />
                </div>

                {/* Footer do Card */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-500 font-bold">+5</div>
                    </div>
                    <button className="text-xs font-bold text-[#EC1B8E] hover:underline">Ver relatório completo</button>
                </div>
            </div>

            {/* Floating Elements (Badges) */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 -top-8 bg-white p-3 rounded-2xl shadow-xl flex items-center gap-2"
            >
                <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600"><CheckCircle2 size={16} /></div>
                <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Soft Skill</div>
                    <div className="text-xs font-bold text-slate-800">Liderança</div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const TraitBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
    <div>
        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span>{label}</span>
            <span>{score}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full rounded-full ${color} relative`}
            >
                <div className="absolute top-0 right-0 bottom-0 w-[20px] bg-gradient-to-r from-transparent to-white/30"></div>
            </motion.div>
        </div>
    </div>
);

// HERO SECTION REFINADO
const HeroOptionB = () => {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden bg-[#4A0E63]">
            {/* Dynamic Background Mesh Gradient */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-[#7C1864] rounded-full blur-[120px] opacity-60 animate-slow-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[80%] bg-[#EC1B8E] rounded-full blur-[120px] opacity-40 animate-slow-pulse delay-1000"></div>
                <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#2E0B45] rounded-full blur-[80px] mix-blend-multiply opacity-80"></div>
                {/* Texture overlay for premium feel */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid md:grid-cols-2 gap-16 items-center">

                {/* Coluna de Texto (Esquerda) */}
                <div className="space-y-8 text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 text-pink-200">
                            <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></span>
                            PINC - People Intelligence
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
                            Autoconhecimento <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-white to-purple-200">
                                transforma vidas.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-purple-100/90 leading-relaxed font-light max-w-lg border-l-4 border-[#EC1B8E] pl-6 my-8">
                            Aprenda a utilizar seus talentos naturais para melhorar seus relacionamentos e atingir máxima produtividade.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5">
                            <button className="group relative px-8 py-4 bg-white text-[#4A0E63] text-lg font-bold rounded-full overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]">
                                <span className="relative z-10 flex items-center gap-2">
                                    Ver Degustação <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>

                            <button className="flex items-center gap-3 px-8 py-4 rounded-full border border-white/30 hover:bg-white/10 transition-colors font-semibold text-white">
                                <Play size={18} fill="currentColor" className="opacity-80" />
                                Como funciona
                            </button>
                        </div>
                    </motion.div>

                    {/* Footerzinho de confiança */}
                    <div className="pt-8 opacity-60 text-xs font-medium tracking-wide border-t border-white/10 mt-8 max-w-sm">
                        PLATAFORMA BASEADA EM BIG FIVE METHODOLOGY
                    </div>
                </div>

                {/* Coluna Visual (Direita) - O Card Flutuante */}
                <div className="hidden md:flex justify-center items-center relative">
                    <FloatingCard />
                </div>

            </div>
        </section>
    );
};

export default function PageV2() {
    return (
        <main>
            <style jsx global>{`
                @keyframes slow-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                .animate-slow-pulse {
                    animation: slow-pulse 8s ease-in-out infinite;
                }
            `}</style>
            <NavbarSimple />
            <HeroOptionB />
        </main>
    );
}

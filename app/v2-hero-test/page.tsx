'use client';

import React from 'react';
import { ArrowRight, Check, Play } from 'lucide-react';

export default function HeroTestPage() {
    return (
        <main className="min-h-screen bg-slate-900 font-sans selection:bg-pink-500 selection:text-white">

            {/* --- NAV PROVISÓRIA --- */}
            <div className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md p-4 text-white text-xs font-mono border-b border-white/10 flex justify-between">
                <span>MODO DE VALIDAÇÃO: HERO TYPOGRAPHY</span>
                <div className="flex gap-4">
                    <a href="#option1" className="hover:text-pink-400">OPÇÃO 1: CLEAN PURPLE</a>
                    <a href="#option2" className="hover:text-pink-400">OPÇÃO 2: EDITORIAL LIGHT</a>
                    <a href="#option3" className="hover:text-pink-400">OPÇÃO 3: BRUTALIST DARK</a>
                </div>
            </div>

            {/* --- OPÇÃO 1: CLEAN PURPLE (Refinamento do Atual) --- */}
            {/* Foca em organizar o texto com espaçamento e pesos melhores */}
            <section id="option1" className="relative min-h-screen flex items-center bg-[#8B1D98] overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-150 contrast-150 mix-blend-overlay"></div>

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        {/* Tagline */}
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-2">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                            <span className="text-xs font-bold text-white tracking-widest uppercase opacity-90">PINC Science</span>
                        </div>

                        {/* Headline: Quebrada e com Tracking Ajustado */}
                        <h1 className="text-white font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                            Autoconhecimento <br />
                            <span className="text-white/60">transforma</span> a sua vida.
                        </h1>

                        {/* Subheadline: Melhor hierarquia */}
                        <p className="text-xl md:text-2xl text-pink-100/80 leading-relaxed font-medium max-w-lg border-l-2 border-pink-400/50 pl-6">
                            Aprenda a utilizar seus talentos naturais para melhorar seus relacionamentos e sua produtividade.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button className="bg-white text-[#8B1D98] px-8 py-4 rounded-full font-bold text-lg hover:bg-pink-50 transition-all hover:scale-105 shadow-xl hover:shadow-2xl">
                                Ver Degustação
                            </button>
                            <button className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition-all">
                                <Play size={18} fill="currentColor" /> Como funciona
                            </button>
                        </div>

                        {/* Micro-prova social */}
                        <div className="pt-8 flex items-center gap-3 text-sm font-medium text-pink-200/60">
                            <div className="flex -space-x-2">
                                <span className="w-6 h-6 rounded-full bg-white/20 border border-white/10"></span>
                                <span className="w-6 h-6 rounded-full bg-white/20 border border-white/10"></span>
                                <span className="w-6 h-6 rounded-full bg-white/20 border border-white/10"></span>
                            </div>
                            +2.000 perfis analisados hoje.
                        </div>
                    </div>

                    {/* Visual Placeholder (Direita) */}
                    <div className="hidden lg:block relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-purple-500 opacity-20 blur-[100px] rounded-full"></div>
                        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700">
                            <div className="h-4 w-1/3 bg-white/20 rounded-full mb-8"></div>
                            <div className="space-y-4">
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden"><div className="w-3/4 h-full bg-green-400"></div></div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden"><div className="w-1/2 h-full bg-blue-400"></div></div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden"><div className="w-5/6 h-full bg-purple-400"></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* --- OPÇÃO 2: EDITORIAL LIGHT (Baseado na Referência 2) --- */}
            <section id="option2" className="relative min-h-screen flex items-center bg-white text-slate-900 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="max-w-4xl">
                        {/* Top Label */}
                        <p className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-6">
                            ● PINC Methodology
                        </p>

                        {/* MASSIVE TYPOGRAPHY */}
                        <h1 className="text-7xl md:text-8xl lg:text-[7rem] font-bold leading-[0.9] tracking-tighter mb-10 text-slate-900">
                            Seus talentos naturais, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600">
                                desbloqueados.
                            </span>
                        </h1>

                        <div className="grid md:grid-cols-2 gap-12 items-start">
                            <p className="text-2xl text-slate-500 font-medium leading-relaxed tracking-tight">
                                Autoconhecimento transforma. Melhore seus relacionamentos e  produtividade com a ciência do Big Five.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <button className="bg-lime-400 hover:bg-lime-300 text-slate-900 px-10 py-5 rounded-full font-bold text-xl transition-transform hover:-translate-y-1 shadow-lg shadow-lime-200">
                                        Fazer Análise Grátis
                                    </button>
                                </div>
                                <p className="text-sm text-slate-400 font-medium">
                                    * Sem cartão de crédito. Resultado em 2 minutos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* --- OPÇÃO 3: TYPOGRAPHY BRUTALISM (Moderno/Dark) --- */}
            <section id="option3" className="relative min-h-screen flex items-center bg-[#1a1a1a] text-white border-t border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-purple-600 blur-[150px] opacity-20 rounded-full pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                    <div className="flex flex-col gap-0">
                        {/* As linhas de texto são blocos sólidos */}
                        <h1 className="text-[12vw] leading-[0.85] font-black tracking-tighter text-white/90 mix-blend-difference hover:text-white transition-colors cursor-default">
                            AUTO
                        </h1>
                        <h1 className="text-[12vw] leading-[0.85] font-black tracking-tighter text-purple-500 hover:text-purple-400 transition-colors cursor-default">
                            CONHECIMENTO
                        </h1>
                        <div className="flex flex-col md:flex-row gap-12 mt-12 items-start">
                            <h1 className="text-[5vw] leading-[0.9] font-bold tracking-tighter text-white/50">
                                É PODER.
                            </h1>
                            <div className="max-w-md space-y-8 pt-2">
                                <p className="text-xl text-gray-400 leading-relaxed font-light border-l border-white/20 pl-6">
                                    Aprenda a utilizar seus talentos naturais para melhorar seus relacionamentos e sua produtividade.
                                </p>
                                <button className="group flex items-center gap-4 text-white text-xl font-bold hover:text-purple-400 transition-colors">
                                    <span className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-purple-400 group-hover:bg-purple-400/10">
                                        <ArrowRight size={20} />
                                    </span>
                                    Começar Jornada
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}

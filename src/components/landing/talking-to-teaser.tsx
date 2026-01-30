'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Lock, Fingerprint } from 'lucide-react';

export const TalkingToTeaser = () => {
    return (
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-6 relative">
                {/* Background Decorative Blobs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[100px] -mr-40 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-[100px] -ml-40 pointer-events-none"></div>

                <div className="text-center mb-16 relative z-10">

                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                        Muito além de um teste de personalidade
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Veja como seus dados se transformam em uma narrativa poderosa sobre quem você realmente é.
                    </p>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* The Card Container with Tilt/Perspective Effect */}
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl ring-1 ring-gray-100 overflow-hidden transform transition-all duration-500 hover:scale-[1.01] hover:rotate-1">

                            {/* Blur Overlay & CTA - The "Gostinho" Part */}
                            <div className="absolute inset-x-0 bottom-0 h-[400px] bg-gradient-to-t from-white via-white/90 to-transparent z-20 flex flex-col items-center justify-end pb-16">
                                <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                                    <div className="flex justify-center">
                                        <div className="bg-gray-900 text-white p-4 rounded-full shadow-xl">
                                            <Lock size={32} />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Quer descobrir o seu perfil completo?
                                    </h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        Desbloqueie agora mesmo sua análise detalhada de 50+ páginas sobre seu modo de operar no mundo.
                                    </p>
                                    <Link
                                        href="/auth/register"
                                        className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-10 rounded-full font-bold text-lg shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-1"
                                    >
                                        Quero meu Relatório <ArrowRight size={20} />
                                    </Link>
                                    <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">
                                        Acesso imediato após avaliação
                                    </p>
                                </div>
                            </div>

                            {/* Header Section (Visible) */}
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-12 relative z-10 opacity-100">
                                <div className="text-8xl filter drop-shadow-lg animate-pulse">
                                    🧬
                                </div>
                                <div className="text-center md:text-left space-y-2">
                                    <h3 className="text-sm font-bold text-purple-600 uppercase tracking-widest">Seu Arquétipo</h3>
                                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-none">
                                        O Visionário Estratégico
                                    </h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                                        <span className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-700 border border-gray-200">Inovador</span>
                                        <span className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-700 border border-gray-200">Analítico</span>
                                        <span className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-700 border border-gray-200">Líder Nato</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Preview (Partially Obscured) */}
                            <div className="space-y-6 opacity-60 filter blur-[1px]">
                                <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex gap-6 items-start">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-xl text-gray-900 mb-2">Energia Social (Extroversão)</h4>
                                        <p className="text-gray-600 italic">"Você domina o ambiente com sua presença, mas sabe exatamente quando ouvir. Sua energia é contagiante e movimenta equipes..."</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">A</div>
                                </div>

                                <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex gap-6 items-start">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-xl text-gray-900 mb-2">Mentalidade (Abertura)</h4>
                                        <p className="text-gray-600 italic">"Sua mente é um laboratório constante de ideias. Onde outros veem problemas, você enxerga padrões invisíveis..."</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">A</div>
                                </div>

                                <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 flex gap-6 items-start">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-xl text-gray-900 mb-2">Resiliência (Estabilidade)</h4>
                                        <p className="text-gray-600 italic">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl">M</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

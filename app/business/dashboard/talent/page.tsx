"use client";
import React from 'react';
import Link from 'next/link';
import { Target, Users, ClipboardList, TrendingUp, Scale, ArrowRight, BrainCircuit, Sparkles } from 'lucide-react';

export default function TalentIntelligenceDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white shadow-lg">
                        <Sparkles size={24} />
                    </div>
                    Inteligência de Talento
                    <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full uppercase tracking-wider border border-purple-200">Beta</span>
                </h1>
                <p className="text-slate-500 mt-2 max-w-2xl text-lg">
                    Transforme dados de colaboradores em decisões estratégicas. Analise fit cultural, crie planos de desenvolvimento e simule cenários de carreira.
                </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Card 1: Perfis de Cargo */}
                <Link href="/business/dashboard/talent/profiles" className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

                    <div className="relative">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <Target size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">Análise de Fit (Cargo)</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            Crie perfis ideais para "Analista de Marketing" e descubra quais colaboradores possuem maior compatibilidade (85%+).
                        </p>
                        <div className="flex items-center text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                            Acessar Perfis <ArrowRight size={16} className="ml-1" />
                        </div>
                    </div>
                </Link>

                {/* Card 2: Análise de Equipe (Coming Soon) */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed relative overflow-hidden group">
                    {/* Badge Coming Soon */}
                    <div className="absolute top-4 right-4 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">Em Breve</div>

                    <div className="w-12 h-12 bg-white text-green-600 rounded-xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                        <Users size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Análise de Equipe</h3>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                        Descubra como um novo membro impacta a dinâmica e cultura do time existente. Preveja conflitos e sinergias.
                    </p>
                </div>

                {/* Card 3: Planos de Ação (Coming Soon) */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed relative group">
                    <div className="absolute top-4 right-4 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">Em Breve</div>

                    <div className="w-12 h-12 bg-white text-orange-600 rounded-xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                        <ClipboardList size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Planos de Ação</h3>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                        Geração automática de planos de desenvolvimento (PDI) baseados em gaps de competência reais.
                    </p>
                </div>

                {/* Card 4: Performance (Coming Soon) */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed relative group">
                    <div className="absolute top-4 right-4 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">Em Breve</div>

                    <div className="w-12 h-12 bg-white text-purple-600 rounded-xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                        <TrendingUp size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Performance Tracking</h3>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                        Acompanhe a evolução do Fit Cultural e das competências comportamentais ao longo do tempo.
                    </p>
                </div>
            </div>

            {/* Getting Started Section */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Primeiro Passo: Defina um Perfil Ideal</h2>
                        <p className="text-purple-100 text-lg mb-0 leading-relaxed">
                            Para calcular a "Nota de Fit" (compatibilidade), a IA do PINC precisa saber o que você espera de cada cargo.
                            <br />Crie seu primeiro Perfil de Cargo em menos de 2 minutos.
                        </p>
                    </div>
                    <Link href="/business/dashboard/talent/profiles" className="whitespace-nowrap flex items-center px-8 py-4 bg-white text-purple-900 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <Sparkles size={20} className="mr-2 text-purple-600" />
                        Criar Perfil de Cargo
                    </Link>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
            </div>
        </div>
    );
}

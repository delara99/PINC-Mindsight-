"use client";
import React from 'react';
import { BarChart3, TrendingUp, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { HelpTooltip } from '@/src/components/ui/HelpTooltip';

export default function PerformancePage() {
    // Helper para URL da API
    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        const baseUrl = url.startsWith('http') ? url : `https://${url}`;
        if (baseUrl.includes('/api/v1')) return baseUrl;
        return `${baseUrl}/api/v1`;
    };

    // Placeholder mock for chart
    const data = [
        { name: 'Jan', value: 400 },
        { name: 'Fev', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Abr', value: 800 },
        { name: 'Mai', value: 500 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Link href="/business/dashboard/talent" className="hover:text-purple-600 transition-colors">Inteligência de Talento</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-medium">Performance</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                    Indicadores de Performance
                    <HelpTooltip text="Visualize a saúde da sua organização através de métricas de engajamento, retenção e riscos." />
                </h1>
                <p className="text-slate-500">Métricas consolidadas de engajamento e resultados.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Engajamento Geral', value: '87%', trend: '+2.5%', trendUp: true, icon: TrendingUp, color: 'text-green-600', help: 'Média de interesse e participação dos colaboradores nas inovações.' },
                    { label: 'Alto Potencial', value: '12', trend: '+4', trendUp: true, icon: Users, color: 'text-purple-600', help: 'Colaboradores identificados com alta performance e alto potencial (9-Box).' },
                    { label: 'Risco de Saída', value: '3', trend: '-1', trendUp: false, icon: AlertTriangle, color: 'text-amber-600', help: 'Colaboradores com baixo engajamento ou fit cultural declinante.' },
                    { label: 'Planos Ativos', value: '24', trend: '+12', trendUp: true, icon: BarChart3, color: 'text-blue-600', help: 'Número de PDIs em andamento neste momento.' }
                ].map((kpi, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg bg-slate-50 ${kpi.color}`}>
                                <kpi.icon size={24} />
                            </div>
                            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${kpi.trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {kpi.trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                                {kpi.trend}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <h3 className="text-slate-500 text-sm font-medium">{kpi.label}</h3>
                            <HelpTooltip text={kpi.help} />
                        </div>
                        <div className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Evolution Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900">Evolução de Competências</h3>
                        <select className="text-sm border-none bg-slate-50 rounded-lg px-2 py-1 text-slate-600 outline-none">
                            <option>Últimos 6 meses</option>
                            <option>Este Ano</option>
                        </select>
                    </div>

                    <div className="h-64 flex items-end justify-between px-4 pb-4 border-b border-l border-slate-100 relative">
                        {/* Mock Bars */}
                        {data.map((d, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 group w-full mx-2">
                                <div className="w-full bg-purple-100 rounded-t-lg relative group-hover:bg-purple-200 transition-colors h-full flex items-end">
                                    <div
                                        className="w-full bg-purple-500 rounded-t-lg transition-all duration-1000 group-hover:bg-purple-600 relative"
                                        style={{ height: `${(d.value / 1000) * 100}%` }}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
                                            {d.value} pts
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">{d.name}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-4">Pontuação média de avaliações por mês</p>
                </div>

                {/* Risk Radar */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Distribuição de Talentos (9-Box)</h3>
                    <p className="text-sm text-slate-500 mb-6">Matriz de Potencial vs Desempenho (Simulação)</p>

                    <div className="grid grid-cols-3 gap-2 h-64">
                        {/* Row 1 */}
                        <div className="bg-orange-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-orange-100">
                            <span className="text-xs font-bold text-orange-800 uppercase">Enigma</span>
                            <span className="text-2xl font-bold text-orange-600">4</span>
                        </div>
                        <div className="bg-green-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-green-100">
                            <span className="text-xs font-bold text-green-800 uppercase">Forte Desempenho</span>
                            <span className="text-2xl font-bold text-green-600">8</span>
                        </div>
                        <div className="bg-purple-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-purple-100 ring-2 ring-purple-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1"><Sparkles size={12} className="text-purple-400" /></div>
                            <span className="text-xs font-bold text-purple-800 uppercase">Alto Potencial</span>
                            <span className="text-2xl font-bold text-purple-600">12</span>
                        </div>

                        {/* Row 2 */}
                        <div className="bg-slate-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-slate-100">
                            <span className="text-xs font-bold text-slate-600 uppercase">Dilema</span>
                            <span className="text-2xl font-bold text-slate-400">2</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-slate-100">
                            <span className="text-xs font-bold text-slate-600 uppercase">Mantenedor</span>
                            <span className="text-2xl font-bold text-slate-400">15</span>
                        </div>
                        <div className="bg-green-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-green-100">
                            <span className="text-xs font-bold text-green-800 uppercase">Forte Desempenho</span>
                            <span className="text-2xl font-bold text-green-600">6</span>
                        </div>

                        {/* Row 3 */}
                        <div className="bg-red-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-red-100">
                            <span className="text-xs font-bold text-red-800 uppercase">Risco</span>
                            <span className="text-2xl font-bold text-red-600">3</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-slate-100">
                            <span className="text-xs font-bold text-slate-600 uppercase">Eficaz</span>
                            <span className="text-2xl font-bold text-slate-400">5</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg flex flex-col items-center justify-center p-2 text-center border border-slate-100">
                            <span className="text-xs font-bold text-slate-600 uppercase">Eficaz+</span>
                            <span className="text-2xl font-bold text-slate-400">7</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

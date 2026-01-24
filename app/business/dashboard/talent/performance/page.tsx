"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, AlertCircle, ArrowUp, ArrowDown, Activity, User, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PerformancePage() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        avgFit: 0,
        avgFitTrend: '+0%',
        assessmentsCount: 0,
        topPerformers: 0,
        needsAttention: 0
    });
    const [performers, setPerformers] = useState<any[]>([]);

    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        return url.startsWith('http') ? url : `https://${url}`;
    };

    // Placeholder mock for chart
    const evolutionData = [
        { month: 'Set', fit: 65 },
        { month: 'Out', fit: 68 },
        { month: 'Nov', fit: 72 },
        { month: 'Dez', fit: 71 },
        { month: 'Jan', fit: 78 },
        { month: 'Fev', fit: 82 },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const res = await fetch(`${getApiUrl()}/business/talent-intelligence/analytics`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();

                    if (data.metrics) {
                        setMetrics({
                            avgFit: data.metrics.avgFit,
                            avgFitTrend: '+4.2%', // Fixed mock since historic data isn't available yet
                            assessmentsCount: data.metrics.assessmentsCount,
                            topPerformers: data.metrics.topPerformers,
                            needsAttention: data.metrics.needsAttention
                        });
                    }

                    if (data.performers) {
                        setPerformers(data.performers);
                    }
                }
            } catch (e) {
                console.error("Error fetching analytics", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Link href="/business/dashboard/talent" className="hover:text-purple-600 transition-colors">Inteligência de Talento</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-medium">Performance</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="text-purple-600" size={28} />
                    Performance Tracking
                </h1>
                <p className="text-slate-500">Acompanhamento da evolução comportamental e cultural da organização.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
            ) : (
                <>
                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-4 opacity-10">
                                <Activity size={64} className="text-purple-600" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium mb-1">Fit Cultural Médio</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-slate-900">{metrics.avgFit}%</h3>
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center">
                                    <ArrowUp size={12} className="mr-0.5" /> {metrics.avgFitTrend}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-1">Colaboradores Monitorados</p>
                            <h3 className="text-3xl font-bold text-slate-900">{metrics.assessmentsCount}</h3>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-1">Top Talentos</p>
                            <div className="flex items-center gap-2 text-yellow-600 font-bold">
                                <Award size={24} />
                                <span className="text-2xl">{metrics.topPerformers}</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-1">Pontos de Atenção</p>
                            <div className="flex items-center gap-2 text-red-600 font-bold">
                                <AlertCircle size={24} />
                                <span className="text-2xl">{metrics.needsAttention}</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Evolução de Compatibilidade (Semestral)</h3>

                        <div className="h-64 flex items-end justify-between gap-2 px-4">
                            {evolutionData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center flex-1 group">
                                    <div className="relative w-full max-w-[60px] flex items-end justify-center h-full">
                                        <div
                                            className="w-full bg-purple-500 rounded-t-lg transition-all duration-1000 group-hover:bg-purple-600 group-hover:shadow-lg relative"
                                            style={{ height: `${d.fit}%` }}
                                        >
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                                {d.fit}%
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium mt-3">{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Performers List */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Ranking de Performance</h3>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Colaborador</th>
                                        <th className="p-4">Fit Atual</th>
                                        <th className="p-4">Tendência</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {performers.length > 0 ? performers.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {p.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {p.name}
                                                {i < 3 && p.fit > 80 && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                                            </td>
                                            <td className="p-4 font-bold text-slate-700">
                                                {p.hasAnalysis ? `${p.fit}%` : <span className="text-xs text-slate-400 font-normal">N/A</span>}
                                            </td>
                                            <td className="p-4">
                                                {p.hasAnalysis ? (
                                                    p.trend === 'up' ? (
                                                        <span className="text-green-600 flex items-center text-xs font-bold"><ArrowUp size={14} className="mr-1" /> Estável</span>
                                                    ) : (
                                                        <span className="text-red-500 flex items-center text-xs font-bold"><ArrowDown size={14} className="mr-1" /> Queda</span>
                                                    )
                                                ) : '-'}
                                            </td>
                                            <td className="p-4">
                                                {!p.hasAnalysis ? (
                                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-bold">Sem Análise</span>
                                                ) : p.fit >= 80 ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">High Potential</span>
                                                ) : p.fit >= 60 ? (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Core Contributor</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">Needs Support</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                                Nenhum colaborador encontrado no painel.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

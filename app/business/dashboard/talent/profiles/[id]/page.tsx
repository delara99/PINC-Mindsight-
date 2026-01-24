"use client";
import React, { useEffect, useState } from 'react';
import { BadgeCheck, User, ArrowLeft, MoreHorizontal, Mail, Phone, Calendar, Briefcase, Target, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { HelpTooltip } from '@/src/components/ui/HelpTooltip';

export default function ProfileDetailsPage({ params }: { params: { id: string } }) {
    const [profile, setProfile] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Helper URLs
    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        const baseUrl = url.startsWith('http') ? url : `https://${url}`;
        if (baseUrl.includes('/api/v1')) return baseUrl;
        return `${baseUrl}/api/v1`;
    };

    const toggleRow = (id: string) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

    // Helper para cor do gap
    const getGapColor = (ideal: number, real: number) => {
        const diff = Math.abs(ideal - real);
        if (diff <= 10) return 'bg-green-500';
        if (diff <= 20) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                // 1. Fetch Profile Details
                const profileRes = await fetch(`${getApiUrl()}/business/job-profiles/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    setProfile(await profileRes.json());
                }

                // 2. Run Analysis
                const analysisRes = await fetch(`${getApiUrl()}/business/talent-intelligence/analyze/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (analysisRes.ok) {
                    setAnalysis(await analysisRes.json());
                }
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
    }

    if (!profile) {
        return <div className="text-center py-20">Perfil não encontrado</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <Link href="/business/dashboard/talent/profiles" className="inline-flex items-center text-sm text-slate-500 hover:text-purple-600 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    Voltar para Perfis
                </Link>
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm text-purple-600">
                            <Target size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-1">{profile.name}</h1>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                <span className="flex items-center gap-1"><Briefcase size={14} /> {profile.department}</span>
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium text-xs uppercase">{profile.level}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Required Config (Mini View) */}
            <div className="grid grid-cols-5 gap-4">
                {[
                    { k: 'O', label: 'Abertura' },
                    { k: 'C', label: 'Consciência' },
                    { k: 'E', label: 'Extroversão' },
                    { k: 'A', label: 'Amabilidade' },
                    { k: 'N', label: 'Estabilidade' }
                ].map((trait) => (
                    <div key={trait.k} className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-purple-200 transition-colors cursor-help group relative" title={trait.label}>
                        <div className="text-2xl font-bold text-slate-900 mb-1">{profile.idealScores?.[trait.k] || 50}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">{trait.k}</div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${profile.idealScores?.[trait.k] || 50}%` }}></div>
                        </div>
                        {/* Simple tooltip on hover */}
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition-opacity z-10">
                            {trait.label} Ideal
                        </div>
                    </div>
                ))}
            </div>

            {/* Candidates Analysis Table (Talent Matrix) */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <User size={20} className="text-purple-600" />
                    Matriz de Talento & Compatibilidade
                    <HelpTooltip text="Ranking de colaboradores baseado na aderência (Fit). Expanda para ver a comparação detalhada por traço." />
                </h2>

                {analysis.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                        <p className="text-slate-500">Nenhum colaborador avaliado ainda.</p>
                        <p className="text-sm text-slate-400 mt-2">Dica: Envie o link do questionário para sua equipe.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="p-4 w-16 text-center">Rank</th>
                                    <th className="p-4">Colaborador</th>
                                    <th className="p-4 w-48">Fit Cultural</th>
                                    <th className="p-4">Insights</th>
                                    <th className="p-4 w-24 text-center">Detalhes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {analysis.map((item, index) => {
                                    const isTopMatch = index === 0;
                                    const isExpanded = expandedRow === item.id;
                                    const scores = item.candidateScores || { O: 0, C: 0, E: 0, A: 0, N: 0 };

                                    return (
                                        <React.Fragment key={item.id}>
                                            <tr
                                                className={`transition-colors cursor-pointer ${isExpanded ? 'bg-purple-50/50' : 'hover:bg-slate-50'} ${isTopMatch && !isExpanded ? 'bg-green-50/30' : ''}`}
                                                onClick={() => toggleRow(item.id)}
                                            >
                                                <td className="p-4 text-center">
                                                    {isTopMatch ? (
                                                        <div className="w-8 h-8 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                            <BadgeCheck size={16} />
                                                        </div>
                                                    ) : (
                                                        <span className="font-mono text-slate-400 font-bold text-lg">#{index + 1}</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-900 text-base">{item.candidateName || 'Anônimo'}</div>
                                                    <div className="text-xs text-slate-500">{item.candidateEmail}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className={`text-lg font-bold ${item.overallFit >= 80 ? 'text-green-600' : item.overallFit >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                                                                {item.overallFit}%
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Match</span>
                                                        </div>
                                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${item.overallFit >= 85 ? 'bg-gradient-to-r from-green-400 to-emerald-600' :
                                                                    item.overallFit >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                                                        'bg-gradient-to-r from-red-400 to-rose-600'
                                                                    }`}
                                                                style={{ width: `${item.overallFit}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-2">
                                                        {item.strengths && item.strengths.slice(0, 1).map((s: string, i: number) => (
                                                            <span key={i} className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                <CheckCircleIcon size={12} /> {s}
                                                            </span>
                                                        ))}
                                                        {item.concerns && item.concerns.slice(0, 1).map((s: string, i: number) => (
                                                            <span key={i} className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                                                <AlertCircleIcon size={12} /> {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-slate-400">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </td>
                                            </tr>

                                            {/* EXPANDED DETAILS */}
                                            {isExpanded && (
                                                <tr className="bg-slate-50">
                                                    <td colSpan={5} className="p-0">
                                                        <div className="p-6 border-b border-slate-200 animate-in slide-in-from-top-2">
                                                            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                                                                <Target size={16} className="text-purple-600" />
                                                                Comparativo Detalhado (Ideal vs Real)
                                                            </h4>

                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                                {/* Left: Macros */}
                                                                <div className="space-y-5">
                                                                    {[
                                                                        { k: 'O', label: 'Abertura (Openness)' },
                                                                        { k: 'C', label: 'Conscienciosidade' },
                                                                        { k: 'E', label: 'Extroversão' },
                                                                        { k: 'A', label: 'Amabilidade' },
                                                                        { k: 'N', label: 'Estabilidade' }
                                                                    ].map(trait => {
                                                                        const ideal = profile.idealScores?.[trait.k] || 50;
                                                                        const real = scores[trait.k] || 0;
                                                                        const gapColor = getGapColor(ideal, real);

                                                                        return (
                                                                            <div key={trait.k} className="relative">
                                                                                <div className="flex justify-between items-end mb-1 text-xs">
                                                                                    <span className="font-bold text-slate-700">{trait.label}</span>
                                                                                    <div className="flex gap-3">
                                                                                        <span className="text-slate-400">Ideal: <strong className="text-purple-600">{ideal}</strong></span>
                                                                                        <span className="text-slate-400">Real: <strong className="text-slate-900">{real}</strong></span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Visual Comparison Bar */}
                                                                                <div className="relative h-3 bg-slate-200 rounded-full w-full">
                                                                                    {/* Real Score Bar */}
                                                                                    <div
                                                                                        className={`absolute top-0 left-0 h-full rounded-full transition-all ${gapColor} opacity-80`}
                                                                                        style={{ width: `${real}%` }}
                                                                                    ></div>

                                                                                    {/* Ideal Marker */}
                                                                                    <div
                                                                                        className="absolute top-0 h-4 w-1 bg-purple-600 border-x border-white -translate-y-0.5 z-10 shadow-sm"
                                                                                        title={`Ideal: ${ideal}`}
                                                                                        style={{ left: `${ideal}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Right: Insights & Facets */}
                                                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-3">Destaques da Análise</h5>
                                                                    <div className="space-y-2 mb-4">
                                                                        {item.strengths && item.strengths.map((s: string, i: number) => (
                                                                            <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                                                <CheckCircleIcon size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                                                <span>{s}</span>
                                                                            </div>
                                                                        ))}
                                                                        {item.concerns && item.concerns.map((s: string, i: number) => (
                                                                            <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                                                <AlertCircleIcon size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                                                                <span>{s}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Facet Warning if applicable */}
                                                                    {scores.facets && Object.keys(scores.facets).length > 0 && (
                                                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                                                            <div className="text-xs text-slate-400 mb-2">Dados de facetas detectados nos resultados.</div>
                                                                            {/* Future: Render facet bars here */}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Icons
function CheckCircleIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg> }
function AlertCircleIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg> }

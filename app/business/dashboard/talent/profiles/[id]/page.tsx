"use client";
import React, { useEffect, useState } from 'react';
import { BadgeCheck, User, ArrowLeft, MoreHorizontal, Mail, Phone, Calendar, Briefcase, Target, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { HelpTooltip } from '@/src/components/ui/HelpTooltip';

export default function ProfileDetailsPage({ params }: { params: { id: string } }) {
    const [profile, setProfile] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper para URL da API
    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        const baseUrl = url.startsWith('http') ? url : `https://${url}`;
        if (baseUrl.includes('/api/v1')) return baseUrl;
        return `${baseUrl}/api/v1`;
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

            {/* Candidates Analysis Table */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <User size={20} className="text-purple-600" />
                    Compatibilidade da Equipe
                    <HelpTooltip text="Ranking de colaboradores baseado na aderência (Fit) ao perfil ideal configurado acima." />
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
                                    <th className="p-4 w-20 text-center">Rank</th>
                                    <th className="p-4">Colaborador</th>
                                    <th className="p-4 w-48">Fit Cultural</th>
                                    <th className="p-4">Insights</th>
                                    {/* <th className="p-4 w-24">Ação</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.map((item, index) => {
                                    const isTopMatch = index === 0;
                                    return (
                                        <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isTopMatch ? 'bg-purple-50/30' : ''}`}>
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
                                            {/* <td className="p-4">
                                                <button className="text-sm font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                                                    Detalhes
                                                </button>
                                            </td> */}
                                        </tr>
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

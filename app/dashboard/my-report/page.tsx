'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_URL } from '../../../src/config/api';
import { useAuthStore } from '../../../src/store/auth-store';
import Link from 'next/link';
import { Calendar, History, Sparkles, ArrowUpRight } from 'lucide-react';
import TalkingToReport from '@/src/components/reports/TalkingToReport';
import { AIPincWidget } from '../../../src/components/ai/AIPincWidget';

function Spinner() {
    return (
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-sm font-bold animate-pulse">Carregando...</p>
        </div>
    )
}

function MyReportContent() {
    const searchParams = useSearchParams();
    const queryReportId = searchParams.get('reportId');

    const [history, setHistory] = useState<any[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Auth Token Management
    const token = useAuthStore((state) => state.token);
    const getToken = () => {
        if (token) return token;
        const t = useAuthStore.getState().token;
        if (t) return t;
        if (typeof window !== 'undefined') {
            try {
                const storage = localStorage.getItem('auth-storage');
                if (storage) {
                    return JSON.parse(storage).state?.token;
                }
            } catch (e) { console.error(e); }
        }
        return null;
    }

    // Load History & User on Mount
    useEffect(() => {
        const init = async () => {
            const t = getToken();
            if (!t) return;

            // Load User for Name
            try {
                const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
                    headers: { 'Authorization': `Bearer ${t}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                }
            } catch (e) { console.error("Erro carregando user", e); }

            // PRIORIDADE: Se tiver ID na URL (ex: Admin vendo cliente), carrega direto e ignora histórico
            if (queryReportId) {
                await handleSelectReport(queryReportId, t);
                return;
            }

            // Load History (Normal User Flow)
            try {
                const res = await fetch(`${API_URL}/api/v1/talking-to/history`, {
                    headers: { 'Authorization': `Bearer ${t}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setHistory(data);
                        handleSelectReport(data[0].id, t);
                    } else {
                        // Tentar buscar o último direto caso history falhe ou esteja vazio
                        fetchLegacyReport(t);
                    }
                } else {
                    fetchLegacyReport(t);
                }
            } catch (e) {
                console.error("Erro carregando histórico", e);
                fetchLegacyReport(t);
            }
        };

        setTimeout(init, 100);
    }, [token, queryReportId]);

    const fetchLegacyReport = async (authToken: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/talking-to/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReport(data);
                setHistory([{
                    id: 'current',
                    completedAt: data.completedAt,
                    assessment: { title: data.title || 'Relatório Atual' }
                }]);
                setSelectedReportId('current');
            } else if (res.status === 404) {
                setReport(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleSelectReport = async (id: string, authToken?: string) => {
        const t = authToken || getToken();
        if (!t) return;

        setSelectedReportId(id);
        setLoadingReport(true);
        if (!report) setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/v1/talking-to/report/${id}`, {
                headers: { 'Authorization': `Bearer ${t}` }
            });

            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingReport(false);
        }
    };

    const handleDownloadPdf = async () => {
        const t = getToken();
        if (!t || !selectedReportId) return;

        try {
            const reportId = selectedReportId === 'current' ? 'latest' : selectedReportId;

            const res = await fetch(`${API_URL}/api/v1/talking-to/export/pdf/${reportId}`, {
                headers: { 'Authorization': `Bearer ${t}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Relatorio_PINC.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Erro ao gerar o PDF. Tente novamente em instantes.');
            }
        } catch (e) {
            console.error(e);
            alert('Não foi possível iniciar o download.');
        }
    };


    // --- RENDER STATES ---

    if (loading && !report) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!report && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
                <div className="text-center max-w-lg bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="bg-purple-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <Sparkles className="text-purple-600" size={40} />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Descubra seu Perfil</h2>
                    <p className="text-slate-500 mb-10 text-lg leading-relaxed font-medium">
                        Sua análise ainda não foi gerada. Inicie sua jornada de autoconhecimento hoje mesmo.
                    </p>
                    <Link href="/dashboard/my-assessments" className="inline-flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                        Iniciar Questionário <ArrowUpRight size={22} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32">

            {/* TIMELINE NAV (Floating) */}
            {history.length > 1 && (
                <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <History size={14} /> Linha do Tempo
                            </div>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                                {history.length} ANÁLISES
                            </span>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                            {history.map((h) => {
                                const isSelected = selectedReportId === h.id;
                                return (
                                    <button
                                        key={h.id}
                                        onClick={() => handleSelectReport(h.id)}
                                        className={`flex-shrink-0 snap-start relative outline-none transition-all duration-300 text-left group`}
                                    >
                                        <div className={`w-64 p-3 rounded-xl border transition-all duration-300 flex items-center gap-3 ${isSelected
                                            ? 'bg-slate-800 border-slate-700 text-white shadow-lg scale-[1.02]'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                            }`}>

                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <Calendar size={16} />
                                            </div>

                                            <div className="overflow-hidden">
                                                <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                                    {h.assessment?.title || 'Relatório'}
                                                </h4>
                                                <span className={`text-[10px] uppercase font-bold tracking-wide ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                                                    {new Date(h.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN REPORT AREA */}
            <div className={`transition-all duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 ${loadingReport ? 'opacity-50 grayscale blur-sm pointer-events-none' : 'opacity-100 blur-0'}`}>
                <TalkingToReport
                    reportData={report}
                    userName={user?.name || 'Visitante'}
                    onDownloadPdf={handleDownloadPdf}
                />
            </div>

            {/* AI COACH WIDGET */}
            {report && (
                <AIPincWidget
                    userProfile={{
                        name: user?.name,
                        role: user?.userType === 'COMPANY' ? user?.role : 'Membro',
                        factors: report.unifiedScores ? {
                            extroversion: report.unifiedScores['EXTRAVERSION']?.normalizedScore || 0,
                            agreeableness: report.unifiedScores['AGREEABLENESS']?.normalizedScore || 0,
                            conscientiousness: report.unifiedScores['CONSCIENTIOUSNESS']?.normalizedScore || 0,
                            neuroticism: report.unifiedScores['NEUROTICISM']?.normalizedScore || 0,
                            openness: report.unifiedScores['OPENNESS']?.normalizedScore || 0
                        } : {}
                    }}
                />
            )}
        </div>
    );
}

export default function MyReportPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spinner />
            </div>
        }>
            <MyReportContent />
        </Suspense>
    );
}

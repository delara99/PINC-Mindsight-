'use client';
import { useEffect, useState } from 'react';
import { API_URL } from '../../../src/config/api';
import { useAuthStore } from '../../../src/store/auth-store';
import Link from 'next/link';
import { Calendar, Clock, ChevronRight, History } from 'lucide-react';

// Componente SafeRender para prevenção de crashes
const SafeRender = ({ value }: { value: any }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') {
        return <span className="text-xs font-mono text-gray-500" title={JSON.stringify(value)}>[Dados Complexos]</span>;
    }
    return <>{String(value)}</>;
};

export default function MyReportPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState('');

    const token = useAuthStore((state) => state.token);

    // Função de recuperação de token
    const getToken = () => {
        if (token) return token;
        const t = useAuthStore.getState().token;
        if (t) return t;
        if (typeof window !== 'undefined') {
            try {
                const storage = localStorage.getItem('auth-storage');
                if (storage) {
                    const parsed = JSON.parse(storage);
                    return parsed.state?.token;
                }
            } catch (e) {
                console.error("Token error", e);
            }
        }
        return null;
    }

    // 1. Carregar Histórico ao iniciar
    useEffect(() => {
        const init = async () => {
            const t = getToken();
            if (!t) return; // AuthGuard vai redirecionar ou mostrar erro depois

            try {
                // Tenta buscar histórico
                const res = await fetch(`${API_URL}/api/v1/talking-to/history`, {
                    headers: { 'Authorization': `Bearer ${t}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setHistory(data);
                        // Seleciona o mais recente automaticamente
                        handleSelectReport(data[0].id, t);
                    } else {
                        // Se não tiver histórico, tenta o /me direto (fallback legado)
                        fetchLegacyReport(t);
                    }
                } else {
                    // Se rota /history falhar (ex: deploy pendente), tenta /me
                    fetchLegacyReport(t);
                }
            } catch (e) {
                console.error("Erro carregando histórico", e);
                fetchLegacyReport(t);
            }
        };

        // Pequeno delay para garantir hidratação
        setTimeout(init, 100);
    }, [token]);

    const fetchLegacyReport = async (authToken: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/talking-to/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                const rep = data.report || data;
                setReport(rep);
                // Cria um histórico "fake" com esse único item
                setHistory([{
                    id: 'legacy',
                    completedAt: rep.completedAt,
                    assessment: { title: 'Relatório Atual' }
                }]);
                setSelectedReportId('legacy');
            } else if (res.status === 404) {
                setReport(null); // Nenhum relatório
            }
        } catch (e) {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    }

    const handleSelectReport = async (id: string, authToken?: string) => {
        const t = authToken || getToken();
        if (!t) return;

        setSelectedReportId(id);
        setLoadingReport(true);
        // Se for o primeiro load, loading geral mantem true. Senão, só o report carrega.
        if (!report) setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/v1/talking-to/report/${id}`, {
                headers: { 'Authorization': `Bearer ${t}` }
            });

            if (res.ok) {
                const data = await res.json();
                setReport(data);
            } else {
                console.error("Erro ao buscar relatório específico");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingReport(false);
        }
    };

    if (loading && !report) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-300 animate-pulse">Carregando sua jornada...</p>
                </div>
            </div>
        );
    }

    if (!report && !loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700">
                    <div className="bg-slate-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <History className="text-slate-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Nenhuma análise disponível</h2>
                    <p className="text-gray-400 mb-6">
                        Você ainda não completou seu inventário TalkingTo. Comece agora para descobrir seu perfil.
                    </p>
                    <Link href="/dashboard/assessments" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-purple-500/25">
                        Iniciar Avaliação
                    </Link>
                </div>
            </div>
        );
    }

    const { talkingToAnalysis } = report;

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans pb-20">

            {/* Timeline Selector */}
            <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            <History size={16} /> Histórico de Evolução
                        </h2>
                        <span className="text-xs text-gray-500 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                            {history.length} avaliações
                        </span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {history.map((h) => (
                            <button
                                key={h.id}
                                onClick={() => handleSelectReport(h.id)}
                                className={`flex-shrink-0 snap-start relative group transition-all duration-300 ${selectedReportId === h.id
                                        ? 'scale-105'
                                        : 'opacity-60 hover:opacity-100 hover:scale-[1.02]'
                                    }`}
                            >
                                <div className={`w-64 p-4 rounded-xl border-2 text-left transition-all ${selectedReportId === h.id
                                        ? 'bg-slate-800 border-purple-500 shadow-lg shadow-purple-900/20'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`p-1.5 rounded-lg ${selectedReportId === h.id ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700 text-slate-400'}`}>
                                            <Calendar size={14} />
                                        </div>
                                        {selectedReportId === h.id && (
                                            <span className="text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full">
                                                VENDO AGORA
                                            </span>
                                        )}
                                    </div>
                                    <h4 className={`font-bold text-sm mb-1 truncate ${selectedReportId === h.id ? 'text-white' : 'text-gray-300'}`}>
                                        {h.assessment?.title || 'Relatório de Perfil'}
                                    </h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(h.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`transition-opacity duration-300 ${loadingReport ? 'opacity-50' : 'opacity-100'}`}>
                <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Report Header */}
                    <div className="text-center py-8">
                        <span className="inline-block py-1 px-3 rounded-full bg-slate-800 border border-slate-700 text-purple-400 text-xs font-bold tracking-widest uppercase mb-4">
                            Relatório Completo
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-white via-purple-100 to-gray-400 bg-clip-text text-transparent mb-4">
                            Seu Perfil TalkingTo
                        </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                            Análise profunda baseada na avaliação realizada em <span className="text-white font-medium">{new Date(report.completedAt).toLocaleDateString('pt-BR')}</span>.
                        </p>
                    </div>

                    {/* Archetype Hero Card */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-12 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none transition-all duration-1000 group-hover:bg-purple-500/30"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

                        <div className="relative z-10 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 flex flex-col md:flex-row items-center gap-4">
                                <span className="text-5xl md:text-6xl filter drop-shadow-lg">🧬</span>
                                <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                                    <SafeRender value={talkingToAnalysis.profile_summary?.archetype_name} />
                                </span>
                            </h2>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                {Array.isArray(talkingToAnalysis.profile_summary?.dominant_traits) && talkingToAnalysis.profile_summary.dominant_traits.map((t: string, i: number) => (
                                    <span key={i} className="px-5 py-2.5 bg-slate-950/40 backdrop-blur-sm text-purple-200 rounded-xl text-sm font-semibold border border-purple-500/20 shadow-sm hover:border-purple-500/50 transition-colors">
                                        <SafeRender value={t} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dimensions Grid (Cards Redesenhados) */}
                    <div className="grid gap-6">
                        {Array.isArray(talkingToAnalysis.talkingto_analysis) && talkingToAnalysis.talkingto_analysis.map((item: any, i: number) => (
                            <div key={i} className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-all shadow-lg hover:shadow-xl">
                                {/* Card Header */}
                                <div className="bg-slate-950/30 p-6 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-white flex items-center gap-3">
                                            <SafeRender value={item.dimension} />
                                            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px] ${(typeof item.classification === 'string' && item.classification.toUpperCase() === 'ALTO') ? 'bg-green-500 shadow-green-500/50' :
                                                    (typeof item.classification === 'string' && item.classification.toUpperCase() === 'BAIXO') ? 'bg-blue-500 shadow-blue-500/50' :
                                                        'bg-yellow-500 shadow-yellow-500/50'
                                                }`}></div>
                                        </h3>
                                        <span className={`inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${(typeof item.classification === 'string' && item.classification.toUpperCase() === 'ALTO') ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                (typeof item.classification === 'string' && item.classification.toUpperCase() === 'BAIXO') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                            <SafeRender value={item.classification} />
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(item.labels) && item.labels.map((l: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-slate-700/50 rounded-lg text-xs text-gray-400 font-medium">
                                                <SafeRender value={l} />
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 md:p-8">
                                    <div className="relative mb-8 pl-6 border-l-2 border-slate-600">
                                        <p className="text-gray-300 italic text-lg leading-relaxed">
                                            "<SafeRender value={item.text_interpretation} />"
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">❤️</span>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Necessidade Primária</span>
                                            </div>
                                            <p className="text-gray-200 text-sm"><SafeRender value={item.needs?.primary} /></p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">⚠️</span>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ponto de Atenção</span>
                                            </div>
                                            <p className="text-gray-200 text-sm"><SafeRender value={item.needs?.risk} /></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Executive Summary */}
                    <div className="bg-slate-800 p-8 md:p-10 rounded-3xl border border-slate-700 shadow-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-1.5 h-8 rounded-full"></div>
                            <h3 className="text-2xl font-bold text-white">Síntese Executiva</h3>
                        </div>

                        {talkingToAnalysis.executive_summary && typeof talkingToAnalysis.executive_summary === 'object' ? (
                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="flex items-center gap-3 font-bold text-emerald-400 mb-6 uppercase text-xs tracking-widest border-b border-emerald-500/20 pb-3">
                                        <span className="text-lg">💪</span> Principais Forças
                                    </h4>
                                    <ul className="space-y-4">
                                        {Array.isArray(talkingToAnalysis.executive_summary.strengths) ?
                                            talkingToAnalysis.executive_summary.strengths.map((s: string, i: number) => (
                                                <li key={i} className="flex gap-4 text-gray-300 text-sm leading-relaxed group">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 group-hover:scale-125 transition-transform"></div>
                                                    {s}
                                                </li>
                                            )) : <li className="text-gray-500 italic">Nenhum ponto forte identificado.</li>}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="flex items-center gap-3 font-bold text-amber-400 mb-6 uppercase text-xs tracking-widest border-b border-amber-500/20 pb-3">
                                        <span className="text-lg">🚧</span> Pontos de Atenção
                                    </h4>
                                    <ul className="space-y-4">
                                        {Array.isArray(talkingToAnalysis.executive_summary.watch_outs) ?
                                            talkingToAnalysis.executive_summary.watch_outs.map((w: string, i: number) => (
                                                <li key={i} className="flex gap-4 text-gray-300 text-sm leading-relaxed group">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 group-hover:scale-125 transition-transform"></div>
                                                    {w}
                                                </li>
                                            )) : <li className="text-gray-500 italic">Nenhum ponto de atenção identificado.</li>}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700/50 text-gray-300 leading-relaxed italic">
                                <SafeRender value={talkingToAnalysis.executive_summary} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

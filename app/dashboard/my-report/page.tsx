'use client';
import { useEffect, useState } from 'react';
import { API_URL } from '../../../src/config/api';
import { useAuthStore } from '../../../src/store/auth-store';
import Link from 'next/link';
import { Calendar, Clock, ChevronRight, History, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

// Componente SafeRender para prevenção de crashes
const SafeRender = ({ value }: { value: any }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') {
        return <span className="text-xs font-mono text-gray-400" title={JSON.stringify(value)}>[Complex Data]</span>;
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

    useEffect(() => {
        const init = async () => {
            const t = getToken();
            if (!t) return;

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
                setHistory([{
                    id: 'legacy',
                    completedAt: rep.completedAt,
                    assessment: { title: 'Relatório Atual' }
                }]);
                setSelectedReportId('legacy');
            } else if (res.status === 404) {
                setReport(null);
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-gray-500 font-medium text-lg animate-pulse">Preparando sua análise de perfil...</p>
                </div>
            </div>
        );
    }

    if (!report && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="text-center max-w-lg bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
                    <div className="bg-purple-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Sparkles className="text-purple-600" size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Descubra seu Perfil</h2>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                        Você ainda não possui um mapeamento TalkingTo. Inicie sua jornada de autoconhecimento hoje mesmo.
                    </p>
                    <Link href="/dashboard/assessments" className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        Iniciar Diagnóstico <ArrowUpRight size={20} />
                    </Link>
                </div>
            </div>
        );
    }

    const { talkingToAnalysis } = report;

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans pb-32">

            {/* Timeline NAVEGATION - Clean Style V2 */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded-lg">
                                <History size={20} className="text-gray-600" />
                            </div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
                                Jornada Evolutiva
                            </h2>
                        </div>
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                            {history.length} ANÁLISES DISPONÍVEIS
                        </span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide snap-x px-1">
                        {history.map((h) => {
                            const isSelected = selectedReportId === h.id;
                            return (
                                <button
                                    key={h.id}
                                    onClick={() => handleSelectReport(h.id)}
                                    className={`flex-shrink-0 snap-start relative group outline-none transition-all duration-300 ${isSelected ? 'translate-y-0' : 'hover:-translate-y-1'
                                        }`}
                                >
                                    <div className={`w-72 p-5 rounded-2xl text-left transition-all duration-300 border ${isSelected
                                            ? 'bg-white border-purple-500 shadow-xl shadow-purple-500/10'
                                            : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200'
                                        }`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-2.5 rounded-xl transition-colors ${isSelected
                                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                                    : 'bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500'
                                                }`}>
                                                <Calendar size={18} />
                                            </div>
                                            {isSelected && (
                                                <span className="text-[10px] font-bold bg-gray-900 text-white px-3 py-1.5 rounded-lg uppercase tracking-wide flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                                    VISUALIZANDO
                                                </span>
                                            )}
                                        </div>

                                        <h4 className={`font-bold text-sm mb-2 truncate transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'
                                            }`}>
                                            {h.assessment?.title || 'Relatório de Perfil'}
                                        </h4>

                                        <div className="flex items-center gap-2">
                                            <div className={`h-px flex-1 transition-colors ${isSelected ? 'bg-purple-100' : 'bg-gray-100'}`}></div>
                                            <p className={`text-xs font-medium flex items-center gap-1.5 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`}>
                                                <Clock size={12} />
                                                {new Date(h.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Indicador de Seleção Externo (Glow) para evitar bordas cortadas */}
                                    {isSelected && (
                                        <div className="absolute inset-x-4 -bottom-2 h-4 bg-purple-500/20 blur-xl rounded-full -z-10"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-500 ${loadingReport ? 'opacity-50 blur-sm grayscale' : 'opacity-100 blur-0 grayscale-0'}`}>
                <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

                    {/* Header Clean */}
                    <div className="text-center space-y-4 pt-4 pb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-600 mb-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            Relatório Validado
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                            Seu Perfil <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">TalkingTo</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                            Mapeamento comportamental profundo (Big 5) processado em <span className="text-gray-900 font-semibold">{new Date(report.completedAt).toLocaleDateString('pt-BR')}</span>.
                        </p>
                    </div>

                    {/* Hero Archetype Modern white Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl shadow-purple-900/5 ring-1 ring-gray-100 relative overflow-hidden group">
                        {/* Subtle Background Elements */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-purple-50 to-pink-50 rounded-full blur-3xl -mr-40 -mt-40 opacity-70 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-50 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                            <div className="flex-shrink-0 relative">
                                <div className="text-[7rem] md:text-[8rem] leading-none filter drop-shadow-2xl animate-in fade-in zoom-in duration-700">
                                    🧬
                                </div>
                                <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                                    <Sparkles className="text-yellow-400 fill-yellow-400" size={32} />
                                </div>
                            </div>

                            <div className="text-center md:text-left space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-2">Arquétipo Dominante</h3>
                                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                                        <SafeRender value={talkingToAnalysis.profile_summary?.archetype_name} />
                                    </h2>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                    {Array.isArray(talkingToAnalysis.profile_summary?.dominant_traits) && talkingToAnalysis.profile_summary.dominant_traits.map((t: string, i: number) => (
                                        <span key={i} className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-lg font-semibold border border-gray-200 shadow-sm">
                                            <SafeRender value={t} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dimensions Grid - Bento Grid Style */}
                    <div className="grid gap-6">
                        {Array.isArray(talkingToAnalysis.talkingto_analysis) && talkingToAnalysis.talkingto_analysis.map((item: any, i: number) => (
                            <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-purple-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                                <div className="p-8 md:p-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-2xl text-gray-900 flex items-center gap-3">
                                                <SafeRender value={item.dimension} />
                                            </h3>

                                            <div className="flex items-center gap-3">
                                                <div className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border ${(typeof item.classification === 'string' && item.classification.toUpperCase() === 'ALTO') ? 'bg-green-50 text-green-700 border-green-200' :
                                                        (typeof item.classification === 'string' && item.classification.toUpperCase() === 'BAIXO') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    }`}>
                                                    <SafeRender value={item.classification} />
                                                </div>
                                                <div className="h-px bg-gray-200 w-12"></div>
                                                <div className="flex gap-2">
                                                    {Array.isArray(item.labels) && item.labels.map((l: string, idx: number) => (
                                                        <span key={idx} className="text-sm font-medium text-gray-500">
                                                            {l}{idx < item.labels.length - 1 ? ',' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${(typeof item.classification === 'string' && item.classification.toUpperCase() === 'ALTO') ? 'bg-green-100 text-green-600' :
                                                (typeof item.classification === 'string' && item.classification.toUpperCase() === 'BAIXO') ? 'bg-blue-100 text-blue-600' :
                                                    'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            <span className="text-2xl font-bold">
                                                {item.classification ? item.classification[0] : '-'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Interpretation Quote */}
                                    <div className="relative pl-6 mb-8">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-full"></div>
                                        <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed italic">
                                            "<SafeRender value={item.text_interpretation} />"
                                        </p>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                                            <div className="p-2 bg-white rounded-lg shadow-sm text-red-500 shrink-0">
                                                <Sparkles size={18} />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Necessidade Primária</span>
                                                <span className="text-gray-700 font-medium text-base"><SafeRender value={item.needs?.primary} /></span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors">
                                            <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500 shrink-0">
                                                <AlertCircle size={18} />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Ponto de Atenção</span>
                                                <span className="text-gray-700 font-medium text-base"><SafeRender value={item.needs?.risk} /></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Executive Summary - Modern */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/50">
                        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-100">
                            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                                <ArrowUpRight size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Síntese Executiva</h3>
                                <p className="text-gray-500 text-sm">Resumo estratégico para tomada de decisão</p>
                            </div>
                        </div>

                        {talkingToAnalysis.executive_summary && typeof talkingToAnalysis.executive_summary === 'object' ? (
                            <div className="grid md:grid-cols-2 gap-12">
                                <div>
                                    <h4 className="flex items-center gap-3 text-emerald-600 mb-6 font-bold uppercase text-xs tracking-widest">
                                        <span className="p-1.5 bg-emerald-100 rounded-md">💪</span> Pontos Fortes
                                    </h4>
                                    <ul className="space-y-4">
                                        {Array.isArray(talkingToAnalysis.executive_summary.strengths) ?
                                            talkingToAnalysis.executive_summary.strengths.map((s: string, i: number) => (
                                                <li key={i} className="flex gap-4 text-gray-700 font-medium text-base leading-relaxed group">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2.5 shrink-0 group-hover:scale-125 transition-transform shadow-sm shadow-emerald-200"></div>
                                                    {s}
                                                </li>
                                            )) : <li className="text-gray-400 italic">Nenhum ponto forte identificado.</li>}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="flex items-center gap-3 text-amber-600 mb-6 font-bold uppercase text-xs tracking-widest">
                                        <span className="p-1.5 bg-amber-100 rounded-md">⚠️</span> Atenção
                                    </h4>
                                    <ul className="space-y-4">
                                        {Array.isArray(talkingToAnalysis.executive_summary.watch_outs) ?
                                            talkingToAnalysis.executive_summary.watch_outs.map((w: string, i: number) => (
                                                <li key={i} className="flex gap-4 text-gray-700 font-medium text-base leading-relaxed group">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 shrink-0 group-hover:scale-125 transition-transform shadow-sm shadow-amber-200"></div>
                                                    {w}
                                                </li>
                                            )) : <li className="text-gray-400 italic">Nenhum ponto de atenção identificado.</li>}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 text-lg leading-relaxed italic">
                                "{String(talkingToAnalysis.executive_summary)}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

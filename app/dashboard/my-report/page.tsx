'use client';
import { useEffect, useState } from 'react';
import { API_URL } from '../../../src/config/api';
import { useAuthStore } from '../../../src/store/auth-store';
import Link from 'next/link';
import { Calendar, Clock, History, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2, Target } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

// --- COMPONENTS ---

// SafeRender para evitar crashes
const SafeRender = ({ value }: { value: any }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') {
        return <span className="text-xs font-mono text-gray-400" title={JSON.stringify(value)}>[Data]</span>;
    }
    return <>{String(value)}</>;
};

// Radar Chart Component
const UnifiedRadar = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;
    return (
        <div className="w-full h-[400px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Seu Perfil"
                        dataKey="A"
                        stroke="#9333ea"
                        strokeWidth={4}
                        fill="#a855f7"
                        fillOpacity={0.4}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#9333ea', fontWeight: 'bold' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default function MyReportPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);

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

    // Load History on Mount
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
    }, [token]);

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

    // --- RENDER STATES ---

    if (loading && !report) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-gray-500 font-medium text-lg animate-pulse">Carregando análise...</p>
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
                        Inicie sua jornada de autoconhecimento hoje mesmo.
                    </p>
                    <Link href="/dashboard/my-assessments" className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                        Iniciar Diagnóstico <ArrowUpRight size={20} />
                    </Link>
                </div>
            </div>
        );
    }

    // --- DATA PREPARATION ---
    const { talkingToAnalysis, unifiedScores, radarData } = report;
    const scoresList = unifiedScores ? Object.values(unifiedScores) : [];

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans pb-32">

            {/* TIMELINE NAV */}
            {history.length > 1 && (
                <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {history.map(h => (
                                <button key={h.id} onClick={() => handleSelectReport(h.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedReportId === h.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    {new Date(h.completedAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()} • {h.assessment?.title || 'Relatório'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className={`transition-all duration-700 ${loadingReport ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>

                {/* HERO SECTION */}
                <div className="relative bg-white border-b border-gray-200 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none mix-blend-multiply"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none mix-blend-multiply"></div>

                    <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-gray-200 shadow-sm backdrop-blur-md text-sm font-semibold text-gray-600 mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Análise Unificada Completa
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-6">
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-300% animate-gradient">
                                {talkingToAnalysis.profile_summary?.archetype_name || 'Seu Arquétipo'}
                            </span>
                        </h1>
                        <div className="flex flex-wrap justify-center gap-3 mb-8">
                            {Array.isArray(talkingToAnalysis.profile_summary?.dominant_traits) && talkingToAnalysis.profile_summary.dominant_traits.map((t: string, i: number) => (
                                <span key={i} className="px-6 py-2 bg-white/60 backdrop-blur border border-gray-200/50 rounded-xl font-bold text-gray-700 shadow-sm">
                                    {t}
                                </span>
                            ))}
                        </div>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Relatório processado em <span className="font-semibold text-gray-900">{new Date(report.completedAt).toLocaleDateString('pt-BR')}</span>.
                            Este documento unifica sua identidade comportamental com métricas de alta precisão.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">

                    {/* SECTION 1: RADAR & EXECUTIVE SUMMARY (SIDE BY SIDE) */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* CARD 1: RADAR CHART */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-center items-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 self-start flex items-center gap-2">
                                <Target className="text-purple-600" /> Mapeamento Dimensional
                            </h3>
                            {radarData ? (
                                <div className="w-full pl-0">
                                    <UnifiedRadar data={radarData} />
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-400 italic">
                                    Dados gráficos indisponíveis no momento.
                                </div>
                            )}
                            <p className="text-sm text-gray-400 mt-4 text-center">
                                Visualização polar das 5 grandes dimensões da sua personalidade.
                            </p>
                        </div>

                        {/* CARD 2: EXECUTIVE SUMMARY */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gray-100"></div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                                <Sparkles className="text-yellow-500 fill-yellow-500" /> Síntese Executiva
                            </h3>

                            <div className="space-y-8 flex-1">
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Potencializadores
                                    </h4>
                                    <ul className="space-y-3">
                                        {talkingToAnalysis.executive_summary?.strengths?.map((s: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-gray-700 font-medium leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div> Pontos de Atenção
                                    </h4>
                                    <ul className="space-y-3">
                                        {talkingToAnalysis.executive_summary?.watch_outs?.map((s: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-gray-700 font-medium leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                                                <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: DETAILED TALKING TO CARDS */}
                    <div className="space-y-8">
                        <div className="flex items-end justify-between border-b border-gray-200 pb-4">
                            <h2 className="text-3xl font-bold text-gray-900">Detalhamento por Traço</h2>
                            <span className="text-sm text-gray-500">Análise Narrativa</span>
                        </div>

                        <div className="grid gap-6">
                            {talkingToAnalysis.talkingto_analysis?.map((item: any, i: number) => (
                                <div key={i} className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        {/* Left: Score & Class */}
                                        <div className="md:w-1/4 flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-4xl font-black text-purple-600 mb-2">
                                                {item.classification === 'ALTO' ? 'Alto' : item.classification === 'BAIXO' ? 'Baixo' : 'Flex'}
                                            </span>
                                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">{item.dimension}</span>
                                            <div className="h-1 w-12 bg-purple-200 rounded-full mt-4 mb-4"></div>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {item.labels?.map((l: string, idx: number) => (
                                                    <span key={idx} className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600">
                                                        {l}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right: Text */}
                                        <div className="flex-1 space-y-6">
                                            <h3 className="text-2xl font-bold text-gray-900">{item.dimension}</h3>
                                            <p className="text-lg text-gray-600 leading-relaxed italic border-l-4 border-purple-500 pl-6">
                                                "{item.text_interpretation}"
                                            </p>

                                            <div className="grid md:grid-cols-2 gap-4 mt-6">
                                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                    <h5 className="text-xs font-bold text-blue-600 uppercase mb-2">Ambiente Ideal</h5>
                                                    <p className="text-sm text-gray-700 font-medium">{item.needs?.environment}</p>
                                                </div>
                                                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                                    <h5 className="text-xs font-bold text-red-600 uppercase mb-2">Risco Latente</h5>
                                                    <p className="text-sm text-gray-700 font-medium">{item.needs?.risk}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 3: DETAILED SCORES DATA (TABLE) */}
                    {scoresList.length > 0 && (
                        <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-16 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                    <History className="text-purple-400" /> Dados Analíticos Brutos
                                </h2>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {scoresList.map((score: any, idx: number) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-bold text-lg text-gray-200">{score.traitName}</h4>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${score.level === 'HIGH' || score.level === 'VERY_HIGH' ? 'bg-green-500/20 text-green-300' : score.level === 'LOW' || score.level === 'VERY_LOW' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                                    {score.levelLabel || score.level}
                                                </span>
                                            </div>

                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm text-gray-400 mb-1">
                                                    <span>Score</span>
                                                    <span>{score.normalizedScore}%</span>
                                                </div>
                                                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${score.normalizedScore}%` }}></div>
                                                </div>
                                            </div>

                                            {score.facets && score.facets.length > 0 && (
                                                <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                                                    {score.facets.map((f: any, fi: number) => (
                                                        <div key={fi} className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-400">{f.facetName}</span>
                                                            <span className="font-mono text-gray-300">{f.score}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

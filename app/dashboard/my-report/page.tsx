'use client';
import { useEffect, useState } from 'react';
import { API_URL } from '../../../src/config/api';
import { useAuthStore } from '../../../src/store/auth-store';
import Link from 'next/link';

// Componente SafeRender para prevenção de crashes
const SafeRender = ({ value }: { value: any }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') {
        return <span className="text-xs font-mono text-gray-500" title={JSON.stringify(value)}>[Dados Complexos]</span>;
    }
    return <>{String(value)}</>;
};

export default function MyReportPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = useAuthStore((state) => state.token);

    // Função de recuperação de token resiliente
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
        const t = getToken();
        if (t) {
            fetchLatestReport(t);
        } else {
            // Tentativa secundária para hidratação lenta
            setTimeout(() => {
                const t2 = getToken();
                if (t2) fetchLatestReport(t2);
                else {
                    setLoading(false);
                    setError('Não autenticado. Por favor faça login novamente.');
                }
            }, 500);
        }
    }, [token]);

    const fetchLatestReport = async (authToken: string) => {
        try {
            const res = await fetch(`${API_URL}/api/v1/talking-to/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (res.status === 404) {
                // Usuário não tem avaliações
                setLoading(false);
                return;
            }

            if (!res.ok) {
                throw new Error('Falha ao carregar relatório');
            }

            const data = await res.json();
            setReport(data.report || data);
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar sua análise. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-300 animate-pulse">Gerando sua análise TalkingTo...</p>
                </div>
            </div>
        );
    }

    if (!report && !error) {
        // Caso não tenha relatório (404 da API tratado)
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700">
                    <div className="text-4xl mb-4">📝</div>
                    <h2 className="text-xl font-bold text-white mb-2">Nenhuma análise disponível</h2>
                    <p className="text-gray-400 mb-6">
                        Você ainda não completou uma avaliação comportamental compatível.
                    </p>
                    <Link href="/dashboard/assessments" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Ir para Avaliações
                    </Link>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-gray-400 hover:text-white underline text-sm">
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    // Renderização Principal
    const { talkingToAnalysis } = report;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">

                {/* Cabeçalho */}
                <div className="text-center md:text-left border-b border-gray-700 pb-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Seu Perfil TalkingTo
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Análise baseada na avaliação de {new Date(report.completedAt).toLocaleDateString()}
                    </p>
                </div>

                {/* Arquétipo */}
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-purple-600/20 transition-all"></div>

                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 relative z-10">
                        <span className="text-4xl">🧬</span>
                        <SafeRender value={talkingToAnalysis.profile_summary?.archetype_name} />
                    </h2>

                    <div className="flex flex-wrap gap-3 mb-6 relative z-10">
                        {Array.isArray(talkingToAnalysis.profile_summary?.dominant_traits) && talkingToAnalysis.profile_summary.dominant_traits.map((t: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm font-medium border border-purple-500/30">
                                <SafeRender value={t} />
                            </span>
                        ))}
                    </div>
                </div>

                {/* Dimensions Grid */}
                <div className="grid gap-6">
                    {Array.isArray(talkingToAnalysis.talkingto_analysis) && talkingToAnalysis.talkingto_analysis.map((item: any, i: number) => (
                        <div key={i} className="bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                                        <SafeRender value={item.dimension} />
                                        <div className={`w-3 h-3 rounded-full ${(typeof item.classification === 'string' && item.classification.toUpperCase() === 'ALTO') ? 'bg-green-500' :
                                                (typeof item.classification === 'string' && item.classification.toUpperCase() === 'BAIXO') ? 'bg-blue-500' :
                                                    'bg-yellow-500'
                                            }`}></div>
                                    </h3>

                                    <div className="mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${(typeof item.classification === 'string' && item.classification.toUpperCase() === 'ALTO') ? 'bg-green-500/10 text-green-400' :
                                                (typeof item.classification === 'string' && item.classification.toUpperCase() === 'BAIXO') ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            <SafeRender value={item.classification} />
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(item.labels) && item.labels.map((l: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-700 rounded-lg text-xs text-gray-300 font-mono">
                                            <SafeRender value={l} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-lg border-l-4 border-purple-500 mb-6 italic text-gray-300 leading-relaxed min-h-[5rem]">
                                "<SafeRender value={item.text_interpretation} />"
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">❤️</div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Necessidade Primária</span>
                                        <span className="text-gray-200"><SafeRender value={item.needs?.primary} /></span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">⚠️</div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Ponto de Atenção</span>
                                        <span className="text-gray-200"><SafeRender value={item.needs?.risk} /></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Executive Summary */}
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold mb-4">Síntese Executiva</h3>
                    <p className="text-gray-300 leading-relaxed">
                        <SafeRender value={talkingToAnalysis.executive_summary} />
                    </p>
                </div>
            </div>
        </div>
    );
}

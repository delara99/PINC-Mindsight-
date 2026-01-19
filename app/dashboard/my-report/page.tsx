'use client';
import { useEffect, useState } from 'react';
import { API_URL } from '../../../src/config/api';

export default function MyReportPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLatestReport();
    }, []);

    const fetchLatestReport = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/auth/login';
                return;
            }

            const res = await fetch(`${API_URL}/api/v1/reports/latest`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Erro API:', res.status, text);
                setError(`Erro de conexão: Status ${res.status}. Tente recarregar.`);
                // Não redirecionar automaticamente para podermos ler o erro
                // if (res.status === 401) window.location.href = '/auth/login';
                return;
            }

            const data = await res.json();
            if (data.found) {
                setReport(data.report);
            } else {
                setError('Nenhum relatório encontrado. Complete a avaliação primeiro.');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao carregar relatório.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-white">Carregando análise...</div>;
    if (error) return <div className="p-8 text-white">{error}</div>;
    if (!report || !report.talkingToAnalysis) return <div className="p-8 text-white">Relatório incompleto. Contate o suporte.</div>;

    const { talkingToAnalysis } = report;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Cabeçalho */}
                <div className="text-center md:text-left border-b border-gray-700 pb-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Seu Perfil TalkingTo
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Análise profunda baseada na sua avaliação realizada em {new Date(report.completedAt).toLocaleDateString()}.
                    </p>
                </div>

                {/* Resumo do Perfil */}
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 relative z-10">
                        <span className="text-4xl">🧬</span>
                        {talkingToAnalysis.profile_summary?.archetype_name || 'Perfil Mapeado'}
                    </h2>

                    <div className="flex flex-wrap gap-3 mb-6 relative z-10">
                        {talkingToAnalysis.profile_summary?.dominant_traits?.map((t: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm font-medium border border-purple-500/30">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Grid de Dimensões */}
                <div className="grid gap-6">
                    {talkingToAnalysis.talkingto_analysis?.map((item: any, i: number) => (
                        <div key={i} className="bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                                        {item.dimension}
                                        <div className={`w-3 h-3 rounded-full ${item.classification === 'ALTO' ? 'bg-green-500' :
                                            item.classification === 'BAIXO' ? 'bg-blue-500' :
                                                'bg-yellow-500'
                                            }`}></div>
                                    </h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${item.classification === 'ALTO' ? 'bg-green-500/10 text-green-400' :
                                            item.classification === 'BAIXO' ? 'bg-blue-500/10 text-blue-400' :
                                                'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {item.classification}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {item.labels.map((l: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-700 rounded-lg text-xs text-gray-300 font-mono">
                                            {l}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-lg border-l-4 border-purple-500 mb-6 italic text-gray-300 leading-relaxed">
                                "{item.text_interpretation}"
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">❤️</div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Necessidade Primária</span>
                                        <span className="text-gray-200">{item.needs.primary}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">⚠️</div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Ponto de Atenção</span>
                                        <span className="text-gray-200">{item.needs.risk}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resumo Executivo */}
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold mb-4">Síntese Executiva</h3>
                    <p className="text-gray-300 leading-relaxed">
                        {talkingToAnalysis.executive_summary}
                    </p>
                </div>

            </div>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { ArrowLeft, Target, TrendingUp, AlertCircle, CheckCircle, User } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

export default function JobProfileAnalysisPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get(`${API_URL}/api/v1/business/job-profiles/${params.id}/analysis`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (error) {
                console.error(error);
                // alert('Erro ao carregar análise.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    if (loading) return <div className="p-12 text-center text-slate-500">Calculando compatibilidades...</div>;
    if (!data) return <div className="p-12 text-center text-red-500">Erro ao carregar dados.</div>;

    const { profile, candidates } = data;
    const idealScores = profile.idealScores;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                >
                    <ArrowLeft />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
                    <p className="text-slate-500 flex items-center gap-2">
                        <Target size={16} /> Análise de Compatibilidade (Fit)
                    </p>
                </div>
            </div>

            {/* Ranking Grid */}
            <div className="grid grid-cols-1 gap-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="text-purple-600" />
                    Ranking de Candidatos ({candidates.length})
                </h2>

                {candidates.length === 0 ? (
                    <div className="bg-slate-50 p-12 text-center rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500">Nenhum colaborador com avaliação completa encontrado.</p>
                    </div>
                ) : (
                    candidates.map((cand: any, idx: number) => {
                        // Preparar dados para o gráfico deste candidato
                        const chartData = [
                            { subject: 'Abertura', A: idealScores.O, B: cand.dimensions.O, fullMark: 100 },
                            { subject: 'Estrutura', A: idealScores.C, B: cand.dimensions.C, fullMark: 100 }, // Estrutura = Conscienciosidade
                            { subject: 'Extroversão', A: idealScores.E, B: cand.dimensions.E, fullMark: 100 },
                            { subject: 'Amabilidade', A: idealScores.A, B: cand.dimensions.A, fullMark: 100 },
                            { subject: 'Estabilidade', A: idealScores.N, B: cand.dimensions.N, fullMark: 100 },
                        ];

                        return (
                            <div key={cand.user.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${getFitColor(cand.fit)}`}></div>

                                <div className="p-6 grid md:grid-cols-[250px_1fr_300px] gap-8 items-center">

                                    {/* Coluna 1: Info e Score */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 font-bold text-xl">
                                                {cand.user.avatar ? <img src={cand.user.avatar} className="w-full h-full rounded-full" /> : <User />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">{cand.user.name}</h3>
                                                <p className="text-sm text-slate-500">{cand.user.email}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nota de Fit</span>
                                            <div className="flex items-end gap-2 mt-1">
                                                <span className={`text-4xl font-bold ${getFitTextColor(cand.fit)}`}>{cand.fit}%</span>
                                                <span className="text-sm font-medium text-slate-400 mb-2">
                                                    {cand.fit >= 80 ? 'alta compatibilidade' : cand.fit >= 50 ? 'compatibilidade média' : 'baixa compatibilidade'}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                                <div className={`h-full rounded-full ${getFitColor(cand.fit)}`} style={{ width: `${cand.fit}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna 2: Radar Comparativo */}
                                    <div className="h-[250px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                {/* Perfil Ideal (Área) */}
                                                <Radar
                                                    name="Perfil Ideal"
                                                    dataKey="A"
                                                    stroke="#a855f7"
                                                    strokeWidth={2}
                                                    fill="#a855f7"
                                                    fillOpacity={0.1}
                                                />
                                                {/* Candidato (Linha) */}
                                                <Radar
                                                    name="Candidato"
                                                    dataKey="B"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    fill="#3b82f6"
                                                    fillOpacity={0}
                                                />
                                                <Legend />
                                                <Tooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] font-bold">
                                            <span className="text-purple-500">● Ideal</span>
                                            <span className="text-blue-500">● Real</span>
                                        </div>
                                    </div>

                                    {/* Coluna 3: Insights */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <CheckCircle size={12} /> Pontos Fortes
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {cand.strengths.length > 0 ? cand.strengths.map((s: string) => (
                                                    <span key={s} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">
                                                        {translateDim(s)}
                                                    </span>
                                                )) : <span className="text-xs text-slate-400">Nenhum destaque claro</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <AlertCircle size={12} /> Pontos de Atenção (Gaps)
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {cand.gaps.length > 0 ? cand.gaps.map((g: string) => (
                                                    <span key={g} className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                                                        {translateDim(g)}
                                                    </span>
                                                )) : <span className="text-xs text-slate-400">Sem gaps críticos</span>}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function getFitColor(score: number) {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
}

function getFitTextColor(score: number) {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
}

function translateDim(dim: string) {
    const map: any = {
        'O': 'Abertura',
        'C': 'Estrutura',
        'E': 'Extroversão',
        'A': 'Amabilidade',
        'N': 'Estabilidade'
    };
    return map[dim] || dim;
}

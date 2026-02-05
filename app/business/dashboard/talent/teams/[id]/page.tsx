'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { API_URL } from '@/src/config/api';
import axios from 'axios';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const DIMENSION_LABELS: Record<string, string> = {
    O: 'Abertura',
    C: 'Conscienciosidade',
    E: 'Extroversão',
    A: 'Amabilidade',
    N: 'Estabilidade'
};

const FACET_MAP: Record<string, { label: string; facets: Record<string, string> }> = {
    O: {
        label: 'Abertura',
        facets: {
            O_F1: 'Fantasia',
            O_F2: 'Estética',
            O_F3: 'Sentimentos',
            O_F4: 'Ações',
            O_F5: 'Ideias',
            O_F6: 'Valores'
        }
    },
    C: {
        label: 'Conscienciosidade',
        facets: {
            C_F1: 'Competência',
            C_F2: 'Ordem',
            C_F3: 'Senso de Dever',
            C_F4: 'Esforço',
            C_F5: 'Autodisciplina',
            C_F6: 'Ponderação'
        }
    },
    E: {
        label: 'Extroversão',
        facets: {
            E_F1: 'Cordialidade',
            E_F2: 'Gregariedade',
            E_F3: 'Assertividade',
            E_F4: 'Atividade',
            E_F5: 'Busca de Sensações',
            E_F6: 'Emoções Positivas'
        }
    },
    A: {
        label: 'Amabilidade',
        facets: {
            A_F1: 'Confiança',
            A_F2: 'Franqueza',
            A_F3: 'Altruísmo',
            A_F4: 'Complacência',
            A_F5: 'Modéstia',
            A_F6: 'Sensibilidade'
        }
    },
    N: {
        label: 'Estabilidade',
        facets: {
            N_F1: 'Ansiedade',
            N_F2: 'Hostilidade',
            N_F3: 'Depressão',
            N_F4: 'Embaraço',
            N_F5: 'Impulsividade',
            N_F6: 'Vulnerabilidade'
        }
    }
};

export default function TeamAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadAnalysis();
    }, [params.id]);

    const loadAnalysis = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/business/team/${params.id}/analysis`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error('Failed to load team analysis:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDimension = (dim: string) => {
        setExpandedDimensions(prev => {
            const next = new Set(prev);
            if (next.has(dim)) {
                next.delete(dim);
            } else {
                next.add(dim);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Analisando equipe...</p>
                </div>
            </div>
        );
    }

    if (!data || !data.stats) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertTriangle className="w-20 h-20 text-purple-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Dados Insuficientes</h2>
                    <p className="text-slate-600 mb-6">Esta equipe não possui membros com avaliações completas.</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-200"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    const { team, members, stats } = data;
    const radarData = ['O', 'C', 'E', 'A', 'N'].map(dim => ({
        dimension: DIMENSION_LABELS[dim],
        value: stats.avgScores[dim] || 0
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-100 p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-purple-600 font-bold mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Voltar
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-6xl font-black text-slate-900 leading-none mb-2 tracking-tight">
                            {team.name}
                        </h1>
                        <div className="h-2 w-32 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full mb-4"></div>
                        {team.description && (
                            <p className="text-slate-600 text-lg max-w-2xl">{team.description}</p>
                        )}
                    </div>

                    <div className="text-right">
                        <div className="text-5xl font-black text-purple-600">{stats.count}</div>
                        <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">Membros Avaliados</div>
                    </div>
                </div>
            </div>

            {/* Main Grid - Assimétrico */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda - Radar + Diversidade */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Radar Chart */}
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-lg hover:border-purple-200 transition-all">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                            Persona da Equipe
                        </h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#cbd5e1" />
                                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#1e293b', fontWeight: 'bold' }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b' }} />
                                <Radar
                                    name="Média do Time"
                                    dataKey="value"
                                    stroke="#9333ea"
                                    fill="#9333ea"
                                    fillOpacity={0.3}
                                    strokeWidth={3}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '2px solid #9333ea',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontWeight: 'bold'
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Breakdown de Facetas */}
                    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                            Análise Granular (30 Facetas)
                        </h2>
                        <div className="space-y-4">
                            {['O', 'C', 'E', 'A', 'N'].map(dim => (
                                <DimensionBreakdown
                                    key={dim}
                                    dimension={dim}
                                    label={DIMENSION_LABELS[dim]}
                                    score={stats.avgScores[dim] || 0}
                                    facets={FACET_MAP[dim].facets}
                                    facetScores={stats.avgScores}
                                    expanded={expandedDimensions.has(dim)}
                                    onToggle={() => toggleDimension(dim)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Coluna Direita - Insights */}
                <div className="space-y-8">
                    {/* Diversidade */}
                    <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl border border-purple-700 p-6 text-white shadow-lg hover:shadow-purple-200 transition-all">
                        <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">
                            Score de Diversidade
                        </div>
                        <div className="text-5xl font-black mb-2">{stats.diversityScore}</div>
                        <div className="text-sm font-medium opacity-90">
                            {stats.highDiversity
                                ? '🌈 Time Heterogêneo (Alta Diversidade Cognitiva)'
                                : '🎯 Time Homogêneo (Perfis Similares)'}
                        </div>
                    </div>

                    {/* Traços Dominantes */}
                    {stats.dominantTraits && stats.dominantTraits.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                Traços Dominantes
                            </h3>
                            <div className="space-y-2">
                                {stats.dominantTraits.map((trait: string) => (
                                    <div key={trait} className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-bold text-slate-900">
                                            {DIMENSION_LABELS[trait]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lista de Membros */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                            Membros ({members.length})
                        </h3>
                        <div className="space-y-3">
                            {members.map((m: any) => (
                                <div key={m.user.id} className="border-l-4 border-purple-600 pl-3 py-2 bg-purple-50/50 rounded-r">
                                    <p className="font-bold text-slate-900">{m.user.name}</p>
                                    <p className="text-sm text-slate-500">
                                        {m.hasData ? '✅ Avaliado' : '⏳ Sem avaliação'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


interface DimensionBreakdownProps {
    dimension: string;
    label: string;
    score: number;
    facets: Record<string, string>;
    facetScores: Record<string, number>;
    expanded: boolean;
    onToggle: () => void;
}

function DimensionBreakdown({ dimension, label, score, facets, facetScores, expanded, onToggle }: DimensionBreakdownProps) {
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden hover:border-purple-200 transition-colors">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center rounded-lg shadow-sm">
                        <span className="text-white font-black text-xl">{dimension}</span>
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-slate-900">{label}</div>
                        <div className="text-sm text-slate-500">Média: {score}</div>
                    </div>
                </div>
                {expanded ? <ChevronUp className="w-5 h-5 text-purple-600" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {expanded && (
                <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-2">
                    {(Object.entries(facets) as [string, string][]).map(([code, name]) => {
                        const facetScore = facetScores[code] || 0;
                        return (
                            <div key={code} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">{name}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all"
                                            style={{ width: `${facetScore}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 w-8 text-right">{facetScore}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


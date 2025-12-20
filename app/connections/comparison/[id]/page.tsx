'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/auth-store';
import { API_URL } from '@/src/config/api';
import { BigFiveChart } from '@/src/components/dashboard/big-five-chart';
import { ArrowLeft, TrendingUp, Users, Sparkles, BarChart3 } from 'lucide-react';

interface ComparisonData {
    user1: {
        name: string;
        email: string;
        scores: Record<string, number>;
    };
    user2: {
        name: string;
        email: string;
        scores: Record<string, number>;
    };
    insights: {
        compatibility: number;
        strengths: string[];
        differences: Array<{
            trait: string;
            difference: number;
            interpretation: string;
        }>;
    };
}

export default function ComparisonPage() {
    const params = useParams();
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const [data, setData] = useState<ComparisonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token || !params.id) return;

        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/comparison/radar/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Erro ao carregar comparação');

                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Carregando comparação...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h2>
                    <p className="text-gray-600 mb-6">{error || 'Erro ao carregar dados'}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    const compatibilityColor =
        data.insights.compatibility >= 80 ? 'from-green-500 to-emerald-600' :
            data.insights.compatibility >= 60 ? 'from-blue-500 to-cyan-600' :
                data.insights.compatibility >= 40 ? 'from-yellow-500 to-orange-600' :
                    'from-red-500 to-pink-600';

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Voltar</span>
                    </button>

                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Análise Comparativa de Perfis
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-6">
                            <div className="flex items-center gap-3 bg-purple-50 rounded-xl px-4 py-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {data.user1.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{data.user1.name}</p>
                                    <p className="text-sm text-gray-500">{data.user1.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center px-4">
                                <div className="text-3xl">⚡</div>
                            </div>

                            <div className="flex items-center gap-3 bg-pink-50 rounded-xl px-4 py-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {data.user2.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{data.user2.name}</p>
                                    <p className="text-sm text-gray-500">{data.user2.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compatibility Score */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 h-full">
                            <div className="flex items-center gap-2 mb-6">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                <h2 className="text-xl font-bold text-gray-900">Compatibilidade</h2>
                            </div>

                            <div className="relative">
                                <div className="w-40 h-40 mx-auto">
                                    <svg className="transform -rotate-90 w-40 h-40">
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="#e5e7eb"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="70"
                                            stroke="url(#gradient)"
                                            strokeWidth="12"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 70}`}
                                            strokeDashoffset={`${2 * Math.PI * 70 * (1 - data.insights.compatibility / 100)}`}
                                            className="transition-all duration-1000 ease-out"
                                            strokeLinecap="round"
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" className="text-purple-500" stopColor="currentColor" />
                                                <stop offset="100%" className="text-pink-500" stopColor="currentColor" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className={`text-5xl font-bold bg-gradient-to-r ${compatibilityColor} bg-clip-text text-transparent`}>
                                                {data.insights.compatibility}%
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">Compatível</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {data.insights.strengths.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Pontos Fortes
                                    </h3>
                                    <div className="space-y-2">
                                        {data.insights.strengths.map((strength, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm">
                                                <span className="text-green-500 mt-0.5">✓</span>
                                                <span className="text-gray-700">{strength}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                            <div className="flex items-center gap-2 mb-6">
                                <BarChart3 className="w-5 h-5 text-purple-600" />
                                <h2 className="text-xl font-bold text-gray-900">Radar de Personalidade</h2>
                            </div>

                            {/* Preparar dados para o radar chart */}
                            {(() => {
                                const combinedScores: Record<string, number> = {};

                                // Adicionar scores do user1
                                Object.entries(data.user1.scores).forEach(([key, value]) => {
                                    combinedScores[key] = typeof value === 'number' ? value : 0;
                                });

                                return <BigFiveChart scores={combinedScores} comparisonScores={data.user2.scores} />;
                            })()}
                        </div>
                    </div>
                </div>

                {/* Differences Table */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Análise Detalhada por Traço</h2>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Traço</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Diferença</th>
                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Interpretação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.insights.differences.map((diff, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                                        <td className="py-4 px-4 font-medium text-gray-900">{diff.trait}</td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="inline-flex items-center gap-2">
                                                <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${diff.difference < 1 ? 'from-green-400 to-green-600' :
                                                                diff.difference < 2 ? 'from-yellow-400 to-yellow-600' :
                                                                    'from-red-400 to-red-600'
                                                            }`}
                                                        style={{ width: `${Math.min(100, (diff.difference / 5) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-mono text-gray-600 w-12">
                                                    {diff.difference.toFixed(1)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${diff.difference < 1 ? 'bg-green-100 text-green-700' :
                                                    diff.difference < 2 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {diff.interpretation}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

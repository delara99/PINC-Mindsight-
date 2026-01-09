'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { API_URL } from '../../../../src/config/api';
import { useAuthStore } from '../../../../src/store/auth-store';

interface Need {
    id: string;
    code: string;
    name: string;
    clientTitle: string;
    clientDescription: string;
    clientImpact: string;
    specialistTitle: string;
    specialistDescription: string;
    specialistAnalysis: string;
    favorableEnvironments: string;
    unfavorableEnvironments: string;
    recommendations: string;
    active: boolean;
}

export default function PsychologicalNeedsPage() {
    const router = useRouter();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (token) loadNeeds();
    }, [token]);

    const loadNeeds = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/interpretation/needs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNeeds(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar necessidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const parseJsonArray = (jsonString: string): string[] => {
        try {
            const parsed = JSON.parse(jsonString);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando necessidades...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Necessidades Psicológicas
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Gerencie as necessidades identificadas a partir dos padrões
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        onClick={() => router.push('/dashboard/metrics-config')}
                        className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        ← Voltar
                    </button>
                </div>
            </div>

            {/* Needs Grid */}
            {needs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma necessidade encontrada</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Execute a migração para popular as necessidades iniciais
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {needs.map((need) => (
                        <div
                            key={need.id}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => setSelectedNeed(need)}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {need.name}
                                    </h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${need.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {need.active ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>

                                <p className="text-sm font-mono text-gray-500 mb-3">
                                    {need.code}
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">
                                            Para Cliente:
                                        </h4>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {need.clientDescription}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">
                                            Ambientes Favoráveis:
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {parseJsonArray(need.favorableEnvironments).slice(0, 2).map((env, idx) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                                                    {env}
                                                </span>
                                            ))}
                                            {parseJsonArray(need.favorableEnvironments).length > 2 && (
                                                <span className="text-xs text-gray-500">
                                                    +{parseJsonArray(need.favorableEnvironments).length - 2} mais
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedNeed(need);
                                    }}
                                    className="mt-4 w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                >
                                    Ver Detalhes →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedNeed && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedNeed.name}
                                </h2>
                                <button
                                    onClick={() => setSelectedNeed(null)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="mt-1 text-sm font-mono text-gray-500">{selectedNeed.code}</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Cliente Section */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                                    📱 Versão para Cliente
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-800">Título:</h4>
                                        <p className="text-sm text-blue-700">{selectedNeed.clientTitle}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-800">Descrição:</h4>
                                        <p className="text-sm text-blue-700">{selectedNeed.clientDescription}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-800">Impacto:</h4>
                                        <p className="text-sm text-blue-700">{selectedNeed.clientImpact}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Specialist Section */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-purple-900 mb-3">
                                    🎓 Versão para Especialista
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-purple-800">Título:</h4>
                                        <p className="text-sm text-purple-700">{selectedNeed.specialistTitle}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-purple-800">Descrição:</h4>
                                        <p className="text-sm text-purple-700">{selectedNeed.specialistDescription}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-purple-800">Análise:</h4>
                                        <p className="text-sm text-purple-700">{selectedNeed.specialistAnalysis}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Environments */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-green-900 mb-2">
                                        ✅ Ambientes Favoráveis
                                    </h4>
                                    <ul className="space-y-1">
                                        {parseJsonArray(selectedNeed.favorableEnvironments).map((env, idx) => (
                                            <li key={idx} className="text-sm text-green-700 flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{env}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-red-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-red-900 mb-2">
                                        ❌ Ambientes Desfavoráveis
                                    </h4>
                                    <ul className="space-y-1">
                                        {parseJsonArray(selectedNeed.unfavorableEnvironments).map((env, idx) => (
                                            <li key={idx} className="text-sm text-red-700 flex items-start">
                                                <span className="mr-2">•</span>
                                                <span>{env}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-yellow-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                                    💡 Recomendações
                                </h4>
                                <ul className="space-y-1">
                                    {parseJsonArray(selectedNeed.recommendations).map((rec, idx) => (
                                        <li key={idx} className="text-sm text-yellow-700 flex items-start">
                                            <span className="mr-2">•</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

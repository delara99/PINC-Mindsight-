'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/store/auth-store';
import { useRouter } from 'next/navigation';
import { Settings, Plus, Check, Edit, TrendingUp, Loader2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { API_URL } from '../../../src/config/api';

interface BigFiveConfig {
    id: string;
    name: string;
    isActive: boolean;
    veryLowMax: number;
    lowMax: number;
    averageMax: number;
    highMax: number;
    primaryColor: string;
    createdAt: string;
    _count?: { traits: number };
}

export default function MetricsConfigPage() {
    const { token } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: configs, isLoading } = useQuery<BigFiveConfig[]>({
        queryKey: ['big-five-configs'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar configurações');
            return response.json();
        }
    });

    const activateMutation = useMutation({
        mutationFn: async (configId: string) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/${configId}/activate`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Erro ao ativar configuração');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['big-five-configs'] });
            alert('Configuração ativada com sucesso!');
        }
    });

    const activeConfig = configs?.find(c => c.isActive);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-primary" size={32} />
                        <h1 className="text-3xl font-bold text-gray-900">Métricas de Avaliação Big Five</h1>
                    </div>

                </div>
                <p className="text-gray-600">
                    Configure pesos, interpretações, descrições e recomendações do sistema Big Five
                </p>
            </div>

            {/* Active Config Summary */}
            {activeConfig && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary p-6 rounded-lg mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Check className="text-primary" size={20} />
                                <h2 className="text-xl font-bold text-gray-900">Configuração Ativa</h2>
                            </div>
                            <p className="text-gray-700 font-medium mb-3">{activeConfig.name}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Muito Baixo</p>
                                    <p className="font-bold text-gray-900">0-{activeConfig.veryLowMax}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Baixo</p>
                                    <p className="font-bold text-gray-900">{activeConfig.veryLowMax + 1}-{activeConfig.lowMax}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Médio</p>
                                    <p className="font-bold text-gray-900">{activeConfig.lowMax + 1}-{activeConfig.averageMax}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Alto</p>
                                    <p className="font-bold text-gray-900">{activeConfig.averageMax + 1}-{activeConfig.highMax}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push(`/dashboard/metrics-config/${activeConfig.id}`)}
                            className="bg-white hover:bg-gray-50 text-primary px-4 py-2 rounded-lg border border-primary transition-colors flex items-center gap-2"
                        >
                            <Edit size={18} />
                            Editar
                        </button>
                    </div>
                </div>
            )}

            {/* Configurations List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Todas as Configurações</h3>
                    <button
                        onClick={() => router.push('/dashboard/metrics-config/new')}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nova Configuração
                    </button>
                </div>

                <div className="divide-y divide-gray-200">
                    {configs && configs.length > 0 ? (
                        configs.map(config => (
                            <div key={config.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-semibold text-gray-900">{config.name}</h4>
                                            {config.isActive && (
                                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                    <Check size={14} />
                                                    ATIVA
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-6 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Settings size={16} />
                                                <span>Faixas: {config.veryLowMax}, {config.lowMax}, {config.averageMax}, {config.highMax}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full border border-gray-300"
                                                    style={{ backgroundColor: config.primaryColor }}
                                                />
                                                <span>{config.primaryColor}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {!config.isActive && (
                                            <button
                                                onClick={() => activateMutation.mutate(config.id)}
                                                disabled={activateMutation.isPending}
                                                className="text-primary hover:text-primary/80 font-medium px-4 py-2 rounded-lg border border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                                            >
                                                Ativar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.push(`/dashboard/metrics-config/${config.id}`)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Edit size={18} />
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Settings className="mx-auto mb-4 text-gray-300" size={64} />
                            <p className="text-lg font-medium mb-2">Nenhuma configuração encontrada</p>
                            <p className="text-sm">Crie sua primeira configuração de métricas Big Five</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ⭐ NOVA SEÇÃO: Camada Interpretativa Avançada */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <Wrench className="text-purple-600" size={24} />
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Camada Interpretativa Avançada</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Gerencie padrões, necessidades psicológicas e seções customizadas
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {/* Padrões */}
                    <button
                        onClick={() => router.push('/dashboard/metrics-config/interpretation-patterns')}
                        className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-6 rounded-lg transition-all border border-blue-200 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500 text-white rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">Padrões Interpretativos</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            Configure combinações de scores que identificam perfis específicos
                        </p>
                    </button>

                    {/* Necessidades */}
                    <button
                        onClick={() => router.push('/dashboard/metrics-config/psychological-needs')}
                        className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-6 rounded-lg transition-all border border-purple-200 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-500 text-white rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-700">Necessidades Psicológicas</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            Gerenci necessidades identificadas a partir dos padrões
                        </p>
                    </button>

                    {/* Seções */}
                    <button
                        onClick={() => router.push('/dashboard/metrics-config/interpretation-sections')}
                        className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 p-6 rounded-lg transition-all border border-green-200 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-500 text-white rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-green-700">Seções Interpretativas</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            Templates de seções customizadas para relatórios (Em breve)
                        </p>
                    </button>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-indigo-50 border-t border-indigo-100">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-indigo-900">
                                Camada Interpretativa Avançada
                            </p>
                            <p className="text-sm text-indigo-700 mt-1">
                                Esta funcionalidade adiciona análise de padrões comportamentais e necessidades psicológicas aos relatórios,
                                sem alterar o Big Five tradicional. Pode ser ativada/desativada via variável de ambiente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
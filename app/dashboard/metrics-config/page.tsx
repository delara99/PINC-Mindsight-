'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useRouter } from 'next/navigation';
import { Settings, Plus, Check, Edit, TrendingUp, Loader2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { API_URL } from '@/src/config/api';

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

    const fixAllFacetsMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/fix-all-facets`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Erro ao corrigir facetas');
            }
            return response.json();
        },
        onSuccess: (data) => {
            alert(`✅ FACETAS CORRIGIDAS!\n\n${data.message}\n\nRecarregue qualquer inventário aberto para ver as mudanças.`);
            queryClient.invalidateQueries({ queryKey: ['big-five-configs'] });
        },
        onError: (err: any) => alert('❌ ' + err.message)
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
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-primary" size={32} />
                        <h1 className="text-3xl font-bold text-gray-900">Métricas de Avaliação Big Five</h1>
                    </div>
                    <button
                        onClick={() => fixAllFacetsMutation.mutate()}
                        disabled={fixAllFacetsMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 animate-pulse"
                    >
                        {fixAllFacetsMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Wrench size={20} />}
                        CORRIGIR FACETAS AGORA
                    </button>
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
        </div>
    );
}
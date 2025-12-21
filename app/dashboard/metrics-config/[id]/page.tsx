'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../src/store/auth-store';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Save, TrendingUp, Settings, FileText, Lightbulb, Palette, Check } from 'lucide-react';
import { API_URL } from '../../../../src/config/api';

// Tabs componentes
import RangesEditor from './components/RangesEditor';
import TraitsEditor from './components/TraitsEditor';
import RecommendationsEditor from './components/RecommendationsEditor';
import BrandingEditor from './components/BrandingEditor';
import QuestionsEditor from './components/QuestionsEditor';

type TabType = 'ranges' | 'traits' | 'recommendations' | 'branding' | 'questions';

export default function MetricsConfigEditorPage() {
    const { token } = useAuthStore();
    const router = useRouter();
    const params = useParams();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('ranges');
    const [newConfigName, setNewConfigName] = useState('');

    const configId = params.id as string;
    const isNew = configId === 'new';

    const { data: config, isLoading } = useQuery({
        queryKey: ['big-five-config', configId],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/${configId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar configuração');
            return response.json();
        },
        enabled: !isNew
    });

    const createMutation = useMutation({
        mutationFn: async (name: string) => {
            // 1. Criar configuração
            const createResponse = await fetch(`${API_URL}/api/v1/big-five-config`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });

            if (!createResponse.ok) {
                throw new Error('Erro ao criar configuração');
            }

            const newConfig = await createResponse.json();

            // 2. Automaticamente popular com traços da config ativa
            const populateResponse = await fetch(`${API_URL}/api/v1/big-five-config/${newConfig.id}/populate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!populateResponse.ok) {
                console.warn('Falha ao popular traços automaticamente');
            }

            return newConfig;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['big-five-configs'] });
            router.push(`/dashboard/metrics-config/${data.id}`);
        }
    });

    const tabs = [
        { id: 'ranges' as TabType, label: 'Interpretação de Scores', icon: TrendingUp },
        { id: 'questions' as TabType, label: 'Parametrização Perguntas', icon: FileText },
        { id: 'traits' as TabType, label: 'Traços e Facetas', icon: Settings },
        { id: 'recommendations' as TabType, label: 'Recomendações', icon: Lightbulb },
        { id: 'branding' as TabType, label: 'Branding', icon: Palette }
    ];

    if (isLoading && !isNew) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Form para criar nova configuração
    if (isNew) {
        return (
            <div className="max-w-3xl mx-auto p-8">
                <button
                    onClick={() => router.push('/dashboard/metrics-config')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Voltar para Configurações
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Nova Configuração</h1>
                    <p className="text-gray-600 mb-8">
                        Crie uma nova configuração de métricas Big Five. Após criar, você poderá editar ranges, traços, facetas e branding.
                    </p>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome da Configuração
                            </label>
                            <input
                                type="text"
                                value={newConfigName}
                                onChange={(e) => setNewConfigName(e.target.value)}
                                placeholder="Ex: Configuração Personalizada"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-lg"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Este nome ajudará a identificar a configuração na lista
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-bold text-blue-900 mb-2">ℹ️ O que será criado?</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Configuração com valores padrão (faixas: 20, 40, 60, 80)</li>
                                <li>• Cor primária padrão (#d11c9e)</li>
                                <li>• Você poderá editar todos os parâmetros depois</li>
                            </ul>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                onClick={() => router.push('/dashboard/metrics-config')}
                                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (!newConfigName.trim()) {
                                        alert('Digite um nome para a configuração');
                                        return;
                                    }
                                    createMutation.mutate(newConfigName);
                                }}
                                disabled={createMutation.isPending || !newConfigName.trim()}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={20} />
                                {createMutation.isPending ? 'Criando...' : 'Criar Configuração'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push('/dashboard/metrics-config')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Voltar para Configurações
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {config?.name || 'Configuração'}
                        </h1>
                        {config?.isActive && (
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                                <Check size={14} />
                                Configuração Ativa
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === tab.id
                                        ? 'border-primary text-primary bg-primary/5'
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {activeTab === 'ranges' && <RangesEditor config={config} configId={configId} />}
                    {activeTab === 'questions' && <QuestionsEditor />}
                    {activeTab === 'traits' && <TraitsEditor config={config} configId={configId} />}
                    {activeTab === 'recommendations' && <RecommendationsEditor config={config} configId={configId} />}
                    {activeTab === 'branding' && <BrandingEditor config={config} configId={configId} />}
                </div>
            </div>
        </div>
    );
}
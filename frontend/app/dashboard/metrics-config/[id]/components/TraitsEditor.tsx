'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { ChevronDown, ChevronUp, Save, Edit2, AlertCircle, RefreshCw } from 'lucide-react';

interface TraitsEditorProps {
    config: any;
    configId: string;
}

export default function TraitsEditor({ config, configId }: TraitsEditorProps) {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [expandedTrait, setExpandedTrait] = useState<string | null>(null);
    const [editingTrait, setEditingTrait] = useState<any>(null);

    const updateTraitMutation = useMutation({
        mutationFn: async ({ traitId, data }: any) => {
            const response = await fetch(`http://localhost:3000/api/v1/big-five-config/traits/${traitId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erro ao atualizar traço');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['big-five-config', configId] });
            setEditingTrait(null);
            alert('Traço atualizado com sucesso!');
        }
    });

    const populateMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`http://localhost:3000/api/v1/big-five-config/${configId}/populate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Erro ao popular traços' }));
                throw new Error(error.message || 'Erro ao popular traços');
            }

            return response.json();
        },
        onSuccess: async () => {
            // Invalidar E AGUARDAR refetch para garantir atualização
            await queryClient.invalidateQueries({ queryKey: ['big-five-config', configId] });
            await queryClient.refetchQueries({ queryKey: ['big-five-config', configId] });
            alert('✅ Traços e facetas copiados com sucesso!');
        },
        onError: (error: Error) => {
            alert(`❌ Erro: ${error.message}`);
        }
    });

    const handleSaveTrait = () => {
        if (!editingTrait) return;
        updateTraitMutation.mutate({
            traitId: editingTrait.id,
            data: {
                name: editingTrait.name,
                icon: editingTrait.icon,
                weight: editingTrait.weight,
                description: editingTrait.description,
                veryLowText: editingTrait.veryLowText,
                lowText: editingTrait.lowText,
                averageText: editingTrait.averageText,
                highText: editingTrait.highText,
                veryHighText: editingTrait.veryHighText
            }
        });
    };

    // Se não tem traços, mostrar opção de popular
    if (!config?.traits || config.traits.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="mx-auto mb-4 text-yellow-500" size={64} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum traço configurado</h3>
                <p className="text-gray-600 mb-2">
                    Esta configuração não possui traços.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Normalmente isso acontece se a criação automática falhou.<br />
                    Use o botão abaixo para copiar os traços da configuração ativa.
                </p>
                <button
                    onClick={() => populateMutation.mutate()}
                    disabled={populateMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw size={20} className={populateMutation.isPending ? 'animate-spin' : ''} />
                    {populateMutation.isPending ? 'Copiando...' : 'Copiar Traços da Configuração Ativa'}
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Traços e Facetas</h3>
                <p className="text-gray-600">
                    Configure os 5 traços principais, seus pesos e descrições para cada faixa de score
                </p>
            </div>

            <div className="space-y-4">
                {config.traits.map((trait: any) => (
                    <div key={trait.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Trait Header */}
                        <button
                            onClick={() => setExpandedTrait(expandedTrait === trait.id ? null : trait.id)}
                            className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{trait.icon}</span>
                                <div className="text-left">
                                    <h4 className="font-bold text-gray-900">{trait.name}</h4>
                                    <p className="text-sm text-gray-600">
                                        Peso: {trait.weight} | {trait.facets?.length || 0} facetas
                                    </p>
                                </div>
                            </div>
                            {expandedTrait === trait.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {/* Trait Details */}
                        {expandedTrait === trait.id && (
                            <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
                                {editingTrait?.id === trait.id ? (
                                    /* Edit Mode */
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                                            <input
                                                type="text"
                                                value={editingTrait.name}
                                                onChange={(e) => setEditingTrait({ ...editingTrait, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
                                                <input
                                                    type="text"
                                                    value={editingTrait.icon}
                                                    onChange={(e) => setEditingTrait({ ...editingTrait, icon: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Peso</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={editingTrait.weight}
                                                    onChange={(e) => setEditingTrait({ ...editingTrait, weight: parseFloat(e.target.value) })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Geral</label>
                                            <textarea
                                                value={editingTrait.description}
                                                onChange={(e) => setEditingTrait({ ...editingTrait, description: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <h5 className="font-bold text-gray-900">Descrições por Faixa</h5>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Muito Baixo</label>
                                                <textarea
                                                    value={editingTrait.veryLowText}
                                                    onChange={(e) => setEditingTrait({ ...editingTrait, veryLowText: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Baixo</label>
                                                <textarea
                                                    value={editingTrait.lowText}
                                                    onChange={(e) => setEditingTrait({ ...editingTrait, lowText: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Médio</label>
                                                <textarea
                                                    value={editingTrait.averageText}
                                                    onChange={(e) => setEditingTrait({ ...editingTrait, averageText: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Alto</label>
                                                <textarea
                                                    value={editingTrait.highText}
                                                    onChange={(e) => setEditingTrait({ ...editingTrait, highText: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Muito Alto</label>
                                                <textarea
                                                    value={editingTrait.veryHighText}
                                                    onChange={(e) => setEditingTrait({ ...editingTrait, veryHighText: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={() => setEditingTrait(null)}
                                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveTrait}
                                                disabled={updateTraitMutation.isPending}
                                                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <Save size={18} />
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <div>
                                        <div className="flex justify-end mb-4">
                                            <button
                                                onClick={() => setEditingTrait(trait)}
                                                className="text-primary hover:text-primary/80 flex items-center gap-2"
                                            >
                                                <Edit2 size={16} />
                                                Editar
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h5 className="font-medium text-gray-700 mb-1">Descrição</h5>
                                                <p className="text-gray-600">{trait.description}</p>
                                            </div>

                                            <div>
                                                <h5 className="font-medium text-gray-700 mb-2">Facetas ({trait.facets?.length || 0})</h5>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {trait.facets?.map((facet: any) => (
                                                        <div key={facet.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                                            <p className="font-medium text-gray-900">{facet.name}</p>
                                                            <p className="text-sm text-gray-600">Peso: {facet.weight}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

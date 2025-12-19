'use client';
import { API_URL } from '@/src/config/api';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { ChevronDown, ChevronUp, Save, Edit2, AlertCircle, RefreshCw, Plus, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface TraitsEditorProps {
    config: any;
    configId: string;
}

export default function TraitsEditor({ config, configId }: TraitsEditorProps) {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [expandedTrait, setExpandedTrait] = useState<string | null>(null);
    const [editingTrait, setEditingTrait] = useState<any>(null);
    const [isCreatingTrait, setIsCreatingTrait] = useState(false);
    const [newTraitData, setNewTraitData] = useState({ name: '', traitKey: '', weight: 1.0 });
    const [creatingFacetForTrait, setCreatingFacetForTrait] = useState<string | null>(null);
    const [newFacetData, setNewFacetData] = useState({ name: '', facetKey: '', weight: 1.0 });

    const createTraitMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/${configId}/traits`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erro ao criar traço');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['big-five-config', configId] });
            setIsCreatingTrait(false);
            setNewTraitData({ name: '', traitKey: '', weight: 1.0 });
            alert('Traço criado com sucesso!');
        }
    });

    const createFacetMutation = useMutation({
        mutationFn: async ({ traitId, data }: any) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/traits/${traitId}/facets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erro ao criar faceta');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['big-five-config', configId] });
            setCreatingFacetForTrait(null);
            setNewFacetData({ name: '', facetKey: '', weight: 1.0 });
            alert('Faceta criada com sucesso!');
        }
    });

    const updateTraitMutation = useMutation({
        mutationFn: async ({ traitId, data }: any) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/traits/${traitId}`, {
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
            const response = await fetch(`${API_URL}/api/v1/big-five-config/${configId}/populate`, {
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Traços e Facetas</h3>
                    <p className="text-gray-600">
                        Configure os traços, pesos e facetas. O sistema utilizará fielmente estes parâmetros.
                    </p>
                </div>
                {!isCreatingTrait && (
                    <button
                        onClick={() => setIsCreatingTrait(true)}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Novo Traço
                    </button>
                )}
            </div>

            {/* Form de Criação de Traço */}
            {isCreatingTrait && (
                <div className="bg-gray-50 border border-primary/20 rounded-lg p-6 mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-900">Novo Traço</h4>
                        <button onClick={() => setIsCreatingTrait(false)} className="text-gray-500 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Exibição</label>
                            <input
                                type="text"
                                value={newTraitData.name}
                                onChange={e => setNewTraitData({ ...newTraitData, name: e.target.value, traitKey: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                placeholder="Ex: Inovação"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chave Única (Sistema)</label>
                            <input
                                type="text"
                                value={newTraitData.traitKey}
                                onChange={e => setNewTraitData({ ...newTraitData, traitKey: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary bg-gray-100"
                                placeholder="Ex: Inovacao"
                            />
                            <p className="text-xs text-gray-500 mt-1">Deve corresponder à 'traitKey' nas perguntas.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
                            <input
                                type="number"
                                step="0.1"
                                value={newTraitData.weight}
                                onChange={e => setNewTraitData({ ...newTraitData, weight: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => createTraitMutation.mutate(newTraitData)}
                            disabled={createTraitMutation.isPending || !newTraitData.name}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            Salvar Traço
                        </button>
                    </div>
                </div>
            )}

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
                                    /* Edit Mode - Mantido igual ao original (truncado para brevidade se necessario, mas vou tentar manter) */
                                    <div className="space-y-6">
                                        {/* ...Formulário de Edição existente... */}
                                        {/* Vou reincluir o form de edição para não perder funcionalidade */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                                            <input
                                                type="text"
                                                value={editingTrait.name}
                                                onChange={(e) => setEditingTrait({ ...editingTrait, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <input
                                                type="checkbox"
                                                id="trait-active"
                                                checked={editingTrait.isActive !== false}
                                                onChange={(e) => setEditingTrait({ ...editingTrait, isActive: e.target.checked })}
                                                className="w-5 h-5 text-primary rounded focus:ring-primary"
                                            />
                                            <label htmlFor="trait-active" className="text-sm font-bold text-gray-700 cursor-pointer">
                                                Traço Ativo?
                                            </label>
                                            <span className="text-xs text-gray-500 ml-2">Desativar remove este traço dos cálculos e relatórios.</span>
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

                                        <div className="flex gap-3 justify-end mt-4">
                                            <button onClick={() => setEditingTrait(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Cancelar</button>
                                            <button onClick={handleSaveTrait} className="bg-primary text-white px-4 py-2 rounded-lg">Salvar</button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode */
                                    <div>
                                        <div className="flex justify-end mb-4 gap-2">
                                            <button
                                                onClick={() => setEditingTrait(trait)}
                                                className="text-primary hover:text-primary/80 flex items-center gap-2 px-3 py-1 hover:bg-primary/5 rounded"
                                            >
                                                <Edit2 size={16} /> Editar Traço
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h5 className="font-medium text-gray-700 mb-1">Descrição</h5>
                                                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{trait.description}</p>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-gray-700 mb-1">Ícone e Peso</h5>
                                                    <p className="text-gray-600 text-sm">Ícone: {trait.icon} • Peso: {trait.weight}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <h5 className="font-medium text-gray-700">Facetas ({trait.facets?.length || 0})</h5>
                                                    <button
                                                        onClick={() => setCreatingFacetForTrait(trait.id)}
                                                        className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                                                    >
                                                        <Plus size={14} /> Adicionar Faceta
                                                    </button>
                                                </div>

                                                {/* Form Criar Faceta */}
                                                {creatingFacetForTrait === trait.id && (
                                                    <div className="bg-white p-4 rounded-lg border border-primary/20 mb-3 animate-in fade-in">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="font-bold text-sm">Nova Faceta</span>
                                                            <button onClick={() => setCreatingFacetForTrait(null)}><X size={16} /></button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                                            <input
                                                                placeholder="Nome"
                                                                className="border p-2 rounded text-sm is-full"
                                                                value={newFacetData.name}
                                                                onChange={e => setNewFacetData({ ...newFacetData, name: e.target.value, facetKey: e.target.value })}
                                                            />
                                                            <input
                                                                placeholder="Chave (Key)"
                                                                className="border p-2 rounded text-sm w-full bg-gray-50"
                                                                value={newFacetData.facetKey}
                                                                onChange={e => setNewFacetData({ ...newFacetData, facetKey: e.target.value })}
                                                            />
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="Peso"
                                                                className="border p-2 rounded text-sm w-full"
                                                                value={newFacetData.weight}
                                                                onChange={e => setNewFacetData({ ...newFacetData, weight: parseFloat(e.target.value) })}
                                                            />
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() => createFacetMutation.mutate({ traitId: trait.id, data: newFacetData })}
                                                                disabled={createFacetMutation.isPending || !newFacetData.name}
                                                                className="bg-primary text-white text-sm px-3 py-1.5 rounded disabled:opacity-50"
                                                            >
                                                                Salvar Faceta
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {trait.facets?.map((facet: any) => (
                                                        <div key={facet.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-primary/30 transition-colors">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{facet.name}</p>
                                                                    <p className="text-xs text-gray-500 font-mono">Key: {facet.facetKey}</p>
                                                                </div>
                                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Peso: {facet.weight}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!trait.facets || trait.facets.length === 0) && !creatingFacetForTrait && (
                                                        <p className="text-gray-400 text-sm col-span-2 italic">Nenhuma faceta configurada.</p>
                                                    )}
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

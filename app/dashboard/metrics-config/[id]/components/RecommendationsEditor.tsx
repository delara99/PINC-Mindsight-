'use client';
import { API_URL } from '@/src/config/api';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface RecommendationsEditorProps {
    config: any;
    configId: string;
}

export default function RecommendationsEditor({ config, configId }: RecommendationsEditorProps) {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [editingRec, setEditingRec] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);

    const { data: recommendations } = useQuery({
        queryKey: ['recommendations', configId],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/${configId}/recommendations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar recomendações');
            return response.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/recommendations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...data, configId })
            });
            if (!response.ok) throw new Error('Erro ao criar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recommendations', configId] });
            setIsCreating(false);
            setEditingRec(null);
            alert('Recomendação criada!');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: any) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/recommendations/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erro ao atualizar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recommendations', configId] });
            setEditingRec(null);
            alert('Recomendação atualizada!');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/recommendations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao deletar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recommendations', configId] });
            alert('Recomendação deletada!');
        }
    });

    const traitOptions = config?.traits?.map((t: any) => ({ value: t.traitKey, label: t.name })) || [];
    const scoreRangeOptions = [
        { value: 'very_low', label: 'Muito Baixo' },
        { value: 'low', label: 'Baixo' },
        { value: 'average', label: 'Médio' },
        { value: 'high', label: 'Alto' },
        { value: 'very_high', label: 'Muito Alto' }
    ];

    const handleSave = () => {
        if (!editingRec) return;

        if (isCreating) {
            createMutation.mutate(editingRec);
        } else {
            updateMutation.mutate({ id: editingRec.id, data: editingRec });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Recomendações</h3>
                    <p className="text-gray-600">
                        Crie recomendações personalizadas por traço e faixa de score
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setEditingRec({
                            traitKey: '',
                            scoreRange: '',
                            title: '',
                            description: '',
                            icon: '💡',
                            order: 0
                        });
                    }}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Recomendação
                </button>
            </div>

            {/* Edit/Create Form */}
            {editingRec && (
                <div className="bg-blue-50 border-2 border-primary rounded-lg p-6 mb-6">
                    <h4 className="font-bold text-gray-900 mb-4">
                        {isCreating ? 'Nova Recomendação' : 'Editar Recomendação'}
                    </h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Traço</label>
                                <select
                                    value={editingRec.traitKey}
                                    onChange={(e) => setEditingRec({ ...editingRec, traitKey: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Selecione...</option>
                                    {traitOptions.map((opt: any) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Faixa de Score</label>
                                <select
                                    value={editingRec.scoreRange}
                                    onChange={(e) => setEditingRec({ ...editingRec, scoreRange: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Selecione...</option>
                                    {scoreRangeOptions.map((opt: any) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                            <input
                                type="text"
                                value={editingRec.title}
                                onChange={(e) => setEditingRec({ ...editingRec, title: e.target.value })}
                                placeholder="Ex: Capitalize sua Criatividade"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                            <textarea
                                value={editingRec.description}
                                onChange={(e) => setEditingRec({ ...editingRec, description: e.target.value })}
                                rows={3}
                                placeholder="Descreva a recomendação..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ícone (emoji)</label>
                                <input
                                    type="text"
                                    value={editingRec.icon}
                                    onChange={(e) => setEditingRec({ ...editingRec, icon: e.target.value })}
                                    placeholder="💡"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ordem</label>
                                <input
                                    type="number"
                                    value={editingRec.order}
                                    onChange={(e) => setEditingRec({ ...editingRec, order: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setEditingRec(null);
                                    setIsCreating(false);
                                }}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <X size={18} />
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={18} />
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendations List */}
            <div className="space-y-3">
                {recommendations && recommendations.length > 0 ? (
                    recommendations.map((rec: any) => (
                        <div key={rec.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{rec.icon}</span>
                                        <h5 className="font-bold text-gray-900">{rec.title}</h5>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-2">{rec.description}</p>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        <span className="bg-gray-100 px-2 py-1 rounded">Traço: {rec.traitKey}</span>
                                        <span className="bg-gray-100 px-2 py-1 rounded">Faixa: {rec.scoreRange}</span>
                                        <span className="bg-gray-100 px-2 py-1 rounded">Ordem: {rec.order}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsCreating(false);
                                            setEditingRec(rec);
                                        }}
                                        className="text-primary hover:text-primary/80 p-2"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Deletar esta recomendação?')) {
                                                deleteMutation.mutate(rec.id);
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-700 p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Plus className="mx-auto mb-4 text-gray-300" size={48} />
                        <p>Nenhuma recomendação criada ainda</p>
                    </div>
                )}
            </div>
        </div>
    );
}

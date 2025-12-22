'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../../src/store/auth-store';
import { API_URL } from '../../../../../src/config/api';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Save } from 'lucide-react';

interface InterpretativeTextsEditorProps {
    configId: string;
    config: any; // Para pegar os traços
}

export default function InterpretativeTextsEditor({ configId, config }: InterpretativeTextsEditorProps) {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState<string | null>(null);

    // Form States
    const [selectedTrait, setSelectedTrait] = useState('');
    const [selectedRange, setSelectedRange] = useState('HIGH');
    const [selectedCategory, setSelectedCategory] = useState('SUMMARY');
    const [context, setContext] = useState('');
    const [textBody, setTextBody] = useState('');

    const resetForm = () => {
        setIsEditing(null);
        setSelectedTrait(config.traits?.[0]?.traitKey || '');
        setSelectedRange('HIGH');
        setSelectedCategory('SUMMARY');
        setContext('');
        setTextBody('');
    };

    const { data: texts, isLoading } = useQuery({
        queryKey: ['interpretative-texts', configId],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/${configId}/interpretative-texts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return []; // Retornar vazio se der erro (ex: tabela ainda não criada)
            return response.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/interpretative-texts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...data, configId })
            });
            if (!response.ok) throw new Error('Falha ao criar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interpretative-texts', configId] });
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/interpretative-texts/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Falha ao atualizar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interpretative-texts', configId] });
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/interpretative-texts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao deletar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interpretative-texts', configId] });
        }
    });

    const handleSave = () => {
        const payload = {
            traitKey: selectedTrait,
            scoreRange: selectedRange,
            category: selectedCategory,
            context: context || null,
            text: textBody
        };

        if (isEditing) {
            updateMutation.mutate({ id: isEditing, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (item: any) => {
        setIsEditing(item.id);
        setSelectedTrait(item.traitKey);
        setSelectedRange(item.scoreRange);
        setSelectedCategory(item.category);
        setContext(item.context || '');
        setTextBody(item.text);
    };

    const categories = [
        { value: 'SUMMARY', label: 'Resumo do Perfil (Cliente)' },
        { value: 'PRACTICAL_IMPACT', label: 'Impacto Prático (Cliente)' },
        { value: 'EXPERT_SYNTHESIS', label: 'Síntese Interpretativa (Especialista)' },
        { value: 'EXPERT_HYPOTHESIS', label: 'Hipóteses e Pontos de Atenção (Especialista)' }
    ];

    const ranges = [
        { value: 'VERY_LOW', label: 'Muito Baixo' },
        { value: 'LOW', label: 'Baixo' },
        { value: 'AVERAGE', label: 'Médio' },
        { value: 'HIGH', label: 'Alto' },
        { value: 'VERY_HIGH', label: 'Muito Alto' }
    ];

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="border-b pb-4">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
                        {isEditing ? 'Editar Texto' : 'Adicionar Novo Texto Interpretativo'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Crie textos ricos para compor automaticamente os relatórios finais.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Traço</label>
                        <select 
                            value={selectedTrait}
                            onChange={e => setSelectedTrait(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">Selecione um Traço...</option>
                            {config.traits?.map((t: any) => (
                                <option key={t.traitKey} value={t.traitKey}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Faixa de Score (Para qual resultado?)</label>
                        <select 
                            value={selectedRange}
                            onChange={e => setSelectedRange(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            {ranges.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria do Texto</label>
                        <select 
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            {categories.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    {(selectedCategory === 'PRACTICAL_IMPACT' || selectedCategory === 'EXPERT_HYPOTHESIS') && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contexto / Tipo (Opcional)</label>
                            <input 
                                type="text"
                                value={context}
                                onChange={e => setContext(e.target.value)}
                                placeholder="Ex: Comunicação, Pressão..."
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Conteúdo do Texto</label>
                    <textarea 
                        value={textBody}
                        onChange={e => setTextBody(e.target.value)}
                        rows={6}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Escreva a interpretação detalhada que aparecerá no relatório..."
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                    {isEditing && (
                        <button 
                            onClick={resetForm}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                        >
                            Cancelar
                        </button>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={!selectedTrait || !textBody || createMutation.isPending}
                        className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Save size={16} />
                        {isEditing ? 'Atualizar Texto' : 'Salvar Texto'}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg">Textos Cadastrados ({texts?.length || 0})</h3>
                {isLoading ? (
                    <p className="text-gray-500">Carregando...</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {texts?.map((item: any) => (
                            <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded uppercase">
                                            {config.traits?.find((t: any) => t.traitKey === item.traitKey)?.name || item.traitKey}
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                            {ranges.find(r => r.value === item.scoreRange)?.label || item.scoreRange}
                                        </span>
                                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border font-semibold">
                                            {categories.find(c => c.value === item.category)?.label || item.category}
                                        </span>
                                        {item.context && (
                                            <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2 py-1 rounded border border-amber-100">
                                                {item.context}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEdit(item)}
                                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => deleteMutation.mutate(item.id)}
                                            className="p-1.5 hover:bg-red-50 rounded text-gray-500 hover:text-red-500"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                        {texts?.length === 0 && (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                                Nenhum texto interpretativo cadastrado. Use o formulário acima para adicionar.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

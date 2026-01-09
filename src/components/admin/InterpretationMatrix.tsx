
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interpretationService, InterpretationPattern } from '../../services/interpretation';
import { Plus, Edit, Trash2, X, PlusCircle, Save } from 'lucide-react';

export function InterpretationMatrix() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [currentPattern, setCurrentPattern] = useState<Partial<InterpretationPattern>>({});

    // Lista
    const { data: patterns, isLoading } = useQuery<InterpretationPattern[]>({
        queryKey: ['interpretation-patterns'],
        queryFn: interpretationService.listPatterns
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: interpretationService.createPattern,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interpretation-patterns'] });
            setIsEditing(false);
            setCurrentPattern({});
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => interpretationService.updatePattern(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interpretation-patterns'] });
            setIsEditing(false);
            setCurrentPattern({});
        }
    });

    const deleteMutation = useMutation({
        mutationFn: interpretationService.deletePattern,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interpretation-patterns'] })
    });

    const handleSave = () => {
        if (!currentPattern.name || !currentPattern.description) return alert('Nome e Descrição obrigatórios');

        // Formatar conditions se necessário
        const data = {
            ...currentPattern,
            priority: Number(currentPattern.priority || 0),
            conditions: currentPattern.conditions as any || []
        };

        if (currentPattern.id) {
            updateMutation.mutate({ id: currentPattern.id, data });
        } else {
            createMutation.mutate(data as any);
        }
    };

    const addCondition = () => {
        const conditions = currentPattern.conditions || [];
        setCurrentPattern({
            ...currentPattern,
            conditions: [...conditions, { trait: 'extroversao', operator: 'lt', value: 50 }]
        });
    };

    const removeCondition = (index: number) => {
        const conditions = [...(currentPattern.conditions || [])];
        conditions.splice(index, 1);
        setCurrentPattern({ ...currentPattern, conditions });
    };

    const updateCondition = (index: number, field: string, value: any) => {
        const conditions = [...(currentPattern.conditions || [])];
        conditions[index] = { ...conditions[index], [field]: value };
        setCurrentPattern({ ...currentPattern, conditions });
    };

    if (isEditing) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between mb-6">
                    <h2 className="text-xl font-bold">{currentPattern.id ? 'Editar Padrão' : 'Novo Padrão'}</h2>
                    <button onClick={() => setIsEditing(false)}><X className="text-gray-500" /></button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome DO Padrão</label>
                            <input
                                className="w-full border rounded p-2"
                                value={currentPattern.name || ''}
                                onChange={e => setCurrentPattern({ ...currentPattern, name: e.target.value })}
                                placeholder="Ex: Crítico-Independente"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Código (Único)</label>
                            <input
                                className="w-full border rounded p-2"
                                value={currentPattern.code || ''}
                                onChange={e => setCurrentPattern({ ...currentPattern, code: e.target.value })}
                                placeholder="Ex: LOGIC_CIC"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Texto Descritivo (Interpretação Completa)</label>
                        <textarea
                            className="w-full border rounded p-2 min-h-[200px]"
                            value={currentPattern.description || ''}
                            onChange={e => setCurrentPattern({ ...currentPattern, description: e.target.value })}
                            placeholder="Cole o texto da planilha aqui..."
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">Condições (Gatilhos)</label>
                            <button onClick={addCondition} className="text-xs flex items-center gap-1 text-primary"><PlusCircle size={14} /> Adicionar Regra</button>
                        </div>

                        <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                            {currentPattern.conditions?.map((cond: any, idx: number) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <select
                                        className="border rounded p-1 text-sm bg-white flex-1"
                                        value={cond.trait}
                                        onChange={e => updateCondition(idx, 'trait', e.target.value)}
                                    >
                                        <option value="extroversao">Extroversão</option>
                                        <option value="amabilidade">Amabilidade</option>
                                        <option value="conscienciosidade">Conscienciosidade</option>
                                        <option value="neuroticismo">Neuroticismo</option>
                                        <option value="abertura">Abertura à Exp.</option>
                                    </select>
                                    <select
                                        className="border rounded p-1 text-sm bg-white w-20"
                                        value={cond.operator}
                                        onChange={e => updateCondition(idx, 'operator', e.target.value)}
                                    >
                                        <option value="lt">{'<'}</option>
                                        <option value="gt">{'>'}</option>
                                        <option value="eq">{'='}</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="border rounded p-1 text-sm w-16"
                                        value={cond.value}
                                        onChange={e => updateCondition(idx, 'value', Number(e.target.value))}
                                    />
                                    <button onClick={() => removeCondition(idx)} className="text-red-500"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            {(!currentPattern.conditions || currentPattern.conditions.length === 0) && (
                                <p className="text-xs text-gray-500 italic">Nenhuma regra definida (Padrão nunca será ativado).</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
                        <button
                            onClick={handleSave}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="px-4 py-2 bg-primary text-white rounded flex items-center gap-2"
                        >
                            <Save size={16} /> Salvar Padrão
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando padrões...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-violet-50 p-4 rounded-xl border border-violet-100">
                <div>
                    <h2 className="text-lg font-bold text-violet-900">Matriz de Interpretação Avançada</h2>
                    <p className="text-sm text-violet-700">Crie regras combinatórias e defina os textos exatos que aparecem no relatório.</p>
                </div>
                <button
                    onClick={() => { setCurrentPattern({}); setIsEditing(true); }}
                    className="bg-primary hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"
                >
                    <Plus size={18} /> Novo Padrão
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patterns?.map(pattern => (
                    <div key={pattern.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setCurrentPattern(pattern); setIsEditing(true); }} className="p-1.5 bg-gray-100 rounded-full hover:bg-blue-100 text-blue-600"><Edit size={14} /></button>
                            <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(pattern.id) }} className="p-1.5 bg-gray-100 rounded-full hover:bg-red-100 text-red-600"><Trash2 size={14} /></button>
                        </div>

                        <div className="mb-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded tracking-wider">{pattern.code}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 leading-tight">{pattern.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-3 mb-4">{pattern.description}</p>

                        <div className="flex flex-wrap gap-1 mt-auto">
                            {pattern.conditions?.map((c: any, i: number) => (
                                <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                                    {c.trait.substring(0, 3).toUpperCase()} {c.operator === 'lt' ? '<' : '>'} {c.value}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

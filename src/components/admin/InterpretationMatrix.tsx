
'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interpretationService, InterpretationPattern } from '../../services/interpretation';
import { Plus, Edit, Trash2, X, PlusCircle, Save } from 'lucide-react';

const CATEGORIES = [
    { id: 'LOGIC', label: 'Lógica-Sentimento', prefix: 'LOGIC_' },
    { id: 'ADAPT', label: 'Adaptação-Estrutura', prefix: 'ADAPT_' },
    { id: 'CONCR', label: 'Concreto-Abstrato', prefix: 'CONCR_' },
    { id: 'EMOT', label: 'Emoção-Razão', prefix: 'EMOT_' },
    { id: 'REC', label: 'Recomendações', prefix: 'REC_' },
    { id: 'OTHER', label: 'Outros', prefix: '' }
];

const TRAIT_OPTIONS = [
    { value: 'extroversao', label: 'EXTROVERSÃO (Geral)' },
    { value: 'facet_acolhimento', label: 'Ext: Acolhimento' },
    { value: 'facet_gregarismo', label: 'Ext: Gregarismo' },
    { value: 'facet_assertividade', label: 'Ext: Assertividade' },
    { value: 'facet_atividade', label: 'Ext: Nível de Atividade' },
    { value: 'facet_busca_excitacao', label: 'Ext: Busca de Excitação' },
    { value: 'facet_emo_positivas', label: 'Ext: Emoções Positivas' },

    { value: 'amabilidade', label: 'AMABILIDADE (Geral)' },
    { value: 'facet_confianca', label: 'Amb: Confiança' },
    { value: 'facet_franqueza', label: 'Amb: Franqueza' },
    { value: 'facet_altruismo', label: 'Amb: Altruísmo' },
    { value: 'facet_complacencia', label: 'Amb: Complacência' },
    { value: 'facet_modestia', label: 'Amb: Modéstia' },
    { value: 'facet_sensibilidade', label: 'Amb: Sensibilidade' },

    { value: 'conscienciosidade', label: 'CONSCIENCIOSIDADE (Geral)' },
    { value: 'facet_competencia', label: 'Con: Competência' },
    { value: 'facet_ordem', label: 'Con: Ordem/Organização' },
    { value: 'facet_senso_dever', label: 'Con: Senso de Dever' },
    { value: 'facet_esforco_realizacao', label: 'Con: Esforço de Realização' },
    { value: 'facet_autodisciplina', label: 'Con: Autodisciplina' },
    { value: 'facet_deliberacao', label: 'Con: Deliberação' },

    { value: 'neuroticismo', label: 'NEUROTICISMO (Geral)' },
    { value: 'facet_ansiedade', label: 'Neu: Ansiedade' },
    { value: 'facet_raiva_hostilidade', label: 'Neu: Raiva/Hostilidade' },
    { value: 'facet_depressao', label: 'Neu: Depressão' },
    { value: 'facet_autoconsciencia', label: 'Neu: Autoconsciência' },
    { value: 'facet_impulsividade', label: 'Neu: Impulsividade' },
    { value: 'facet_vulnerabilidade', label: 'Neu: Vulnerabilidade' },

    { value: 'abertura', label: 'ABERTURA (Geral)' },
    { value: 'facet_fantasia', label: 'Abe: Fantasia' },
    { value: 'facet_estetica', label: 'Abe: Estética' },
    { value: 'facet_sentimentos', label: 'Abe: Sentimentos' },
    { value: 'facet_acoes', label: 'Abe: Ações' },
    { value: 'facet_ideias', label: 'Abe: Ideias' },
    { value: 'facet_valores', label: 'Abe: Valores' },
];

export function InterpretationMatrix() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [currentPattern, setCurrentPattern] = useState<Partial<InterpretationPattern>>({});
    const [activeCategory, setActiveCategory] = useState('LOGIC');

    // Lista
    const { data: patterns, isLoading } = useQuery<InterpretationPattern[]>({
        queryKey: ['interpretation-patterns'],
        queryFn: interpretationService.listPatterns
    });

    const filteredPatterns = patterns?.filter(p => {
        const cat = CATEGORIES.find(c => c.id === activeCategory);
        if (!cat) return true;

        if (activeCategory === 'OTHER') {
            return !CATEGORIES.some(c => c.id !== 'OTHER' && p.code.startsWith(c.prefix));
        }
        return p.code.startsWith(cat.prefix);
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

    const handleCreateNew = () => {
        const cat = CATEGORIES.find(c => c.id === activeCategory);
        setCurrentPattern({
            code: cat && cat.id !== 'OTHER' ? cat.prefix : '',
            conditions: []
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!currentPattern.name || !currentPattern.description) return alert('Nome e Descrição obrigatórios');
        if (!currentPattern.code) return alert('Código é obrigatório');

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

    const patternsToDisplay = filteredPatterns || [];
    const getTraitLabel = (val: string) => TRAIT_OPTIONS.find(t => t.value === val)?.label || val;

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando padrões...</div>;

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
                            <label className="block text-sm font-medium mb-1">Nome do Padrão</label>
                            <input
                                className="w-full border rounded p-2"
                                value={currentPattern.name || ''}
                                onChange={e => setCurrentPattern({ ...currentPattern, name: e.target.value })}
                                placeholder="Ex: Crítico-Independente"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Código (Prefixo Obrigatório)</label>
                            <input
                                className="w-full border rounded p-2 font-mono text-sm bg-gray-50"
                                value={currentPattern.code || ''}
                                onChange={e => setCurrentPattern({ ...currentPattern, code: e.target.value })}
                                placeholder="LOGIC_CIC"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Prefixo Sugerido: <b>{CATEGORIES.find(c => c.id === activeCategory)?.prefix}</b>
                            </p>
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
                                <div key={idx} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                                    <select
                                        className="border rounded p-2 text-sm bg-white flex-1 min-w-[200px]"
                                        value={cond.trait}
                                        onChange={e => updateCondition(idx, 'trait', e.target.value)}
                                    >
                                        {TRAIT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        className="border rounded p-2 text-sm bg-white w-20"
                                        value={cond.operator}
                                        onChange={e => updateCondition(idx, 'operator', e.target.value)}
                                    >
                                        <option value="lt">{'<'}</option>
                                        <option value="gt">{'>'}</option>
                                        <option value="eq">{'='}</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="border rounded p-2 text-sm w-20"
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-violet-50 p-4 rounded-xl border border-violet-100">
                <div>
                    <h2 className="text-lg font-bold text-violet-900">Matriz de Interpretação Avançada</h2>
                    <p className="text-sm text-violet-700">Crie regras combinatórias e defina os textos exatos que aparecem no relatório.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-primary hover:bg-violet-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm"
                >
                    <Plus size={18} /> Novo Padrão
                </button>
            </div>

            {/* Abas de Categorias */}
            <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`whitespace-nowrap px-6 py-3 border-b-2 font-medium transition-colors ${activeCategory === cat.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patternsToDisplay.length > 0 ? (
                    patternsToDisplay.map(pattern => (
                        <div key={pattern.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setCurrentPattern(pattern); setIsEditing(true); }} className="p-1.5 bg-gray-100 rounded-full hover:bg-blue-100 text-blue-600"><Edit size={14} /></button>
                                <button onClick={() => { if (confirm('Excluir?')) deleteMutation.mutate(pattern.id) }} className="p-1.5 bg-gray-100 rounded-full hover:bg-red-100 text-red-600"><Trash2 size={14} /></button>
                            </div>

                            <div className="mb-2">
                                <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded tracking-wider">{pattern.code}</span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2 leading-tight">{pattern.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-4 mb-4 whitespace-pre-line">{pattern.description}</p>

                            <div className="flex flex-wrap gap-1 mt-auto">
                                {pattern.conditions?.map((c: any, i: number) => {
                                    // Tenta achar label amigável, senão mostra raw
                                    const niceLabel = getTraitLabel(c.trait).split(':')[1] || getTraitLabel(c.trait).substring(0, 10);
                                    return (
                                        <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100" title={getTraitLabel(c.trait)}>
                                            {niceLabel.trim()} {c.operator === 'lt' ? '<' : '>'} {c.value}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <p className="mb-2">Nenhum padrão encontrado na categoria <b>{CATEGORIES.find(c => c.id === activeCategory)?.label}</b>.</p>
                        <button onClick={handleCreateNew} className="text-primary font-bold hover:underline">
                            + Criar o primeiro padrão desta categoria
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

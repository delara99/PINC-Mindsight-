import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../../../../../src/config/api';
import { useAuthStore } from '../../../../../src/store/auth-store';
import { Edit2, Save, X, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function QuestionsEditor() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({
        id: '',
        text: '',
        traitKey: '',
        facetKey: '',
        weight: 1.0,
        isReverse: false,
        isActive: true,
        // TalkingTo Fields
        dichotomy: '',         // Ex: Introversão-Extroversão
        questionTrait: '',     // Ex: EXTROVERTIDO
        subtraitDichotomy: '', // Ex: ouvinte-falante
        subtrait: '',          // Ex: falante
        concept: ''            // Ex: comunicação
    });

    const [isCreating, setIsCreating] = useState(false);

    const resetForm = () => {
        setFormData({
            id: '', text: '', traitKey: '', facetKey: '', weight: 1.0, isReverse: false, isActive: true,
            dichotomy: '', questionTrait: '', subtraitDichotomy: '', subtrait: '', concept: ''
        });
        setFormMode('create');
        setIsCreating(false);
    }

    // 1. Buscar o ID do Modelo Big Five
    const { data: assessment } = useQuery({
        queryKey: ['big-five-model'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/assessments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar modelo');
            const data = await res.json();
            const model = data.find((a: any) => a.type === 'BIG_FIVE');
            if (!model) throw new Error('Modelo Big Five não encontrado');
            return model;
        }
    });

    const assessmentId = assessment?.id;

    // 2. Buscar Perguntas do Modelo
    const { data: questions, isLoading } = useQuery({
        queryKey: ['questions', assessmentId],
        queryFn: async () => {
            if (!assessmentId) return [];
            const res = await fetch(`${API_URL}/api/v1/questions/assessment/${assessmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar perguntas');
            return res.json();
        },
        enabled: !!assessmentId
    });

    // Mutations (Updated to use formData)
    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const { id, ...updateData } = data;
            const res = await fetch(`${API_URL}/api/v1/questions/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            if (!res.ok) throw new Error('Erro ao atualizar');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', assessmentId] });
            resetForm();
            alert('Pergunta atualizada!');
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            // Remove id if present
            const { id, ...createPayload } = data;
            const res = await fetch(`${API_URL}/api/v1/questions/assessment/${assessmentId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createPayload)
            });
            if (!res.ok) throw new Error('Erro ao criar');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', assessmentId] });
            resetForm();
            alert('Pergunta criada!');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/api/v1/questions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao remover');
            return res.status === 204 ? {} : res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', assessmentId] });
            alert('Pergunta removida/inativada.');
        }
    });

    const handleEditClick = (q: any) => {
        setFormData({
            id: q.id,
            text: q.text,
            traitKey: q.traitKey || '',
            facetKey: q.facetKey || '',
            weight: q.weight || 1.0,
            isReverse: q.isReverse || false,
            isActive: q.isActive !== false,
            dichotomy: q.dichotomy || '',
            questionTrait: q.questionTrait || '',
            subtraitDichotomy: q.subtraitDichotomy || '',
            subtrait: q.subtrait || '',
            concept: q.concept || ''
        });
        setFormMode('edit');
        setIsCreating(true); // Reusa o booleano para mostrar o form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = () => {
        if (formMode === 'create') {
            createMutation.mutate(formData);
        } else {
            updateMutation.mutate(formData);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Carregando perguntas...</div>;
    if (!assessment) return <div className="p-8 text-center text-red-500">Modelo Big Five não encontrado. Crie um modelo primeiro.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Parametrização das Perguntas</h3>
                    <p className="text-gray-600">
                        Edite o texto e configure os parâmetros do algoritmo TalkingTo.
                    </p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Nova Pergunta
                    </button>
                )}
            </div>

            {/* Form de Edição/Criação */}
            {isCreating && (
                <div className="bg-gray-50 border border-primary/20 rounded-lg p-6 mb-8 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg text-primary flex items-center gap-2">
                            {formMode === 'create' ? <Plus size={20} /> : <Edit2 size={20} />}
                            {formMode === 'create' ? 'Adicionar Pergunta' : 'Editar Pergunta'}
                        </h4>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                        {/* Texto (Full Width) */}
                        <div className="md:col-span-12">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Texto da Pergunta</label>
                            <input
                                className="w-full border p-2 rounded focus:ring-2 ring-primary/20 outline-none"
                                value={formData.text}
                                onChange={e => setFormData({ ...formData, text: e.target.value })}
                                placeholder="Ex: Sinto-me confortável..."
                            />
                        </div>

                        {/* Bloco 1: Big Five Clássico */}
                        <div className="md:col-span-12 mt-2 mb-1">
                            <span className="text-xs font-bold text-gray-400 border-b block pb-1">PARÂMETROS BÁSICOS</span>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Traço (Openness...)</label>
                            <input className="w-full border p-2 rounded uppercase" value={formData.traitKey} onChange={e => setFormData({ ...formData, traitKey: e.target.value })} />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Faceta (Fantasy...)</label>
                            <input className="w-full border p-2 rounded uppercase" value={formData.facetKey} onChange={e => setFormData({ ...formData, facetKey: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Peso</label>
                            <input type="number" step="0.1" className="w-full border p-2 rounded" value={formData.weight} onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })} />
                        </div>
                        <div className="md:col-span-4 flex items-end gap-6 pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isReverse} onChange={e => setFormData({ ...formData, isReverse: e.target.checked })} className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-gray-700">Invertida?</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-bold text-gray-700">Ativa?</span>
                            </label>
                        </div>

                        {/* Bloco 2: TalkingTo (Novos Campos) */}
                        <div className="md:col-span-12 mt-4 mb-1">
                            <span className="text-xs font-bold text-purple-500 border-b border-purple-100 block pb-1">PARÂMETROS TALKING-TO (AVANÇADO)</span>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dicotomia</label>
                            <input className="w-full border p-2 rounded border-purple-100 bg-purple-50/30" value={formData.dichotomy} onChange={e => setFormData({ ...formData, dichotomy: e.target.value })} placeholder="Introv-Extrov" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Traço Questão</label>
                            <input className="w-full border p-2 rounded border-purple-100 bg-purple-50/30" value={formData.questionTrait} onChange={e => setFormData({ ...formData, questionTrait: e.target.value })} placeholder="EXTROVERTIDO" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subtraço Dicot.</label>
                            <input className="w-full border p-2 rounded border-purple-100 bg-purple-50/30" value={formData.subtraitDichotomy} onChange={e => setFormData({ ...formData, subtraitDichotomy: e.target.value })} placeholder="ouvinte-falante" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subtraço Alvo</label>
                            <input className="w-full border p-2 rounded border-purple-100 bg-purple-50/30" value={formData.subtrait} onChange={e => setFormData({ ...formData, subtrait: e.target.value })} placeholder="falante" />
                        </div>
                        <div className="md:col-span-12">
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Conceito</label>
                            <input className="w-full border p-2 rounded border-purple-100 bg-purple-50/30" value={formData.concept} onChange={e => setFormData({ ...formData, concept: e.target.value })} placeholder="Ex: Comunicação, Tomada de Decisão..." />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button onClick={resetForm} className="text-gray-500 px-6 py-2 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                        <button onClick={handleSubmit} className="bg-primary hover:bg-primary-hover text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 transition-all">
                            {formMode === 'create' ? 'Salvar Nova' : 'Atualizar Pergunta'}
                        </button>
                    </div>
                </div>
            )}

            {/* Listagem Simplificada */}
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Pergunta</th>
                            <th className="px-4 py-3 w-40">TalkingTo (Subtraço)</th>
                            <th className="px-4 py-3 w-28 text-center">Status</th>
                            <th className="px-4 py-3 w-24 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {questions?.map((q: any) => (
                            <tr key={q.id} className={!q.isActive ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">{q.text}</p>
                                    <div className="flex gap-2 mt-1 text-xs text-gray-400 font-mono">
                                        <span className="bg-gray-100 px-1 rounded">{q.traitKey}</span>
                                        {q.facetKey && <span className="bg-gray-100 px-1 rounded">{q.facetKey}</span>}
                                        {q.isReverse && <span className="text-orange-500 font-bold ml-1">(R)</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                    {q.subtrait ? (
                                        <div>
                                            <span className="font-bold text-purple-700 block">{q.subtrait}</span>
                                            <span className="text-gray-400 text-[10px]">{q.subtraitDichotomy}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {q.isActive ?
                                        <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">Ativa</span> :
                                        <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded-full">Inativa</span>
                                    }
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEditClick(q)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Editar">
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Remover pergunta?')) deleteMutation.mutate(q.id) }}
                                            className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {questions?.length === 0 && <div className="p-8 text-center text-gray-500">Nenhuma pergunta encontrada.</div>}
            </div>
        </div>
    );
}

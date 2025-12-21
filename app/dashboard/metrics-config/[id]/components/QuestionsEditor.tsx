import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../../../../../src/config/api';
import { useAuthStore } from '../../../../../src/store/auth-store';
import { Edit2, Save, X, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function QuestionsEditor() {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({ text: '', traitKey: '', facetKey: '', weight: 1.0, isReverse: false });

    // 1. Buscar o ID do Modelo Big Five
    const { data: assessment } = useQuery({
        queryKey: ['big-five-model'],
        queryFn: async () => {
            // Buscar assessments e filtrar (hack rápido pois não temos endpoint direto 'get-big-five-id' público sem auth complexa,
            // mas assumimos que o admin vê todos)
            const res = await fetch(`${API_URL}/api/v1/assessments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao buscar modelo');
            const data = await res.json();
            // Encontrar o primeiro do tipo BIG_FIVE
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

    // Mutations
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: any) => {
            const res = await fetch(`${API_URL}/api/v1/questions/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Erro ao atualizar');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', assessmentId] });
            setEditingId(null);
            alert('Pergunta atualizada!');
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_URL}/api/v1/questions/assessment/${assessmentId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Erro ao criar');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', assessmentId] });
            setIsCreating(false);
            setCreateForm({ text: '', traitKey: '', facetKey: '', weight: 1.0, isReverse: false });
            alert('Pergunta criada!');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/api/v1/questions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao remover'); // Pode ser soft delete no backend
            return res.status === 204 ? {} : res.json(); // Handle 204 No Content
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['questions', assessmentId] });
            alert('Pergunta removida/inativada.');
        }
    });

    const handleEditClick = (q: any) => {
        setEditingId(q.id);
        setEditForm({ ...q });
    };

    const handleSave = () => {
        updateMutation.mutate({ id: editingId, data: editForm });
    };

    if (isLoading) return <div className="p-8 text-center">Carregando perguntas...</div>;

    if (!assessment) return <div className="p-8 text-center text-red-500">Modelo Big Five não encontrado. Crie um modelo primeiro.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Parametrização das Perguntas</h3>
                    <p className="text-gray-600">
                        Edite o texto, associe Traços/Facetas e configure Inversão.
                        <br /><span className="text-xs text-yellow-600 font-bold">⚠️ Alterações aqui afetam o cálculo de todos os novos inventários.</span>
                    </p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Nova Pergunta
                    </button>
                )}
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-gray-50 border border-primary/20 rounded-lg p-6 mb-6">
                    <h4 className="font-bold mb-4">Adicionar Pergunta</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase">Texto da Pergunta</label>
                            <input className="w-full border p-2 rounded" value={createForm.text} onChange={e => setCreateForm({ ...createForm, text: e.target.value })} placeholder="Ex: Sinto-me confortável perto de pessoas" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase">Chave do Traço (TraitKey)</label>
                            <input className="w-full border p-2 rounded" value={createForm.traitKey} onChange={e => setCreateForm({ ...createForm, traitKey: e.target.value })} placeholder="Ex: EXTRAVERSION" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase">Chave da Faceta (FacetKey)</label>
                            <input className="w-full border p-2 rounded" value={createForm.facetKey} onChange={e => setCreateForm({ ...createForm, facetKey: e.target.value })} placeholder="Ex: FRIENDLINESS" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase">Peso</label>
                            <input type="number" step="0.1" className="w-full border p-2 rounded" value={createForm.weight} onChange={e => setCreateForm({ ...createForm, weight: parseFloat(e.target.value) })} />
                        </div>
                        <div className="flex items-center gap-2 mt-6">
                            <input type="checkbox" id="create-reverse" checked={createForm.isReverse} onChange={e => setCreateForm({ ...createForm, isReverse: e.target.checked })} className="w-5 h-5 text-primary" />
                            <label htmlFor="create-reverse" className="text-sm font-bold text-gray-700">Pergunta Invertida?</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsCreating(false)} className="text-gray-500 px-4 py-2">Cancelar</button>
                        <button onClick={() => createMutation.mutate(createForm)} className="bg-primary text-white px-4 py-2 rounded">Salvar</button>
                    </div>
                </div>
            )}

            {/* Lista */}
            <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Texto</th>
                            <th className="px-4 py-3 w-32">Traço</th>
                            <th className="px-4 py-3 w-32">Faceta</th>
                            <th className="px-4 py-3 w-16 text-center">Peso</th>
                            <th className="px-4 py-3 w-16 text-center">Inv?</th>
                            <th className="px-4 py-3 w-16 text-center">Ativa</th>
                            <th className="px-4 py-3 w-24 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {questions?.map((q: any) => (
                            <tr key={q.id} className={!q.isActive ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}>
                                {editingId === q.id ? (
                                    <>
                                        <td className="px-4 py-2">
                                            <input className="w-full border p-1 rounded" value={editForm.text} onChange={e => setEditForm({ ...editForm, text: e.target.value })} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input className="w-full border p-1 rounded text-xs" value={editForm.traitKey || ''} onChange={e => setEditForm({ ...editForm, traitKey: e.target.value })} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input className="w-full border p-1 rounded text-xs" value={editForm.facetKey || ''} onChange={e => setEditForm({ ...editForm, facetKey: e.target.value })} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input type="number" step="0.1" className="w-16 border p-1 rounded text-center" value={editForm.weight} onChange={e => setEditForm({ ...editForm, weight: parseFloat(e.target.value) })} />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input type="checkbox" checked={editForm.isReverse} onChange={e => setEditForm({ ...editForm, isReverse: e.target.checked })} />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })} />
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={handleSave} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16} /></button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-500 hover:bg-gray-100 p-1 rounded"><X size={16} /></button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 font-medium text-gray-900">{q.text}</td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{q.traitKey}</td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{q.facetKey || '-'}</td>
                                        <td className="px-4 py-3 text-center">{q.weight}</td>
                                        <td className="px-4 py-3 text-center">
                                            {q.isReverse ? <CheckCircle size={16} className="mx-auto text-orange-500" /> : <span className="text-gray-300">-</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {q.isActive ? <CheckCircle size={16} className="mx-auto text-green-500" /> : <XCircle size={16} className="mx-auto text-red-500" />}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditClick(q)} className="text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>
                                                <button onClick={() => { if (confirm('Remover pergunta?')) deleteMutation.mutate(q.id) }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {questions?.length === 0 && <div className="p-8 text-center text-gray-500">Nenhuma pergunta encontrada.</div>}
            </div>
        </div>
    );
}

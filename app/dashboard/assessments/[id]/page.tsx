'use client';
import { API_URL } from '@/src/config/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Question {
    id: string;
    text: string;
    traitKey: string;
    facetKey?: string;
    weight: number;
    isReverse?: boolean;
    isActive?: boolean;
}

interface Assessment {
    id: string;
    title: string;
    description: string;
    type: string;
    questions: Question[];
}

export default function AssessmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();

    const [isEdited, setIsEdited] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedQuestions, setEditedQuestions] = useState<Question[]>([]);

    // 1. Buscar a Configuração Ativa para popular os Selects (Segurança)
    const { data: config } = useQuery({
        queryKey: ['active-big-five-config'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return null; // Pode não ter config ativa
            return response.json();
        }
    });

    const { data: assessment, isLoading } = useQuery<Assessment>({
        queryKey: ['assessment', params.id],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar avaliação');
            const data = await response.json();

            // Inicializar estados editáveis
            setEditedTitle(data.title);
            setEditedDescription(data.description || '');
            setEditedQuestions(data.questions || []);

            return data;
        }
    });

    const updateQuestion = (questionId: string, field: keyof Question, value: any) => {
        setIsEdited(true);
        setEditedQuestions(prev =>
            prev.map(q => q.id === questionId ? { ...q, [field]: value } : q)
        );
    };

    const deleteQuestion = (questionId: string) => {
        setIsEdited(true);
        setEditedQuestions(prev => prev.filter(q => q.id !== questionId));
    };

    const addQuestion = () => {
        setIsEdited(true);
        // Tentar pegar o primeiro traço da config como default
        const defaultTrait = config?.traits?.[0]?.traitKey || 'EXTRAVERSION';

        const newQuestion: Question = {
            id: `temp-${Date.now()}`,
            text: '',
            traitKey: defaultTrait,
            facetKey: '',
            weight: 1.0,
            isReverse: false,
            isActive: true
        };
        setEditedQuestions(prev => [...prev, newQuestion]);
    };

    const saveChanges = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editedTitle,
                    description: editedDescription,
                    questions: editedQuestions
                })
            });
            if (!response.ok) throw new Error('Falha ao salvar alterações');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessment', params.id] });
            setIsEdited(false);
            alert('Avaliação salva com sucesso!');
        },
        onError: () => {
            alert('Erro ao salvar alterações.');
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-primary" />
            </div>
        );
    }

    // Helpers para renderização dos dropdowns

    // Helper para normalizar string para comparação (ignora acentos e case)
    const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // Busca o traço na config, sendo resiliente a chaves antigas (ex: "Conscienciosidade" vs "CONSCIENTIOUSNESS")
    const getActiveTrait = (key: string) => {
        if (!config?.traits) return null;

        // 1. Tenta match exato pelo traitKey (padrão novo)
        let trait = config.traits.find((t: any) => t.traitKey === key);

        // 2. Tenta match normalizado pelo traitKey ou Name (padrão antigo)
        if (!trait) {
            const search = normalize(key);
            trait = config.traits.find((t: any) =>
                normalize(t.traitKey) === search ||
                normalize(t.name) === search
            );
        }
        return trait;
    };

    const hasMissingFacets = config?.traits?.some((t: any) => !t.facets || t.facets.length === 0);

    const fixFacets = useMutation({
        mutationFn: async () => {
            if (!config?.id) return;
            const response = await fetch(`${API_URL}/api/v1/debug-reports/fix-facets/${config.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.json();
        },
        onSuccess: (data) => {
            alert('Configuração corrigida automaticamente! As facetas agora devem aparecer.');
            queryClient.invalidateQueries({ queryKey: ['active-big-five-config'] });
        }
    });

    const getFacetsForTrait = (traitKey: string) => {
        const trait = getActiveTrait(traitKey);
        return trait?.facets || [];
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/assessments')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Editar Avaliação</h1>
                        <p className="text-gray-500 mt-1">
                            Edite perguntas, pesos e associações com segurança.
                            {!config && <span className="text-red-500 ml-2 text-xs font-bold">(Configuração Big Five não encontrada. Usando modo manual.)</span>}
                        </p>
                    </div>
                </div>

                {isEdited && (
                    <button
                        onClick={() => saveChanges.mutate()}
                        disabled={saveChanges.isPending}
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2 fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4"
                    >
                        {saveChanges.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar Alterações
                    </button>
                )}
            </div>

            {/* Banner de Correção Automática */}
            {config && hasMissingFacets && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-amber-900">Configuração Incompleta Detectada</h3>
                            <p className="text-sm text-amber-700">Alguns traços não possuem facetas cadastradas no banco de dados, o que bloqueia a seleção de subcategorias.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => fixFacets.mutate()}
                        disabled={fixFacets.isPending}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg font-bold text-sm border border-amber-300 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        {fixFacets.isPending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        Corrigir Facetas Agora
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Título</label>
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => {
                            setEditedTitle(e.target.value);
                            setIsEdited(true);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
                    <textarea
                        value={editedDescription}
                        onChange={(e) => {
                            setEditedDescription(e.target.value);
                            setIsEdited(true);
                        }}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>

                <div className="pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Perguntas ({editedQuestions.length})</h2>
                        <button
                            onClick={addQuestion}
                            className="bg-gray-50 hover:bg-gray-100 text-primary font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-gray-200"
                        >
                            <Plus size={18} />
                            Adicionar Pergunta
                        </button>
                    </div>

                    <div className="space-y-4">
                        {editedQuestions.map((question, index) => {
                            const activeTrait = getActiveTrait(question.traitKey);
                            const availableFacets = getFacetsForTrait(question.traitKey);

                            return (
                                <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary/30 transition-all bg-white hover:shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm mt-1">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            {/* Texto da Pergunta */}
                                            <textarea
                                                value={question.text}
                                                onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                                placeholder="Digite o texto da pergunta..."
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                                            />

                                            {/* Controles de Configuração */}
                                            <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">

                                                {/* Seletor de Traço */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Traço</label>
                                                    {config ? (
                                                        <select
                                                            value={question.traitKey}
                                                            onChange={(e) => {
                                                                updateQuestion(question.id, 'traitKey', e.target.value);
                                                                updateQuestion(question.id, 'facetKey', ''); // Limpa faceta ao mudar traço
                                                            }}
                                                            className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary outline-none min-w-[160px]"
                                                        >
                                                            {config.traits?.map((t: any) => (
                                                                <option key={t.traitKey} value={t.traitKey}>{t.name} ({t.weight}x)</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            value={question.traitKey}
                                                            onChange={e => updateQuestion(question.id, 'traitKey', e.target.value)}
                                                            className="px-2 py-1 border rounded text-xs"
                                                            placeholder="Chave do Traço"
                                                        />
                                                    )}
                                                </div>

                                                {/* Seletor de Faceta */}
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Faceta</label>
                                                    {config ? (
                                                        <select
                                                            value={question.facetKey || ''}
                                                            onChange={(e) => updateQuestion(question.id, 'facetKey', e.target.value)}
                                                            className={`px-2 py-1.5 bg-white border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary outline-none min-w-[160px] ${!availableFacets.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            disabled={!availableFacets.length}
                                                        >
                                                            <option value="">Selecione...</option>
                                                            {availableFacets.map((f: any) => (
                                                                <option key={f.facetKey} value={f.facetKey}>{f.name} ({f.weight}x)</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            value={question.facetKey}
                                                            onChange={e => updateQuestion(question.id, 'facetKey', e.target.value)}
                                                            className="px-2 py-1 border rounded text-xs"
                                                            placeholder="Chave da Faceta"
                                                        />
                                                    )}
                                                </div>

                                                {/* Peso */}
                                                <div className="flex flex-col gap-1 w-20">
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Peso</label>
                                                    <input
                                                        type="number"
                                                        value={question.weight}
                                                        onChange={(e) => updateQuestion(question.id, 'weight', parseFloat(e.target.value))}
                                                        step="0.1"
                                                        className="px-2 py-1.5 border border-gray-300 rounded text-xs text-center focus:ring-2 focus:ring-primary outline-none"
                                                    />
                                                </div>

                                                {/* Invertida */}
                                                <div className="flex items-center gap-2 mt-4 border-l pl-4 border-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        id={`rev-${question.id}`}
                                                        checked={question.isReverse || false}
                                                        onChange={(e) => updateQuestion(question.id, 'isReverse', e.target.checked)}
                                                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                                                    />
                                                    <label htmlFor={`rev-${question.id}`} className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                                                        Invertida? (R)
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => deleteQuestion(question.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                            title="Excluir pergunta"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {editedQuestions.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 mb-2">Nenhuma pergunta nesta avaliação.</p>
                                <button onClick={addQuestion} className="text-primary font-bold hover:underline">
                                    Adicionar primeira pergunta
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

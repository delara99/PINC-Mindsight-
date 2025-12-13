'use client';
import { API_URL } from '@/src/config/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Question {
    id: string;
    text: string;
    traitKey: string;
    weight: number;
}

interface Assessment {
    id: string;
    title: string;
    description: string;
    type: string;
    questions: Question[];
}

// Mapeamento de tradução para traços Big Five
const traitTranslation: Record<string, string> = {
    'OPENNESS': 'Abertura',
    'CONSCIENTIOUSNESS': 'Conscienciosidade',
    'EXTRAVERSION': 'Extroversão',
    'AGREEABLENESS': 'Amabilidade',
    'NEUROTICISM': 'Neuroticismo'
};

// Função para traduzir ou manter valor original
const translateTrait = (trait: string): string => {
    return traitTranslation[trait] || trait;
};

export default function AssessmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();

    const [isEdited, setIsEdited] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedQuestions, setEditedQuestions] = useState<Question[]>([]);

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

    const updateQuestion = (questionId: string, text: string) => {
        setIsEdited(true);
        setEditedQuestions(prev =>
            prev.map(q => q.id === questionId ? { ...q, text } : q)
        );
    };

    const deleteQuestion = (questionId: string) => {
        setIsEdited(true);
        setEditedQuestions(prev => prev.filter(q => q.id !== questionId));
    };

    const addQuestion = () => {
        setIsEdited(true);
        const newQuestion: Question = {
            id: `temp-${Date.now()}`,
            text: '',
            traitKey: 'OPENNESS',
            weight: 1.0
        };
        setEditedQuestions(prev => [...prev, newQuestion]);
    };

    const saveChanges = useMutation({
        mutationFn: async () => {
            // TODO: Implementar endpoint de update no backend
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
            alert('Alterações salvas com sucesso!');
        },
        onError: () => {
            alert('Erro ao salvar alterações. Tente novamente.');
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
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
                        <p className="text-gray-500 mt-1">Visualize e edite as perguntas do questionário.</p>
                    </div>
                </div>

                {isEdited && (
                    <button
                        onClick={() => saveChanges.mutate()}
                        disabled={saveChanges.isPending}
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        {saveChanges.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar Alterações
                    </button>
                )}
            </div>

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
                            className="text-primary hover:text-primary-hover font-bold text-sm flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Adicionar Pergunta
                        </button>
                    </div>

                    <div className="space-y-4">
                        {editedQuestions.map((question, index) => (
                            <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary/30 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={question.text}
                                            onChange={(e) => updateQuestion(question.id, e.target.value)}
                                            placeholder="Digite a pergunta..."
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                        />
                                        <div className="mt-2 flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-gray-700">Traço:</label>
                                                {(question.traitKey === '' || (question.traitKey && !['Abertura', 'Conscienciosidade', 'Extroversão', 'Amabilidade', 'Neuroticismo', 'Liderança', 'Comunicação', 'Trabalho em Equipe', 'Resolução de Problemas', 'Criatividade'].includes(translateTrait(question.traitKey)))) ? (
                                                    // Modo customizado
                                                    <div className="flex gap-1">
                                                        <input
                                                            type="text"
                                                            value={translateTrait(question.traitKey)}
                                                            onChange={(e) => {
                                                                setIsEdited(true);
                                                                setEditedQuestions(prev =>
                                                                    prev.map(q => q.id === question.id ? { ...q, traitKey: e.target.value } : q)
                                                                );
                                                            }}
                                                            placeholder="Digite o nome do traço..."
                                                            autoFocus
                                                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary outline-none min-w-[150px]"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsEdited(true);
                                                                setEditedQuestions(prev =>
                                                                    prev.map(q => q.id === question.id ? { ...q, traitKey: 'Abertura' } : q)
                                                                );
                                                            }}
                                                            className="text-xs text-primary hover:text-primary-hover px-2"
                                                        >
                                                            ↩ Voltar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // Modo dropdown
                                                    <select
                                                        value={translateTrait(question.traitKey)}
                                                        onChange={(e) => {
                                                            setIsEdited(true);
                                                            const newValue = e.target.value === '__custom__' ? '' : e.target.value;
                                                            setEditedQuestions(prev =>
                                                                prev.map(q => q.id === question.id ? { ...q, traitKey: newValue } : q)
                                                            );
                                                        }}
                                                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary outline-none min-w-[180px]"
                                                    >
                                                        <option value="Abertura">Abertura</option>
                                                        <option value="Conscienciosidade">Conscienciosidade</option>
                                                        <option value="Extroversão">Extroversão</option>
                                                        <option value="Amabilidade">Amabilidade</option>
                                                        <option value="Neuroticismo">Neuroticismo</option>
                                                        <option value="Liderança">Liderança</option>
                                                        <option value="Comunicação">Comunicação</option>
                                                        <option value="Trabalho em Equipe">Trabalho em Equipe</option>
                                                        <option value="Resolução de Problemas">Resolução de Problemas</option>
                                                        <option value="Criatividade">Criatividade</option>
                                                        <option value="__custom__">➕ Adicionar traço personalizado...</option>
                                                    </select>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-gray-700">Peso:</label>
                                                <input
                                                    type="number"
                                                    value={question.weight}
                                                    onChange={(e) => {
                                                        setIsEdited(true);
                                                        setEditedQuestions(prev =>
                                                            prev.map(q => q.id === question.id ? { ...q, weight: parseFloat(e.target.value) || 1 } : q)
                                                        );
                                                    }}
                                                    step="0.1"
                                                    min="-1"
                                                    max="1"
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-primary outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteQuestion(question.id)}
                                        className="text-red-400 hover:text-red-600 transition-colors p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {editedQuestions.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <p>Nenhuma pergunta cadastrada.</p>
                                <button onClick={addQuestion} className="text-primary hover:underline mt-2">
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

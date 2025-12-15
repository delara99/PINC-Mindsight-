'use client';
import { API_URL } from '@/src/config/api';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

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

export default function TakeAssessmentPage() {
    const params = useParams();
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const id = params.id as string;
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Carregar avaliação e Auto-Inicializar se necessário
    const { data: assessment, isLoading } = useQuery<Assessment>({
        queryKey: ['assessment', params.id],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar avaliação');
            const data = await response.json();
            
            // CRITICAL FIX: Garantir que o Assignment existe antes de tentar submeter
            // Se for avaliação do sistema (BIG_FIVE), chamamos o init para criar o registro 'IN_PROGRESS'
            if (data.type === 'BIG_FIVE') {
                try {
                    console.log('🔄 Auto-inicializando Big Five...');
                    await fetch(`${API_URL}/api/v1/assessments/${params.id}/start-session`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                } catch (e) {
                    console.error('⚠️ Erro ao auto-inicializar Big Five (pode já existir):', e);
                }
            }

            return data;
        }
    });

    // Submeter respostas
    const submitMutation = useMutation({
        mutationFn: async (answers: { questionId: string; value: number }[]) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${id}/submit`, { // Use id here
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao submeter avaliação');
            }

            return response.json();
        },
        onSuccess: async (data) => {
            // Invalidar queries para atualizar dados
            queryClient.invalidateQueries({ queryKey: ['user-credits'] });
            queryClient.invalidateQueries({ queryKey: ['my-assessments'] });

            // Forçar atualização do usuário no store global (créditos)
            try {
                const token = useAuthStore.getState().token;
                const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    useAuthStore.getState().updateUser(userData);
                }
            } catch (e) {
                console.error('Falha ao atualizar dados do usuário', e);
            }

            // Redirecionamento suave para os resultados
            router.push(`/dashboard/assessments/results/${data.result.assignmentId}`);
        },
        onError: (error: any) => {
            alert(error.message || 'Erro ao submeter avaliação');
        }
    });

    const handleAnswer = (questionId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));

        // Auto-avançar para próxima pergunta após 500ms
        if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
            setTimeout(() => {
                goToNext();
            }, 500);
        }
    };

    const goToNext = () => {
        if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        if (assessment && Object.keys(answers).length === assessment.questions.length) {
            const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
                questionId,
                value
            }));
            submitMutation.mutate(formattedAnswers);
        } else {
            alert('Por favor, responda todas as perguntas antes de submeter.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Avaliação não encontrada.</p>
            </div>
        );
    }

    const currentQuestion = assessment.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
    const allAnswered = Object.keys(answers).length === assessment.questions.length;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    Voltar
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
                <p className="text-gray-500 mt-2">{assessment.description}</p>
            </div>

            {/* Barra de Progresso */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                        Pergunta {currentQuestionIndex + 1} de {assessment.questions.length}
                    </span>
                    <span className="text-sm font-medium text-primary">
                        {Math.round(progress)}% concluído
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Pergunta Atual */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6">
                <p className="text-lg font-semibold text-gray-900 mb-6">
                    {currentQuestion.text}
                </p>

                {/* Escala Likert */}
                <div className="space-y-3">
                    {[
                        { value: 1, label: 'Discordo totalmente' },
                        { value: 2, label: 'Discordo' },
                        { value: 3, label: 'Neutro' },
                        { value: 4, label: 'Concordo' },
                        { value: 5, label: 'Concordo totalmente' }
                    ].map((option) => (
                        <label
                            key={option.value}
                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${answers[currentQuestion.id] === option.value
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                type="radio"
                                name={currentQuestion.id}
                                value={option.value}
                                checked={answers[currentQuestion.id] === option.value}
                                onChange={() => handleAnswer(currentQuestion.id, option.value)}
                                className="w-5 h-5 text-primary"
                            />
                            <span className="font-medium text-gray-900">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Navegação */}
            <div className="flex justify-between items-center gap-4 mt-8 pb-8">
                <button
                    onClick={goToPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>

                <div className="flex gap-2 flex-wrap justify-center mb-6 px-4">
                    {assessment.questions.map((_, index) => {
                        const isCurrent = index === currentQuestionIndex;
                        const isAnswered = !!answers[assessment.questions[index].id];
                        
                        return (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestionIndex(index)}
                                title={`Ir para questão ${index + 1} ${isAnswered ? '(Respondida)' : '(Pendente)'}`}
                                className={`
                                    w-4 h-4 rounded-full transition-all duration-300 transform
                                    ${isCurrent 
                                        ? 'scale-125 ring-2 ring-primary ring-offset-2 bg-primary' 
                                        : isAnswered 
                                            ? 'bg-emerald-500 hover:scale-110 hover:bg-emerald-600' 
                                            : 'bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                    }
                                `}
                            />
                        );
                    })}
                </div>

                {currentQuestionIndex === assessment.questions.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered || submitMutation.isPending}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        {submitMutation.isPending ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Finalizar
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={goToNext}
                        disabled={!answers[currentQuestion.id]}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        Próxima
                    </button>
                )}
            </div>

            {/* Indicador de respostas */}
            <div className="mt-6 text-center text-sm text-gray-500">
                {allAnswered ? (
                    <span className="text-green-600 font-semibold flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        Todas as perguntas respondidas! Você pode finalizar agora.
                    </span>
                ) : (
                    <span>
                        Você respondeu {Object.keys(answers).length} de {assessment.questions.length} perguntas
                    </span>
                )}
            </div>
        </div>
    );
}

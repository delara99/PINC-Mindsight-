'use client';
import { API_URL } from '@/src/config/api';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, Clock, AlertCircle, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface AssessmentAssignment {
    id: string;
    status: string;
    timeSpent: number;
    assessment: Assessment;
    responses: {
        questionId: string;
        answer: number;
    }[];
}

export default function TakeAssessmentPage() {
    const params = useParams();
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const id = params.id as string;
    
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Carregar Sessão (Assignment + Assessment + Responses)
    const { data: assignment, isLoading } = useQuery({
        queryKey: ['assessment-session', params.id],
        queryFn: async () => {
            // 1. Tentar buscar assignment existente com progresso
            let res = await fetch(`${API_URL}/api/v1/assessments/${params.id}/my-assignment`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 2. Se não existir (400/404), iniciar sessão
            if (!res.ok) {
                await fetch(`${API_URL}/api/v1/assessments/${params.id}/start-session`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Buscar novamente
                res = await fetch(`${API_URL}/api/v1/assessments/${params.id}/my-assignment`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            if (!res.ok) throw new Error('Falha ao carregar sessão de avaliação');
            const data = await res.json();

            // 3. Restaurar Estado (Resume)
            if (data.responses && Array.isArray(data.responses)) {
                const initialAnswers: Record<string, number> = {};
                data.responses.forEach((r: any) => {
                    initialAnswers[r.questionId] = r.answer;
                });
                setAnswers(initialAnswers);
            }
            
            if (typeof data.timeSpent === 'number') {
                setSeconds(data.timeSpent);
            }

            // Pular para primeira não respondida
            if (data.assessment && data.assessment.questions) {
                const firstUnanswered = data.assessment.questions.findIndex((q: any) => 
                    !data.responses?.some((r: any) => r.questionId === q.id)
                );
                if (firstUnanswered !== -1) {
                    setCurrentQuestionIndex(firstUnanswered);
                }
            }

            return data;
        },
        enabled: !!token && !!params.id,
        refetchOnWindowFocus: false
    });

    const assessment = assignment?.assessment as Assessment;

    // Mutation: Salvar Resposta Individual (Background)
    const saveAnswerMutation = useMutation({
        mutationFn: async ({ qId, val, time }: { qId: string, val: number, time: number }) => {
             await fetch(`${API_URL}/api/v1/assessments/${assessment.id}/save-answer`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ questionId: qId, value: val, timeSpent: time })
             });
        }
    });

    // Mutation: Finalizar Avaliação
    const submitMutation = useMutation({
        mutationFn: async () => {
            // Converter answers state para array
            const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
                questionId,
                value
            }));

            const response = await fetch(`${API_URL}/api/v1/assessments/${id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers: formattedAnswers })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao submeter avaliação');
            }
            return response.json();
        },
        onSuccess: async (data) => {
            queryClient.invalidateQueries({ queryKey: ['user-credits'] });
            queryClient.invalidateQueries({ queryKey: ['my-assessments'] });
            
            // Atualizar user store
            try {
                const token = useAuthStore.getState().token;
                const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
                   headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    useAuthStore.getState().updateUser(userData);
                }
            } catch (e) {}

            router.push(`/dashboard/assessments/results/${data.result.assignmentId}`);
        },
        onError: (error: any) => {
            alert(error.message || 'Erro ao submeter avaliação');
            setIsConfirmOpen(false);
        }
    });

    const handleAnswer = (questionId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        
        // Salvar em background (Optimistic UI)
        saveAnswerMutation.mutate({ qId: questionId, val: value, time: seconds });

        // Auto-avançar
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

    // Abre Modal de Confirmação
    const handleSubmitClick = () => {
        if (assessment && Object.keys(answers).length === assessment.questions.length) {
            setIsConfirmOpen(true);
        } else {
             alert('Por favor, responda todas as perguntas.');
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
    const progress = ((Object.keys(answers).length) / assessment.questions.length) * 100;
    const allAnswered = Object.keys(answers).length === assessment.questions.length;

    return (
        <div className="max-w-3xl mx-auto relative">
            {/* Header Sticky com Tempo */}
            <div className="sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-4 mb-6 border-b border-gray-200 flex justify-between items-center px-4 md:px-0">
                 <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">Voltar</span>
                </button>
                
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                    <Clock size={16} className="text-primary" />
                    <span className="font-mono font-bold text-gray-700">{formatTime(seconds)}</span>
                </div>
            </div>

            <div className="mb-8 px-4 md:px-0">
                <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
                <p className="text-gray-500 mt-2">{assessment.description}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 px-4 md:px-0">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                        Questão {currentQuestionIndex + 1} de {assessment.questions.length}
                    </span>
                    <span className="text-sm font-medium text-primary">
                        {Math.round(progress)}% respondido
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-6 mx-4 md:mx-0"
                >
                    <p className="text-lg font-semibold text-gray-900 mb-6">
                        {currentQuestion.text}
                    </p>

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
                </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-between items-center gap-4 mt-8 pb-8 px-4 md:px-0">
                <button
                    onClick={goToPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>

                 <div className="text-sm text-gray-400 hidden sm:block">
                    {saveAnswerMutation.isPending ? 'Salvando...' : 'Progresso Salvo'}
                 </div>

                {currentQuestionIndex === assessment.questions.length - 1 ? (
                    <button
                        onClick={handleSubmitClick}
                        disabled={!allAnswered}
                        className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        <CheckCircle size={20} />
                        Finalizar
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

            {/* Confirmation Modal */}
            <AnimatePresence>
                {isConfirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative"
                        >
                            <button 
                                onClick={() => setIsConfirmOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="bg-green-100 p-3 rounded-full mb-4">
                                    <CheckCircle className="text-green-600" size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Finalizar Avaliação?</h2>
                                <p className="text-gray-500 mb-6">
                                    Você respondeu todas as perguntas. Tem certeza que deseja enviar suas respostas? Essa ação não pode ser desfeita.
                                </p>
                                
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setIsConfirmOpen(false)}
                                        className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                                    >
                                        Revisar
                                    </button>
                                    <button
                                        onClick={() => submitMutation.mutate()}
                                        disabled={submitMutation.isPending}
                                        className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 flex justify-center items-center gap-2"
                                    >
                                        {submitMutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Envio'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

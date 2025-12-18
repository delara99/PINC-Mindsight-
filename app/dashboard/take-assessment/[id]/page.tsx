'use client';
import { API_URL } from '@/src/config/api';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, Clock, X, ChevronRight, ChevronLeft } from 'lucide-react';
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

    // Carregar Sessão
    const { data: assignment, isLoading } = useQuery({
        queryKey: ['assessment-session', params.id],
        queryFn: async () => {
            let res = await fetch(`${API_URL}/api/v1/assessments/${params.id}/my-assignment`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                await fetch(`${API_URL}/api/v1/assessments/${params.id}/start-session`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                res = await fetch(`${API_URL}/api/v1/assessments/${params.id}/my-assignment`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            if (!res.ok) throw new Error('Falha ao carregar sessão de avaliação');
            const data = await res.json();

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

    const saveAnswerMutation = useMutation({
        mutationFn: async ({ qId, val, time }: { qId: string, val: number, time: number }) => {
            await fetch(`${API_URL}/api/v1/assessments/${assessment.id}/save-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ questionId: qId, value: val, timeSpent: time })
            });
        }
    });

    const submitMutation = useMutation({
        mutationFn: async () => {
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

            try {
                const token = useAuthStore.getState().token;
                const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    useAuthStore.getState().updateUser(userData);
                }
            } catch (e) { }

            router.push(`/dashboard/assessments/results/${data.result.assignmentId}`);
        },
        onError: (error: any) => {
            alert(error.message || 'Erro ao submeter avaliação');
            setIsConfirmOpen(false);
        }
    });

    const handleAnswer = (questionId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        saveAnswerMutation.mutate({ qId: questionId, val: value, time: seconds });
        if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
            setTimeout(() => goToNext(), 400);
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

    const handleSubmitClick = () => {
        if (assessment && Object.keys(answers).length === assessment.questions.length) {
            setIsConfirmOpen(true);
        } else {
            alert('Por favor, responda todas as perguntas.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!assessment) return null;

    const currentQuestion = assessment.questions[currentQuestionIndex];
    const progress = ((Object.keys(answers).length) / assessment.questions.length) * 100;
    const allAnswered = Object.keys(answers).length === assessment.questions.length;

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-slate-800">
            {/* Top Bar Minimalista */}
            <header className="px-6 py-4 flex items-center justify-between bg-white z-10 sticky top-[64px] md:top-0">
                <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-700 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                        Questão {currentQuestionIndex + 1} / {assessment.questions.length}
                    </span>
                    <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                    <Clock size={16} />
                    <span className="font-mono font-medium text-sm">{formatTime(seconds)}</span>
                </div>
            </header>

            {/* Main Content Centrado */}
            <main className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-6 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {/* Pergunta */}
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-12 text-center">
                            {currentQuestion.text}
                        </h2>

                        {/* Opções */}
                        <div className="space-y-4">
                            {[
                                { value: 1, label: 'Discordo totalmente' },
                                { value: 2, label: 'Discordo' },
                                { value: 3, label: 'Neutro' },
                                { value: 4, label: 'Concordo' },
                                { value: 5, label: 'Concordo totalmente' }
                            ].map((option) => {
                                const isSelected = answers[currentQuestion.id] === option.value;
                                return (
                                    <motion.button
                                        key={option.value}
                                        whileHover={{ scale: 1.02, backgroundColor: isSelected ? undefined : "#f8fafc" }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                        className={`w-full p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-200 group
                                            ${isSelected
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-slate-100 hover:border-primary/30 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${isSelected
                                                    ? 'border-primary bg-primary text-white'
                                                    : 'border-slate-300 group-hover:border-primary/50'
                                                }`}>
                                                {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                            </div>
                                            <span className={`text-lg font-medium ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                                                {option.label}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <CheckCircle className="text-primary" size={24} />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer de Navegação */}
            <footer className="px-6 py-8 max-w-5xl mx-auto w-full">
                {/* Indicador de Progresso - Bolinhas das Perguntas */}
                <div className="mb-6 flex justify-center items-center gap-1.5 flex-wrap max-w-3xl mx-auto">
                    {assessment.questions.map((q, index) => {
                        const isAnswered = !!answers[q.id];
                        const isCurrent = index === currentQuestionIndex;

                        return (
                            <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIndex(index)}
                                title={`Pergunta ${index + 1}${isAnswered ? ' (respondida)' : ' (não respondida)'}`}
                                className={`
                                    w-8 h-8 rounded-full font-semibold text-xs transition-all
                                    ${isCurrent
                                        ? 'bg-primary text-white scale-110 ring-4 ring-primary/30'
                                        : isAnswered
                                            ? 'bg-green-500 text-white hover:scale-110'
                                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:scale-105'
                                    }
                                `}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>

                {/* Botões de Navegação */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={goToPrevious}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} />
                        Anterior
                    </button>

                    {currentQuestionIndex === assessment.questions.length - 1 ? (
                        <button
                            onClick={handleSubmitClick}
                            disabled={!allAnswered}
                            className="flex items-center gap-2 px-8 py-4 bg-primary text-white text-lg font-bold rounded-full shadow-lg shadow-primary/30 hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Finalizar Avaliação
                            <CheckCircle size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={goToNext}
                            disabled={!answers[currentQuestion.id]}
                            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:px-10"
                        >
                            Próxima
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </footer>

            {/* Modal de Confirmação Moderno */}
            <AnimatePresence>
                {isConfirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setIsConfirmOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 relative z-10 shadow-2xl"
                        >
                            <button
                                onClick={() => setIsConfirmOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center">
                                <div className="w-20 h-20 bg-green-100/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="text-green-600 w-10 h-10" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Tudo pronto!</h2>
                                <p className="text-slate-500 mb-8 text-lg">
                                    Você respondeu todas as {assessment.questions.length} perguntas. Deseja enviar seus resultados agora?
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => submitMutation.mutate()}
                                        disabled={submitMutation.isPending}
                                        className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-95 flex justify-center items-center gap-2"
                                    >
                                        {submitMutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar e Enviar'}
                                    </button>
                                    <button
                                        onClick={() => setIsConfirmOpen(false)}
                                        className="w-full py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                                    >
                                        Revisar respostas
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

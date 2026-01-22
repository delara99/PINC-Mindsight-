'use client';
import { API_URL } from '@/src/config/api';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function EmployeeTakeAssessmentPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const id = params.id as string;
    const [token, setToken] = useState<string | null>(null);

    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        const t = localStorage.getItem('accessToken');
        if (t) setToken(t);
        else router.push('/business/login');
    }, [router]);

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
            if (!token) return null;
            let res = await fetch(`${API_URL}/api/v1/assessments/${params.id}/my-assignment`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                // Tenta iniciar sessão se não existir
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
        refetchOnWindowFocus: false,
        retry: 1
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
            // REDIRECIONAR PARA RELATÓRIOS DO EMPREGADO
            router.push(`/business/employee/reports?success=true`);
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


    if (isLoading || !token) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700">Carregando avaliação...</h2>
                    <p className="text-slate-400 mt-2">Por favor, aguarde.</p>
                </div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <X className="text-red-500 w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Avaliação Indisponível</h2>
                    <p className="text-slate-500 mb-8">
                        Não foi possível carregar esta avaliação. Ela pode ter sido removida ou você não possui permissão para acessá-la.
                    </p>
                    <button
                        onClick={() => router.push('/business/employee/inventory')}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        Voltar para Lista
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = assessment.questions[currentQuestionIndex];
    if (!currentQuestion) return <div>Questão não encontrada.</div>;

    const progress = ((Object.keys(answers).length) / assessment.questions.length) * 100;
    const allAnswered = Object.keys(answers).length === assessment.questions.length;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans text-slate-800 relative">
            {/* Top Bar Minimalista */}
            <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
                <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1">
                    <ArrowLeft size={18} /> <span className="text-sm font-bold">Voltar</span>
                </button>
                <div className="flex flex-col items-center flex-1 mx-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                        Questão {currentQuestionIndex + 1} / {assessment.questions.length}
                    </span>
                    <div className="w-full max-w-xs h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-purple-600"
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
            <main className="flex flex-col justify-center w-full px-6 py-12 max-w-3xl mx-auto min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {/* Pergunta */}
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-8 text-center">
                            {currentQuestion.text}
                        </h2>

                        {/* Opções */}
                        <div className="space-y-3">
                            {[
                                { value: 1, label: 'Discordo totalmente' },
                                { value: 2, label: 'Discordo' },
                                { value: 3, label: 'Neutro' },
                                { value: 4, label: 'Concordo' },
                                { value: 5, label: 'Concordo totalmente' }
                            ].map((option) => {
                                const isSelected = answers[currentQuestion.id] === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                        className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all duration-200 group
                                            ${isSelected
                                                ? 'border-purple-600 bg-purple-50 shadow-sm'
                                                : 'border-slate-100 hover:border-purple-200 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                                ${isSelected
                                                    ? 'border-purple-600 bg-purple-600 text-white'
                                                    : 'border-slate-300 group-hover:border-purple-400'
                                                }`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className={`text-base font-medium ${isSelected ? 'text-purple-700' : 'text-slate-600'}`}>
                                                {option.label}
                                            </span>
                                        </div>
                                        {isSelected && <CheckCircle className="text-purple-600" size={20} />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer de Navegação */}
            <footer className="px-6 py-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center max-w-3xl mx-auto">
                    <button
                        onClick={goToPrevious}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-slate-500 hover:bg-slate-200/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} />
                        Anterior
                    </button>

                    {currentQuestionIndex === assessment.questions.length - 1 ? (
                        <button
                            onClick={handleSubmitClick}
                            disabled={!allAnswered}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white text-base font-bold rounded-lg shadow-lg shadow-purple-600/30 hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Finalizar Avaliação
                            <CheckCircle size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={goToNext}
                            disabled={!answers[currentQuestion.id]}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Próxima
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </footer>

            {/* Modal de Confirmação */}
            <AnimatePresence>
                {isConfirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setIsConfirmOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-2xl p-6 relative z-10 shadow-2xl"
                        >
                            <button
                                onClick={() => setIsConfirmOpen(false)}
                                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-green-600 w-8 h-8" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2">Tudo pronto!</h2>
                                <p className="text-slate-500 mb-6 text-sm">
                                    Deseja enviar seus resultados agora?
                                </p>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => submitMutation.mutate()}
                                        disabled={submitMutation.isPending}
                                        className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all flex justify-center items-center gap-2"
                                    >
                                        {submitMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : 'Enviar Respostas'}
                                    </button>
                                    <button
                                        onClick={() => setIsConfirmOpen(false)}
                                        className="w-full py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors text-sm"
                                    >
                                        Revisar (Voltar)
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

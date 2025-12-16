'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PlayCircle, Loader2, Clock, CheckCircle2, BrainCircuit, Award, CreditCard, Wallet, ArrowRight, AlertCircle, TrendingUp, Calendar, History, RefreshCw, X, Sparkles, ChevronRight } from 'lucide-react';
import { API_URL } from '@/src/config/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Assessment {
    id: string;
    title: string;
    description: string;
    type: string;
    assignmentStatus?: string;
    assignedAt?: string;
    completedAt?: string;
    feedback?: string;
}

export default function MyAssessmentsPage() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const [isNudgeOpen, setIsNudgeOpen] = useState(false);

    // Carregar avaliações atribuídas ao usuário (Endpoint dedicado)
    const { data: assessments, isLoading } = useQuery<Assessment[]>({
        queryKey: ['my-assessments'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/assessments/my-assignments-list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar suas avaliações');
            return response.json();
        },
        enabled: !!token
    });

    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    // Mock de adicionar créditos
    const handleAddCredit = async () => {
        try {
            const response = await fetch(`${API_URL}/api/v1/users/request-credit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Solicitação enviada! Aguarde a liberação dos créditos.');
            } else {
                const data = await response.json();
                alert(data.message || 'Erro ao enviar solicitação.');
            }
        } catch (error) {
            alert('Erro de conexão ao enviar solicitação.');
        }

        setIsPurchaseModalOpen(false);
    };


    const handleStartAssessment = async (assessment: Assessment) => {
        if ((user?.credits || 0) < 1) {
            setIsPurchaseModalOpen(true);
            return;
        }

        // Se for Big Five, inicializa antes de navegar para garantir que o assignment existe
        if (assessment.type === 'BIG_FIVE') {
            try {
                // Tenta inicializar Sessão para ESTE ID específico
                await fetch(`${API_URL}/api/v1/assessments/${assessment.id}/start-session`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Erro pre-flight init:', error);
            }
        }

        router.push(`/dashboard/take-assessment/${assessment.id}`);
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        switch (status) {
            case 'PENDING':
                return <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold"><Clock size={12} /> Pendente</div>;
            case 'IN_PROGRESS':
                return <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold"><PlayCircle size={12} /> Em Andamento</div>;
            case 'COMPLETED':
                return <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 size={12} /> Concluída</div>;
            default:
                return null;
        }
    };

    // Separação e Agrupamento
    const completedAssessments = assessments?.filter(a => a.assignmentStatus === 'COMPLETED') || [];
    const pendingAssessments = assessments?.filter(a => a.assignmentStatus !== 'COMPLETED') || [];

    const groupedHistory = completedAssessments.reduce((groups, assessment) => {
        // Usar completedAt se existir, senão assignedAt, senão agora (fallback)
        const date = assessment.completedAt ? new Date(assessment.completedAt) : (assessment.assignedAt ? new Date(assessment.assignedAt) : new Date());
        // Capitalize first letter logic handled by CSS or standard formatted string
        const key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const keyCapitalized = key.charAt(0).toUpperCase() + key.slice(1);
        
        if (!groups[keyCapitalized]) groups[keyCapitalized] = [];
        groups[keyCapitalized].push(assessment);
        return groups;
    }, {} as Record<string, Assessment[]>);

    // Efeito Nudge (Simulação: Se tiver pelo menos 1 concluída, sugere renovação)
    useEffect(() => {
        if (completedAssessments.length > 0) {
            const timer = setTimeout(() => setIsNudgeOpen(true), 1500); // Delay suave
            return () => clearTimeout(timer);
        }
    }, [completedAssessments.length]);

    return (
        <div className="space-y-12">
            {/* Header com Créditos */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Jornada de Evolução</h1>
                    <p className="text-gray-500 mt-1">
                        Acompanhe seu crescimento e planeje seus próximos passos.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex flex-col items-end px-2 border-r border-gray-100">
                        <span className="text-xs text-gray-400 font-bold uppercase">Seus Créditos</span>
                        <span className={`text-xl font-bold ${(user?.credits || 0) < 1 ? 'text-red-500' : 'text-primary'}`}>
                            {user?.credits || 0}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsPurchaseModalOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
                    >
                        <CreditCard size={16} />
                        Adicionar Crédito
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Seção 1: Avaliações Disponíveis (Cardápio do dia) */}
                    {pendingAssessments.length > 0 ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <PlayCircle className="text-primary" /> Disponíveis Agora
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pendingAssessments.map((assessment) => (
                                    <div key={assessment.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                                         {/* Lógica de Bloqueio/Crédito (igual original) */}
                                         {assessment.assignmentStatus !== 'COMPLETED' && (user?.credits || 0) < 1 && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-6 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="bg-white p-4 rounded-xl shadow-xl border border-red-100 transform scale-100">
                                                    <Wallet className="mx-auto text-red-500 mb-2" size={24} />
                                                    <p className="font-bold text-gray-800 text-sm mb-1">Crédito Necessário</p>
                                                    <button onClick={() => setIsPurchaseModalOpen(true)} className="text-primary text-xs font-bold hover:underline">Adicionar Saldo</button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                                {assessment.type === 'BIG_FIVE' ? 'Big Five' : assessment.type}
                                            </span>
                                            {getStatusBadge(assessment.assignmentStatus)}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{assessment.title}</h3>
                                        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{assessment.description || 'Sem descrição.'}</p>
                                        <button
                                            onClick={() => handleStartAssessment(assessment)}
                                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${(user?.credits || 0) < 1
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 hover:scale-[1.02]'
                                                }`}
                                        >
                                            {(user?.credits || 0) < 1 ? <><Wallet size={18} /> Comprar Crédito</> : <><PlayCircle size={18} /> Iniciar Agora</>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Estado vazio de pendentes (se não tiver histórico também, mostra empty state geral)
                        completedAssessments.length === 0 && (
                            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BrainCircuit className="text-gray-400" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma avaliação disponível</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">Aguarde novas atribuições para iniciar sua jornada.</p>
                            </div>
                        )
                    )}

                    {/* Seção 2: Histórico de Evolução (Timeline Visual) */}
                    {completedAssessments.length > 0 && (
                        <div className="pt-8 border-t border-gray-200">
                            {/* Banner Marketing de Recorrência */}
                            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden mb-12 shadow-2xl shadow-indigo-200">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10 max-w-2xl">
                                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4 border border-white/20">
                                        <Sparkles size={14} className="text-yellow-300" /> Growth Mindset
                                    </div>
                                    <h2 className="text-3xl font-extrabold mb-4 leading-tight">
                                        Você não é a mesma pessoa de 6 meses atrás.
                                    </h2>
                                    <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                                        O mercado muda, você evolui. Refazer seu inventário periodicamente é a chave para acompanhar seu crescimento e calibrar sua bússola profissional.
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <button 
                                            onClick={() => router.push('/dashboard/plans')}
                                            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw size={20} />
                                            Atualizar meu Perfil Agora
                                        </button>
                                        <button className="px-6 py-3 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-colors">
                                            Saiba como funciona
                                        </button>
                                    </div>
                                </div>
                                <div className="hidden lg:block absolute bottom-0 right-10 opacity-20">
                                    <TrendingUp size={300} />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-8">
                                <History className="text-gray-400" size={24} />
                                <h2 className="text-2xl font-bold text-gray-900">Histórico de Evolução</h2>
                            </div>

                            {/* Timeline Grouping */}
                            <div className="relative pl-8 border-l-2 border-gray-100 space-y-12">
                                {Object.entries(groupedHistory).map(([dateKey, items], index) => (
                                    <div key={dateKey} className="relative animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                                        {/* Bolinha da Timeline */}
                                        <div className="absolute -left-[41px] top-0 bg-white border-4 border-indigo-100 w-6 h-6 rounded-full flex items-center justify-center z-10" />
                                        
                                        <div className="mb-6">
                                            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                                {dateKey}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {items.map((assessment) => (
                                                <div key={assessment.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer"
                                                     onClick={() => router.push(`/dashboard/assessments/results/${(assessment as any).assignmentId || assessment.id}`)}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                                                            <Award size={20} />
                                                        </div>
                                                        <ArrowRight className="text-gray-300 group-hover:text-indigo-500 transition-colors" size={20} />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 mb-1">{assessment.title}</h3>
                                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{assessment.description}</p>
                                                    <div className="text-xs font-medium text-indigo-600 flex items-center gap-1">
                                                        Ver Análise Completa
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Nudge (Pop-up de Recorrência) */}
            <AnimatePresence>
                {isNudgeOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 pointer-events-auto overflow-hidden sm:mr-8 sm:mb-8"
                        >
                            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-1 h-2" />
                            <div className="p-6 relative">
                                <button 
                                    onClick={() => setIsNudgeOpen(false)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex gap-4">
                                    <div className="bg-pink-100 p-3 rounded-full h-fit shrink-0">
                                        <RefreshCw className="text-pink-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">Hora de atualizar?</h3>
                                        <p className="text-gray-600 text-sm mb-4">
                                            Sua última análise foi incrível, mas você já mudou desde então. Que tal ver sua nova versão?
                                        </p>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => { setIsNudgeOpen(false); router.push('/dashboard/plans'); }}
                                                className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                                            >
                                                Ver Planos
                                            </button>
                                            <button 
                                                onClick={() => setIsNudgeOpen(false)}
                                                className="text-gray-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                                            >
                                                Agora não
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Compra (Mantido) */}
            {isPurchaseModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
                        <div className="bg-primary p-6 text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Adicionar Créditos</h2>
                            <p className="text-primary-foreground/80 text-sm">
                                Invista no seu desenvolvimento profissional
                            </p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="text-center">
                                <p className="text-gray-600 mb-4">
                                    Para adquirir novos créditos, realize o pagamento via <strong>PIX</strong> utilizando a chave abaixo:
                                </p>
                                <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 flex items-center justify-between gap-3 group">
                                    <code className="text-lg font-mono font-bold text-gray-800 select-all">00.000.000/0001-00</code>
                                    <button onClick={() => navigator.clipboard.writeText('00.000.000/0001-00')} className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-primary transition-colors" title="Copiar chave">
                                        <CheckCircle2 size={20} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">CNPJ: Empresa Demo LTDA</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex gap-3">
                                <AlertCircle className="shrink-0" size={20} />
                                <p>Após realizar o pagamento, envie o comprovante para o administrador para a liberação dos créditos.</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setIsPurchaseModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors">Cancelar</button>
                                <button onClick={handleAddCredit} className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-colors">Confirmar Pagamento</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
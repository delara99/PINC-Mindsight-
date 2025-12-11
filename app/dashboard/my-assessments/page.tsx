'use client';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlayCircle, Loader2, Clock, CheckCircle2, BrainCircuit, Award, CreditCard, Wallet, ArrowRight, AlertCircle } from 'lucide-react';

interface Assessment {
    id: string;
    title: string;
    description: string;
    type: string;
    assignmentStatus?: string;
    assignedAt?: string;
    feedback?: string;
}

export default function MyAssessmentsPage() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    const { data: assessments, isLoading } = useQuery<Assessment[]>({
        queryKey: ['my-assessments'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/assessments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar avaliações');
            return response.json();
        }
    });

    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const updateUser = useAuthStore((state) => state.updateUser);

    // Mock de adicionar créditos (para demo)
    const handleAddCredit = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/users/request-credit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Solicitação enviada! Aguarde a liberação dos créditos pelo administrador após a conferência do pagamento.');
            } else {
                const data = await response.json();
                alert(data.message || 'Erro ao enviar solicitação.');
            }
        } catch (error) {
            alert('Erro de conexão ao enviar solicitação.');
        }

        setIsPurchaseModalOpen(false);
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;

        switch (status) {
            case 'PENDING':
                return (
                    <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold">
                        <Clock size={12} />
                        Pendente
                    </div>
                );
            case 'IN_PROGRESS':
                return (
                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold">
                        <PlayCircle size={12} />
                        Em Andamento
                    </div>
                );
            case 'COMPLETED':
                return (
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                        <CheckCircle2 size={12} />
                        Concluída
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Avaliações Disponíveis</h1>
                    <p className="text-gray-500 mt-1">
                        Gerencie e responda às suas avaliações pendentes.
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

            {/* Alerta de Poucos Créditos Global */}
            {(user?.credits || 0) < 1 && assessments && assessments.length > 0 && assessments.some(a => a.assignmentStatus !== 'COMPLETED') && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-4 animate-fadeIn">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800">Créditos Insuficientes</h3>
                        <p className="text-red-600 text-sm mt-1">
                            Você possui avaliações pendentes mas não tem créditos suficientes para iniciá-las.
                            Adicione novos créditos para continuar seu desenvolvimento.
                        </p>
                        <button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="mt-3 text-red-700 font-bold text-sm hover:underline flex items-center gap-1"
                        >
                            Comprar Créditos Agora <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-primary" />
                </div>
            ) : assessments?.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BrainCircuit className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma avaliação disponível</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Aguarde enquanto o administrador atribui avaliações para você.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments?.map((assessment) => (
                        <div key={assessment.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            {/* Overlay de Bloqueio se sem créditos */}
                            {assessment.assignmentStatus !== 'COMPLETED' && (user?.credits || 0) < 1 && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-6 text-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-white p-4 rounded-xl shadow-xl border border-red-100 transform scale-100">
                                        <Wallet className="mx-auto text-red-500 mb-2" size={24} />
                                        <p className="font-bold text-gray-800 text-sm mb-1">Crédito Necessário</p>
                                        <button
                                            onClick={() => setIsPurchaseModalOpen(true)}
                                            className="text-primary text-xs font-bold hover:underline"
                                        >
                                            Adicionar Saldo
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                    {assessment.type === 'BIG_FIVE' ? 'Big Five' : assessment.type}
                                </span>
                                {getStatusBadge(assessment.assignmentStatus)}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                                {assessment.title}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                {assessment.description || 'Sem descrição.'}
                            </p>

                            <div className={`flex items-center justify-between text-xs border-t border-gray-50 pt-4 mb-4 ${(user?.credits || 0) < 1 && assessment.assignmentStatus !== 'COMPLETED' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                <div>Custo: <strong className={assessment.assignmentStatus !== 'COMPLETED' && (user?.credits || 0) < 1 ? 'text-red-600' : 'text-primary'}>1 Crédito</strong></div>
                                {assessment.assignedAt && (
                                    <div className="text-gray-400">Atribuída em {new Date(assessment.assignedAt).toLocaleDateString('pt-BR')}</div>
                                )}
                            </div>

                            {assessment.assignmentStatus === 'COMPLETED' ? (
                                // Botão Ver Resultados para avaliações concluídas
                                <button
                                    onClick={() => {
                                        // Usar o assignmentId retornado pelo backend
                                        const assignmentIdToUse = (assessment as any).assignmentId || assessment.id;
                                        router.push(`/dashboard/assessments/results/${assignmentIdToUse}`);
                                    }}
                                    className="w-full py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-pink-600 text-white hover:shadow-lg shadow-primary/20"
                                >
                                    <Award size={18} />
                                    Ver Resultados
                                </button>
                            ) : (
                                // Botão original para avaliações pendentes
                                <button
                                    onClick={() => {
                                        if ((user?.credits || 0) >= 1) {
                                            router.push(`/dashboard/take-assessment/${assessment.id}`);
                                        } else {
                                            setIsPurchaseModalOpen(true);
                                        }
                                    }}
                                    className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${(user?.credits || 0) < 1
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                        : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'
                                        }`}
                                >
                                    {(user?.credits || 0) < 1 ? (
                                        <>
                                            <Wallet size={18} />
                                            Comprar Crédito
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle size={18} />
                                            Iniciar Agora
                                        </>
                                    )}
                                </button>
                            )}

                            {assessment.feedback && (
                                <div className="mt-4 bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-sm text-yellow-800">
                                    <strong className="block mb-1 font-semibold flex items-center gap-1">
                                        <Award className="w-4 h-4" />
                                        Feedback do Especialista:
                                    </strong>
                                    {assessment.feedback}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Compra */}
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
                                    <code className="text-lg font-mono font-bold text-gray-800 select-all">
                                        00.000.000/0001-00
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText('00.000.000/0001-00')}
                                        className="p-2 hover:bg-white rounded-lg text-gray-500 hover:text-primary transition-colors"
                                        title="Copiar chave"
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    CNPJ: Empresa Demo LTDA
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex gap-3">
                                <AlertCircle className="shrink-0" size={20} />
                                <p>
                                    Após realizar o pagamento, envie o comprovante para o administrador para a liberação dos créditos.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsPurchaseModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddCredit}
                                    className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-colors"
                                >
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

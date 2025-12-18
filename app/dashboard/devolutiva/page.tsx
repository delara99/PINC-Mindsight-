'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { API_URL } from '@/src/config/api';
import { Lock, Sparkles, Phone, CheckCircle2, Calendar, Clock, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DevolutivaPage() {
    const token = useAuthStore((state) => state.token);
    const [phone, setPhone] = useState('');
    const [selectedAssignments, setSelectedAssignments] = useState<any[]>([]);

    // Buscar inventários completados do usuário
    const { data: completedInventories } = useQuery({
        queryKey: ['my-completed-inventories'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/assessments/my-completed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar inventários');
            return res.json();
        }
    });

    // Buscar status da solicitação se houver
    const { data: feedbackStatus, refetch } = useQuery({
        queryKey: ['feedback-status', selectedAssignments[0]?.id],
        enabled: selectedAssignments.length > 0,
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/feedback/my-request/${selectedAssignments[0].id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return null;
            return res.json();
        }
    });

    // Mutation para solicitar devolutiva
    const requestMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/feedback/request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assignmentId: selectedAssignments[0].id, // Por enquanto primeiro selecionado
                    phone
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Erro ao solicitar devolutiva');
            }
            return res.json();
        },
        onSuccess: () => {
            alert('✅ Solicitação enviada com sucesso! Um especialista entrará em contato pelo número informado para combinar os detalhes da reunião.');
            refetch();
        },
        onError: (error: any) => {
            alert('❌ Erro ao enviar solicitação: ' + error.message);
        }
    });

    const isUnlocked = feedbackStatus?.status === 'COMPLETED';

    const toggleAssignment = (inv: any) => {
        setSelectedAssignments(prev => {
            const exists = prev.find(a => a.id === inv.id);
            if (exists) {
                return prev.filter(a => a.id !== inv.id);
            } else {
                return [...prev, inv];
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    <Sparkles size={16} />
                    Funcionalidade Premium
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Fale com um Especialista
                </h1>
                <p className="text-xl text-gray-900 font-semibold mb-2">
                    Devolutiva Profissional
                </p>
                <p className="text-gray-700 leading-relaxed">
                    Tenha acesso a uma análise aprofundada do seu perfil com suporte de um especialista em comportamento humano.
                </p>
            </div>

            {/* Benefícios */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">O que você ganha:</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Conversa Individual</h3>
                            <p className="text-sm text-gray-700 mt-1">
                                Atendimento online personalizado focado em você
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">1 Hora de Sessão</h3>
                            <p className="text-sm text-gray-700 mt-1">
                                Tempo dedicado para esclarecer todas as suas dúvidas
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Relatório Completo</h3>
                            <p className="text-sm text-gray-700 mt-1">
                                Acesso liberado ao relatório profissional detalhado
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seleção de Inventário */}
            {completedInventories && completedInventories.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Selecione um ou mais inventários:</h2>
                    <p className="text-sm text-gray-700 mb-4">Você pode selecionar múltiplos inventários para a devolutiva</p>
                    <div className="grid gap-3">
                        {completedInventories.map((inv: any) => {
                            const isSelected = selectedAssignments.some(a => a.id === inv.id);
                            return (
                                <button
                                    key={inv.id}
                                    onClick={() => toggleAssignment(inv)}
                                    className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{inv.assessmentTitle}</p>
                                            <p className="text-sm text-gray-700 mt-1">
                                                Concluído em {new Date(inv.completedAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        {isSelected && <CheckCircle2 size={24} className="text-primary" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Preview do Relatório ou Acesso Liberado */}
            {selectedAssignments.length > 0 && (
                <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {isUnlocked ? (
                        // Relatório Liberado - Mostrar card com link
                        <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle2 size={32} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-900">✅ Relatório Completo Liberado!</h3>
                                    <p className="text-gray-700 mt-1">Sua devolutiva foi atendida. O relatório profissional está disponível.</p>
                                </div>
                            </div>
                            <Link href={`/dashboard/reports/${selectedAssignments[0].id}`}>
                                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                    <FileText size={20} />
                                    Ver Relatório Completo Profissional
                                </button>
                            </Link>
                        </div>
                    ) : (
                        // Relatório Bloqueado - Preview com Blur
                        <>
                            <div className="p-8 filter blur-md select-none">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Relatório Profissional Big Five</h3>
                                {/* Simulação de conteúdo */}
                                <div className="space-y-4">
                                    <div className="h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg"></div>
                                    <div className="h-32 bg-gradient-to-r from-green-100 to-yellow-100 rounded-lg"></div>
                                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                                    <p className="text-gray-700 leading-relaxed">
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                                    </p>
                                </div>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
                                <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-4">
                                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Lock size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Relatório Completo Bloqueado
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        Este relatório detalhado é liberado apenas com a Devolutiva Profissional
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Formulário de Solicitação */}
            {selectedAssignments.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitar Devolutiva</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                <Phone size={16} className="inline mr-2" />
                                Telefone para Contato
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(00) 00000-0000"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900"
                            />
                        </div>
                        <button
                            onClick={() => requestMutation.mutate()}
                            disabled={requestMutation.isPending || !phone}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {requestMutation.isPending ? 'Enviando...' : '🎯 Solicitar Devolutiva Profissional'}
                        </button>
                    </div>
                </div>
            )}

            {/* Status da Solicitação */}
            {feedbackStatus && (
                <div className={`border-2 rounded-2xl p-6 ${feedbackStatus.status === 'COMPLETED' ? 'border-green-500 bg-green-50' :
                    feedbackStatus.status === 'CANCELLED' ? 'border-red-500 bg-red-50' :
                        'border-yellow-500 bg-yellow-50'
                    }`}>
                    <h3 className="text-xl font-bold mb-2">
                        {feedbackStatus.status === 'COMPLETED' && '✅ Devolutiva Atendida!'}
                        {feedbackStatus.status === 'PENDING' && '⏳ Solicitação Pendente'}
                        {feedbackStatus.status === 'SCHEDULED' && '📅 Devolutiva Agendada'}
                        {feedbackStatus.status === 'CANCELLED' && '❌ Solicitação Cancelada'}
                    </h3>
                    <p className="text-gray-700">
                        {feedbackStatus.status === 'COMPLETED' && 'Seu relatório completo foi liberado! Role para cima para visualizar.'}
                        {feedbackStatus.status === 'PENDING' && 'Um especialista entrará em contato pelo número informado para combinar os detalhes da reunião.'}
                        {feedbackStatus.status === 'SCHEDULED' && `Reunião agendada para ${new Date(feedbackStatus.scheduledAt).toLocaleString('pt-BR')}`}
                        {feedbackStatus.status === 'CANCELLED' && 'Esta solicitação foi cancelada. Entre em contato conosco para mais informações.'}
                    </p>
                </div>
            )}

            {completedInventories && completedInventories.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <p className="text-gray-600">Você precisa completar um inventário primeiro.</p>
                    <Link href="/dashboard">
                        <button className="mt-4 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors">
                            Ir para Dashboard
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}

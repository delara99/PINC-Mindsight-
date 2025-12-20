'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import Link from 'next/link';
import Router from 'next/router';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, FileText, Calendar, Users, BrainCircuit, X, Copy, Edit, Trash2, Star } from 'lucide-react';
import { useState } from 'react';
import { API_URL } from '@/src/config/api';

interface Assessment {
    id: string;
    title: string;
    description: string;
    type: string;
    createdAt: string;
    _count?: {
        assignments: number;
    };
    isTemplate?: boolean;
    questionCount?: number;
    isDefault?: boolean;
}

interface Client {
    id: string;
    name: string;
    email: string;
}

export default function AssessmentsListPage() {
    const token = useAuthStore((state) => state.token);
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);

    // Estados para modal de candidatos atribuídos
    const [isViewCandidatesModalOpen, setIsViewCandidatesModalOpen] = useState(false);
    const [viewingAssessmentId, setViewingAssessmentId] = useState<string | null>(null);

    const { data: assessments, isLoading, error } = useQuery<Assessment[]>({
        queryKey: ['assessments'],
        queryFn: async () => {
            console.log('🔍 Buscando avaliações (incluindo templates)...');
            const response = await fetch(`${API_URL}/api/v1/assessments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar avaliações');
            const data = await response.json();
            console.log('✅ Avaliações recebidas:', data.length, 'itens');
            console.log('📊 Templates encontrados:', data.filter((a: any) => a.isTemplate).length);
            return data;
        }
    });

    // Mutation para clonar avaliação
    const cloneMutation = useMutation({
        mutationFn: async (assessmentId: string) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/templates/${assessmentId}/clone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            });
            if (!response.ok) throw new Error('Erro ao clonar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            alert('Avaliação clonada com sucesso!');
        },
        onError: () => {
            alert('Erro ao clonar avaliação.');
        }
    });

    // Mutation para deletar avaliação
    const deleteMutation = useMutation({
        mutationFn: async (assessmentId: string) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${assessmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao deletar');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            alert('Avaliação deletada com sucesso!');
        },
        onError: (error: any) => {
            console.error('Erro ao deletar:', error);
            alert('Erro ao deletar avaliação: ' + (error.message || 'Erro desconhecido'));
        }
    });

    // Mutation para definir padrão
    const setDefaultMutation = useMutation({
        mutationFn: async (assessmentId: string) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${assessmentId}/set-default`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Erro ao definir padrão');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
        },
        onError: (err: any) => alert(err.message)
    });

    const { data: clients } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/users/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar clientes');
            return response.json();
        },
        enabled: isApplyModalOpen
    });

    const applyAssessment = useMutation({
        mutationFn: async ({ assessmentId, userIds }: { assessmentId: string, userIds: string[] }) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${assessmentId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userIds })
            });
            if (!response.ok) throw new Error('Falha ao aplicar avaliação');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            setIsApplyModalOpen(false);
            setSelectedClients([]);
            alert('Avaliação aplicada com sucesso!');
        },
        onError: () => {
            alert('Erro ao aplicar avaliação.');
        }
    });

    // Query para buscar candidatos atribuídos
    const { data: assignedCandidates, refetch: refetchCandidates } = useQuery({
        queryKey: ['assigned-candidates', viewingAssessmentId],
        queryFn: async () => {
            if (!viewingAssessmentId) return [];
            const response = await fetch(`${API_URL}/api/v1/assessments/${viewingAssessmentId}/assignments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar candidatos');
            return response.json();
        },
        enabled: !!viewingAssessmentId && isViewCandidatesModalOpen
    });

    // Mutation para remover atribuição
    const removeAssignment = useMutation({
        mutationFn: async ({ assessmentId, userId }: { assessmentId: string, userId: string }) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${assessmentId}/assignments/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao remover atribuição');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            refetchCandidates();
            alert('Candidato removido com sucesso!');
        },
        onError: () => {
            alert('Erro ao remover candidato.');
        }
    });

    const openApplyModal = (assessmentId: string) => {
        setSelectedAssessment(assessmentId);
        setIsApplyModalOpen(true);
    };

    const openViewCandidatesModal = (assessmentId: string) => {
        setViewingAssessmentId(assessmentId);
        setIsViewCandidatesModalOpen(true);
    };

    const toggleClient = (clientId: string) => {
        setSelectedClients(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Minhas Avaliações</h1>
                    <p className="text-gray-500 mt-1">Gerencie os questionários disponíveis para aplicação.</p>
                </div>
                <div className="flex gap-3">

                    <Link href="/dashboard/assessments/new">
                        <button className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                            <Plus size={18} />
                            Nova Avaliação
                        </button>
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    Erro ao carregar avaliações. Tente recarregar a página.
                </div>
            ) : assessments?.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BrainCircuit className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma avaliação criada</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">Comece criando seu primeiro questionário para avaliar competências.</p>
                    <Link href="/dashboard/assessments/new">
                        <button className="text-primary font-bold hover:underline">
                            Criar primeira avaliação
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments?.map((assessment) => (
                        <div key={assessment.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                        {assessment.type === 'BIG_FIVE' ? 'Big Five' : assessment.type}
                                    </span>
                                    {assessment.isTemplate && (
                                        <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase">
                                            Template
                                        </span>
                                    )}
                                    {assessment.isDefault && (
                                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1 border border-amber-200">
                                            <Star size={10} fill="currentColor" />
                                            Padrão
                                        </span>
                                    )}
                                    {!assessment.isDefault && !assessment.isTemplate && (
                                        <button
                                            onClick={() => setDefaultMutation.mutate(assessment.id)}
                                            disabled={setDefaultMutation.isPending}
                                            className="text-gray-300 hover:text-amber-500 transition-colors p-1 rounded-full hover:bg-amber-50"
                                            title="Definir como Avaliação Padrão"
                                        >
                                            <Star size={16} />
                                        </button>
                                    )}
                                </div>
                                {!assessment.isTemplate && (
                                    <button
                                        onClick={() => {
                                            if (confirm(`Tem certeza que deseja deletar "${assessment.title}"? Esta ação não pode ser desfeita e irá remover todos os candidatos e respostas associados.`)) {
                                                deleteMutation.mutate(assessment.id);
                                            }
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                        title="Deletar avaliação"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                {assessment.title}
                            </h3>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                {assessment.description || 'Sem descrição.'}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-4">
                                <div className="flex items-center gap-1">
                                    {assessment.isTemplate ? (
                                        <>
                                            <FileText size={14} />
                                            {assessment.questionCount || 0} perguntas
                                        </>
                                    ) : (
                                        <>
                                            <Calendar size={14} />
                                            {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}
                                        </>
                                    )}
                                </div>
                                {!assessment.isTemplate && (
                                    <div className="flex items-center gap-1">
                                        <Users size={14} />
                                        {assessment._count?.assignments || 0} Candidato{(assessment._count?.assignments || 0) !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 flex gap-2">
                                {assessment.isTemplate ? (
                                    // Botões para Templates
                                    <>
                                        <button
                                            onClick={() => router.push(`/dashboard/assessments/${assessment.id}`)}
                                            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-colors"
                                        >
                                            Visualizar
                                        </button>
                                        <button
                                            onClick={() => cloneMutation.mutate(assessment.id)}
                                            disabled={cloneMutation.isPending}
                                            className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <Copy size={16} />
                                            {cloneMutation.isPending ? 'Clonando...' : 'Clonar'}
                                        </button>
                                    </>
                                ) : (
                                    // Botões para Avaliações Normais
                                    <>
                                        <button
                                            onClick={() => router.push(`/dashboard/assessments/${assessment.id}`)}
                                            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Edit size={14} />
                                            Editar
                                        </button>
                                        {(assessment._count?.assignments || 0) > 0 && (
                                            <button
                                                onClick={() => openViewCandidatesModal(assessment.id)}
                                                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 rounded-lg text-sm transition-colors"
                                            >
                                                Candidatos
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openApplyModal(assessment.id)}
                                            className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover transition-colors"
                                        >
                                            Aplicar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Aplicar */}
            {isApplyModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">Aplicar Avaliação</h3>
                                <p className="text-gray-500 mt-1">Selecione os clientes que responderão esta avaliação.</p>
                            </div>
                            <button onClick={() => setIsApplyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-6">
                            {clients?.map((client) => (
                                <label
                                    key={client.id}
                                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedClients.includes(client.id)}
                                        onChange={() => toggleClient(client.id)}
                                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                                    />
                                    <div>
                                        <div className="font-bold text-gray-900">{client.name || 'Sem nome'}</div>
                                        <div className="text-sm text-gray-500">{client.email}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <button
                                onClick={() => setIsApplyModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => selectedAssessment && applyAssessment.mutate({ assessmentId: selectedAssessment, userIds: selectedClients })}
                                disabled={applyAssessment.isPending || selectedClients.length === 0}
                                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {applyAssessment.isPending && <Loader2 size={16} className="animate-spin" />}
                                Aplicar para {selectedClients.length} cliente(s)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Ver Candidatos */}
            {isViewCandidatesModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">Candidatos Atribuídos</h3>
                                <p className="text-gray-500 mt-1">
                                    {assignedCandidates?.length || 0} candidato(s) com esta avaliação
                                </p>
                            </div>
                            <button onClick={() => setIsViewCandidatesModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-2 mb-6">
                            {assignedCandidates?.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p>Nenhum candidato atribuído ainda.</p>
                                </div>
                            ) : (
                                assignedCandidates?.map((assignment: any) => (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div>
                                            <div className="font-bold text-gray-900">{assignment.user.name || 'Sem nome'}</div>
                                            <div className="text-sm text-gray-500">{assignment.user.email}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Status: <span className="font-semibold">{assignment.status === 'PENDING' ? 'Pendente' : assignment.status === 'IN_PROGRESS' ? 'Em andamento' : 'Concluída'}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => viewingAssessmentId && removeAssignment.mutate({ assessmentId: viewingAssessmentId, userId: assignment.user.id })}
                                            disabled={removeAssignment.isPending}
                                            className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            {removeAssignment.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Remover'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end pt-6 border-t">
                            <button
                                onClick={() => setIsViewCandidatesModalOpen(false)}
                                className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
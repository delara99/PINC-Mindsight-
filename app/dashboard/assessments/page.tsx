'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/store/auth-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, FileText, Calendar, Users, BrainCircuit, X, Copy, Edit, Trash2, Star, Building2, User } from 'lucide-react';
import { useState } from 'react';
import { API_URL } from '../../../src/config/api';

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
    role: string;
    userType?: string;
}

export default function AssessmentsListPage() {
    const token = useAuthStore((state) => state.token);
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);

    // Novo estado para Abas
    const [activeTab, setActiveTab] = useState<'B2C' | 'B2B'>('B2C');

    // Estados para modal de candidatos atribuídos
    const [isViewCandidatesModalOpen, setIsViewCandidatesModalOpen] = useState(false);
    const [viewingAssessmentId, setViewingAssessmentId] = useState<string | null>(null);

    const { data: assessments, isLoading, error } = useQuery<Assessment[]>({
        queryKey: ['assessments'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/assessments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar avaliações');
            return response.json();
        }
    });

    const cloneMutation = useMutation({
        mutationFn: async (assessmentId: string) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/templates/${assessmentId}/clone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({})
            });
            if (!response.ok) throw new Error('Erro ao clonar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            alert('Avaliação clonada com sucesso!');
        },
        onError: () => alert('Erro ao clonar avaliação.')
    });

    const deleteMutation = useMutation({
        mutationFn: async (assessmentId: string) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${assessmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao deletar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            alert('Avaliação deletada com sucesso!');
        },
        onError: (error: any) => alert('Erro: ' + (error.message || 'Erro desconhecido'))
    });

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

    // Mutações de Aplicação
    const applyToB2C = useMutation({
        mutationFn: async ({ assessmentId, userIds }: { assessmentId: string, userIds: string[] }) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${assessmentId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userIds })
            });
            if (!response.ok) throw new Error('Falha ao aplicar avaliação (B2C)');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            handleCloseModal();
            alert('Avaliação aplicada aos clientes (B2C) com sucesso!');
        }
    });

    const applyToB2B = useMutation({
        mutationFn: async ({ assessmentId, targetUserId }: { assessmentId: string, targetUserId: string }) => {
            const response = await fetch(`${API_URL}/api/v1/assessments/${assessmentId}/share-b2b`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ targetUserId })
            });
            if (!response.ok) throw new Error('Falha ao distribuir avaliação para Gestor (B2B)');
            return response.json();
        },
        onSuccess: () => {
            // Não invalida query local de assessments pois foi criado em OUTRO tenant
            handleCloseModal();
            alert('Avaliação disponibilizada para o Gestor (B2B) com sucesso!');
        }
    });

    // Handle Confirm Apply
    const handleApply = async () => {
        if (!selectedAssessment) return;

        if (activeTab === 'B2C') {
            applyToB2C.mutate({ assessmentId: selectedAssessment, userIds: selectedClients });
        } else {
            // B2B - Envia um por um (Endpoints separados por tenant)
            // Como a API clonar funciona 1 user por vez no endpoint share-b2b
            // Vamos fazer um loop
            try {
                for (const userId of selectedClients) {
                    await applyToB2B.mutateAsync({ assessmentId: selectedAssessment, targetUserId: userId });
                }
            } catch (e) {
                console.error(e);
                alert("Erro ao processar algumas distribuições.");
            }
        }
    }

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
        onError: () => alert('Erro ao remover candidato.')
    });

    const openApplyModal = (assessmentId: string) => {
        setSelectedAssessment(assessmentId);
        setIsApplyModalOpen(true);
        setSelectedClients([]);
        setActiveTab('B2C'); // Default
    };

    const handleCloseModal = () => {
        setIsApplyModalOpen(false);
        setSelectedClients([]);
    };

    const openViewCandidatesModal = (assessmentId: string) => {
        setViewingAssessmentId(assessmentId);
        setIsViewCandidatesModalOpen(true);
    };

    const toggleClient = (clientId: string) => {
        setSelectedClients(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId] // Checkbox style
        );
    };

    // Filter Clients based on Tab
    const filteredClients = clients?.filter(client => {
        if (activeTab === 'B2B') {
            return client.role === 'TENANT_ADMIN';
        } else {
            return client.role === 'MEMBER';
        }
    }) || [];

    const isLoadingApply = applyToB2C.isPending || applyToB2B.isPending;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Minhas Avaliações</h1>
                    <p className="text-gray-500 mt-1">Gerencie os questionários disponíveis para aplicação.</p>
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
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                        {assessment.type === 'BIG_FIVE' ? 'Big Five' : assessment.type}
                                    </span>
                                    {assessment.isTemplate && <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase">Template</span>}
                                    {assessment.isDefault && (
                                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1 border border-amber-200">
                                            <Star size={10} fill="currentColor" /> Padrão
                                        </span>
                                    )}
                                    {!assessment.isDefault && !assessment.isTemplate && (
                                        <button onClick={() => setDefaultMutation.mutate(assessment.id)} className="text-gray-300 hover:text-amber-500 transition-colors p-1" title="Definir como Padrão">
                                            <Star size={16} />
                                        </button>
                                    )}
                                </div>
                                {!assessment.isTemplate && (
                                    <button onClick={() => { if (confirm(`Deletar "${assessment.title}"?`)) deleteMutation.mutate(assessment.id); }} className="text-gray-400 hover:text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-1">{assessment.title}</h3>
                            <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">{assessment.description || 'Sem descrição.'}</p>

                            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-4">
                                <div className="flex items-center gap-1">
                                    {assessment.isTemplate ? (
                                        <><FileText size={14} /> {assessment.questionCount || 0} perguntas</>
                                    ) : (
                                        <><Calendar size={14} /> {new Date(assessment.createdAt).toLocaleDateString('pt-BR')}</>
                                    )}
                                </div>
                                {!assessment.isTemplate && (
                                    <div className="flex items-center gap-1"><Users size={14} /> {assessment._count?.assignments || 0} Candidato{assessment._count?.assignments !== 1 ? 's' : ''}</div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 flex gap-2">
                                {assessment.isTemplate ? (
                                    // Template Actions
                                    <>
                                        <button onClick={() => router.push(`/dashboard/assessments/${assessment.id}`)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-colors">Visualizar</button>
                                        <button onClick={() => cloneMutation.mutate(assessment.id)} disabled={cloneMutation.isPending} className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-sm shadow-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2">
                                            <Copy size={16} /> {cloneMutation.isPending ? '...' : 'Clonar'}
                                        </button>
                                    </>
                                ) : (
                                    // Normal Actions
                                    <>
                                        <button onClick={() => router.push(`/dashboard/assessments/${assessment.id}`)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1"><Edit size={14} /> Editar</button>
                                        {(assessment._count?.assignments || 0) > 0 && (
                                            <button onClick={() => openViewCandidatesModal(assessment.id)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 rounded-lg text-sm transition-colors">Candidatos</button>
                                        )}
                                        <button onClick={() => openApplyModal(assessment.id)} className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-sm shadow-lg hover:bg-primary-hover transition-colors">Aplicar</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Aplicar com Abas */}
            {isApplyModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold">Aplicar Avaliação</h3>
                                <p className="text-gray-500 mt-1">Selecione quem receberá esta avaliação.</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 px-6">
                            <button
                                onClick={() => { setActiveTab('B2C'); setSelectedClients([]); }}
                                className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'B2C' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <User size={18} /> B2C (Clientes)
                            </button>
                            <button
                                onClick={() => { setActiveTab('B2B'); setSelectedClients([]); }}
                                className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'B2B' ? 'border-primary text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Building2 size={18} /> B2B (Gestores)
                            </button>
                        </div>

                        {/* List */}
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                            {filteredClients.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p>Nenhum usuário encontrado nesta categoria.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredClients.map((client) => (
                                        <label key={client.id} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${selectedClients.includes(client.id) ? 'bg-white border-primary shadow-sm' : 'bg-white border-gray-200 hover:border-primary/50'}`}>
                                            <input type="checkbox" checked={selectedClients.includes(client.id)} onChange={() => toggleClient(client.id)} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                                            <div>
                                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                                    {client.name || 'Sem nome'}
                                                    {client.userType === 'COMPANY' && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded uppercase">Empresa</span>}
                                                </div>
                                                <div className="text-sm text-gray-500">{client.email}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button
                                onClick={handleApply}
                                disabled={isLoadingApply || selectedClients.length === 0}
                                className={`px-6 py-2.5 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'B2B' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-primary hover:bg-primary-hover shadow-primary/20'}`}
                            >
                                {isLoadingApply && <Loader2 size={16} className="animate-spin" />}
                                {activeTab === 'B2B' ? `Distribuir para ${selectedClients.length} Gestor(es)` : `Aplicar a ${selectedClients.length} Cliente(s)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Candidates (Reused) */}
            {/* ... existing code ... */}
        </div>
    );
}
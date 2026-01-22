'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { API_URL } from '../../../../src/config/api';
import { Loader2, BrainCircuit, Users, Calendar, CheckCircle, X, Trash2 } from 'lucide-react';
import axios from 'axios';

interface Assessment {
    id: string;
    title: string;
    description: string;
    type: string;
    createdAt: string;
    questionCount: number;
    _count?: {
        assignments: number;
    };
}

interface Employee {
    id: string;
    name: string;
    email: string;
    status: string;
}

interface Assignment {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    status: string;
}

export default function BusinessInventoryPage() {
    const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
    const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

    // Estado para "Gerenciar Atribuições"
    const [viewingAssessmentId, setViewingAssessmentId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    // 1. Fetch Assessments
    const { data: assessments, isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
        queryKey: ['business-assessments'],
        queryFn: async () => {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/assessments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        }
    });

    // 2. Fetch Employees (For distribution)
    const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
        queryKey: ['business-employees'],
        queryFn: async () => {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/business/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: isDistributeModalOpen
    });

    // 3. Fetch Assignments (For management)
    const { data: assignments, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useQuery<Assignment[]>({
        queryKey: ['business-assignments', viewingAssessmentId],
        queryFn: async () => {
            if (!viewingAssessmentId) return [];
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/assessments/${viewingAssessmentId}/assignments`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!viewingAssessmentId && isManageModalOpen
    });

    // 4. Mutation to Assign
    const distributeMutation = useMutation({
        mutationFn: async () => {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/assessments/${selectedAssessment}/assign`, {
                userIds: selectedEmployees
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            alert('Inventário distribuído com sucesso para os colaboradores selecionados.');
            setIsDistributeModalOpen(false);
            setSelectedEmployees([]);
            setSelectedAssessment(null);
            queryClient.invalidateQueries({ queryKey: ['business-assessments'] });
        },
        onError: (err: any) => {
            alert('Erro ao distribuir: ' + (err.response?.data?.message || err.message));
        }
    });

    // 5. Mutation to Remove Assignment
    const removeAssignmentMutation = useMutation({
        mutationFn: async ({ assessmentId, userId }: { assessmentId: string, userId: string }) => {
            const token = localStorage.getItem('accessToken');
            await axios.delete(`${API_URL}/api/v1/assessments/${assessmentId}/assignments/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            alert('Atribuição removida com sucesso.');
            refetchAssignments();
            queryClient.invalidateQueries({ queryKey: ['business-assessments'] });
        },
        onError: (err: any) => {
            alert('Erro ao remover: ' + (err.response?.data?.message || err.message));
        }
    });

    const openDistributeModal = (id: string) => {
        setSelectedAssessment(id);
        setIsDistributeModalOpen(true);
        setSelectedEmployees([]);
    };

    const openManageModal = (id: string) => {
        setViewingAssessmentId(id);
        setIsManageModalOpen(true);
    };

    const toggleEmployee = (id: string) => {
        setSelectedEmployees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleCloseManageModal = () => {
        setIsManageModalOpen(false);
        setViewingAssessmentId(null);
    }

    if (isLoadingAssessments) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-purple-600" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Inventário Disponível</h1>
                    <p className="text-slate-500">Avaliações liberadas pelo administrador para aplicação em sua equipe.</p>
                </div>
            </div>

            {assessments?.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BrainCircuit className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhum inventário disponível</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Você ainda não possui avaliações liberadas para uso. Entre em contato com o administrador do sistema.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {assessments?.map(assessment => (
                        <div key={assessment.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-200 transition-colors flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-slate-900">{assessment.title}</h3>
                                    <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded uppercase">
                                        {assessment.type === 'BIG_FIVE' ? 'Big Five' : assessment.type}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2 h-10">
                                    {assessment.description || 'Sem descrição.'}
                                </p>
                                <div className="flex gap-4 text-xs text-slate-400 border-t border-slate-50 pt-3 mb-4">
                                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(assessment.createdAt).toLocaleDateString()}</span>
                                    <button
                                        onClick={() => openManageModal(assessment.id)}
                                        className="flex items-center gap-1 hover:text-purple-600 hover:underline cursor-pointer"
                                    >
                                        <Users size={14} /> {assessment._count?.assignments || 0} Aplicações (Ver)
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => openDistributeModal(assessment.id)}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <Users size={18} /> Distribuir para Equipe
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Distribuição */}
            {isDistributeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-slate-900">Distribuir Avaliação</h3>
                            <button onClick={() => setIsDistributeModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                            <p className="text-sm text-slate-500 mb-4">Selecione os colaboradores que realizarão este teste:</p>

                            {isLoadingEmployees ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-600" /></div>
                            ) : employees?.length === 0 ? (
                                <p className="text-center text-slate-400 py-8">Nenhum colaborador cadastrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {employees?.map(emp => (
                                        <label key={emp.id} className={`flex items-center gap-3 p-4 bg-white border rounded-xl cursor-pointer transition-all ${selectedEmployees.includes(emp.id) ? 'border-purple-600 shadow-sm' : 'border-slate-200 hover:border-purple-300'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.includes(emp.id)}
                                                onChange={() => toggleEmployee(emp.id)}
                                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-600"
                                            />
                                            <div>
                                                <div className="font-bold text-slate-900">{emp.name}</div>
                                                <div className="text-xs text-slate-500">{emp.email}</div>
                                            </div>
                                            {selectedEmployees.includes(emp.id) && <CheckCircle className="ml-auto text-purple-600" size={20} />}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button onClick={() => setIsDistributeModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
                            <button
                                onClick={() => distributeMutation.mutate()}
                                disabled={selectedEmployees.length === 0 || distributeMutation.isPending}
                                className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {distributeMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                                Distribuir ({selectedEmployees.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Gerenciamento de Atribuições */}
            {isManageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-slate-900">Gerenciar Distribuições</h3>
                            <button onClick={handleCloseManageModal} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                            {isLoadingAssignments ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-purple-600" /></div>
                            ) : assignments?.length === 0 ? (
                                <div className="text-center text-slate-400 py-12 flex flex-col items-center">
                                    <Users size={40} className="mb-2 opacity-50" />
                                    <p>Nenhum colaborador recebeu este inventário ainda.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {assignments?.map(assignment => (
                                        <div key={assignment.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-slate-900">{assignment.user.name}</div>
                                                <div className="text-sm text-slate-500">{assignment.user.email}</div>
                                                <div className="text-xs text-slate-400 mt-1">Status: <span className="font-semibold text-purple-600">{assignment.status}</span></div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Tem certeza que deseja remover esta atribuição? O colaborador perderá o acesso e as respostas (se houver).')) {
                                                        removeAssignmentMutation.mutate({ assessmentId: viewingAssessmentId!, userId: assignment.user.id })
                                                    }
                                                }}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
                                            >
                                                <Trash2 size={16} /> Remover
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button onClick={handleCloseManageModal} className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

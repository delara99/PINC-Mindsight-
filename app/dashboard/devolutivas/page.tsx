'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/store/auth-store';
import { API_URL } from '../../../src/config/api';
import { CheckCircle2, XCircle, Clock, Calendar, User, FileText } from 'lucide-react';

export default function DevolutivasAdminPage() {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin-feedbacks'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/feedback/admin/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar solicitações');
            return res.json();
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const res = await fetch(`${API_URL}/api/v1/feedback/admin/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Erro ao atualizar status');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
        }
    });

    if (isLoading) {
        return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Devolutivas Profissionais</h1>
                <p className="text-gray-500 mt-1">{requests?.length || 0} solicitações</p>
            </div>

            {!requests || requests.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">Nenhuma solicitação</h3>
                    <p className="text-gray-500 mt-2">Quando clientes solicitarem devolutivas, elas aparecerão aqui.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((req: any) => (
                        <div
                            key={req.id}
                            className={`bg-white p-6 rounded-xl shadow-sm border-2 ${req.status === 'COMPLETED' ? 'border-green-200 bg-green-50/50' :
                                req.status === 'CANCELLED' ? 'border-red-200 bg-red-50/50' :
                                    'border-gray-200'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <User size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{req.user.name || req.user.email}</h3>
                                            <p className="text-sm text-gray-500">{req.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-700">Telefone</p>
                                            <p className="font-medium text-gray-900">{req.phone || req.user.phone || 'Não informado'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-700">Inventário</p>
                                            <p className="font-medium text-gray-900">{req.assignment.assessment.title}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-700">Solicitado em</p>
                                            <p className="font-medium text-gray-900">{new Date(req.createdAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                        req.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                            req.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {req.status === 'COMPLETED' && <CheckCircle2 size={14} />}
                                        {req.status === 'CANCELLED' && <XCircle size={14} />}
                                        {req.status === 'SCHEDULED' && <Calendar size={14} />}
                                        {req.status === 'PENDING' && <Clock size={14} />}
                                        {req.status}
                                    </div>

                                    {req.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'COMPLETED' })}
                                                disabled={updateStatusMutation.isPending}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                ✅ Atendido
                                            </button>
                                            <button
                                                onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'CANCELLED' })}
                                                disabled={updateStatusMutation.isPending}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                ❌ Cancelar
                                            </button>
                                        </>
                                    )}

                                    <a
                                        href={`/dashboard/reports/${req.assignmentId}`}
                                        target="_blank"
                                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                                    >
                                        Ver Relatório
                                    </a>
                                </div>
                            </div>

                            {req.notes && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600"><strong>Notas:</strong> {req.notes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

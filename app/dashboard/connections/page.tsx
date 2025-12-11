'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Check, X, MessageSquare, Trash2, Settings, Link as LinkIcon, Copy, CheckCircle2, Shield, XCircle } from 'lucide-react';

export default function ConnectionsPage() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'active' | 'requests' | 'approvals' | 'admin'>('active');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    // Verificação segura de admin
    // Apenas SUPER_ADMIN ou TENANT_ADMIN de EMPRESA podem aprovar conexões e gerenciar
    const isAdmin = user && (
        user.role === 'SUPER_ADMIN' ||
        (user.role === 'TENANT_ADMIN' && user.userType === 'COMPANY')
    );

    // DEBUG: Log para ajudar a diagnosticar
    console.log('🔍 DEBUG ConnectionsPage:', {
        user: user,
        role: user?.role,
        userType: user?.userType,
        isAdmin: isAdmin,
        tokenExists: !!token
    });

    // Fetch Connections
    const { data: connections, isLoading: loadingConnections } = useQuery({
        queryKey: ['connections'],
        queryFn: async () => {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'/api/v1/connections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch connections');
            return res.json();
        }
    });

    // Fetch Requests
    const { data: requests, isLoading: loadingRequests } = useQuery({
        queryKey: ['connection-requests'],
        queryFn: async () => {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'/api/v1/connections/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch requests');
            return res.json();
        }
    });

    // Fetch Pending Admin Approvals (com retry e error handling)
    const { data: pendingApprovals, isLoading: loadingApprovals, error: approvalsError } = useQuery({
        queryKey: ['pending-approvals'],
        enabled: !!isAdmin && !!token, // Só habilita se for admin E tiver token
        retry: 2,
        queryFn: async () => {
            console.log('🔍 DEBUG: Fetching pending approvals...');
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'/api/v1/connections/pending-approvals', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
                console.error('🔍 DEBUG: API Error:', error);
                throw new Error(error.message || 'Failed to fetch approvals');
            }
            const data = await res.json();
            console.log('🔍 DEBUG: Pending approvals data:', data);
            return data;
        }
    });

    // Fetch All Connections (Admin Management)
    const { data: allConnections, isLoading: loadingAllConnections } = useQuery({
        queryKey: ['all-connections-admin'],
        enabled: !!isAdmin && !!token && activeTab === 'admin',
        queryFn: async () => {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'/api/v1/connections/admin/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar todas as conexões');
            return res.json();
        }
    });

    // Admin Cancel Connection Mutation
    const cancelConnectionMutation = useMutation({
        mutationFn: async ({ connectionId, reason }: { connectionId: string; reason?: string }) => {
            const res = await fetch(`http://localhost:3000/api/v1/connections/admin/${connectionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });
            if (!res.ok) throw new Error('Erro ao cancelar conexão');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-connections-admin'] });
            alert('Conexão cancelada com sucesso!');
        }
    });

    // Generate Invite Link
    const generateLinkMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'/api/v1/connections/generate-invite', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao gerar link');
            return res.json();
        },
        onSuccess: (data) => {
            setGeneratedLink(data.link);
        }
    });

    const acceptRequestMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:3000/api/v1/connections/requests/${id}/accept`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao aceitar');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
            alert('Conexão aceita!');
        }
    });

    const rejectRequestMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:3000/api/v1/connections/requests/${id}/reject`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao recusar');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connection-requests'] });
        }
    });

    const removeConnectionMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:3000/api/v1/connections/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao remover');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            alert('Conexão removida.');
        }
    });

    const approveConnectionMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:3000/api/v1/connections/approve/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao aprovar');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            alert('Conexão aprovada com sucesso!');
        }
    });

    const rejectConnectionMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:3000/api/v1/connections/reject/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao recusar');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
        }
    });

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Minhas Conexões</h1>
                    <p className="text-gray-500 mt-1">Conecte-se com outros usuários para compartilhar resultados.</p>
                </div>
                <button
                    onClick={() => {
                        setIsInviteModalOpen(true);
                        setGeneratedLink(null);
                        setLinkCopied(false);
                    }}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <UserPlus size={18} />
                    Gerar Link de Convite
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'active' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Conexões Ativas
                    {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'requests' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Convites Recebidos
                    {requests?.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>
                    )}
                    {activeTab === 'requests' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                </button>
                {isAdmin && (
                    <>
                        <button
                            onClick={() => setActiveTab('approvals')}
                            className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'approvals' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Aprovações Pendentes
                            {pendingApprovals?.length > 0 && (
                                <span className="ml-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingApprovals.length}</span>
                            )}
                            {activeTab === 'approvals' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`pb-3 px-2 font-medium text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'admin' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Shield size={16} />
                            Administração
                            {activeTab === 'admin' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />}
                        </button>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="min-h-[300px]">
                {activeTab === 'active' ? (
                    loadingConnections ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                    ) : connections?.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Nenhuma conexão ativa</h3>
                            <p className="text-gray-500 mt-1">Gere um link e compartilhe com outras pessoas.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {connections?.map((conn: any) => (
                                <div key={conn.connectionId} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-gray-600">
                                            {conn.name?.charAt(0) || conn.email?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{conn.name || 'Usuário Sem Nome'}</h3>
                                            <p className="text-xs text-gray-500">{conn.email}</p>
                                            {conn.companyName && <p className="text-xs text-blue-600 font-medium">{conn.companyName}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => router.push(`/dashboard/connections/${conn.connectionId}`)}
                                            className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-hover flex items-center justify-center gap-1"
                                        >
                                            <MessageSquare size={14} /> Chat
                                        </button>
                                        <button
                                            onClick={() => router.push(`/dashboard/connections/${conn.connectionId}`)}
                                            className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                                        >
                                            <Settings size={14} /> Perfil
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Tem certeza que deseja remover esta conexão?')) {
                                                    removeConnectionMutation.mutate(conn.connectionId);
                                                }
                                            }}
                                            className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === 'requests' ? (
                    loadingRequests ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                    ) : requests?.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500">Nenhum convite pendente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests?.map((req: any) => (
                                <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                            {req.sender?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{req.sender?.name} <span className="font-normal text-gray-500">quer se conectar com você.</span></p>
                                            <p className="text-xs text-gray-500">{req.sender?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => acceptRequestMutation.mutate(req.id)}
                                            className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1"
                                        >
                                            <Check size={14} /> Aceitar
                                        </button>
                                        <button
                                            onClick={() => rejectRequestMutation.mutate(req.id)}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1"
                                        >
                                            <X size={14} /> Recusar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // Admin Approvals Tab
                    loadingApprovals ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                    ) : approvalsError ? (
                        <div className="text-center py-20 bg-red-50 rounded-xl border border-red-200">
                            <XCircle size={48} className="mx-auto text-red-400 mb-3" />
                            <h3 className="text-lg font-medium text-red-900">Erro ao carregar aprovações</h3>
                            <p className="text-red-600 text-sm mt-1">{(approvalsError as Error).message}</p>
                        </div>
                    ) : !pendingApprovals ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
                    ) : pendingApprovals.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Shield size={48} className="mx-auto text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">Nenhuma aprovação pendente</h3>
                            <p className="text-gray-500 mt-1">Todas as conexões foram processadas.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingApprovals.map((approval: any) => (
                                <div key={approval.id} className="bg-white border border-orange-200 rounded-xl p-5 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                                                    {approval.sender?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{approval.sender?.name}</p>
                                                    <p className="text-xs text-gray-500">{approval.sender?.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-gray-400 font-bold">→</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
                                                    {approval.receiver?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{approval.receiver?.name}</p>
                                                    <p className="text-xs text-gray-500">{approval.receiver?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                                            Aguardando Aprovação
                                        </span>
                                    </div>
                                    <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => approveConnectionMutation.mutate(approval.id)}
                                            disabled={approveConnectionMutation.isPending}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {approveConnectionMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            Aprovar Conexão
                                        </button>
                                        <button
                                            onClick={() => rejectConnectionMutation.mutate(approval.id)}
                                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                                        >
                                            <X size={16} />
                                            Recusar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Admin Management Tab */}
                {activeTab === 'admin' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 p-6 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Shield className="text-purple-600" size={28} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Painel de Administração</h3>
                                    <p className="text-sm text-gray-600">
                                        Gerencie todas as conexões do sistema. Você pode cancelar conexões e visualizar conversas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {loadingAllConnections ? (
                            <div className="flex justify-center py-20">
                                <Loader2 size={40} className="animate-spin text-primary" />
                            </div>
                        ) : !allConnections || allConnections.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                                <Shield className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-500 font-medium">Nenhuma conexão no sistema</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase">Conexão</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase">Status</th>
                                            <th className="text-center px-6 py-4 text-xs font-bold text-gray-600 uppercase">Msgs</th>
                                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase">Criada</th>
                                            <th className="text-center px-6 py-4 text-xs font-bold text-gray-600 uppercase">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {allConnections.map((conn: any) => (
                                            <tr key={conn.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                                                                {conn.userA.name?.[0] || 'U'}
                                                            </div>
                                                            <span className="font-medium text-gray-900">{conn.userA.name || conn.userA.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm ml-1">
                                                            <span className="text-gray-400">↔</span>
                                                            <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                                                                {conn.userB.name?.[0] || 'U'}
                                                            </div>
                                                            <span className="font-medium text-gray-900">{conn.userB.name || conn.userB.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {conn.status === 'ACTIVE' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                                                            <CheckCircle2 size={12} /> Ativa
                                                        </span>
                                                    )}
                                                    {conn.status === 'CANCELLED' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">
                                                            <XCircle size={12} /> Cancelada
                                                        </span>
                                                    )}
                                                    {conn.cancelledByUser && (
                                                        <p className="text-xs text-gray-500 mt-1">Por: {conn.cancelledByUser.name}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                                                        <MessageSquare size={12} /> {conn._count.messages}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(conn.createdAt).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Chat button temporarily hidden */}
                                                        {/* {conn._count.messages > 0 && (
                                                            <button
                                                                onClick={() => router.push(`/dashboard/connections/${conn.id}`)}
                                                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold hover:bg-blue-100 flex items-center gap-1"
                                                            >
                                                                <MessageSquare size={12} /> Chat
                                                            </button>
                                                        )} */}
                                                        {conn.status === 'ACTIVE' && (
                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Motivo do cancelamento (opcional):');
                                                                    if (reason !== null) {
                                                                        cancelConnectionMutation.mutate({ connectionId: conn.id, reason: reason || undefined });
                                                                    }
                                                                }}
                                                                disabled={cancelConnectionMutation.isPending}
                                                                className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold hover:bg-red-100 flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                <Trash2 size={12} /> Cancelar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Generate Link */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <LinkIcon size={24} className="text-primary" />
                            Link de Convite Compartilhável
                        </h3>
                        <p className="text-gray-500 mb-6 text-sm">
                            Gere um link único e compartilhe com quem você deseja conectar. Após a pessoa aceitar, a conexão ficará pendente de aprovação do administrador.
                        </p>

                        {!generatedLink ? (
                            <button
                                onClick={() => generateLinkMutation.mutate()}
                                disabled={generateLinkMutation.isPending}
                                className="w-full bg-primary text-white py-4 rounded-lg font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {generateLinkMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <LinkIcon size={18} />}
                                Gerar Link Agora
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm font-bold text-green-800 mb-2">✅ Link gerado com sucesso!</p>
                                    <div className="flex items-center gap-2 bg-white p-3 rounded border border-green-300">
                                        <input
                                            type="text"
                                            value={generatedLink || ''}
                                            readOnly
                                            className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-hover flex items-center gap-2"
                                        >
                                            {linkCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                            {linkCopied ? 'Copiado!' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    Compartilhe este link por WhatsApp, e-mail ou qualquer outro meio. Ele expira em 7 dias.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
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

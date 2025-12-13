'use client';
import { API_URL } from '@/src/config/api';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, UserPlus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function AcceptInvitePage() {
    const { token } = useParams();
    const router = useRouter();
    const authToken = useAuthStore((state) => state.token);
    const [accepted, setAccepted] = useState(false);

    // Validate the invite token
    const { data: invite, isLoading, error } = useQuery({
        queryKey: ['validate-invite', token],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/connections/validate-invite/${token}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Link inválido');
            }
            return res.json();
        },
        enabled: !!authToken && !!token
    });

    const acceptInviteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/connections/join/${token}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Erro ao aceitar convite');
            }
            return res.json();
        },
        onSuccess: () => {
            setAccepted(true);
        }
    });

    if (!authToken) {
        router.push(`/auth/login?redirect=/dashboard/connections/join/${token}`);
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Validando convite...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-200">
                    <XCircle className="text-red-500 mx-auto mb-4" size={64} />
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Link Inválido</h2>
                    <p className="text-gray-600 text-center mb-6">
                        {(error as Error).message || 'Este link de convite não é válido ou já foi utilizado.'}
                    </p>
                    <button
                        onClick={() => router.push('/dashboard/connections')}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover"
                    >
                        Ir para Minhas Conexões
                    </button>
                </div>
            </div>
        );
    }

    if (accepted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                    <CheckCircle2 className="text-green-500 mx-auto mb-4" size={64} />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
                    <p className="text-gray-600 mb-2">
                        Sua solicitação de conexão com <strong>{invite?.creator?.name}</strong> foi enviada.
                    </p>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 mt-4">
                        <AlertCircle className="text-orange-600 mx-auto mb-2" size={32} />
                        <p className="text-sm text-orange-800 font-medium">
                            A conexão está pendente de aprovação do administrador.
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                            Você será notificado assim que for aprovada.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/connections')}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover"
                    >
                        Voltar para Conexões
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-blue-50 p-6">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
                <UserPlus className="text-primary mx-auto mb-4" size={64} />
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Você foi convidado!</h2>
                <p className="text-gray-600 text-center mb-6">
                    <strong>{invite?.creator?.name}</strong> ({invite?.creator?.email}) quer se conectar com você na plataforma.
                </p>

                {invite?.creator?.companyName && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>Empresa:</strong> {invite.creator.companyName}
                        </p>
                    </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-sm text-gray-800 mb-2">Ao aceitar, você:</h3>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>✅ Poderá compartilhar inventários e resultados (se autorizado)</li>
                        <li>✅ Terá acesso ao chat privado</li>
                        <li>⚠️ A conexão estará pendente de aprovação do administrador</li>
                    </ul>
                </div>

                <button
                    onClick={() => acceptInviteMutation.mutate()}
                    disabled={acceptInviteMutation.isPending}
                    className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/30"
                >
                    {acceptInviteMutation.isPending ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Processando...
                        </>
                    ) : (
                        <>
                            <UserPlus size={20} />
                            Aceitar Convite
                        </>
                    )}
                </button>

                {acceptInviteMutation.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 text-center">
                            {(acceptInviteMutation.error as Error).message}
                        </p>
                    </div>
                )}

                <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}

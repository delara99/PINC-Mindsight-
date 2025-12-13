'use client';
import Link from 'next/link';
import { ArrowUpRight, UserPlus, FileCheck, AlertCircle, PlayCircle, Clock, Users } from 'lucide-react';
import { useAuthStore } from '@/src/store/auth-store';
import { useTrialStore } from '@/src/store/trial-store';
import ClientDashboard from '@/src/components/dashboard/client-overview';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/src/config/api';

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return null;
            return response.json();
        },
        enabled: user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN'
    });


    // Exibir Dashboard de Cliente se for MEMBRO ou PESSOA FÍSICA (Exceto Super Admin)
    const isClientView = user?.role === 'MEMBER' || (user?.userType === 'INDIVIDUAL' && user?.role !== 'SUPER_ADMIN');

    // Trial Widget Logic
    const { answers, userInfo, resetTrial } = useTrialStore();
    const hasTrialData = Object.keys(answers).length > 0;

    // Calculo Dinâmico do Perfil (Mesma lógica do TrialResult)
    const scoreExtroversion = ((answers[1] || 3) + (answers[2] || 3)) / 2;
    const profileText = scoreExtroversion > 3.5 ? "Liderança Inovadora e Comunicativa" : "Estratégia e Análise Profunda";

    if (isClientView) {
        // Se tiver trial data e nenhum credit request, mostra o TrialResultWidget junto ou dentro
        if (hasTrialData) {
            return (
                <div className="space-y-8">
                    {/* Trial Upsell Banner */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                         <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-2">Olá, {user?.name || userInfo.name}! 👋</h2>
                            <p className="text-gray-300 mb-6 max-w-xl">
                                Identificamos que você iniciou sua jornada de autoconhecimento. 
                                Seu perfil preliminar indica alta compatibilidade com <strong>{profileText}</strong>.
                            </p>
                            
                            <div className="flex flex-wrap gap-4">
                                <Link href="/dashboard/plans">
                                    <button className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                                        <ArrowUpRight className="w-5 h-5" />
                                        Desbloquear Relatório Completo
                                    </button>
                                </Link>
                                <button 
                                    onClick={() => {
                                        if(confirm('Isso irá remover seu resultado preliminar.')) resetTrial();
                                    }}
                                    className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm"
                                >
                                    Dispensar Resultado
                                </button>
                            </div>
                         </div>
                    </div>
                    <ClientDashboard />
                </div>
            );
        }

        return <ClientDashboard />;
    }

    return (
        <div className="space-y-8">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Visão Geral</h1>
                    <p className="text-gray-500 mt-1">Bem-vindo ao painel de controle da sua organização.</p>
                </div>
                <Link href="/dashboard/assessments/new">
                    <button className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                        <UserPlus size={18} />
                        Nova Avaliação
                    </button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Avaliações Ativas"
                    value={stats?.activeAssessments || 0}
                    trend="Em andamento"
                    icon={<FileCheck className="text-white" />}
                    color="bg-blue-500"
                />
                <StatsCard
                    title="Candidatos na Fila"
                    value={stats?.candidatesInQueue || 0}
                    trend="Aguardando início"
                    icon={<UserPlus className="text-white" />}
                    color="bg-secondary"
                />
                <StatsCard
                    title="Clientes Online"
                    value={stats?.onlineUsers || 0}
                    trend="Ativos agora"
                    icon={<Users className="text-white" />}
                    color="bg-green-500"
                />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Solicitacoes de Credito + Users Without Credits */}
                <div className="space-y-6">
                    {/* Notificações de Crédito */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <AlertCircle size={20} className="text-orange-500" />
                            Solicitações de Crédito
                        </h3>
                        {stats?.creditRequests?.length > 0 ? (
                            <div className="space-y-3">
                                {stats.creditRequests.map((req: any) => (
                                    <div key={req.id} className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-sm">
                                        <p className="font-bold text-gray-800">{req.user.name}</p>
                                        <p className="text-xs text-gray-500 mb-2">{req.user.email}</p>
                                        <p className="text-xs text-orange-700 font-medium">
                                            Solicitou compra em {new Date(req.createdAt).toLocaleDateString()}
                                        </p>
                                        <Link href="/dashboard/clients" className="block mt-2 text-center bg-white border border-gray-200 text-gray-600 text-xs font-bold py-1.5 rounded hover:bg-gray-50">
                                            Gerenciar
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">Nenhuma solicitação pendente.</p>
                        )}
                    </div>

                    {/* Usuários sem Crédito */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Clock size={20} className="text-red-500" />
                            Sem Créditos e Pendentes
                        </h3>
                        {stats?.usersWithoutCredits?.length > 0 ? (
                            <div className="space-y-3">
                                {stats.usersWithoutCredits.map((u: any) => (
                                    <div key={u.id} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-sm text-gray-800">{u.name}</p>
                                            <p className="text-xs text-gray-400">{u.email}</p>
                                        </div>
                                        <Link href="/dashboard/clients">
                                            <button className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-100">+ Crédito</button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">Todos os usuários com pendências possuem créditos.</p>
                        )}
                    </div>
                </div>

                {/* Recent Candidates */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 self-start">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-lg text-gray-800">Candidatos Recentes</h2>
                        <Link href="/dashboard/assessments" className="text-primary text-sm font-semibold hover:underline">Ver todos</Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                    <th className="pb-3 font-semibold">Nome</th>
                                    <th className="pb-3 font-semibold">Cargo</th>
                                    <th className="pb-3 font-semibold">Data</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {isLoading ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-gray-400">Carregando...</td></tr>
                                ) : stats?.recentCandidates?.length > 0 ? (
                                    stats.recentCandidates.map((c: any, i: number) => (
                                        <TableRow
                                            key={i}
                                            name={c.name}
                                            role={c.role}
                                            date={new Date(c.date).toLocaleDateString()}
                                            status={c.status}
                                        />
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="py-4 text-center text-gray-400">Nenhum candidato recente.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, trend, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-4xl font-bold text-gray-900 mb-2">{value}</p>
                <div className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {trend}
                </div>
            </div>
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg transform -rotate-3`}>
                {icon}
            </div>
        </div>
    )
}

function TableRow({ name, role, date, status }: any) {
    const isPending = status === 'Pendente';
    return (
        <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
            <td className="py-4 font-medium text-gray-800">{name}</td>
            <td className="py-4 text-gray-500">{role}</td>
            <td className="py-4 text-gray-400 text-xs">{date}</td>
            <td className="py-4">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPending ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {status}
                </span>
            </td>
        </tr>
    )
}
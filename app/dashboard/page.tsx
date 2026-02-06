'use client';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowUpRight,
    UserPlus,
    FileCheck,
    AlertCircle,
    Users,
    CheckCircle2,
    TrendingUp,
    Target,
    Zap,
    MoreHorizontal,
    Search,
    BrainCircuit,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';

import { useAuthStore } from '../../src/store/auth-store';
import { useTrialStore } from '../../src/store/trial-store';
import ClientLayoutWrapper from './components/ClientWrapper';
import { API_URL } from '../../src/config/api';

// --- Components ---

function LiveUsersWidget({ users }: { users: any[] }) {
    if (!users || users.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden mb-8 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Monitoramento em Tempo Real
                </h3>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full border border-emerald-100">
                    {users.length} ativos
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-3">Usuário</th>
                            <th className="px-6 py-3">Atividade Atual</th>
                            <th className="px-6 py-3">Última Ação</th>
                            <th className="px-6 py-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((u) => {
                            const isTakingExam = !!u.currentExam;
                            return (
                                <tr key={u.id} className={isTakingExam ? "bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors" : "hover:bg-gray-50/50 transition-colors"}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ${isTakingExam ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {isTakingExam ? (
                                            <div className="flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                </span>
                                                <span className="text-xs font-bold text-indigo-700">
                                                    Respondendo {u.currentExam.name}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 w-fit px-2 py-1 rounded-md">
                                                <MoreHorizontal size={12} className="text-gray-400" />
                                                {u.lastPage || 'Navegando...'}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                                        {new Date(u.lastActivity).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isTakingExam ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                                <Target size={12} /> Questão {u.currentExam.question}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                <Zap size={10} /> Online
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function WelcomeHeader({ user }: { user: any }) {
    const date = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visão Geral</h1>
                <p className="text-gray-500 mt-1 capitalize">{date}</p>
            </div>
            <div className="flex gap-3">
                <Link href="/dashboard/assessments/new">
                    <button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-gray-200">
                        <Target size={18} />
                        Nova Avaliação
                    </button>
                </Link>
                <Link href="/dashboard/clients">
                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200">
                        <UserPlus size={18} />
                        Convidar Candidato
                    </button>
                </Link>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, color, trend, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={80} />
            </div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <div className={`p-3 rounded-xl inline-flex mb-4 ${color.replace('text-', 'bg-').replace('600', '100')} ${color}`}>
                        <Icon size={22} />
                    </div>
                    <p className="text-gray-500 font-medium text-sm">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg">
                    <TrendingUp size={14} />
                    {trend}
                </div>
            )}
        </motion.div>
    );
}

function ActivityChart({ stats }: { stats: any }) {
    if (!stats) return null;

    const data = [
        { name: 'Em Andamento', value: stats.activeAssessments, color: '#4F46E5' }, // Indigo
        { name: 'Na Fila', value: stats.candidatesInQueue, color: '#F59E0B' },   // Amber
        { name: 'Online', value: stats.onlineUsers, color: '#10B981' },         // Emerald
    ];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BrainCircuit className="text-indigo-500" size={20} />
                Distribuição de Atividades
            </h3>
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function RecentCandidatesTable({ candidates }: { candidates: any[] }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Users className="text-indigo-500" size={20} />
                    Candidatos Recentes
                </h3>
                <Link href="/dashboard/assessments" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                    Ver todos
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/50">
                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Candidato</th>
                            <th className="px-6 py-4">Cargo</th>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {candidates?.length > 0 ? (
                            candidates.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                {c.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">{c.role}</td>
                                    <td className="px-6 py-4 text-gray-400 text-xs font-mono">{new Date(c.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${c.status === 'Pendente' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${c.status === 'Pendente' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                                    Nenhuma atividade recente encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CreditNotificationWidget({ requests, token }: { requests: any[], token: string }) {
    if (!requests || requests.length === 0) return null;

    return (
        <div className="bg-gradient-to-b from-orange-50 to-white p-6 rounded-2xl shadow-sm border border-orange-100">
            <h3 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                <div className="bg-orange-100 p-1.5 rounded-lg animate-pulse">
                    <AlertCircle size={18} className="text-orange-600" />
                </div>
                Solicitações de Crédito
                <span className="bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full">{requests.length}</span>
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {requests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100/50 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{req.user.name}</p>
                                <p className="text-xs text-gray-500">{req.user.email}</p>
                            </div>
                            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        {req.planName && (
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard size={14} className="text-purple-500" />
                                <span className="text-xs font-bold text-purple-700">
                                    {req.planName} {req.credits > 0 && `(+${req.credits} créditos)`}
                                </span>
                            </div>
                        )}

                        <button
                            onClick={async () => {
                                if (!confirm(`Confirmar aprovação para ${req.user.name}?`)) return;
                                try {
                                    const res = await fetch(`${API_URL}/api/v1/users/approve-credit/${req.id}`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (res.ok) window.location.reload();
                                    else alert('Erro ao aprovar.');
                                } catch (e) { alert('Erro de conexão'); }
                            }}
                            className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={14} /> Aprovar Solicitação
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Main Page Component ---

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);

    // Verificacao segura de tipo de usuario
    const isClientView = user?.role === 'MEMBER' || (user?.userType === 'INDIVIDUAL' && user?.role !== 'SUPER_ADMIN');

    // React Query para Stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            if (!token) return null;
            const response = await fetch(`${API_URL}/api/v1/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok ? response.json() : null;
        },
        enabled: !isClientView && !!token,
        refetchInterval: 5000 // Real-time update every 5 seconds
    });

    if (isClientView) {
        return <ClientLayoutWrapper />;
    }

    return (
        <div className="min-h-screen bg-gray-50/30 p-1">
            <WelcomeHeader user={user} />

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard
                    title="Avaliações em Andamento"
                    value={isLoading ? '-' : stats?.activeAssessments || 0}
                    icon={FileCheck}
                    color="text-indigo-600"
                    trend="+12% essa semana"
                    delay={0}
                />
                <MetricCard
                    title="Candidatos Aguardando"
                    value={isLoading ? '-' : stats?.candidatesInQueue || 0}
                    icon={UserPlus}
                    color="text-amber-600"
                    trend="Ação necessária"
                    delay={0.1}
                />
                <MetricCard
                    title="Usuários Ativos Online"
                    value={isLoading ? '-' : stats?.onlineUsers || 0}
                    icon={Zap}
                    color="text-emerald-600"
                    trend="Agora"
                    delay={0.2}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* Main Data Column (Expanded to Full Width) */}
                <div className="xl:col-span-12 space-y-8">
                    {/* Charts */}
                    <div className="h-[350px]">
                        <ActivityChart stats={stats} />
                    </div>

                    {/* Live Users Widget (New) */}
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: stats?.onlineUsersList?.length > 0 ? 1 : 0, height: 'auto' }}
                    >
                        {stats?.onlineUsersList?.length > 0 && <LiveUsersWidget users={stats.onlineUsersList} />}
                    </motion.div>

                    {/* Recent Table */}
                    <RecentCandidatesTable candidates={stats?.recentCandidates} />
                </div>

            </div>
        </div>
    );
}
"use client";
import React, { useEffect, useState } from 'react';
import {
    Users, FileCheck, Clock, TrendingUp, Target, Zap, Brain,
    Award, AlertCircle, CheckCircle, ArrowUpRight, ArrowDownRight,
    Activity, UserCheck, Briefcase, BarChart3, PieChart, LineChart
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import Link from 'next/link';

export default function BusinessDashboardHome() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    const [topPerformers, setTopPerformers] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/business/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);

            // Simular atividades recentes (você pode substituir por dados reais da API)
            setActivities(generateRecentActivities());
            setTopPerformers(generateTopPerformers(res.data));
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
                    <div className="h-96 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
                <p className="text-slate-500">Monitoramento em tempo real do seu processo de avaliação e gestão de talentos.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Colaboradores"
                    value={stats?.employees?.total || 0}
                    change="+12%"
                    trend="up"
                    icon={Users}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Avaliações Concluídas"
                    value={stats?.assessments?.completed || 0}
                    change="+8%"
                    trend="up"
                    icon={FileCheck}
                    color="bg-green-50 text-green-600"
                />
                <StatCard
                    title="Taxa de Engajamento"
                    value={`${Math.round(((stats?.assessments?.completed || 0) / (stats?.employees?.total || 1)) * 100)}%`}
                    change="+5%"
                    trend="up"
                    icon={TrendingUp}
                    color="bg-purple-50 text-purple-600"
                />
                <StatCard
                    title="Seus Créditos"
                    value={stats?.credits || 0}
                    change="-15"
                    trend="down"
                    icon={Zap}
                    color="bg-amber-50 text-amber-600"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Feed */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Atividade Recente</h3>
                                <p className="text-sm text-slate-500">Últimas ações no sistema</p>
                            </div>
                            <Activity className="text-purple-600" size={20} />
                        </div>
                        <div className="space-y-4">
                            {activities.length > 0 ? activities.map((activity, idx) => (
                                <ActivityItem key={idx} activity={activity} />
                            )) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nenhuma atividade recente</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance Chart */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Tendência de Avaliações</h3>
                                <p className="text-sm text-slate-500">Últimos 7 dias</p>
                            </div>
                            <LineChart className="text-purple-600" size={20} />
                        </div>
                        <PerformanceChart />
                    </div>

                    {/* Personality Distribution */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Distribuição de Personalidade</h3>
                                <p className="text-sm text-slate-500">Big Five - Média da equipe</p>
                            </div>
                            <Brain className="text-purple-600" size={20} />
                        </div>
                        <PersonalityDistribution />
                    </div>
                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6">
                    {/* Top Performers */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Award className="text-purple-600" size={20} />
                            <h3 className="text-lg font-bold text-slate-900">Top Performers</h3>
                        </div>
                        <div className="space-y-3">
                            {topPerformers.map((performer, idx) => (
                                <TopPerformerItem key={idx} performer={performer} rank={idx + 1} />
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Ações Rápidas</h3>
                        <div className="space-y-2">
                            <QuickActionButton
                                icon={UserCheck}
                                label="Convidar Colaborador"
                                href="/business/dashboard/candidates"
                                color="purple"
                            />
                            <QuickActionButton
                                icon={Target}
                                label="Criar Perfil de Cargo"
                                href="/business/dashboard/talent/profiles"
                                color="blue"
                            />
                            <QuickActionButton
                                icon={Users}
                                label="Gerenciar Equipes"
                                href="/business/dashboard/talent/teams"
                                color="green"
                            />
                            <QuickActionButton
                                icon={BarChart3}
                                label="Ver Relatórios"
                                href="/business/dashboard/reports"
                                color="amber"
                            />
                        </div>
                    </div>

                    {/* Insights & Alerts */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="text-purple-600" size={20} />
                            <h3 className="text-lg font-bold text-slate-900">Insights</h3>
                        </div>
                        <div className="space-y-3">
                            <InsightCard
                                type="success"
                                message="Taxa de conclusão acima da média do setor (85%)"
                            />
                            <InsightCard
                                type="warning"
                                message="3 colaboradores pendentes de avaliação há mais de 7 dias"
                            />
                            <InsightCard
                                type="info"
                                message="Novo perfil de cargo disponível para análise"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, trend, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {change}
                    </div>
                )}
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-slate-900">{value}</h4>
        </div>
    );
}

function ActivityItem({ activity }: any) {
    const getIcon = () => {
        switch (activity.type) {
            case 'assessment': return <FileCheck className="text-green-600" size={16} />;
            case 'invite': return <UserCheck className="text-blue-600" size={16} />;
            case 'team': return <Users className="text-purple-600" size={16} />;
            case 'profile': return <Target className="text-amber-600" size={16} />;
            default: return <Activity className="text-slate-600" size={16} />;
        }
    };

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 font-medium">{activity.message}</p>
                <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
            </div>
        </div>
    );
}

function TopPerformerItem({ performer, rank }: any) {
    return (
        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold">
                {rank}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{performer.name}</p>
                <p className="text-xs text-slate-500">{performer.role}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-purple-600">{performer.score}%</p>
                <p className="text-xs text-slate-500">fit</p>
            </div>
        </div>
    );
}

function QuickActionButton({ icon: Icon, label, href, color }: any) {
    const colorClasses = {
        purple: 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200',
        blue: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200',
        green: 'hover:bg-green-50 hover:text-green-700 hover:border-green-200',
        amber: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
    };

    return (
        <Link href={href}>
            <button className={`w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 text-slate-700 transition-all ${colorClasses[color as keyof typeof colorClasses]}`}>
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
            </button>
        </Link>
    );
}

function InsightCard({ type, message }: any) {
    const config = {
        success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
        info: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    };

    const { icon: Icon, color, bg, border } = config[type as keyof typeof config];

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border ${border} ${bg}`}>
            <Icon className={color} size={16} />
            <p className="text-sm text-slate-700 flex-1">{message}</p>
        </div>
    );
}

function PerformanceChart() {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const data = [12, 19, 15, 25, 22, 18, 24];
    const maxValue = Math.max(...data);

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between gap-2 h-48">
                {data.map((value, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                            <div
                                className="absolute bottom-0 w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-purple-700 hover:to-purple-500"
                                style={{ height: `${(value / maxValue) * 100}%` }}
                            >
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white">
                                    {value}
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{days[idx]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PersonalityDistribution() {
    const traits = [
        { name: 'Abertura', value: 72, color: 'bg-indigo-500' },
        { name: 'Conscienciosidade', value: 85, color: 'bg-blue-500' },
        { name: 'Extroversão', value: 64, color: 'bg-green-500' },
        { name: 'Amabilidade', value: 78, color: 'bg-yellow-500' },
        { name: 'Neuroticismo', value: 45, color: 'bg-pink-500' }
    ];

    return (
        <div className="space-y-4">
            {traits.map((trait, idx) => (
                <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{trait.name}</span>
                        <span className="text-sm font-bold text-slate-900">{trait.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${trait.color} rounded-full transition-all duration-500`}
                            style={{ width: `${trait.value}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Helper functions
function generateRecentActivities() {
    const now = new Date();
    return [
        {
            type: 'assessment',
            message: 'João Silva completou a avaliação de personalidade',
            time: 'Há 5 minutos'
        },
        {
            type: 'invite',
            message: 'Novo colaborador convidado: Maria Santos',
            time: 'Há 15 minutos'
        },
        {
            type: 'team',
            message: 'Equipe "Vendas" foi atualizada com 2 novos membros',
            time: 'Há 1 hora'
        },
        {
            type: 'profile',
            message: 'Perfil de cargo "Analista de Marketing" criado',
            time: 'Há 2 horas'
        },
        {
            type: 'assessment',
            message: 'Ana Costa completou a avaliação de personalidade',
            time: 'Há 3 horas'
        }
    ];
}

function generateTopPerformers(stats: any) {
    return [
        { name: 'Carlos Mendes', role: 'Gerente de Vendas', score: 95 },
        { name: 'Juliana Lima', role: 'Analista de Marketing', score: 92 },
        { name: 'Pedro Oliveira', role: 'Desenvolvedor', score: 89 },
        { name: 'Fernanda Costa', role: 'Designer UX', score: 87 },
        { name: 'Roberto Santos', role: 'Analista de Dados', score: 85 }
    ];
}

"use client";
import React, { useEffect, useState } from 'react';
import {
    Users, FileCheck, TrendingUp, Zap,
    ArrowUpRight, ArrowDownRight,
    Activity, UserCheck, BarChart3
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import Link from 'next/link';

export default function BusinessDashboardHome() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
                    icon={Users}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Avaliações Concluídas"
                    value={stats?.assessments?.completed || 0}
                    icon={FileCheck}
                    color="bg-green-50 text-green-600"
                />
                <StatCard
                    title="Taxa de Engajamento"
                    value={`${stats?.employees?.total ? Math.round(((stats?.assessments?.completed || 0) / (stats?.employees?.total)) * 100) : 0}%`}
                    icon={TrendingUp}
                    color="bg-purple-50 text-purple-600"
                />
                <StatCard
                    title="Seus Créditos"
                    value={stats?.credits || 0}
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
                            {stats?.activities && stats.activities.length > 0 ? stats.activities.map((activity: any, idx: number) => (
                                <ActivityItem key={idx} activity={activity} />
                            )) : (
                                <div className="text-center py-8 text-slate-400">
                                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Nenhuma atividade recente encontrada</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column - 1/3 width */}
                <div className="space-y-6">

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
            case 'assessment_completed': return <FileCheck className="text-green-600" size={16} />;
            case 'assessment_assigned': return <UserCheck className="text-blue-600" size={16} />;
            case 'team_created': return <Users className="text-purple-600" size={16} />;
            // case 'profile': return <Target className="text-amber-600" size={16} />;
            default: return <Activity className="text-slate-600" size={16} />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours} horas atrás`;
        return `${diffDays} dias atrás`;
    }

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 font-medium">{activity.message}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(activity.time)}</p>
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


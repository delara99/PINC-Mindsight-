
"use client";
import React, { useEffect, useState } from 'react';
import { Users, FileCheck, Clock, TrendingUp } from 'lucide-react';
import axios from 'axios';

export default function BusinessDashboardHome() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="animate-pulse flex flex-col gap-4 max-w-4xl"><div className="h-40 bg-slate-200 rounded-xl"></div><div className="h-40 bg-slate-200 rounded-xl"></div></div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
                <p className="text-slate-500">Monitoramento em tempo real do seu processo de avaliação.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    title="Pendentes"
                    value={stats?.assessments?.pending || 0}
                    icon={Clock}
                    color="bg-orange-50 text-orange-600"
                />
                <StatCard
                    title="Seus Créditos"
                    value={stats?.credits || 0}
                    icon={TrendingUp} // Trocando icone temporario
                    color="bg-purple-50 text-purple-600"
                />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Atividade Recente</h3>
                <div className="text-sm text-slate-500 italic">
                    Nenhuma atividade recente registrada nos últimos 30 minutos.
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between hover:border-slate-300 transition-colors">
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h4 className="text-3xl font-bold text-slate-900">{value}</h4>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={20} />
            </div>
        </div>
    );
}

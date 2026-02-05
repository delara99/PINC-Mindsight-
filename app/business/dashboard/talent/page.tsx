"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { Target, Users, ClipboardList, TrendingUp, ArrowRight, BrainCircuit, Sparkles, Plus, Trash2 } from 'lucide-react';

export default function TalentIntelligenceDashboard() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/business/job-profiles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfiles(res.data);
        } catch (error) {
            console.error("Erro ao buscar perfis:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        if (!confirm('Tem certeza que deseja excluir este perfil?')) return;

        try {
            const token = localStorage.getItem('accessToken');
            await axios.delete(`${API_URL}/api/v1/business/job-profiles/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProfiles(); // Reload
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white shadow-lg">
                            <Sparkles size={24} />
                        </div>
                        Inteligência de Talento
                        <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full uppercase tracking-wider border border-purple-200">Beta</span>
                    </h1>
                    <p className="text-slate-500 mt-2 max-w-2xl text-lg">
                        Transforme dados de colaboradores em decisões estratégicas.
                    </p>
                </div>
                <Link href="/business/dashboard/talent/jobs/create">
                    <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl">
                        <Plus size={20} />
                        Novo Perfil
                    </button>
                </Link>
            </div>

            {/* SEÇÃO DE PERFIS CRIADOS (NOVA) */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BrainCircuit className="text-purple-600" />
                    Seus Perfis de Cargo
                </h2>

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Carregando perfis...</div>
                ) : profiles.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                        <p className="text-slate-500 mb-4">Você ainda não criou nenhum perfil de cargo.</p>
                        <Link href="/business/dashboard/talent/jobs/create" className="text-purple-600 font-bold hover:underline">
                            Criar meu primeiro perfil
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profiles.map(profile => (
                            <Link
                                key={profile.id}
                                href={`/business/dashboard/talent/jobs/${profile.id}`}
                                className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-100/30 transition-all duration-300 flex flex-col justify-between h-full relative"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold">
                                            {profile.name.charAt(0)}
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, profile.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Excluir Perfil"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-purple-700 transition-colors">
                                        {profile.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
                                        {profile.description || 'Sem descrição definida.'}
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ver Análise</span>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Card de Adicionar Novo (Ghost) */}
                        <Link href="/business/dashboard/talent/jobs/create" className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all gap-4 text-slate-400 hover:text-purple-600 cursor-pointer min-h-[200px]">
                            <Plus size={32} />
                            <span className="font-bold">Criar Novo Perfil</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Quick Actions Grid (Secundário) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                {/* Cards antigos mantidos, mas com menos destaque pois agora o foco é a lista acima */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-2 text-green-600">
                        <Users size={20} />
                        <h3 className="font-bold">Análise de Equipe</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Em breve: simule novos membros.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-2 text-orange-600">
                        <ClipboardList size={20} />
                        <h3 className="font-bold">Planos de Ação</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Em breve: PDI automático.</p>
                </div>
            </div>
        </div>
    );
}

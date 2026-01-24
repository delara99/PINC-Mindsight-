"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, MoreHorizontal, PieChart, BarChart3, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { HelpTooltip } from '@/src/components/ui/HelpTooltip';

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        const baseUrl = url.startsWith('http') ? url : `https://${url}`;
        if (baseUrl.includes('/api/v1')) return baseUrl;
        return `${baseUrl}/api/v1`;
    };

    useEffect(() => {
        const fetchTeams = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const response = await fetch(`${getApiUrl()}/business/talent-intelligence/teams`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    setTeams(await response.json());
                }
            } catch (error) {
                console.error("Erro ao carregar equipes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const handleCreate = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${getApiUrl()}/business/talent-intelligence/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newTeam = await response.json();
                setTeams(prev => [newTeam, ...prev]);
                setShowCreateModal(false);
                setFormData({ name: '', description: '' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Link href="/business/dashboard/talent" className="hover:text-purple-600 transition-colors">Inteligência de Talento</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">Equipes</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        Análise de Equipes (Team Fit)
                        <HelpTooltip text="Crie grupos ou squads para visualizar o 'DNA da Equipe': a média dos traços comportamentais dos membros." />
                    </h1>
                    <p className="text-slate-500">Gerencie times e analise a dinâmica coletiva da sua organização.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-lg hover:shadow-green-200"
                >
                    <Plus size={20} />
                    Nova Equipe
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar equipes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Teams Grid */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>
            ) : filteredTeams.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma equipe encontrada</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Crie a primeira equipe para começar a análise coletiva.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 font-medium transition-colors"
                    >
                        Criar Equipe
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.map((team) => (
                        <div key={team.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-green-200 transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div className="text-xs font-bold text-slate-400">{team.memberIds?.length || 0} MEMBROS</div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{team.name}</h3>
                            <p className="text-xs text-slate-500 mb-6 min-h-[1.5rem] line-clamp-1">{team.description}</p>

                            <Link href={`/business/dashboard/talent/teams/${team.id}`} className="block w-full text-center py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-green-50 hover:text-green-700 font-medium text-sm transition-colors border border-slate-200 hover:border-green-200 flex items-center justify-center gap-2">
                                <PieChart size={16} />
                                Análise & Fit
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Nova Equipe</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Equipe</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Squad Mobile"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    placeholder="Objetivos e responsabilidades..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancelar</button>
                            <button
                                onClick={handleCreate}
                                disabled={!formData.name || isSaving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Criar Equipe
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

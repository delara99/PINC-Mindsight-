"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Settings, ArrowRight, X, Loader2, Save, BarChart2 } from 'lucide-react';
import Link from 'next/link';

const MOCK_TEAMS = [
    { id: '1', name: 'Equipe de Vendas', description: 'Vendedores Hunter e Farmer', memberCount: 5 },
    { id: '2', name: 'Squad Mobile', description: 'Desenvolvedores e QA do App', memberCount: 8 },
];

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>(MOCK_TEAMS);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });

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
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setTeams(data.map((t: any) => ({
                            ...t,
                            memberCount: t.memberIds ? (t.memberIds as string[]).length : 0
                        })));
                    }
                }
            } catch (error) {
                console.error("Error fetching teams:", error);
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
                setTeams(prev => [{ ...newTeam, memberCount: 0 }, ...prev]);
                setShowCreateModal(false);
                setFormData({ name: '', description: '' });
            }
        } catch (error) {
            console.error("Error creating team:", error);
            alert("Erro ao criar equipe");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredTeams = teams.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-slate-900">Análise de Equipes (Team Fit)</h1>
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

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar equipe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>
            ) : filteredTeams.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Users className="text-slate-400 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">Nenhuma equipe encontrada</h3>
                    <p className="text-slate-500 mb-6">Crie sua primeira equipe para começar as análises.</p>
                    <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-green-50 text-green-700 rounded-lg">Criar Equipe</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.map(team => (
                        <div key={team.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-green-300 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                    <Users size={24} />
                                </div>
                                <div className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold font-mono">
                                    {team.memberCount} membros
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-green-700 transition-colors">{team.name}</h3>
                            <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{team.description || "Sem descrição."}</p>

                            <div className="flex gap-2">
                                <Link
                                    href={`/business/dashboard/talent/teams/${team.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-lg font-bold hover:bg-green-100 transition-colors"
                                >
                                    <BarChart2 size={18} />
                                    Análise & Fit
                                </Link>
                            </div>
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
                            <button onClick={() => setShowCreateModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Equipe</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Ex: Squad Checkout"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Objetivos e responsabilidades..."
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={!formData.name || isSaving}
                                className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                Criar Equipe
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

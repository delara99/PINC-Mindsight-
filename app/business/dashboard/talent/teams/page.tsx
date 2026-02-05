'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, TrendingUp, Search, Filter } from 'lucide-react';
import { API_URL } from '@/src/config/api';
import axios from 'axios';
import Link from 'next/link';

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            const res = await axios.get(`${API_URL}/business/team`);
            setTeams(res.data);
        } catch (error) {
            console.error('Failed to load teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteTeam = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta equipe?')) return;
        try {
            await axios.delete(`${API_URL}/business/team/${id}`);
            loadTeams();
        } catch (error) {
            console.error('Failed to delete team:', error);
        }
    };

    const filtered = teams.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando equipes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-100 p-8">
            {/* Header Assimétrico (90/10) */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex items-start justify-between">
                    {/* Lado Esquerdo - Comprimido */}
                    <div className="w-2/3">
                        <div className="inline-block">
                            <h1 className="text-6xl font-black text-slate-900 leading-none mb-2 tracking-tight">
                                Equipes
                            </h1>
                            <div className="h-2 w-32 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                        </div>
                        <p className="text-slate-600 mt-4 text-lg max-w-md">
                            Gerencie times, analise compatibilidade e otimize a formação de equipes de alta performance.
                        </p>
                    </div>

                    {/* Lado Direito - CTA Flutuante */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Nova Equipe</span>
                        </div>
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                </div>

                {/* Barra de Busca - Estilo Brutalist */}
                <div className="mt-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar equipe por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-900 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-orange-500 transition-colors"
                    />
                </div>
            </div>

            {/* Grid de Cards - Fragmentado (não Bento) */}
            <div className="max-w-7xl mx-auto">
                {filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg font-medium">
                            {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe criada ainda'}
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-6 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                        >
                            Criar Primeira Equipe
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((team, idx) => (
                            <TeamCard
                                key={team.id}
                                team={team}
                                onDelete={deleteTeam}
                                delay={idx * 50}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Criação */}
            {showModal && (
                <TeamModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); loadTeams(); }}
                />
            )}
        </div>
    );
}

function TeamCard({ team, onDelete, delay }: any) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="group relative bg-white border-2 border-slate-900 p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            style={{ animationDelay: `${delay}ms` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Accent Bar */}
            <div className={`absolute top-0 left-0 h-full w-2 bg-gradient-to-b from-orange-500 to-red-500 transition-all duration-300 ${hovered ? 'w-full opacity-5' : ''}`}></div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 mb-1">{team.name}</h3>
                        <p className="text-sm text-slate-500">{team.description || 'Sem descrição'}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/business/dashboard/talent/teams/${team.id}`}>
                            <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors">
                                <TrendingUp className="w-5 h-5 text-orange-600" />
                            </button>
                        </Link>
                        <button
                            onClick={() => onDelete(team.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-5 h-5" />
                    <span className="font-bold text-lg">{team.memberCount || 0}</span>
                    <span className="text-sm">membros</span>
                </div>
            </div>
        </div>
    );
}

function TeamModal({ onClose, onSuccess }: any) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState<string[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/user`);
            setAvailableUsers(res.data.filter((u: any) => u.role === 'MEMBER'));
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/business/team`, {
                name,
                description,
                memberIds: members
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to create team:', error);
            alert('Erro ao criar equipe');
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (id: string) => {
        setMembers(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border-4 border-slate-900 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 p-6 border-b-4 border-slate-900">
                    <h2 className="text-3xl font-black text-white">Nova Equipe</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
                            Nome da Equipe *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                            placeholder="Ex: Time de Vendas"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-900 focus:outline-none focus:border-orange-500 font-medium resize-none"
                            rows={3}
                            placeholder="Descreva o propósito desta equipe..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                            Membros ({members.length} selecionados)
                        </label>
                        <div className="border-2 border-slate-900 max-h-64 overflow-y-auto">
                            {availableUsers.map(user => (
                                <label
                                    key={user.id}
                                    className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer border-b border-slate-200 last:border-0 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={members.includes(user.id)}
                                        onChange={() => toggleMember(user.id)}
                                        className="w-5 h-5 accent-orange-500"
                                    />
                                    <div>
                                        <p className="font-bold text-slate-900">{user.name}</p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-slate-900 font-bold hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:shadow-lg disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Criando...' : 'Criar Equipe'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

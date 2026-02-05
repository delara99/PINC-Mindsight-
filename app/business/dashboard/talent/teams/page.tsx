'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, TrendingUp, Search, Filter, ArrowLeft } from 'lucide-react';
import { API_URL } from '@/src/config/api';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/business/team`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            const token = localStorage.getItem('accessToken');
            await axios.delete(`${API_URL}/api/v1/business/team/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando equipes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <button
                            onClick={() => router.push('/business/dashboard/talent')}
                            className="hover:text-purple-600 transition-colors flex items-center gap-1"
                        >
                            <ArrowLeft size={16} />
                            Inteligência de Talento
                        </button>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">Equipes</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Equipes
                    </h1>
                    <p className="text-slate-500">
                        Gerencie times, analise compatibilidade e otimize a formação de equipes de alta performance.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow-lg hover:shadow-purple-200"
                >
                    <Plus size={20} />
                    Nova Equipe
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar equipe por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Grid de Cards */}
            <div>
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                            {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe criada ainda'}
                        </h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-6">
                            Comece criando a primeira equipe para analisar a compatibilidade e performance.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 font-medium transition-colors"
                        >
                            Criar Primeira Equipe
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filtered.map((team) => (
                            <TeamCard
                                key={team.id}
                                team={team}
                                onDelete={deleteTeam}
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

function TeamCard({ team, onDelete }: any) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-purple-200 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <Users size={20} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/business/dashboard/talent/teams/${team.id}`}>
                        <button className="p-1 hover:bg-purple-100 rounded text-purple-600 transition-colors">
                            <TrendingUp size={16} />
                        </button>
                    </Link>
                    <button
                        onClick={() => onDelete(team.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">{team.name}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{team.description || 'Sem descrição'}</p>

            <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{team.memberCount || 0} membros</span>
            </div>

            <Link href={`/business/dashboard/talent/teams/${team.id}`} className="block w-full text-center py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-purple-50 hover:text-purple-700 font-medium text-sm transition-colors border border-slate-200 hover:border-purple-200 mt-4">
                Ver Análise
            </Link>
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
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/business/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailableUsers(res.data);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/business/team`, {
                name,
                description,
                memberIds: members
            }, {
                headers: { Authorization: `Bearer ${token}` }
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-500 p-6 rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-white">Nova Equipe</h2>
                    <p className="text-purple-100 text-sm">Crie uma nova equipe e selecione os membros</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nome da Equipe *
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            placeholder="Ex: Time de Vendas"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
                            rows={3}
                            placeholder="Descreva o propósito desta equipe..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Membros ({members.length} selecionados)
                        </label>
                        <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                            {availableUsers.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                    <p>Nenhum colaborador disponível</p>
                                </div>
                            ) : (
                                availableUsers.map(user => (
                                    <label
                                        key={user.id}
                                        className="flex items-center gap-3 p-3 hover:bg-purple-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={members.includes(user.id)}
                                            onChange={() => toggleMember(user.id)}
                                            className="w-5 h-5 accent-purple-600 rounded"
                                        />
                                        <div>
                                            <p className="font-medium text-slate-900">{user.name}</p>
                                            <p className="text-sm text-slate-500">{user.email}</p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-200"
                        >
                            {loading ? 'Criando...' : 'Criar Equipe'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

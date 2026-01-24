"use client";
import React, { useEffect, useState } from 'react';
import { Users, ArrowLeft, Plus, UserPlus, Trash2, PieChart, ShieldAlert, Sparkles, Loader2, Check } from 'lucide-react';
import Link from 'next/link';

export default function TeamDetailsPage({ params }: { params: { id: string } }) {
    const [team, setTeam] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]); // Detalhes dos membros
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Add Member State
    const [availableUsers, setAvailableUsers] = useState<any[]>([]); // Mock or Fetch
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchTeamData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                // 1. Fetch "All Teams" and filter locally (MVP hack since we don't have getOne endpoint exposed yet)
                // Or better: Implement getTeam in controller. But for now, let's filter.
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/talent-intelligence/teams`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const teams = await response.json();
                    const foundTeam = teams.find((t: any) => t.id === params.id);
                    if (foundTeam) {
                        setTeam(foundTeam);
                        // Fetch members details? We only have IDs in foundTeam.memberIds
                        // Mocking member details for visualization
                        setMembers((foundTeam.memberIds || []).map((id: string) => ({ id, name: `User ${id.substring(0, 4)}`, role: 'Member' })));
                    }
                }
            } catch (error) {
                console.error("Error", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [params.id]);

    const handleAddMembers = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/talent-intelligence/teams/${params.id}/members`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ memberIds: selectedUsers })
            });

            if (response.ok) {
                // Reload page or update state
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" size={40} /></div>;
    if (!team) return <div className="text-center py-20">Equipe não encontrada</div>;

    const avgScores = team.avgScores || { O: 50, C: 50, E: 50, A: 50, N: 50 };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <Link href="/business/dashboard/talent/teams" className="inline-flex items-center text-sm text-slate-500 hover:text-green-600 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    Voltar para Equipes
                </Link>
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-green-50 text-green-600 border border-green-100 rounded-xl flex items-center justify-center shadow-sm">
                            <Users size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-1">{team.name}</h1>
                            <p className="text-slate-500 max-w-2xl">{team.description || "Dynamics report."}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium"
                    >
                        <UserPlus size={18} />
                        Gerenciar Membros
                    </button>
                </div>
            </div>

            {/* Team DNA Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Radar / Bars */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <PieChart size={20} className="text-green-600" />
                        DNA da Equipe (Média)
                    </h3>

                    <div className="space-y-6">
                        {[
                            { k: 'O', label: 'Abertura', val: avgScores.O, color: 'indigo', desc: 'Nível de inovação' },
                            { k: 'C', label: 'Conscienciosidade', val: avgScores.C, color: 'blue', desc: 'Organização e foco' },
                            { k: 'E', label: 'Extroversão', val: avgScores.E, color: 'green', desc: 'Energia social' },
                            { k: 'A', label: 'Amabilidade', val: avgScores.A, color: 'yellow', desc: 'Cooperação' },
                            { k: 'N', label: 'Estabilidade', val: avgScores.N, color: 'pink', desc: 'Resiliência' }
                        ].map((item) => (
                            <div key={item.k}>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                    <span className="text-xs text-slate-400">{item.desc}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full bg-${item.color}-500 rounded-full transition-all duration-1000`} style={{ width: `${item.val}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right font-mono font-bold text-slate-900">{item.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cultural Insights */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-600" />
                        Insights Culturais
                    </h3>

                    {/* Dynamic Insights based on scores */}
                    <div className="space-y-4">
                        {avgScores.C > 70 ? (
                            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-blue-700 mb-1">Alta Execução</h4>
                                <p className="text-sm text-slate-600">Este time valoriza processos, prazos e qualidade técnica. Pode resistir a mudanças bruscas.</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-orange-700 mb-1">Flexibilidade e Rapidez</h4>
                                <p className="text-sm text-slate-600">Time ágil, focado em entregas rápidas, mas pode precisar de ajuda com processos.</p>
                            </div>
                        )}

                        {avgScores.A > 70 ? (
                            <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-yellow-700 mb-1">Alta Coesão</h4>
                                <p className="text-sm text-slate-600">Ambiente colaborativo e harmonioso. Feedback duro pode ser evitado para não ferir sentimentos.</p>
                            </div>
                        ) : null}

                        {/* Mock Risk */}
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                            <h4 className="font-bold text-red-700 mb-1 flex items-center gap-1"><ShieldAlert size={14} /> Ponto de Atenção</h4>
                            <p className="text-sm text-red-600">Baixa diversidade em Extroversão (Todos muito {avgScores.E > 60 ? 'altos' : 'baixos'}).</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members List */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Membros ({members.length})</h3>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {members.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Nenhum membro adicionado.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {members.map(m => (
                                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                            {m.name.substring(0, 2)}
                                        </div>
                                        <span className="font-medium text-slate-900">{m.name}</span>
                                    </div>
                                    <button className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Modal (Mocked selection) */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Adicionar Membros</h2>
                        <p className="text-sm text-slate-500 mb-4">Funcionalidade simulada no MVP (seleção de usuários).</p>

                        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                            {/* Mock Users Selection */}
                            {[1, 2, 3, 4].map(i => (
                                <label key={i} className="flex items-center gap-3 p-3 border rounded hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-green-600"
                                        checked={selectedUsers.includes(`user-${i}`)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedUsers([...selectedUsers, `user-${i}`]);
                                            else setSelectedUsers(selectedUsers.filter(id => id !== `user-${i}`));
                                        }}
                                    />
                                    <span>Colaborador Exemplo {i}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                            <button
                                onClick={handleAddMembers}
                                disabled={isSaving || selectedUsers.length === 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                {isSaving ? 'Salvando...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

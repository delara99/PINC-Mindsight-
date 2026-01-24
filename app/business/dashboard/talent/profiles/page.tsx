"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Target, Briefcase, Trash2, Edit2, CheckCircle, X, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MOCK_PROFILES = [
    { id: '1', name: 'Analista de Marketing', department: 'Marketing', level: 'Pleno', idealScores: { O: 80, C: 60, E: 75, A: 70, N: 40 }, tolerance: 0.5 },
    { id: '2', name: 'Desenvolvedor Senior', department: 'Tech', level: 'Senior', idealScores: { O: 90, C: 80, E: 40, A: 60, N: 30 }, tolerance: 0.5 },
];

export default function JobProfilesPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<any[]>(MOCK_PROFILES);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        level: 'Pleno',
        idealScores: { O: 50, C: 50, E: 50, A: 50, N: 50 }
    });

    // Helper para URL da API
    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        const baseUrl = url.startsWith('http') ? url : `https://${url}`;

        // Se já tiver /api/v1, retorna. Se não, adiciona.
        if (baseUrl.includes('/api/v1')) return baseUrl;

        // Em produção no Railway, o prefixo é obrigatório
        return `${baseUrl}/api/v1`;
    };

    // Fetch Profiles
    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const response = await fetch(`${getApiUrl()}/business/job-profiles`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setProfiles(data);
                    }
                }
            } catch (error) {
                console.error("Error fetching profiles:", error);
            } finally {
                setLoading(false);
            }
        };

        // Uncomment to enable real fetching
        fetchProfiles();
    }, []);

    const handleScoreChange = (trait: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            idealScores: { ...prev.idealScores, [trait]: value }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${getApiUrl()}/business/job-profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newProfile = await response.json();
                setProfiles(prev => [newProfile, ...prev]);
                setShowCreateModal(false);
                // Reset form
                setFormData({
                    name: '',
                    department: '',
                    level: 'Pleno',
                    idealScores: { O: 50, C: 50, E: 50, A: 50, N: 50 }
                });
            } else {
                alert("Erro ao salvar perfil");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Erro de conexão");
        } finally {
            setIsSaving(false);
        }
    };

    // Filter
    const filteredProfiles = profiles.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.department && p.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Color Maps for Tailwind
    const TRAIT_COLORS: Record<string, string> = {
        indigo: 'bg-indigo-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        pink: 'bg-pink-500'
    };

    const TRAIT_BORDERS: Record<string, string> = {
        indigo: 'border-indigo-500',
        blue: 'border-blue-500',
        green: 'border-green-500',
        yellow: 'border-yellow-500',
        pink: 'border-pink-500'
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Link href="/business/dashboard/talent" className="hover:text-purple-600 transition-colors">Inteligência de Talento</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">Perfis de Cargo</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Perfis de Cargo e Fit Cultural</h1>
                    <p className="text-slate-500">Defina o DNA comportamental ideal para cada função.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow-lg hover:shadow-purple-200"
                >
                    <Plus size={20} />
                    Novo Perfil
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por cargo ou departamento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Profiles Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-purple-600" size={32} />
                </div>
            ) : filteredProfiles.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum perfil encontrado</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Comece criando o primeiro perfil de cargo para analisar a compatibilidade dos seus colaboradores.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 font-medium transition-colors"
                    >
                        Criar Perfil
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProfiles.map((profile) => (
                        <div key={profile.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-purple-200 transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                    <Briefcase size={20} />
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{profile.name}</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">{profile.department || 'Geral'}</span>
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">{profile.level || 'N/A'}</span>
                            </div>

                            {/* Mini Metrics Visualization */}
                            <div className="space-y-3 mb-6">
                                {[
                                    { k: 'O', val: profile.idealScores?.O || 0, colorClass: 'bg-indigo-500' },
                                    { k: 'C', val: profile.idealScores?.C || 0, colorClass: 'bg-blue-500' },
                                    { k: 'E', val: profile.idealScores?.E || 0, colorClass: 'bg-green-500' }
                                ].map((item) => (
                                    <div key={item.k} className="flex items-center gap-2 text-xs">
                                        <span className="w-8 text-slate-500 font-bold">{item.k}</span>
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.colorClass} rounded-full`} style={{ width: `${item.val}%` }}></div>
                                        </div>
                                        <span className="w-6 text-right font-mono text-slate-600">{item.val}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href={`/business/dashboard/talent/profiles/${profile.id}`} className="block w-full text-center py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-purple-50 hover:text-purple-700 font-medium text-sm transition-colors border border-slate-200 hover:border-purple-200">
                                Ver Detalhes & Compatibilidade
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Novo Perfil de Cargo</h2>
                                <p className="text-sm text-slate-500">Defina os requisitos comportamentais para esta posição.</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8 overflow-y-auto">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Nome do Cargo <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Analista de Vendas"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Departamento</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Comercial"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Nível Senioridade</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                    >
                                        <option value="Estagiário">Estagiário</option>
                                        <option value="Júnior">Júnior</option>
                                        <option value="Pleno">Pleno</option>
                                        <option value="Sênior">Sênior</option>
                                        <option value="Especialista">Especialista</option>
                                        <option value="Gestor">Gestor</option>
                                        <option value="Diretor">Diretor</option>
                                    </select>
                                </div>
                            </div>

                            {/* Ideal Profile Config */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Target className="text-purple-600" size={20} />
                                    Perfil Comportamental Ideal (Big Five)
                                </h3>
                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-6">
                                    {(['O', 'C', 'E', 'A', 'N'] as const).map((key) => {
                                        const traitsConfig = {
                                            O: { label: 'Abertura (Openness)', desc: 'Criatividade, curiosidade e aceitação de novas ideias.', color: 'indigo' },
                                            C: { label: 'Conscienciosidade', desc: 'Organização, disciplina e foco em resultados.', color: 'blue' },
                                            E: { label: 'Extroversão', desc: 'Sociabilidade, energia e assertividade.', color: 'green' },
                                            A: { label: 'Amabilidade', desc: 'Empatia, cooperação e confiança nos outros.', color: 'yellow' },
                                            N: { label: 'Estabilidade', desc: 'Controle emocional e resiliência ao estresse.', color: 'pink' }
                                        };
                                        const trait = { key, ...traitsConfig[key] };

                                        return (
                                            <div key={trait.key} className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${TRAIT_COLORS[trait.color]}`}></div>
                                                        {trait.label}
                                                    </label>
                                                    <span className="text-sm font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm w-12 text-center">
                                                        {formData.idealScores[key]}
                                                    </span>
                                                </div>
                                                <div className="relative h-2 w-full rounded-lg bg-slate-200">
                                                    {/* Custom Slider Track Background could go here */}
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={formData.idealScores[key]}
                                                        onChange={(e) => handleScoreChange(key, parseInt(e.target.value))}
                                                        className={`absolute w-full h-full opacity-0 cursor-pointer z-10`}
                                                    />
                                                    {/* Visible Track */}
                                                    <div
                                                        className={`absolute h-full rounded-lg ${TRAIT_COLORS[trait.color]} transition-all`}
                                                        style={{ width: `${formData.idealScores[key]}%` }}
                                                    ></div>
                                                    {/* Thumb Handle visualization */}
                                                    <div
                                                        className={`absolute h-4 w-4 bg-white border-2 ${TRAIT_BORDERS[trait.color]} rounded-full shadow top-1/2 -translate-y-1/2 -ml-2 pointer-events-none transition-all`}
                                                        style={{ left: `${formData.idealScores[key]}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-slate-500 pt-1">{trait.desc}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl sticky bottom-0">
                            <button onClick={() => setShowCreateModal(false)} className="px-5 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !formData.name}
                                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-lg shadow-purple-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Salvar Perfil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

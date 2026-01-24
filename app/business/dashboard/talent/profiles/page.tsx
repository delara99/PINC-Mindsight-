"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Briefcase, MoreHorizontal, Target, TrendingUp, Save, X, Loader2, Edit2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { HelpTooltip } from '@/src/components/ui/HelpTooltip';

// Configuração de Facetas (Conceitos)
const FACETS_CONFIG: Record<string, string[]> = {
    O: ['Criatividade', 'Curiosidade Intelectual', 'Flexibilidade Mental'],
    C: ['Organização e Ordem', 'Foco em Resultados', 'Autodisciplina'],
    E: ['Assertividade (Liderança)', 'Sociabilidade (Gregarismo)', 'Nível de Energia'],
    A: ['Empatia e Altruísmo', 'Colaboração', 'Confiança nos Outros'],
    N: ['Resiliência à Pressão', 'Controle Emocional', 'Autoconfiança']
};

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedTraits, setExpandedTraits] = useState<Record<string, boolean>>({});

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        level: 'Pleno',
        idealScores: { O: 50, C: 50, E: 50, A: 50, N: 50 } as Record<string, number>,
        // Armazena scores das facetas: { O: { 'Criatividade': 50 }, ... }
        facets: {
            O: {}, C: {}, E: {}, A: {}, N: {}
        } as Record<string, Record<string, number>>
    });

    // Helper para URL da API
    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        const baseUrl = url.startsWith('http') ? url : `https://${url}`;
        if (baseUrl.includes('/api/v1')) return baseUrl;
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
                console.error("Erro ao buscar perfis:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    const handleScoreChange = (trait: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            idealScores: { ...prev.idealScores, [trait]: value }
        }));
    };

    const handleFacetChange = (trait: string, facetName: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            facets: {
                ...prev.facets,
                [trait]: {
                    ...prev.facets[trait],
                    [facetName]: value
                }
            }
        }));
    };

    const toggleTraitExpansion = (trait: string) => {
        setExpandedTraits(prev => ({ ...prev, [trait]: !prev[trait] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('accessToken');

            // Merge facets into idealScores payload if needed, or send as separate field
            const payload = {
                ...formData,
            };

            const response = await fetch(`${getApiUrl()}/business/job-profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const newProfile = await response.json();
                setProfiles(prev => [newProfile, ...prev]);
                setShowCreateModal(false);
                setFormData({
                    name: '',
                    department: '',
                    level: 'Pleno',
                    idealScores: { O: 50, C: 50, E: 50, A: 50, N: 50 },
                    facets: { O: {}, C: {}, E: {}, A: {}, N: {} }
                });
                setExpandedTraits({});
            } else {
                alert("Erro ao salvar perfil");
            }
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
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
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                        Perfis de Cargo e Fit Cultural
                        <HelpTooltip text="Crie perfis ideais para cada cargo e compare com os testes dos colaboradores para encontrar a melhor compatibilidade (Fit)." />
                    </h1>
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
                                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{profile.name}</h3>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">{profile.department || 'Geral'}</span>
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase tracking-wider">{profile.level || 'N/A'}</span>
                            </div>

                            {/* Mini Metrics Visualization */}
                            <div className="space-y-3 mb-6">
                                {[
                                    { k: 'O', label: 'Abertura', val: profile.idealScores?.O || 0, colorClass: 'bg-indigo-500' },
                                    { k: 'C', label: 'Consciência', val: profile.idealScores?.C || 0, colorClass: 'bg-blue-500' },
                                    { k: 'E', label: 'Extroversão', val: profile.idealScores?.E || 0, colorClass: 'bg-green-500' }
                                ].map((item) => (
                                    <div key={item.k} className="flex items-center gap-2 text-xs">
                                        <span className="w-20 text-slate-500 font-bold truncate" title={item.label}>{item.label}</span>
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

            {/* Create Modal - ADVANCED VERSION */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Novo Perfil de Cargo</h2>
                                <p className="text-sm text-slate-500">Defina os requisitos comportamentais (Traços e Facetas).</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8 overflow-y-auto">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center">
                                        Nome do Cargo <span className="text-red-500">*</span>
                                    </label>
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
                                    DNA Comportamental (Advanced)
                                    <HelpTooltip text="Defina os traços principais e use o Ajuste Fino para calibrar as facetas específicas." />
                                </h3>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                                    {(['O', 'C', 'E', 'A', 'N'] as const).map((key) => {
                                        const traitsConfig = {
                                            O: { label: 'Abertura (Openness)', desc: 'Criatividade, curiosidade e aceitação de novas ideias.', color: 'indigo' },
                                            C: { label: 'Conscienciosidade', desc: 'Organização, disciplina e foco em resultados.', color: 'blue' },
                                            E: { label: 'Extroversão', desc: 'Sociabilidade, energia e assertividade.', color: 'green' },
                                            A: { label: 'Amabilidade', desc: 'Empatia, cooperação e confiança nos outros.', color: 'yellow' },
                                            N: { label: 'Estabilidade', desc: 'Controle emocional e resiliência ao estresse.', color: 'pink' }
                                        };
                                        const trait = { key, ...traitsConfig[key] };
                                        const isExpanded = expandedTraits[key];
                                        const facets = FACETS_CONFIG[key] || [];

                                        return (
                                            <div key={trait.key} className="bg-white">
                                                <div className="p-6 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-base font-bold text-slate-800 flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${TRAIT_COLORS[trait.color]}`}></div>
                                                            {trait.label}
                                                        </label>
                                                        <span className={`text-lg font-bold ${formData.idealScores[key] > 70 ? 'text-green-600' : 'text-slate-700'}`}>
                                                            {formData.idealScores[key]}
                                                        </span>
                                                    </div>

                                                    {/* Main Slider */}
                                                    <div className="relative h-2 w-full rounded-lg bg-slate-100">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={formData.idealScores[key]}
                                                            onChange={(e) => handleScoreChange(key, parseInt(e.target.value))}
                                                            className={`absolute w-full h-full opacity-0 cursor-pointer z-10`}
                                                        />
                                                        <div
                                                            className={`absolute h-full rounded-lg ${TRAIT_COLORS[trait.color]} transition-all`}
                                                            style={{ width: `${formData.idealScores[key]}%` }}
                                                        ></div>
                                                        <div
                                                            className={`absolute h-4 w-4 bg-white border-2 ${TRAIT_BORDERS[trait.color]} rounded-full shadow top-1/2 -translate-y-1/2 -ml-2 pointer-events-none transition-all`}
                                                            style={{ left: `${formData.idealScores[key]}%` }}
                                                        ></div>
                                                    </div>

                                                    <div className="flex justify-between items-start">
                                                        <p className="text-xs text-slate-500 max-w-[80%]">{trait.desc}</p>
                                                        <button
                                                            onClick={() => toggleTraitExpansion(key)}
                                                            className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700 transition-colors"
                                                        >
                                                            {isExpanded ? 'Ocultar Detalhes' : 'Ajustar Facetas (Subtraços)'}
                                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Advanced Facets Accordion */}
                                                {isExpanded && (
                                                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="grid grid-cols-1 gap-4">
                                                            {facets.map(facetName => {
                                                                const facetValue = formData.facets[key]?.[facetName] ?? 50;
                                                                return (
                                                                    <div key={facetName} className="flex items-center gap-4">
                                                                        <span className="text-xs font-medium text-slate-600 w-1/3 text-right">{facetName}</span>
                                                                        <div className="flex-1 relative h-1.5 bg-slate-200 rounded-full">
                                                                            <input
                                                                                type="range"
                                                                                min="0"
                                                                                max="100"
                                                                                value={facetValue}
                                                                                onChange={(e) => handleFacetChange(key, facetName, parseInt(e.target.value))}
                                                                                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                                                                            />
                                                                            <div
                                                                                className={`absolute h-full rounded-lg bg-slate-400`}
                                                                                style={{ width: `${facetValue}%` }}
                                                                            ></div>
                                                                            <div
                                                                                className={`absolute h-3 w-3 bg-white border border-slate-300 rounded-full shadow top-1/2 -translate-y-1/2 -ml-1.5 pointer-events-none`}
                                                                                style={{ left: `${facetValue}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="text-xs font-mono text-slate-500 w-8">{facetValue}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                        <div className="mt-3 flex items-start gap-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded">
                                                            <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                                            O ajuste fino das facetas permite encontrar candidatos com perfis mais específicos, priorizando nuances do comportamento.
                                                        </div>
                                                    </div>
                                                )}
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

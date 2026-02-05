'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { ArrowLeft, Target, TrendingUp, AlertCircle, CheckCircle, User, Search } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

export default function JobProfileAnalysisPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // ESTADO DOS FILTROS (Movido para cima para respeitar Regras dos Hooks)
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [sortBy, setSortBy] = useState<'fit' | 'date' | 'name'>('fit');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get(`${API_URL}/api/v1/business/job-profiles/${params.id}/analysis`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    if (loading) return <div className="p-12 text-center text-slate-500">Calculando compatibilidades...</div>;
    if (!data) return <div className="p-12 text-center text-red-500">Erro ao carregar dados.</div>;

    const { profile, candidates } = data;
    const idealScores = profile.idealScores || { O: 50, C: 50, E: 50, A: 50, N: 50 };

    // Lógica de Filtragem e Ordenação
    const filteredCandidates = candidates?.filter((c: any) => {
        const matchesSearch = c.user.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            filterStatus === 'all' ? true :
                filterStatus === 'high' ? c.fit >= 75 :
                    filterStatus === 'medium' ? c.fit >= 50 && c.fit < 75 :
                        c.fit < 50; // low
        return matchesSearch && matchesStatus;
    }).sort((a: any, b: any) => {
        if (sortBy === 'fit') return b.fit - a.fit;
        if (sortBy === 'date') return new Date(b.source?.completedAt).getTime() - new Date(a.source?.completedAt).getTime();
        return a.user.name.localeCompare(b.user.name);
    }) || [];

    // Contadores para as Pílulas
    const counts = {
        all: candidates?.length || 0,
        high: candidates?.filter((c: any) => c.fit >= 75).length || 0,
        medium: candidates?.filter((c: any) => c.fit >= 50 && c.fit < 75).length || 0,
        low: candidates?.filter((c: any) => c.fit < 50).length || 0
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                    >
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{profile.name}</h1>
                        <p className="text-slate-500 flex items-center gap-2">
                            <Target size={16} /> Análise de Compatibilidade (Fit)
                        </p>
                    </div>
                </div>
            </div>

            {/* BARRA DE CONTROLE INTELIGENTE */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-10 backdrop-blur-md bg-opacity-95">

                {/* 1. Busca */}
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar colaborador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    />
                </div>

                {/* 2. Filtros Rápidos (Pills) */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <FilterPill
                        label="Todos"
                        count={counts.all}
                        active={filterStatus === 'all'}
                        onClick={() => setFilterStatus('all')}
                    />
                    <FilterPill
                        label="Alta"
                        color="green"
                        count={counts.high}
                        active={filterStatus === 'high'}
                        onClick={() => setFilterStatus('high')}
                    />
                    <FilterPill
                        label="Média"
                        color="yellow"
                        count={counts.medium}
                        active={filterStatus === 'medium'}
                        onClick={() => setFilterStatus('medium')}
                    />
                    <FilterPill
                        label="Baixa"
                        color="red"
                        count={counts.low}
                        active={filterStatus === 'low'}
                        onClick={() => setFilterStatus('low')}
                    />
                </div>

                {/* 3. Ordenação */}
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                    <span className="text-xs font-bold text-slate-400 uppercase hidden md:inline">Ordenar:</span>
                    <select
                        value={sortBy}
                        onChange={(e: any) => setSortBy(e.target.value)}
                        className="bg-transparent text-sm font-semibold text-slate-700 cursor-pointer outline-none focus:text-purple-600 hover:bg-slate-50 p-2 rounded-lg"
                    >
                        <option value="fit">Melhor Fit</option>
                        <option value="date">Mais Recentes</option>
                        <option value="name">Nome (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* Ranking Grid */}
            <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-purple-600" />
                        Ranking de Candidatos
                    </h2>
                    <span className="text-sm text-slate-500 font-medium">mostrando {filteredCandidates.length} de {candidates.length}</span>
                </div>

                {filteredCandidates.length === 0 ? (
                    <div className="bg-slate-50 p-12 text-center rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500">Nenhum colaborador encontrado com os filtros atuais.</p>
                    </div>
                ) : (
                    filteredCandidates.map((cand: any, idx: number) => {
                        // Preparar dados para o gráfico deste candidato
                        const chartData = [
                            { subject: 'Abertura', A: idealScores.O, B: cand.dimensions.O, fullMark: 100 },
                            { subject: 'Estrutura', A: idealScores.C, B: cand.dimensions.C, fullMark: 100 }, // Estrutura = Conscienciosidade
                            { subject: 'Extroversão', A: idealScores.E, B: cand.dimensions.E, fullMark: 100 },
                            { subject: 'Amabilidade', A: idealScores.A, B: cand.dimensions.A, fullMark: 100 },
                            { subject: 'Estabilidade', A: idealScores.N, B: cand.dimensions.N, fullMark: 100 },
                        ];

                        return (
                            <div key={cand.user.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${getFitColor(cand.fit)}`}></div>

                                <div className="p-6 grid md:grid-cols-[250px_1fr_300px] gap-8 items-center">

                                    {/* Coluna 1: Info e Score */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 font-bold text-xl">
                                                {cand.user.avatar ? <img src={cand.user.avatar} className="w-full h-full rounded-full" /> : <User />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900">{cand.user.name}</h3>
                                                <p className="text-sm text-slate-500">{cand.user.email}</p>
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <CheckCircle size={10} />
                                                    Avaliação: {new Date(cand.source?.completedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nota de Fit</span>
                                            <div className="flex items-end gap-2 mt-1">
                                                <span className={`text-4xl font-bold ${getFitTextColor(cand.fit)}`}>{cand.fit}%</span>
                                                <span className="text-sm font-medium text-slate-400 mb-2">
                                                    {cand.fit >= 80 ? 'alta compatibilidade' : cand.fit >= 50 ? 'compatibilidade média' : 'baixa compatibilidade'}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                                <div className={`h-full rounded-full ${getFitColor(cand.fit)}`} style={{ width: `${cand.fit}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna 2: Radar Comparativo */}
                                    <div className="h-[250px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                {/* Perfil Ideal (Área) */}
                                                <Radar
                                                    name="Perfil Ideal"
                                                    dataKey="A"
                                                    stroke="#a855f7"
                                                    strokeWidth={2}
                                                    fill="#a855f7"
                                                    fillOpacity={0.1}
                                                />
                                                {/* Candidato (Linha) */}
                                                <Radar
                                                    name="Candidato"
                                                    dataKey="B"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    fill="#3b82f6"
                                                    fillOpacity={0}
                                                />
                                                <Legend />
                                                <Tooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-2 right-2 flex flex-col gap-1 text-[10px] font-bold">
                                            <span className="text-purple-500">● Ideal</span>
                                            <span className="text-blue-500">● Real</span>
                                        </div>
                                    </div>

                                    {/* Coluna 3: Insights e Raio-X */}
                                    <div className="space-y-4">

                                        {/* Botão Raio-X */}
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500 font-mono">
                                            <p className="font-bold text-slate-700 mb-2 flex items-center gap-1">
                                                <Target size={12} /> Raio-X do Cálculo e Facetas
                                            </p>
                                            <div className="space-y-1">
                                                {['O', 'C', 'E', 'A', 'N'].map(dim => (
                                                    <DimensionRow
                                                        key={dim}
                                                        dim={dim}
                                                        userScores={cand.userScores}
                                                        idealScores={idealScores}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <CheckCircle size={12} /> Pontos Fortes
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {cand.strengths.length > 0 ? cand.strengths.map((s: string) => (
                                                    <span key={s} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">
                                                        {translateDim(s)}
                                                    </span>
                                                )) : <span className="text-xs text-slate-400">Nenhum destaque claro</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <AlertCircle size={12} /> Gaps (Atenção)
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {cand.gaps.length > 0 ? cand.gaps.map((g: string) => (
                                                    <span key={g} className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                                                        {translateDim(g)}
                                                    </span>
                                                )) : <span className="text-xs text-slate-400">Sem gaps críticos</span>}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function getFitColor(score: number) {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
}

function getFitTextColor(score: number) {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
}

function translateDim(dim: string) {
    const map: any = {
        'O': 'Abertura',
        'C': 'Estrutura',
        'E': 'Extroversão',
        'A': 'Amabilidade',
        'N': 'Estabilidade'
    };
    return map[dim] || dim;
}

const FACET_MAP: any = {
    E: [
        { key: 'E_F1', label: 'Cordialidade' }, { key: 'E_F2', label: 'Gregariedade' },
        { key: 'E_F3', label: 'Assertividade' }, { key: 'E_F4', label: 'Atividade' },
        { key: 'E_F5', label: 'Busca de Sensações' }, { key: 'E_F6', label: 'Emoções Positivas' }
    ],
    A: [
        { key: 'A_F1', label: 'Confiança' }, { key: 'A_F2', label: 'Franqueza' },
        { key: 'A_F3', label: 'Altruísmo' }, { key: 'A_F4', label: 'Complacência' },
        { key: 'A_F5', label: 'Modéstia' }, { key: 'A_F6', label: 'Sensibilidade' }
    ],
    C: [
        { key: 'C_F1', label: 'Competência' }, { key: 'C_F2', label: 'Ordem' },
        { key: 'C_F3', label: 'Senso de Dever' }, { key: 'C_F4', label: 'Esforço' },
        { key: 'C_F5', label: 'Autodisciplina' }, { key: 'C_F6', label: 'Ponderação' }
    ],
    N: [
        { key: 'N_F1', label: 'Ansiedade' }, { key: 'N_F2', label: 'Hostilidade' },
        { key: 'N_F3', label: 'Depressão' }, { key: 'N_F4', label: 'Embaraço' },
        { key: 'N_F5', label: 'Impulsividade' }, { key: 'N_F6', label: 'Vulnerabilidade' }
    ],
    O: [
        { key: 'O_F1', label: 'Fantasia' }, { key: 'O_F2', label: 'Estética' },
        { key: 'O_F3', label: 'Sentimentos' }, { key: 'O_F4', label: 'Ações' },
        { key: 'O_F5', label: 'Ideias' }, { key: 'O_F6', label: 'Valores' }
    ]
};

function DimensionRow({ dim, userScores, idealScores }: any) {
    const [expanded, setExpanded] = useState(false);

    const uScore = userScores?.[dim] ?? 0;
    const iScore = idealScores?.[dim] ?? 50;
    const diff = Math.abs(uScore - iScore);
    const facets = FACET_MAP[dim] || [];

    // Verifica se existem facetas relevantes para mostrar (se o ideal exigiu alguma calibração específica)
    // Se o ideal tiver tudo 50 nas facetas, talvez não valha a pena expandir, mas vamos deixar liberado.

    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex justify-between items-center hover:bg-slate-100 p-1.5 rounded transition-colors group"
            >
                <div className="flex items-center gap-1">
                    <span className={`text-[10px] text-slate-400 transform transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
                    <span>{translateDim(dim)}:</span>
                </div>
                <span className="text-slate-900 font-mono">
                    {uScore} <span className="text-slate-400 text-[10px]">vs</span> {iScore}
                    <span className={`ml-1 text-[10px] ${diff > 20 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                        (-{diff})
                    </span>
                </span>
            </button>

            {expanded && (
                <div className="pl-4 pr-1 pb-2 space-y-1 bg-slate-50/50 rounded-b-lg">
                    {facets.map((f: any) => {
                        const fuScore = userScores?.[f.key] ?? 0; // Se não tiver, assume 0
                        const fiScore = idealScores?.[f.key] ?? 50; // Se não tiver ideal, assume neutro
                        const fDiff = Math.abs(fuScore - fiScore);

                        // Só mostrar se tiver alguma relevância (target != 50 ou user != 0)
                        // Para limpar a view, vamos mostrar todos para o gestor ter certeza.
                        return (
                            <div key={f.key} className="flex justify-between items-center text-[10px] text-slate-600 pl-2 border-l-2 border-slate-200">
                                <span>{f.label}</span>
                                <div>
                                    <span className={fuScore === 0 ? 'text-slate-300' : ''}>{fuScore}</span>
                                    <span className="text-slate-300 mx-1">/</span>
                                    <span className="font-bold text-slate-700">{fiScore}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function FilterPill({ label, count, active, color = 'slate', onClick }: any) {
    const colors: any = {
        slate: active ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        green: active ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-100',
        yellow: active ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-100',
        red: active ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100',
    };

    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${colors[color]}`}
        >
            {label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-white/20' : 'bg-black/5'}`}>
                {count}
            </span>
        </button>
    );
}

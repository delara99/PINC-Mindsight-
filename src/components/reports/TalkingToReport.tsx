import React, { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Target, BrainCircuit, Zap, Users, ShieldCheck, Download, Sparkles, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';

interface TalkingToReportProps {
    reportData: any;
    userName: string;
    onDownloadPdf?: () => void;
    isAdmin?: boolean;
}

export default function TalkingToReport({ reportData, userName, onDownloadPdf, isAdmin }: TalkingToReportProps) {
    const [seeding, setSeeding] = useState(false);

    const { calculatedScores } = reportData;
    const scores = calculatedScores?.scores || [];

    // Dados para o Radar Chart
    const radarData = scores.map((s: any) => ({
        trait: mapTraitToLabel(s.key),
        A: s.score,
        fullMark: 100,
    }));

    const missingTexts = scores.some((s: any) => !s.interpretation && !s.customTexts);

    const handleRepair = async () => {
        if (!confirm('Isso irá regenerar os textos interpretativos padrão do sistema. Deseja continuar?')) return;
        setSeeding(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/admin/seed/interpretative-texts`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Sistema reparado com sucesso! Atualize a página.');
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert('Erro ao reparar sistema. Verifique se você é admin.');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            {/* Header com Gradiente Moderno */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-xl text-white p-8 md:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs font-bold uppercase tracking-wider mb-4">
                            <Sparkles size={14} /> Relatório Oficial
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">Arquétipo TalkingTO</h1>
                        <p className="text-purple-100 text-lg opacity-90">Análise de Perfil Comportamental • {userName}</p>
                    </div>

                    <div className="flex gap-3">
                        {missingTexts && (
                            <button
                                onClick={handleRepair}
                                disabled={seeding}
                                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                <RefreshCw size={18} className={seeding ? "animate-spin" : ""} />
                                {seeding ? 'Reparando...' : 'Reparar Textos'}
                            </button>
                        )}

                        <button
                            onClick={onDownloadPdf}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-purple-900 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <Download size={18} /> Baixar PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Radar Chart */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 lg:col-span-1 flex flex-col items-center justify-center min-h-[400px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Target className="text-purple-500" /> Mapa de Competências
                    </h3>
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="trait" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Perfil"
                                    dataKey="A"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="#8b5cf6"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Coluna Direita: Cards dos Traits (Resumo) */}
                <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 h-fit">
                    {scores.map((trait: any) => (
                        <div key={trait.key} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group h-full">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${getTraitColor(trait.key, 'bg')}`}>
                                        {getTraitIcon(trait.key)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{trait.name}</h4>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getLevelColor(trait.level)}`}>
                                            {getLevelLabel(trait.level)}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-2xl font-black text-slate-900">{trait.score}</span>
                            </div>

                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getTraitColor(trait.key, 'fill')}`}
                                    style={{ width: `${trait.score}%` }}
                                ></div>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed text-justify mt-2">
                                {trait.customTexts?.text_interpretation || trait.interpretation || <span className="text-slate-400 italic">Interpretação não disponível.</span>}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* SEÇÃO DETALHADA: Desdobrando seu Tipo */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mt-8">
                    <span className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                        <BrainCircuit size={18} />
                    </span>
                    Desdobrando seu Tipo
                </h2>

                {scores.map((trait: any) => (
                    <div key={trait.key} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                        <div className="grid md:grid-cols-[200px_1fr] min-h-[200px]">
                            {/* Lado Esquerdo: Score Grande */}
                            <div className={`p-8 flex flex-col justify-center items-center text-center ${getTraitColor(trait.key, 'light-bg')}`}>
                                <h3 className={`text-xl font-bold mb-2 ${getTraitColor(trait.key, 'text')}`}>{trait.name}</h3>
                                <div className="text-5xl font-black text-slate-900 mb-2">{trait.score}</div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-600 shadow-sm`}>
                                    {getLevelLabel(trait.level)}
                                </span>
                            </div>

                            {/* Lado Direito: Texto */}
                            <div className="p-8">
                                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    Interpretação Comportamental
                                </h4>

                                {trait.customTexts ? (
                                    <div className="space-y-6">
                                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-justify">
                                            {trait.customTexts.text_interpretation}
                                        </div>

                                        {/* Detalhes Extras: Ambiente e Riscos (Padrão B2C) */}
                                        {(trait.customTexts.needs || trait.customTexts.risk) && (
                                            <div className="grid md:grid-cols-2 gap-4 pt-4">
                                                {/* Ambiente Ideal */}
                                                {(trait.customTexts.needs || trait.customTexts.environment) && (
                                                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 hover:border-blue-200 transition-colors">
                                                        <h5 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-2">
                                                            <Sparkles size={14} /> Ambiente Ideal
                                                        </h5>
                                                        <p className="text-sm text-slate-700 font-medium leading-relaxed text-justify">
                                                            {trait.customTexts.needs || trait.customTexts.environment}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Pontos de Atenção */}
                                                {(trait.customTexts.risk || trait.customTexts.risks) && (
                                                    <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 hover:border-amber-200 transition-colors">
                                                        <h5 className="text-xs font-bold text-amber-600 uppercase mb-3 flex items-center gap-2">
                                                            <Zap size={14} /> Pontos de Atenção
                                                        </h5>
                                                        <p className="text-sm text-slate-700 font-medium leading-relaxed text-justify">
                                                            {trait.customTexts.risk || trait.customTexts.risks}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : trait.interpretation ? (
                                    <p className="text-slate-600 leading-relaxed text-justify">{trait.interpretation}</p>
                                ) : (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm flex items-center gap-3">
                                        <RefreshCw size={16} />
                                        Texto interpretativo pendente. Clique em "Reparar Textos" no topo da página.
                                    </div>
                                )}

                                {/* Facetas em Grid com Barras de Progresso */}
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Composição do Traço (Facetas)</h5>

                                    {/* CASE 1: REAL FACETS */}
                                    {trait.facets && trait.facets.length > 0 ? (
                                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                                            {(() => {
                                                // Dicionário de Tradução B2B
                                                const translateFacet = (name: string) => {
                                                    const map: Record<string, string> = {
                                                        // Neuroticismo
                                                        'anxiety': 'Ansiedade', 'ansiedade': 'Ansiedade', 'factors_anxiety': 'Ansiedade',
                                                        'angryhostility': 'Hostilidade', 'hostilidade': 'Hostilidade', 'factors_angryhostility': 'Hostilidade',
                                                        'depression': 'Depressão', 'depressao': 'Depressão', 'factors_depression': 'Depressão',
                                                        'selfconsciousness': 'Autoconsciência', 'autoconsciencia': 'Autoconsciência', 'factors_selfconsciousness': 'Autoconsciência',
                                                        'impulsiveness': 'Impulsividade', 'impulsividade': 'Impulsividade', 'factors_impulsiveness': 'Impulsividade',
                                                        'vulnerability': 'Vulnerabilidade', 'factors_vulnerability': 'Vulnerabilidade',

                                                        // Extroversão
                                                        'warmth': 'Acolhimento', 'acolhimento': 'Acolhimento', 'factors_warmth': 'Acolhimento',
                                                        'gregariousness': 'Gregarismo', 'gregarismo': 'Gregarismo', 'factors_gregariousness': 'Gregarismo',
                                                        'assertiveness': 'Assertividade', 'factors_assertiveness': 'Assertividade',
                                                        'activity': 'Nível de Atividade', 'atividade': 'Nível de Atividade', 'factors_activity': 'Nível de Atividade',
                                                        'excitementseeking': 'Busca por Emoção', 'busca de excitacao': 'Busca por Emoção', 'factors_excitementseeking': 'Busca por Emoção',
                                                        'positiveemotions': 'Emoções Positivas', 'emocoes positivas': 'Emoções Positivas', 'factors_positiveemotions': 'Emoções Positivas',

                                                        // Abertura
                                                        'fantasy': 'Fantasia', 'fantasia': 'Fantasia', 'factors_fantasy': 'Fantasia',
                                                        'aesthetics': 'Estética', 'estetica': 'Estética', 'factors_aesthetics': 'Estética',
                                                        'feelings': 'Sentimentos', 'sentimentos': 'Sentimentos', 'factors_feelings': 'Sentimentos',
                                                        'actions': 'Ações', 'acoes': 'Ações', 'factors_actions': 'Ações',
                                                        'ideas': 'Ideias', 'factors_ideas': 'Ideias',
                                                        'values': 'Valores', 'factors_values': 'Valores',

                                                        // Amabilidade
                                                        'trust': 'Confiança', 'confianca': 'Confiança', 'factors_trust': 'Confiança',
                                                        'straightforwardness': 'Franqueza', 'franqueza': 'Franqueza', 'factors_straightforwardness': 'Franqueza',
                                                        'altruism': 'Altruísmo', 'altruismo': 'Altruísmo', 'factors_altruism': 'Altruísmo',
                                                        'compliance': 'Complacência', 'complacencia': 'Complacência', 'factors_compliance': 'Complacência',
                                                        'modesty': 'Modéstia', 'modestia': 'Modéstia', 'factors_modesty': 'Modéstia',
                                                        'tendermindedness': 'Sensibilidade', 'sensibilidade': 'Sensibilidade', 'factors_tendermindedness': 'Sensibilidade',

                                                        // Conscienciosidade
                                                        'competence': 'Competência', 'competencia': 'Competência', 'factors_competence': 'Competência',
                                                        'order': 'Ordem / Organização', 'ordem': 'Ordem / Organização', 'factors_order': 'Ordem / Organização',
                                                        'dutifulness': 'Senso de Dever', 'dever': 'Senso de Dever', 'factors_dutifulness': 'Senso de Dever',
                                                        'achievementstriving': 'Esforço por Realização', 'realizacao': 'Esforço por Realização', 'factors_achievementstriving': 'Esforço por Realização',
                                                        'selfdiscipline': 'Autodisciplina', 'factors_selfdiscipline': 'Autodisciplina',
                                                        'deliberation': 'Deliberação', 'factors_deliberation': 'Deliberação'
                                                    };
                                                    const normalized = name.toLowerCase().replace(/[^a-z_]/g, '');
                                                    return map[normalized] || name;
                                                };

                                                // Deduplicação
                                                const seen = new Set();
                                                const uniqueFacets = trait.facets.filter((f: any) => {
                                                    const fName = f.name || f.facetName;
                                                    const translated = translateFacet(fName);
                                                    if (seen.has(translated)) return false;
                                                    seen.add(translated);
                                                    return true;
                                                });

                                                return uniqueFacets.map((facet: any, idx: number) => {
                                                    const fName = facet.name || facet.facetName;
                                                    const fScore = facet.score || facet.normalizedScore || 0;
                                                    // Cor da barra segue a cor do pai
                                                    const fillColor = getTraitColor(trait.key, 'fill');

                                                    return (
                                                        <div key={idx} className="space-y-1">
                                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                                                                <span>{translateFacet(fName)}</span>
                                                                <span className="text-slate-500">{fScore}%</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-1000 ${fillColor}`}
                                                                    style={{ width: `${fScore}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    ) : (
                                        /* CASE 2: LEGACY FALLBACK (Simulated) */
                                        <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-sm italic">
                                            Detalhamento de facetas indisponível para esta versão do inventário.
                                            {/* Poderíamos simular aqui, mas no B2B é melhor ser honesto ou mostrar nada do que mostrar dado estimado sem aviso claro */}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Helpers (Sem getDefaultFacets) ---

function mapTraitToLabel(key: string) {
    const map: Record<string, string> = {
        'OPENNESS': 'Abertura',
        'CONSCIENTIOUSNESS': 'Conscienciosidade',
        'EXTRAVERSION': 'Extroversão',
        'AGREEABLENESS': 'Amabilidade',
        'NEUROTICISM': 'Estabilidade'
    };
    return map[key] || key;
}

function getLevelLabel(level: string) {
    const map: Record<string, string> = {
        'VERY_HIGH': 'Muito Alto',
        'HIGH': 'Alto',
        'AVERAGE': 'Médio',
        'LOW': 'Baixo',
        'VERY_LOW': 'Muito Baixo'
    };
    return map[level] || level;
}

function getLevelColor(level: string) {
    const map: Record<string, string> = {
        'VERY_HIGH': 'bg-purple-100 text-purple-700',
        'HIGH': 'bg-blue-100 text-blue-700',
        'AVERAGE': 'bg-gray-100 text-gray-700',
        'LOW': 'bg-orange-100 text-orange-700',
        'VERY_LOW': 'bg-red-100 text-red-700'
    };
    return map[level] || 'bg-gray-100 text-gray-700';
}

function getTraitColor(key: string, type: 'bg' | 'text' | 'fill' | 'light-bg') {
    const colors: Record<string, any> = {
        'OPENNESS': { bg: 'bg-yellow-100', text: 'text-yellow-700', fill: 'bg-yellow-500', 'light-bg': 'bg-yellow-50' },
        'CONSCIENTIOUSNESS': { bg: 'bg-blue-100', text: 'text-blue-700', fill: 'bg-blue-500', 'light-bg': 'bg-blue-50' },
        'EXTRAVERSION': { bg: 'bg-orange-100', text: 'text-orange-700', fill: 'bg-orange-500', 'light-bg': 'bg-orange-50' },
        'AGREEABLENESS': { bg: 'bg-green-100', text: 'text-green-700', fill: 'bg-green-500', 'light-bg': 'bg-green-50' },
        'NEUROTICISM': { bg: 'bg-purple-100', text: 'text-purple-700', fill: 'bg-purple-500', 'light-bg': 'bg-purple-50' }
    };
    const def = { bg: 'bg-gray-100', text: 'text-gray-700', fill: 'bg-gray-500', 'light-bg': 'bg-gray-50' };
    return (colors[key] || def)[type];
}

function getTraitIcon(key: string) {
    const icons: Record<string, React.ReactNode> = {
        'OPENNESS': <Sparkles size={20} className="text-yellow-600" />,
        'CONSCIENTIOUSNESS': <ShieldCheck size={20} className="text-blue-600" />,
        'EXTRAVERSION': <Zap size={20} className="text-orange-600" />,
        'AGREEABLENESS': <Users size={20} className="text-green-600" />,
        'NEUROTICISM': <BrainCircuit size={20} className="text-purple-600" />
    };
    return icons[key] || <Target size={20} />;
}

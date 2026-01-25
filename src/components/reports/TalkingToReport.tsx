import React, { useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Target, BrainCircuit, Zap, Users, ShieldCheck, Download, Sparkles, RefreshCw, BarChart3, AlertTriangle, CheckCircle2, Maximize2, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { motion, AnimatePresence } from 'framer-motion';

interface TalkingToReportProps {
    reportData: any;
    userName: string;
    onDownloadPdf?: () => void;
    isAdmin?: boolean;
}

export default function TalkingToReport({ reportData, userName, onDownloadPdf, isAdmin }: TalkingToReportProps) {
    const [seeding, setSeeding] = useState(false);
    const [selectedTrait, setSelectedTrait] = useState<any>(null); // State for Modal

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
        <div className="space-y-10 animate-in fade-in duration-700 font-sans relative">
            {/* --- HEADER PREMIUM --- */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 shadow-2xl text-white p-10 md:p-14">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-[128px] opacity-20 -mr-32 -mt-32 mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[128px] opacity-20 -ml-32 -mb-32 mix-blend-screen"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-widest shadow-inner">
                            <Sparkles size={14} className="text-yellow-400" /> Relatório Oficial Business
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Arquétipo <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">TalkingTO</span></h1>
                            <p className="text-slate-300 text-lg md:text-xl font-medium mt-2 max-w-2xl text-pretty">
                                Análise de Perfil Comportamental Avançada de <strong className="text-white">{userName}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {missingTexts && (
                            <button
                                onClick={handleRepair}
                                disabled={seeding}
                                className="flex items-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-amber-500/20 hover:-translate-y-1"
                            >
                                <RefreshCw size={18} className={seeding ? "animate-spin" : ""} />
                                {seeding ? 'Restaurando...' : 'Reparar Textos'}
                            </button>
                        )}

                        <button
                            onClick={onDownloadPdf}
                            className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                        >
                            <Download size={20} /> Baixar PDF Completo
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAPA E RESUMO (GRID ASSIMÉTRICO) --- */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* RADAR CHART (STICKY LEFT) */}
                <div className="xl:col-span-5 flex flex-col">
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex-1 flex flex-col justify-center min-h-[500px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500"></div>

                        <div className="mb-8 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <Target className="text-purple-600" size={28} /> Mapa de Competências
                            </h3>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Visão 360º</span>
                        </div>

                        <div className="w-full h-[400px] relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                    <PolarAngleAxis
                                        dataKey="trait"
                                        tick={{ fill: '#475569', fontSize: 13, fontWeight: 700 }}
                                    />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Perfil"
                                        dataKey="A"
                                        stroke="#8b5cf6"
                                        strokeWidth={4}
                                        fill="#8b5cf6"
                                        fillOpacity={0.25}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-sm text-slate-500 font-medium">
                            Este gráfico representa a distribuição do seu perfil nas 5 grandes dimensões da personalidade.
                        </div>
                    </div>
                </div>

                {/* RESUMO CARDS (RIGHT) */}
                <div className="xl:col-span-7 grid sm:grid-cols-2 gap-5 h-fit content-start">
                    {scores.map((trait: any) => (
                        <div
                            key={trait.key}
                            onClick={() => setSelectedTrait(trait)}
                            className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:border-purple-200 hover:-translate-y-1 transition-all group flex flex-col justify-between h-full cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-4 right-4 text-slate-300 group-hover:text-purple-400 transition-colors">
                                <Maximize2 size={16} />
                            </div>
                            <div>
                                <div className="flex justify-between items-start mb-4 pr-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl shadow-inner ${getTraitColor(trait.key, 'light-bg')}`}>
                                            {getTraitIcon(trait.key)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{trait.name}</h4>
                                            <span className={`text-[10px] font-black uppercase tracking-widest mt-1 inline-block px-2 py-0.5 rounded-md ${getLevelColor(trait.level)}`}>
                                                {getLevelLabel(trait.level)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-3xl font-black text-slate-900 opacity-20 group-hover:opacity-100 transition-opacity">{trait.score}</span>
                                </div>

                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${getTraitColor(trait.key, 'fill')}`}
                                        style={{ width: `${trait.score}%` }}
                                    ></div>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 font-medium">
                                    {safeRender(trait.customTexts?.text_interpretation) || trait.interpretation || <span className="text-slate-400 italic">Interpretação não disponível.</span>}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- DETALHAMENTO EXPANDIDO (FULL WIDTH CARDS) --- */}
            <div className="space-y-12 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                            <BrainCircuit size={22} />
                        </span>
                        Desdobrando seu Tipo
                    </h2>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>

                {scores.map((trait: any) => (
                    <div key={trait.key} className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 group">
                        <div className="grid lg:grid-cols-[320px_1fr] min-h-[400px]">
                            {/* COLUNA ESQUERDA: VISUAL SCORE */}
                            <div className={`p-10 flex flex-col justify-center items-center text-center relative overflow-hidden ${getTraitColor(trait.key, 'light-bg')}`}>
                                <div className="absolute inset-0 opacity-10 pattern-dots-md"></div> {/* Pattern opcional */}

                                <div className={`w-24 h-24 mb-6 rounded-3xl flex items-center justify-center shadow-xl ${getTraitColor(trait.key, 'bg')} ${getTraitColor(trait.key, 'text-dark')}`}>
                                    {React.cloneElement(getTraitIcon(trait.key) as React.ReactElement, { size: 48 })}
                                </div>

                                <h3 className={`text-2xl font-black mb-2 text-slate-900 leading-tight`}>{trait.name}</h3>

                                <div className="text-8xl font-black text-slate-900 tracking-tighter mb-4 scale-110 group-hover:scale-125 transition-transform duration-500 ease-out">{trait.score}</div>

                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold bg-white/80 backdrop-blur-sm shadow-sm border border-black/5 text-slate-700 uppercase tracking-wider`}>
                                    {getLevelLabel(trait.level)}
                                </span>
                            </div>

                            {/* COLUNA DIREITA: CONTEÚDO RICO */}
                            <div className="p-10 lg:p-14 bg-white flex flex-col justify-center">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <BarChart3 size={16} /> Análise Comportamental Detalhada
                                </h4>

                                {trait.customTexts ? (
                                    <div className="space-y-8">
                                        <div className="prose prose-lg prose-slate max-w-none text-slate-600 font-medium leading-loose text-justify">
                                            {safeRender(trait.customTexts.text_interpretation)}
                                        </div>

                                        {/* Detalhes Extras: Cards Internos */}
                                        {(trait.customTexts.needs || trait.customTexts.risk || trait.customTexts.environment) && (
                                            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                                                {/* Ambiente Ideal */}
                                                {(trait.customTexts.needs || trait.customTexts.environment) && (
                                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-2xl border border-blue-100/50 hover:border-blue-200 transition-colors">
                                                        <h5 className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2 tracking-wide">
                                                            <Sparkles size={14} className="text-blue-500" /> Potencializadores & Ambiente
                                                        </h5>
                                                        <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed text-justify">
                                                            {safeRender(trait.customTexts.needs || trait.customTexts.environment)}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Pontos de Atenção */}
                                                {(trait.customTexts.risk || trait.customTexts.risks) && (
                                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-2xl border border-amber-100/50 hover:border-amber-200 transition-colors">
                                                        <h5 className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-2 tracking-wide">
                                                            <AlertTriangle size={14} className="text-amber-500" /> Pontos de Atenção
                                                        </h5>
                                                        <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed text-justify">
                                                            {safeRender(trait.customTexts.risk || trait.customTexts.risks)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : trait.interpretation ? (
                                    <p className="text-slate-600 leading-relaxed text-justify text-lg">{trait.interpretation}</p>
                                ) : (
                                    <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400">
                                        <RefreshCw size={32} className="mx-auto mb-2 opacity-20" />
                                        Interpretação pendente.
                                    </div>
                                )}

                                {/* Facetas */}
                                <div className="mt-10">
                                    <div className="flex items-center gap-2 mb-6">
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Composição (Facetas)</h5>
                                    </div>

                                    {trait.facets && trait.facets.length > 0 ? (
                                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6">
                                            {(() => {
                                                // (Lógica de Facetas Mantida)
                                                // Minified for brevity in thinking, but full code below
                                                const translateFacet = (name: string) => {
                                                    const map: Record<string, string> = {
                                                        'anxiety': 'Ansiedade', 'ansiedade': 'Ansiedade', 'factors_anxiety': 'Ansiedade',
                                                        'angryhostility': 'Hostilidade', 'hostilidade': 'Hostilidade', 'factors_angryhostility': 'Hostilidade',
                                                        'depression': 'Depressão', 'depressao': 'Depressão', 'factors_depression': 'Depressão',
                                                        'selfconsciousness': 'Autoconsciência', 'autoconsciencia': 'Autoconsciência', 'factors_selfconsciousness': 'Autoconsciência',
                                                        'impulsiveness': 'Impulsividade', 'impulsividade': 'Impulsividade', 'factors_impulsiveness': 'Impulsividade',
                                                        'vulnerability': 'Vulnerabilidade', 'factors_vulnerability': 'Vulnerabilidade',
                                                        'warmth': 'Acolhimento', 'acolhimento': 'Acolhimento', 'factors_warmth': 'Acolhimento',
                                                        'gregariousness': 'Gregarismo', 'gregarismo': 'Gregarismo', 'factors_gregariousness': 'Gregarismo',
                                                        'assertiveness': 'Assertividade', 'factors_assertiveness': 'Assertividade',
                                                        'activity': 'Nível de Atividade', 'atividade': 'Nível de Atividade', 'factors_activity': 'Nível de Atividade',
                                                        'excitementseeking': 'Busca por Emoção', 'busca de excitacao': 'Busca por Emoção', 'factors_excitementseeking': 'Busca por Emoção',
                                                        'positiveemotions': 'Emoções Positivas', 'emocoes positivas': 'Emoções Positivas', 'factors_positiveemotions': 'Emoções Positivas',
                                                        'fantasy': 'Fantasia', 'fantasia': 'Fantasia', 'factors_fantasy': 'Fantasia',
                                                        'aesthetics': 'Estética', 'estetica': 'Estética', 'factors_aesthetics': 'Estética',
                                                        'feelings': 'Sentimentos', 'sentimentos': 'Sentimentos', 'factors_feelings': 'Sentimentos',
                                                        'actions': 'Ações', 'acoes': 'Ações', 'factors_actions': 'Ações',
                                                        'ideas': 'Ideias', 'factors_ideas': 'Ideias',
                                                        'values': 'Valores', 'factors_values': 'Valores',
                                                        'trust': 'Confiança', 'confianca': 'Confiança', 'factors_trust': 'Confiança',
                                                        'straightforwardness': 'Franqueza', 'franqueza': 'Franqueza', 'factors_straightforwardness': 'Franqueza',
                                                        'altruism': 'Altruísmo', 'altruismo': 'Altruísmo', 'factors_altruism': 'Altruísmo',
                                                        'compliance': 'Complacência', 'complacencia': 'Complacência', 'factors_compliance': 'Complacência',
                                                        'modesty': 'Modéstia', 'modestia': 'Modéstia', 'factors_modesty': 'Modéstia',
                                                        'tendermindedness': 'Sensibilidade', 'sensibilidade': 'Sensibilidade', 'factors_tendermindedness': 'Sensibilidade',
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
                                                    const fillColor = getTraitColor(trait.key, 'fill');

                                                    return (
                                                        <div key={idx} className="space-y-1.5">
                                                            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                                                <span>{translateFacet(fName)}</span>
                                                                <span className="text-slate-400 font-mono">{fScore}</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                                        <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs italic font-medium">
                                            Detalhamento de facetas indisponível.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* MODAL POPUP */}
            <AnimatePresence>
                {selectedTrait && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedTrait(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative"
                        >
                            {/* Header */}
                            <div className={`p-8 pb-6 flex items-start justify-between ${getTraitColor(selectedTrait.key, 'light-bg')}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-2xl bg-white shadow-sm ${getTraitColor(selectedTrait.key, 'text')}`}>
                                        {React.cloneElement(getTraitIcon(selectedTrait.key) as React.ReactElement, { size: 32 })}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900">{selectedTrait.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/60 border border-black/5 uppercase tracking-wide`}>
                                            Score: {selectedTrait.score} • {getLevelLabel(selectedTrait.level)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTrait(null)}
                                    className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-slate-500 hover:text-red-500"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content Scrollable */}
                            <div className="p-8 overflow-y-auto">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Interpretação Completa</h4>
                                <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed text-justify">
                                    {safeRender(selectedTrait.customTexts?.text_interpretation) || selectedTrait.interpretation}
                                </div>

                                {(selectedTrait.customTexts?.needs || selectedTrait.customTexts?.environment) && (
                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                        <h5 className="text-sm font-bold text-blue-600 uppercase mb-2 flex items-center gap-2">
                                            <Sparkles size={16} /> Ambiente Ideal
                                        </h5>
                                        <p className="text-slate-600 leading-relaxed">
                                            {safeRender(selectedTrait.customTexts?.needs || selectedTrait.customTexts?.environment)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <button
                                    onClick={() => setSelectedTrait(null)}
                                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                                >
                                    Entendi
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- HELPERS E SAFERENDER ---

function safeRender(content: any) {
    if (content === null || content === undefined) return null;
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
        return content.content || content.primary || JSON.stringify(content);
    }
    return String(content);
}

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
        'VERY_HIGH': 'bg-purple-100 text-purple-700 border-purple-200',
        'HIGH': 'bg-blue-100 text-blue-700 border-blue-200',
        'AVERAGE': 'bg-slate-100 text-slate-700 border-slate-200',
        'LOW': 'bg-amber-100 text-amber-700 border-amber-200',
        'VERY_LOW': 'bg-rose-100 text-rose-700 border-rose-200'
    };
    return map[level] || 'bg-slate-100 text-slate-700';
}

function getTraitColor(key: string, type: 'bg' | 'text' | 'text-dark' | 'fill' | 'light-bg') {
    const colors: Record<string, any> = {
        'OPENNESS': { bg: 'bg-yellow-400', text: 'text-yellow-600', 'text-dark': 'text-yellow-900', fill: 'bg-yellow-500', 'light-bg': 'bg-yellow-50' },
        'CONSCIENTIOUSNESS': { bg: 'bg-blue-400', text: 'text-blue-600', 'text-dark': 'text-blue-900', fill: 'bg-blue-500', 'light-bg': 'bg-blue-50' },
        'EXTRAVERSION': { bg: 'bg-orange-400', text: 'text-orange-600', 'text-dark': 'text-orange-900', fill: 'bg-orange-500', 'light-bg': 'bg-orange-50' },
        'AGREEABLENESS': { bg: 'bg-emerald-400', text: 'text-emerald-600', 'text-dark': 'text-emerald-900', fill: 'bg-emerald-500', 'light-bg': 'bg-emerald-50' },
        'NEUROTICISM': { bg: 'bg-purple-400', text: 'text-purple-600', 'text-dark': 'text-purple-900', fill: 'bg-purple-500', 'light-bg': 'bg-purple-50' }
    };
    const def = { bg: 'bg-slate-200', text: 'text-slate-600', 'text-dark': 'text-slate-800', fill: 'bg-slate-500', 'light-bg': 'bg-slate-50' };
    return (colors[key] || def)[type];
}

function getTraitIcon(key: string) {
    const icons: Record<string, React.ReactNode> = {
        'OPENNESS': <Sparkles />,
        'CONSCIENTIOUSNESS': <ShieldCheck />,
        'EXTRAVERSION': <Zap />,
        'AGREEABLENESS': <Users />,
        'NEUROTICISM': <BrainCircuit />
    };
    return icons[key] || <Target />;
}

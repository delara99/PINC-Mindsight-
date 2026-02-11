import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Target, BrainCircuit, Zap, Users, ShieldCheck, Download, Sparkles, RefreshCw, BarChart3, AlertTriangle, CheckCircle2, Maximize2, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { motion, AnimatePresence } from 'framer-motion';
import TalkingToInteractions from './TalkingToInteractions';

interface TalkingToReportProps {
    reportData: any;
    userName: string;
    onDownloadPdf?: () => void;
    isAdmin?: boolean;
}

export default function TalkingToReport({ reportData, userName, onDownloadPdf, isAdmin }: TalkingToReportProps) {
    const [seeding, setSeeding] = useState(false);
    const [selectedTrait, setSelectedTrait] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Extrair Crossings se existirem (para o Guia de Interação)
    const crossings = reportData.crossings || [];

    // --- DATA NORMALIZATION ADAPTER (B2B vs B2C Support) ---
    let scores: any[] = [];

    if (reportData?.calculatedScores?.scores && Array.isArray(reportData.calculatedScores.scores)) {
        // FORMATO B2B (Array OK) - Normalizar traitKey para key
        scores = reportData.calculatedScores.scores.map((s: any) => ({
            ...s,
            key: s.traitKey || s.key || 'UNKNOWN',
            name: mapTraitToLabel(s.traitKey || s.key || 'UNKNOWN') // Força nome oficial também no formato B2B
        }));
    } else if (reportData?.unifiedScores) {
        // FORMATO B2C Legacy / Misto (Objeto)
        scores = Object.entries(reportData.unifiedScores).map(([rawKey, val]: [string, any]) => {
            // Tenta identificar a chave correta usando TODAS as fontes possíveis (Name, TraitName, Dimension, Key)
            const possibleKeys = [
                val.traitKey,
                val.traitName,
                val.name,
                val.dimension,
                rawKey
            ].filter(Boolean);

            let finalKey = 'UNKNOWN';
            let displayName = val.traitName || val.name || val.dimension || rawKey;

            // Mapa de Normalização Agressivo
            const keyMap: Record<string, string> = {
                // Extroversão
                'energia social': 'EXTRAVERSION', 'extroversao': 'EXTRAVERSION', 'extraversion': 'EXTRAVERSION',
                'social': 'EXTRAVERSION', 'energia': 'EXTRAVERSION',
                // Amabilidade
                'estilo relacional': 'AGREEABLENESS', 'amabilidade': 'AGREEABLENESS', 'agreeableness': 'AGREEABLENESS',
                'agradabilidade': 'AGREEABLENESS', 'relacional': 'AGREEABLENESS', 'colaboracao': 'AGREEABLENESS',
                // Conscienciosidade
                'estilo de trabalho': 'CONSCIENTIOUSNESS', 'conscienciosidade': 'CONSCIENTIOUSNESS', 'conscientiousness': 'CONSCIENTIOUSNESS',
                'estrutura': 'CONSCIENTIOUSNESS', 'trabalho': 'CONSCIENTIOUSNESS', 'organizacao': 'CONSCIENTIOUSNESS',
                // Abertura
                'mentalidade': 'OPENNESS', 'abertura': 'OPENNESS', 'openness': 'OPENNESS',
                'abertura a experiencia': 'OPENNESS', 'inovacao': 'OPENNESS', 'criatividade': 'OPENNESS',
                // Estabilidade
                'resiliencia': 'NEUROTICISM', 'estabilidade': 'NEUROTICISM', 'neuroticism': 'NEUROTICISM',
                'estabilidade emocional': 'NEUROTICISM', 'emocional': 'NEUROTICISM', 'equilibrio': 'NEUROTICISM'
            };

            for (const k of possibleKeys) {
                // Remove parenteses e caracteres extras para limpar a string (ex: "Mentalidade (Abertura)" -> "mentalidade")
                const normalized = String(k).toLowerCase().trim().split(' (')[0].replace(/[^a-z\s]/g, '');

                // Tentativa 1: Match Exato
                if (keyMap[normalized]) {
                    finalKey = keyMap[normalized];
                    break;
                }

                // Tentativa 2: Match Parcial dentro do loop
                const parts = normalized.split(' ');
                for (const p of parts) {
                    if (keyMap[p]) {
                        finalKey = keyMap[p];
                        break;
                    }
                }
                if (finalKey !== 'UNKNOWN') break;
            }

            // Fallback de Emergência
            if (finalKey === 'UNKNOWN') {
                console.warn('Trait Identification Failed:', { rawKey, val });
                // Mantém o nome original se não conseguir identificar, sem poluir a UI
            }

            return {
                key: finalKey,
                name: mapTraitToLabel(finalKey), // Força o nome oficial PINC (ex: ESTRUTURA ao invés de Conscienciosidade)
                score: val.normalizedScore || val.score || 0,
                level: val.level,
                interpretation: val.interpretation,
                customTexts: val.customTexts || {
                    text_interpretation: val.text_interpretation,
                    environment: val.needs?.environment,
                    risk: val.needs?.risk,
                    needs: val.needs?.primary
                },
                facets: val.facets
            };
        });
    }

    // ADAPT TO PINC MODEL (Filter Facets, Invert Scores)
    scores = scores.map(s => adaptTraitToPINC(s)).filter(Boolean);

    // Ordenar scores para consistência visual (O-C-E-A-N)
    const orderMap: Record<string, number> = { 'OPENNESS': 1, 'CONSCIENTIOUSNESS': 2, 'EXTRAVERSION': 3, 'AGREEABLENESS': 4, 'NEUROTICISM': 5 };
    scores.sort((a, b) => (orderMap[a.key] || 99) - (orderMap[b.key] || 99));

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
                            <Sparkles size={14} className="text-yellow-400" /> Relatório Oficial
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
                        {onDownloadPdf && (
                            <button
                                onClick={onDownloadPdf}
                                className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
                            >
                                <Download size={20} /> Baixar PDF Completo
                            </button>
                        )}
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
                            {radarData.length > 0 ? (
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
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 italic">
                                    Gráfico indisponível
                                </div>
                            )}
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
                                        <div className={`p-3 rounded-2xl shadow-inner ${getTraitColor(trait.key, 'light-bg')} ${getTraitColor(trait.key, 'text')}`}>
                                            {React.cloneElement(getTraitIcon(trait.key) as React.ReactElement, { size: 24, strokeWidth: 2.5 })}
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

            {/* --- GUIA DE INTERAÇÃO (CROSSINGS - NOVO) --- */}
            {crossings.length > 0 && (
                <TalkingToInteractions crossings={crossings} />
            )}

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
                                <div className="absolute inset-0 opacity-10 pattern-dots-md"></div>

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

                                        {(trait.customTexts.needs || trait.customTexts.risk || trait.customTexts.environment) && (
                                            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
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
                                                const seen = new Set();
                                                const uniqueFacets = trait.facets.filter((f: any) => {
                                                    const fName = f.name || f.facetName;
                                                    // Usa Helper Global
                                                    const translated = translateFacetGlobal(fName);

                                                    // Se retornou null (bloqueado/repetido) ou já existe -> Pular
                                                    if (!translated || seen.has(translated)) return false;

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
                                                                <span>{translateFacetGlobal(fName)}</span> {/* Chamada Segura */}
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

            {/* MODAL POPUP (PORTAL TO BODY) */}
            {mounted && createPortal(
                <AnimatePresence>
                    {selectedTrait && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedTrait(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white w-full max-w-3xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative my-8"
                            >
                                {/* Header Popup */}
                                <div className={`p-8 pb-6 flex items-start justify-between ${getTraitColor(selectedTrait.key, 'light-bg')} border-b border-black/5`}>
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-2xl bg-white/80 backdrop-blur shadow-sm ${getTraitColor(selectedTrait.key, 'text')}`}>
                                            {React.cloneElement(getTraitIcon(selectedTrait.key) as React.ReactElement, { size: 36 })}
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{selectedTrait.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/60 border border-black/5 uppercase tracking-wide text-slate-700`}>
                                                    Score: {selectedTrait.score}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getLevelColor(selectedTrait.level)} uppercase tracking-wide`}>
                                                    {getLevelLabel(selectedTrait.level)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTrait(null)}
                                        className="p-3 bg-white/50 hover:bg-white rounded-full transition-all text-slate-500 hover:text-red-500 hover:shadow-md"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Content Scrollable */}
                                <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">
                                        Análise Detalhada
                                    </h4>

                                    <div className="text-slate-600 text-lg leading-relaxed text-justify whitespace-pre-line font-medium mb-8">
                                        {safeRender(selectedTrait.customTexts?.text_interpretation) || selectedTrait.interpretation}
                                    </div>

                                    {(selectedTrait.customTexts?.needs || selectedTrait.customTexts?.environment) && (
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                            <h5 className="text-sm font-bold text-blue-600 uppercase mb-3 flex items-center gap-2">
                                                <Sparkles size={16} /> Potencializadores de Ambiente
                                            </h5>
                                            <p className="text-slate-700 leading-relaxed text-base">
                                                {safeRender(selectedTrait.customTexts?.needs || selectedTrait.customTexts?.environment)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 z-10">
                                    <button
                                        onClick={() => setSelectedTrait(null)}
                                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        Fechar Análise
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
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
        'OPENNESS': 'ABERTURA',
        'CONSCIENTIOUSNESS': 'ESTRUTURA',
        'EXTRAVERSION': 'EXTROVERSÃO',
        'AGREEABLENESS': 'AMABILIDADE',
        'NEUROTICISM': 'ESTABILIDADE EMOCIONAL'
    };
    return map[key] || key.toUpperCase();
}

function getLevelLabel(level: string) {
    const map: Record<string, string> = {
        'VERY_HIGH': 'MUITO ALTO',
        'HIGH': 'ALTO',
        'AVERAGE': 'MÉDIO',
        'LOW': 'BAIXO',
        'VERY_LOW': 'MUITO BAIXO'
    };
    // Tenta uppercase por segurança
    const upper = String(level).toUpperCase();
    return map[upper] || upper;
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

// --- PINC ADAPTER LOGIC (SHARED) ---
const PINC_ADAPTER: any = {
    'EXTRAVERSION': {
        label: 'INTROVERSÃO-EXTROVERSÃO',
        facets: [
            { key: 'ouvinte-falante', sources: ['FRIENDLINESS', 'CORDIALIDADE', 'WARMTH', 'ACOLHIMENTO', 'COMUNICAÇÃO', 'COMUNICACAO'], invert: false },
            { key: 'seletivo-interativo', sources: ['GREGARIOUSNESS', 'GREGARIEDADE', 'SOCIAL', 'INTERAÇÃO', 'INTERACAO'], invert: false },
            { key: 'contido-afirmativo', sources: ['ASSERTIVENESS', 'ASSERTIVIDADE', 'AUTORIDADE'], invert: false },
            { key: 'reflexivo-ativo', sources: ['ACTIVITY', 'ATIVIDADE', 'ORIENTAÇÃO', 'ORIENTACAO'], invert: false }
        ]
    },
    'AGREEABLENESS': {
        label: 'LÓGICO-SENTIMENTAL',
        facets: [
            { key: 'crítico-tolerante', sources: ['MORALITY', 'FRANQUEZA', 'STRAIGHTFORWARDNESS', 'LOGICA', 'LÓGICA', 'CRITICO', 'CRÍTICO', 'TOLERÂNCIA', 'TOLERANCIA'], invert: false },
            { key: 'independente-conectado', sources: ['ALTRUISM', 'ALTRUÍSMO', 'ALTRUISMO', 'INDEPENDÊNCIA', 'INDEPENDENCIA', 'CONEXÃO', 'CONEXAO'], invert: false },
            { key: 'competitivo-colaborativo', sources: ['COOPERATION', 'COOPERAÇÃO', 'COOPERACAO', 'COMPLACÊNCIA', 'COMPLIANCE', 'COMPETITIVIDADE', 'COLABORAÇÃO', 'COLABORACAO'], invert: false }
        ]
    },
    'CONSCIENTIOUSNESS': {
        label: 'ADAPTÁVEL-ESTRUTURADO',
        facets: [
            { key: 'aventureiro-planejado', sources: ['CAUTIOUSNESS', 'PONDERAÇÃO', 'PONDERACAO', 'DELIBERATION', 'PLANEJAMENTO'], invert: false },
            { key: 'espontâneo-disciplinado', sources: ['SELF-DISCIPLINE', 'AUTODISCIPLINA', 'DISCIPLINA'], invert: false },
            { key: 'flexível-persistente', sources: ['ACHIEVEMENT', 'REALIZAÇÕES', 'PERSISTENCE', 'PERSISTÊNCIA', 'PERSISTENCIA'], invert: false }
        ]
    },
    'NEUROTICISM': {
        label: 'EMOÇÃO-RAZÃO',
        // No invertDimension: Facets (Confidence, Control) are already Stability markers. Average IS Stability.
        facets: [
            { key: 'inquieto-despreocupado', sources: ['ANXIETY', 'ANSIEDADE', 'CONFIANÇA', 'CONFIANCA'], invert: true },
            { key: 'inseguro-autoconfiante', sources: ['DEPRESSION', 'DEPRESSÃO', 'AUTOCONFIANÇA', 'AUTOCONFIANCA'], invert: true },
            { key: 'irritável-tranquilo', sources: ['ANGER', 'HOSTILITY', 'HOSTILIDADE', 'RAIVA', 'TEMPERAMENTO'], invert: true },
            { key: 'reativo-controlado', sources: ['IMPULSIVENESS', 'IMPULSIVIDADE', 'IMODERAÇÃO', 'CONTROLE'], invert: true }
        ]
    },
    'OPENNESS': {
        label: 'CONCRETO-ABSTRATO',
        facets: [
            { key: 'realista-imaginativo', sources: ['IMAGINATION', 'FANTASIA', 'IMAGINAÇÃO', 'IMAGINACAO'], invert: false },
            { key: 'prático-conceitual', sources: ['INTELLECT', 'IDEIAS', 'INTELECTUALIDADE'], invert: false },
            { key: 'conservador-aberto', sources: ['LIBERALISM', 'VALORES', 'ABERTURA', 'ABERTURA AO NOVO'], invert: false }
        ]
    }
};

const adaptTraitToPINC = (trait: any) => {
    const rawKey = (trait.key || trait.traitKey || trait.name || '').toUpperCase();

    // Find adapter config (handle aliases)
    let config = PINC_ADAPTER[rawKey];
    if (!config && rawKey.includes('ESTABILIDADE')) config = PINC_ADAPTER['NEUROTICISM'];
    if (!config && (rawKey.includes('CONSCIENTIOUSNESS') || rawKey.includes('CONSCIENCIOSIDADE') || rawKey.includes('ESTRUTURA'))) config = PINC_ADAPTER['CONSCIENTIOUSNESS'];

    if (!config) return null; // Not a main PINC dimension

    // Filter and Map Facets
    const adaptedFacets: any[] = [];
    let sumScores = 0;

    config.facets.forEach((rule: any) => {
        // Find raw facet
        const rawFacet = trait.facets?.find((f: any) => {
            const fName = (f.name || f.facetName || '').toUpperCase();
            return rule.sources.some((src: string) => fName.includes(src));
        });

        // Default to 50 if missing
        let score = rawFacet ? (typeof rawFacet.score === 'number' ? rawFacet.score : rawFacet.normalizedScore || 50) : 50;

        // Apply Inversion
        if (rule.invert) score = 100 - score;

        sumScores += score;
        adaptedFacets.push({
            facetName: rule.key, // Use facetName property for compatibility with TalkingToReport rendering which looks for f.name or f.facetName
            name: rule.key,      // Also name for safety
            normalizedScore: score,
            score: score
        });
    });

    // Recalculate Dimension Score (Average of PINC Facets)
    let finalScore = adaptedFacets.length > 0 ? sumScores / adaptedFacets.length : (trait.score || 50);

    // Apply Dimension Inversion (Neuroticism -> Stability)
    if (config.invertDimension) {
        finalScore = 100 - finalScore;
    }

    // Recalculate Level
    let level = 'MÉDIO';
    if (finalScore >= 65) level = 'ALTO';
    else if (finalScore <= 35) level = 'BAIXO';

    return {
        ...trait,
        key: rawKey, // Maintain original Key for Icon/Color mapping (e.g. NEUROTICISM)
        name: config.label,
        score: Math.round(finalScore),
        facets: adaptedFacets,
        level: level
    };
};

// Helper Global de Tradução de Facetas
function translateFacetGlobal(name: string): string | null {
    if (!name) return null;
    const normalized = name.toLowerCase().replace(/[^a-z_]/g, '');

    // 1. Filtro de Bloqueio (Remove Traços Principais se aparecerem como facetas)
    const blocked = [
        'extraversion', 'extroversao', 'neuroticism', 'neuroticismo', 'estabilidade', 'estabilidadeemocional',
        'openness', 'abertura', 'agreeableness', 'amabilidade', 'conscientiousness', 'conscienciosidade'
    ];
    // Verifica se a string normalizada contém o nome do traço (ex: "extraversion_score" -> bloqueia)
    if (blocked.some(b => normalized.includes(b)) && !normalized.includes('factors')) {
        // Exceção: se tiver "factors", as vezes é prefixo válido? 
        // No print do user apareceu "EXTRAVERSION" puro. Então contains é perigoso se for "extraversion_gregariousness".
        // Vamos bloquear apenas match exato ou muito próximo.
        if (blocked.includes(normalized)) return null;
    }
    // Simplificação: Bloqueia match exato com lista de bloqueio
    if (blocked.includes(normalized)) return null;

    // 2. Dicionário de Tradução (UPPERCASE)
    const map: Record<string, string> = {
        // PINC MODEL (Novos Subtraços)
        'communication': 'COMUNICAÇÃO (Ouvinte - Falante)',
        'social_interaction': 'INTERAÇÃO SOCIAL (Seletivo - Interativo)',
        'authority': 'AUTORIDADE (Contido - Afirmativo)',
        'action_orientation': 'ORIENTAÇÃO P/ AÇÃO (Reflexivo - Ativo)',

        'logic': 'LÓGICA (Crítico - Tolerante)',
        'independence': 'INDEPENDÊNCIA (Independente - Conectado)',
        'competitiveness': 'COMPETITIVIDADE (Competitivo - Colaborativo)',

        'planning': 'PLANEJAMENTO (Aventureiro - Planejado)',
        'discipline': 'DISCIPLINA (Espontâneo - Disciplinado)',
        'persistence': 'PERSISTÊNCIA (Flexível - Persistente)',

        'imagination': 'IMAGINAÇÃO (Realista - Imaginativo)',
        'intellect': 'INTELECTUALIDADE (Prático - Conceitual)',
        'openness_to_new': 'ABERTURA AO NOVO (Conservador - Aberto)',

        'confidence': 'CONFIANÇA (Inquieto - Despreocupado)',
        'self_confidence': 'AUTOCONFIANÇA (Inseguro - Autoconfiante)',
        'temperament': 'TEMPERAMENTO (Irritável - Tranquilo)',
        'control': 'CONTROLE (Reativo - Controlado)',

        // IPIP-NEO Legacy (Mantido para compatibilidade, mas abaixo dos novos)
        'anxiety': 'ANSIEDADE', 'ansiedade': 'ANSIEDADE', 'factors_anxiety': 'ANSIEDADE',
        'angryhostility': 'HOSTILIDADE', 'hostilidade': 'HOSTILIDADE', 'factors_angryhostility': 'HOSTILIDADE',
        'depression': 'DEPRESSÃO', 'depressao': 'DEPRESSÃO', 'factors_depression': 'DEPRESSÃO',
        'selfconsciousness': 'AUTOCONSCIÊNCIA', 'autoconsciencia': 'AUTOCONSCIÊNCIA', 'factors_selfconsciousness': 'AUTOCONSCIÊNCIA',
        'impulsiveness': 'IMPULSIVIDADE', 'impulsividade': 'IMPULSIVIDADE', 'factors_impulsiveness': 'IMPULSIVIDADE',
        'vulnerability': 'VULNERABILIDADE', 'factors_vulnerability': 'VULNERABILIDADE',

        'warmth': 'ACOLHIMENTO', 'acolhimento': 'ACOLHIMENTO', 'factors_warmth': 'ACOLHIMENTO',
        'gregariousness': 'GREGARISMO', 'gregarismo': 'GREGARISMO', 'factors_gregariousness': 'GREGARISMO',
        'assertiveness': 'ASSERTIVIDADE', 'factors_assertiveness': 'ASSERTIVIDADE',
        'activity': 'NÍVEL DE ATIVIDADE', 'atividade': 'NÍVEL DE ATIVIDADE', 'factors_activity': 'NÍVEL DE ATIVIDADE',
        'excitementseeking': 'BUSCA POR EMOÇÃO', 'busca de excitacao': 'BUSCA POR EMOÇÃO', 'factors_excitementseeking': 'BUSCA POR EMOÇÃO',
        'positiveemotions': 'EMOÇÕES POSITIVAS', 'emocoes positivas': 'EMOÇÕES POSITIVAS', 'factors_positiveemotions': 'EMOÇÕES POSITIVAS',

        'fantasy': 'FANTASIA', 'fantasia': 'FANTASIA', 'factors_fantasy': 'FANTASIA',
        'aesthetics': 'ESTÉTICA', 'estetica': 'ESTÉTICA', 'factors_aesthetics': 'ESTÉTICA',
        'feelings': 'SENTIMENTOS', 'sentimentos': 'SENTIMENTOS', 'factors_feelings': 'SENTIMENTOS',
        'actions': 'AÇÕES', 'acoes': 'AÇÕES', 'factors_actions': 'AÇÕES',
        'ideas': 'IDEIAS', 'factors_ideas': 'IDEIAS',
        'values': 'VALORES', 'factors_values': 'VALORES',

        'trust': 'CONFIANÇA (IPIP)', 'confianca': 'CONFIANÇA (IPIP)', 'factors_trust': 'CONFIANÇA (IPIP)',
        'straightforwardness': 'FRANQUEZA', 'franqueza': 'FRANQUEZA', 'factors_straightforwardness': 'FRANQUEZA',
        'altruism': 'ALTRUÍSMO', 'altruismo': 'ALTRUÍSMO', 'factors_altruism': 'ALTRUÍSMO',
        'compliance': 'COMPLACÊNCIA', 'complacencia': 'COMPLACÊNCIA', 'factors_compliance': 'COMPLACÊNCIA',
        'modesty': 'MODÉSTIA', 'modestia': 'MODÉSTIA', 'factors_modesty': 'MODÉSTIA',
        'tendermindedness': 'SENSIBILIDADE', 'sensibilidade': 'SENSIBILIDADE', 'factors_tendermindedness': 'SENSIBILIDADE',

        'competence': 'COMPETÊNCIA', 'competencia': 'COMPETÊNCIA', 'factors_competence': 'COMPETÊNCIA',
        'order': 'ORDEM / ORGANIZAÇÃO', 'ordem': 'ORDEM / ORGANIZAÇÃO', 'factors_order': 'ORDEM / ORGANIZAÇÃO',
        'dutifulness': 'SENSO DE DEVER', 'dever': 'SENSO DE DEVER', 'factors_dutifulness': 'SENSO DE DEVER',
        'achievementstriving': 'ESFORÇO POR REALIZAÇÃO', 'realizacao': 'ESFORÇO POR REALIZAÇÃO', 'factors_achievementstriving': 'ESFORÇO POR REALIZAÇÃO',
        'selfdiscipline': 'AUTODISCIPLINA', 'factors_selfdiscipline': 'AUTODISCIPLINA',
        'deliberation': 'DELIBERAÇÃO', 'factors_deliberation': 'DELIBERAÇÃO'
    };

    return map[normalized] || name.toUpperCase();
}

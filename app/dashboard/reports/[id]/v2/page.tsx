'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, User as UserIcon, Calendar, CheckCircle, Download, Sparkles, Activity, Brain, Heart, Zap, Globe, Share2, Layers } from 'lucide-react';
import { useAuthStore } from '../../../../../src/store/auth-store';
import { BigFiveChart } from '../../../../../src/components/dashboard/big-five-chart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_URL } from '../../../../../src/config/api';
import { motion } from 'framer-motion';

// --- MODERN UI COMPONENTS ---

const ModernTraitCard = ({ traitName, overallScore, interpretation, facets, customTexts, colorTheme = 'violet' }: any) => {
    const isHigh = overallScore >= 66;
    const isLow = overallScore <= 33;

    // Status Badge Color
    const getStatusColor = () => {
        if (overallScore >= 66) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (overallScore <= 33) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    // Progress Bar Gradient
    const getProgressGradient = () => {
        if (overallScore >= 66) return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
        if (overallScore <= 33) return 'bg-gradient-to-r from-amber-400 to-amber-600';
        return 'bg-gradient-to-r from-blue-400 to-blue-600';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
        >
            <div className="p-6 border-b border-slate-50">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{traitName}</h3>
                        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor()}`}>
                            {interpretation}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">{overallScore.toFixed(0)}</span>
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Score</span>
                    </div>
                </div>

                {/* Main Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${getProgressGradient()}`}
                    />
                </div>

                {/* Summary Text (Rich) */}
                {customTexts?.summary && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100/50">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                            <Sparkles size={14} />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Insight</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {customTexts.summary.replace(/<[^>]*>/g, '').slice(0, 180)}...
                        </p>
                    </div>
                )}
            </div>

            {/* Facets Grid */}
            <div className="px-6 py-4 bg-slate-50/50">
                <div className="grid grid-cols-1 gap-3">
                    {facets.map((facet: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between group">
                            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors w-1/3 truncate" title={facet.facet}>
                                {facet.facet}
                            </span>
                            <div className="flex-1 mx-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${facet.normalizedScore}%` }}
                                    transition={{ duration: 0.8, delay: 0.1 * idx }}
                                    className={`h-full rounded-full opacity-60 group-hover:opacity-100 transition-opacity ${facet.normalizedScore > 50 ? 'bg-slate-800' : 'bg-slate-400'
                                        }`}
                                />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400 w-8 text-right">{facet.normalizedScore.toFixed(0)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// --- PAGE COMPONENT ---

export default function AssessmentDetailsPageV2() {
    const params = useParams();
    const { token } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [feedback, setFeedback] = useState('');
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    // --- TRANSLATION HELPER (Shared) ---
    const TERMS_MAP: Record<string, string> = {
        'OPENNESS': 'ABERTURA À EXPERIÊNCIA',
        'CONSCIENTIOUSNESS': 'CONSCIENCIOSIDADE',
        'EXTRAVERSION': 'EXTROVERSÃO',
        'AGREEABLENESS': 'AMABILIDADE',
        'NEUROTICISM': 'ESTABILIDADE EMOCIONAL',
        'NEUROTICISMO': 'ESTABILIDADE EMOCIONAL', // Legacy
        'ESTABILIDADE': 'ESTABILIDADE EMOCIONAL',
        // Facetas
        'ANXIETY': 'ANSIEDADE', 'ANGER': 'HOSTILIDADE', 'HOSTILITY': 'HOSTILIDADE', 'DEPRESSION': 'DEPRESSÃO',
        'SELF-CONSCIOUSNESS': 'EMBARAÇO', 'IMPULSIVENESS': 'IMPULSIVIDADE', 'VULNERABILITY': 'VULNERABILIDADE',
        'FRIENDLINESS': 'CORDIALIDADE', 'GREGARIOUSNESS': 'GREGARIEDADE', 'ASSERTIVENESS': 'ASSERTIVIDADE',
        'ACTIVITY LEVEL': 'ATIVIDADE', 'EXCITEMENT-SEEKING': 'BUSCA DE SENSAÇÕES', 'CHEERFULNESS': 'EMOÇÕES POSITIVAS',
        'TRUST': 'CONFIANÇA', 'MORALITY': 'FRANQUEZA', 'ALTRUISM': 'ALTRUÍSMO', 'COOPERATION': 'COMPLACÊNCIA',
        'MODESTY': 'MODÉSTIA', 'SYMPATHY': 'SENSIBILIDADE', 'SELF-EFFICACY': 'COMPETÊNCIA', 'ORDERLINESS': 'ORDEM',
        'DUTIFULNESS': 'SENSO DE DEVER', 'ACHIEVEMENT-STRIVING': 'ESFORÇO POR REALIZAÇÕES', 'SELF-DISCIPLINE': 'AUTODISCIPLINA',
        'CAUTIOUSNESS': 'PONDERAÇÃO', 'IMAGINATION': 'FANTASIA', 'ARTISTIC INTERESTS': 'ESTÉTICA', 'EMOTIONALITY': 'SENTIMENTOS',
        'ADVENTUROUSNESS': 'AÇÕES', 'INTELLECT': 'IDEIAS', 'LIBERALISM': 'VALORES'
    };

    const translateAndFormat = (text: string) => {
        if (!text) return '';
        const upper = text.toUpperCase();
        if (TERMS_MAP[upper]) return TERMS_MAP[upper];
        return upper;
    };

    // --- QUERY ---
    const { data: assignment, isLoading, error } = useQuery({
        queryKey: ['assignment-details', params.id],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/assessments/assignments/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar');
            return res.json();
        },
        enabled: !!token
    });

    const submitFeedbackMutation = useMutation({
        mutationFn: async (feedbackData: { feedback: string }) => {
            const res = await fetch(`${API_URL}/api/v1/assessments/assignments/${params.id}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(feedbackData)
            });
            if (!res.ok) throw new Error('Erro ao salvar feedback');
            return res.json();
        },
        onSuccess: () => {
            alert('Feedback salvo!');
            queryClient.invalidateQueries({ queryKey: ['assignment-details', params.id] });
        }
    });

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">Erro: {error.message}</div>;

    const { user, assessment, responses } = assignment;

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans text-slate-900">
            {/* V2 BADGE */}
            <div className="fixed top-4 right-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold z-50 shadow-xl border border-white/20">
                BETA V2.0 (DRAFT)
            </div>

            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header Section - Glassmorphism */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
                    <div>
                        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-semibold text-sm">Voltar</span>
                        </button>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                Relatório de <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                                    {user.name || 'Candidato'}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4 mt-4 text-slate-500 font-medium">
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                                    <UserIcon size={16} />
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                                    <Calendar size={16} />
                                    <span>{new Date(assignment.completedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            className="bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-xl font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 hover:shadow-md"
                        >
                            <Share2 size={18} />
                            Compartilhar
                        </button>
                        <button
                            onClick={() => window.print()} // Quick print for beta
                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 hover:translate-y-[-2px]"
                        >
                            <Download size={18} />
                            Baixar PDF
                        </button>
                    </div>
                </header>

                <div ref={reportRef} className="space-y-12">

                    {/* Hero Grid: Radar + Key Insights */}
                    <section className="grid md:grid-cols-12 gap-8">
                        {/* Radar Chart Card */}
                        <div className="md:col-span-12 xl:col-span-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 ring-1 ring-slate-400/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Activity className="text-violet-500" />
                                    Mapa de Personalidade
                                </h2>
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Big Five v2</span>
                            </div>

                            {/* Chart Container - Centered */}
                            <div className="flex items-center justify-center p-4">
                                {(() => {
                                    // Reusing Chart Logic from main page
                                    const calcScores = assignment.calculatedScores?.scores;
                                    if (calcScores) {
                                        const scoresList = Array.isArray(calcScores) ? calcScores : Object.values(calcScores);
                                        const chartData: any = {};
                                        scoresList.forEach((t: any) => {
                                            const kn = t.traitKey || t.traitName || t.name;
                                            const tn = translateAndFormat(kn);
                                            if (!tn) return;
                                            if (t.facets) {
                                                t.facets.forEach((f: any) => {
                                                    let v = typeof f.score === 'number' ? f.score : 0;
                                                    if (v > 5) v = v / 20;
                                                    const fn = translateAndFormat(f.name || f.facetName);
                                                    chartData[`${tn}::${fn}`] = v;
                                                });
                                            }
                                        });
                                        return Object.keys(chartData).length > 0 ? <BigFiveChart scores={chartData} /> : null;
                                    }
                                    return <div className="text-slate-400">Dados do gráfico indisponíveis</div>;
                                })()}
                            </div>
                        </div>
                    </section>

                    {/* Detailed Cards - Masonry/Grid */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-3 mb-8">
                            <Layers className="text-indigo-500" />
                            Detalhamento dos Traços
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(() => {
                                const calcScores = assignment.calculatedScores?.scores;
                                if (calcScores) {
                                    const scoresList = Array.isArray(calcScores) ? calcScores : Object.values(calcScores);
                                    return scoresList.map((trait: any, idx: number) => (
                                        <ModernTraitCard
                                            key={idx}
                                            traitName={translateAndFormat(trait.traitKey || trait.name)}
                                            overallScore={Math.min(100, trait.score)}
                                            interpretation={((({
                                                'HIGH': 'ALTO', 'AVERAGE': 'MÉDIO', 'LOW': 'BAIXO',
                                                'VERY_HIGH': 'MUITO ALTO', 'VERY_LOW': 'MUITO BAIXO'
                                            })[trait.level as string] || trait.level || ''))}
                                            facets={trait.facets?.map((f: any) => ({
                                                facet: translateAndFormat(f.name || f.facetName),
                                                normalizedScore: Math.min(100, Math.max(0, typeof f.score === 'number' ? f.score : 0))
                                            })) || []}
                                            customTexts={{
                                                summary: trait.customTexts?.text_interpretation || trait.customTexts?.summary || trait.interpretation
                                            }}
                                        />
                                    ));
                                }
                                return null;
                            })()}
                        </div>
                    </section>

                    {/* Feedback Section */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold mb-4">Anotações do Candidato</h3>
                        <textarea
                            className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 transition-all font-medium"
                            placeholder="Dúvidas ou comentários..."
                            defaultValue={assignment.feedback || ''}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => submitFeedbackMutation.mutate({ feedback: feedback || assignment.feedback })}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                            >
                                Salvar Anotações
                            </button>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

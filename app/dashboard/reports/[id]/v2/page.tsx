'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, User as UserIcon, Calendar, CheckCircle, Download, Sparkles, Activity, Brain, Heart, Zap, Globe, Share2, Layers, MessageSquare, Send, Clock, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../../../../src/store/auth-store';
import { BigFiveChart } from '../../../../../src/components/dashboard/big-five-chart';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_URL } from '../../../../../src/config/api';
import { motion } from 'framer-motion';

// --- HELPERS ---

const getStatusParams = (score: number) => {
    // Pedido V2: Baixo (<36) Vermelho, Médio (36-65) Laranja, Alto (>65) Verde.
    if (score <= 35) return {
        base: 'red',
        gradient: 'bg-gradient-to-r from-red-400 to-red-600',
        text: 'text-red-700',
        bg: 'bg-red-50',
        border: 'border-red-200',
        marker: 'bg-red-500'
    };
    if (score <= 65) return {
        base: 'orange',
        gradient: 'bg-gradient-to-r from-orange-400 to-orange-600',
        text: 'text-orange-700',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        marker: 'bg-orange-500'
    };
    return {
        base: 'emerald',
        gradient: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
        text: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        marker: 'bg-emerald-500'
    };
};

const parseChatHistory = (fullText: string) => {
    if (!fullText) return [];
    const regex = /\[(.*?)\s-\s(.*?)\]:\n([\s\S]*?)(?=(\[.*?\s-\s.*?\]:|$))/g;
    const history = [];
    let match;
    while ((match = regex.exec(fullText)) !== null) {
        history.push({
            author: match[1],
            timestamp: match[2],
            message: match[3].trim()
        });
    }
    if (history.length === 0 && fullText.trim()) {
        return [{ author: 'Anotações Anteriores', timestamp: '-', message: fullText }];
    }
    return history;
};

// --- MODERN UI COMPONENTS ---

const ModernTraitCard = ({ traitName, overallScore, interpretation, facets, customTexts }: any) => {
    const status = getStatusParams(overallScore);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col h-full"
        >
            <div className={`p-6 border-b border-slate-50 ${status.bg} bg-opacity-30`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{traitName}</h3>
                        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.bg} ${status.text} ${status.border} bg-opacity-100`}>
                            {interpretation}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-3xl font-black tracking-tighter ${status.text}`}>{overallScore.toFixed(0)}</span>
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Score</span>
                    </div>
                </div>

                {/* Main Progress Bar */}
                <div className="h-2.5 w-full bg-white rounded-full overflow-hidden mb-6 shadow-sm ring-1 ring-slate-100">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${overallScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${status.gradient}`}
                    />
                </div>

                {/* Summary Text (Rich) */}
                {customTexts?.summary && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-2 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-indigo-500">
                            <Sparkles size={14} fill="currentColor" className="opacity-20" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Insight</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {customTexts.summary.replace(/<[^>]*>/g, '').slice(0, 180)}...
                        </p>
                    </div>
                )}
            </div>

            {/* Facets Grid */}
            <div className="px-6 py-4 bg-white flex-1">
                <div className="grid grid-cols-1 gap-4">
                    {facets.map((facet: any, idx: number) => {
                        const fStatus = getStatusParams(facet.normalizedScore);
                        return (
                            <div key={idx} className="flex items-center justify-between group">
                                <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors w-1/3 truncate" title={facet.facet}>
                                    {facet.facet}
                                </span>
                                <div className="flex-1 mx-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${facet.normalizedScore}%` }}
                                        transition={{ duration: 0.8, delay: 0.1 * idx }}
                                        className={`h-full rounded-full opacity-80 group-hover:opacity-100 transition-opacity ${fStatus.marker}`}
                                    />
                                </div>
                                <span className={`text-xs font-mono font-bold w-8 text-right ${fStatus.text}`}>
                                    {facet.normalizedScore.toFixed(0)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

const EditableAnswer = ({ assignmentId, questionId, initialValue, token, refetch }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(initialValue);

    const updateMutation = useMutation({
        mutationFn: async (newValue: number) => {
            const res = await fetch(`${API_URL}/api/v1/assessments/assignments/${assignmentId}/responses/${questionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ value: newValue })
            });
            if (!res.ok) throw new Error('Falha ao atualizar');
            return res.json();
        },
        onSuccess: () => {
            setIsEditing(false);
            refetch(); // Reload assignment to update scores!
        }
    });

    if (isEditing) {
        return (
            <div className="flex gap-1" onMouseLeave={() => setIsEditing(false)}>
                {[1, 2, 3, 4, 5].map(v => (
                    <button
                        key={v}
                        onClick={() => { setVal(v); updateMutation.mutate(v); }}
                        disabled={updateMutation.isPending}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold text-xs transition-all shadow-sm ${val === v ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 'bg-white text-slate-500 hover:bg-indigo-50 border border-slate-200'
                            }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 rounded-lg text-sm font-bold bg-white border border-slate-200 text-indigo-600 shadow-sm hover:shadow-md transition-all flex items-center gap-2 hover:ring-2 ring-indigo-50 min-w-[50px] justify-between group"
            title="Clique para editar resposta"
        >
            <span>{val || '-'}</span>
            <Edit2 size={10} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
        </button>
    );
}

// --- PAGE COMPONENT ---

export default function AssessmentDetailsPageV2() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { token, user: currentUser } = useAuthStore();

    const [newMessage, setNewMessage] = useState('');
    const reportRef = useRef<HTMLDivElement>(null);

    // --- TRANSLATION HELPER (Shared) ---
    const TERMS_MAP: Record<string, string> = {
        'OPENNESS': 'ABERTURA À EXPERIÊNCIA',
        'CONSCIENTIOUSNESS': 'CONSCIENCIOSIDADE',
        'EXTRAVERSION': 'EXTROVERSÃO',
        'AGREEABLENESS': 'AMABILIDADE',
        'NEUROTICISM': 'ESTABILIDADE EMOCIONAL', 'ESTABILIDADE': 'ESTABILIDADE EMOCIONAL',
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
    const { data: assignment, isLoading, error, refetch } = useQuery({
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
        mutationFn: async (fullText: string) => {
            const res = await fetch(`${API_URL}/api/v1/assessments/assignments/${params.id}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ feedback: fullText })
            });
            if (!res.ok) throw new Error('Erro ao salvar');
            return res.json();
        },
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['assignment-details', params.id] });
        }
    });

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        const now = new Date();
        const timestamp = now.toLocaleString('pt-BR');
        const authorName = currentUser?.name || 'Usuário';
        const newEntry = `[${authorName} - ${timestamp}]:\n${newMessage.trim()}\n\n`;
        const currentFeedback = assignment.feedback || '';
        const updatedFeedback = currentFeedback + (currentFeedback ? (currentFeedback.endsWith('\n\n') ? '' : '\n\n') : '') + newEntry;
        submitFeedbackMutation.mutate(updatedFeedback);
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">Erro: {error.message}</div>;

    const { user, assessment, responses } = assignment;
    const chatHistory = parseChatHistory(assignment.feedback || '');

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans text-slate-900">
            {/* V2 BADGE */}
            <div className="fixed top-4 right-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold z-50 shadow-xl border border-white/20">
                BETA V2.1
            </div>

            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header ... */}
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
                        <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 hover:translate-y-[-2px]">
                            <Download size={18} /> Baixar PDF
                        </button>
                    </div>
                </header>

                <div ref={reportRef} className="space-y-12">

                    {/* SECTION 1: TRAITS (Reordered) */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-3 mb-8">
                            <Layers className="text-indigo-500" /> Detalhamento dos Traços
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

                    {/* SECTION 2: MAPA (Radar) (Reordered) */}
                    <section className="grid md:grid-cols-12 gap-8">
                        <div className="md:col-span-12 xl:col-span-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 ring-1 ring-slate-400/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Activity className="text-violet-500" />
                                    Mapa de Personalidade
                                </h2>
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Big Five v2</span>
                            </div>
                            <div className="flex items-center justify-center p-4">
                                {(() => {
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
                                    return <div className="text-slate-400">Dados indisponíveis</div>;
                                })()}
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: CHAT (Reordered) */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <MessageSquare className="text-indigo-500" /> Interação & Anotações
                        </h2>

                        <div className="bg-slate-50 rounded-2xl p-6 min-h-[300px] max-h-[500px] overflow-y-auto mb-6 flex flex-col gap-4 border border-slate-200">
                            {chatHistory.length === 0 ? (
                                <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-2">
                                    <MessageSquare size={32} className="opacity-20" />
                                    <p className="text-sm">Nenhuma anotação ou mensagem ainda.</p>
                                </div>
                            ) : (
                                chatHistory.map((msg: any, idx: number) => {
                                    const isSpecialist = msg.author.toLowerCase().includes('especialista') || msg.author.toLowerCase().includes('admin');
                                    let bubbleStyle = "bg-white border-slate-200 text-slate-700";
                                    let align = "items-start";
                                    if (isSpecialist) {
                                        bubbleStyle = "bg-indigo-50 border-indigo-100 text-indigo-900 font-medium";
                                        align = "items-end";
                                    }
                                    return (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={idx} className={`flex flex-col ${align} w-full`}>
                                            <div className={`max-w-[80%] rounded-2xl p-4 border shadow-sm ${bubbleStyle}`}>
                                                <div className="flex justify-between items-center gap-4 mb-2 opacity-60 text-xs font-bold uppercase tracking-wider">
                                                    <span>{msg.author}</span>
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {msg.timestamp}</span>
                                                </div>
                                                <p className="text-sm border-t border-black/5 pt-2 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                        <div className="flex gap-4 items-start bg-white p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                            <textarea
                                className="flex-1 min-h-[60px] max-h-[150px] p-2 bg-transparent outline-none text-slate-700 resize-none font-medium text-sm placeholder:text-slate-400"
                                placeholder="Escreva uma mensagem ou anotação..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={submitFeedbackMutation.isPending || !newMessage.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-3 rounded-lg transition-colors shadow-md hover:shadow-lg self-end"
                            >
                                {submitFeedbackMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
                            </button>
                        </div>
                    </section>

                    {/* SECTION 4: RESPONSES (Reordered) */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <Brain className="text-pink-500" /> Respostas do Questionário (ADMIN)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assessment.questions.map((question: any, index: number) => {
                                const response = responses.find((r: any) => r.questionId === question.id);
                                return (
                                    <div key={question.id} className="group p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-white transition-all duration-300">
                                        <div className="flex flex-col h-full justify-between gap-3">
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase mb-1 block">Questão {index + 1}</span>
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">{question.text}</p>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-200/50 pt-3 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Sua Escolha</span>
                                                <EditableAnswer
                                                    assignmentId={params.id}
                                                    questionId={question.id}
                                                    initialValue={response?.answer}
                                                    token={token}
                                                    refetch={refetch}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

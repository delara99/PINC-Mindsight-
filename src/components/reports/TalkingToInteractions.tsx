
import React, { useState } from 'react';
import { MessageCircle, CheckCircle, XCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface Interaction {
    targetSubtrait: string;
    text: string;
    id: string;
}

interface DimensionCrossing {
    dimension: string;
    traitKey: string;
    userSubtrait: string;
    interactions: Interaction[];
}

interface TalkingToInteractionsProps {
    crossings: DimensionCrossing[];
}

export default function TalkingToInteractions({ crossings }: TalkingToInteractionsProps) {
    if (!crossings || crossings.length === 0) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-slate-200 flex-1"></div>
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <MessageCircle size={22} />
                    </span>
                    Guia de Interação
                </h2>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="grid gap-6">
                {crossings.map((crossing, idx) => (
                    <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        {/* Header da Dimensão */}
                        <div className={`p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 ${getDimensionBg(crossing.traitKey)}`}>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-1">{crossing.dimension}</h3>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="text-sm font-medium">Você é:</span>
                                    <span className="px-3 py-1 rounded-full bg-white/60 border border-black/5 text-sm font-black uppercase tracking-wider text-slate-800">
                                        {crossing.userSubtrait}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Interações */}
                        <div className="p-6 md:p-8 space-y-6 bg-white">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                Como lidar com outros perfis
                            </h4>

                            <div className="grid md:grid-cols-1 gap-4">
                                {crossing.interactions.map((interaction) => (
                                    <InteractionCard
                                        key={interaction.id}
                                        target={interaction.targetSubtrait}
                                        text={interaction.text}
                                        traitKey={crossing.traitKey}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function InteractionCard({ target, text, traitKey }: { target: string, text: string, traitKey: string }) {
    const [expanded, setExpanded] = useState(false);

    // Capitalize target
    const targetDisplay = target.charAt(0).toUpperCase() + target.slice(1);

    return (
        <div className="border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-5 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBg(traitKey)}`}>
                        <ArrowRight size={18} className={getIconColor(traitKey)} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-bold uppercase">Falando com</span>
                        <h5 className="text-lg font-black text-slate-800 leading-tight">{targetDisplay}</h5>
                    </div>
                </div>
                {expanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
            </button>

            {expanded && (
                <div className="px-5 pb-6 pt-0 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-px bg-slate-200 mb-4 w-full"></div>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-justify">
                        {text}
                    </p>
                </div>
            )}
        </div>
    )
}

function getDimensionBg(key: string) {
    const map: Record<string, string> = {
        'EXTRAVERSION': 'bg-gradient-to-r from-orange-50 to-orange-100/50',
        'AGREEABLENESS': 'bg-gradient-to-r from-emerald-50 to-emerald-100/50',
        'CONSCIENTIOUSNESS': 'bg-gradient-to-r from-blue-50 to-blue-100/50',
        'OPENNESS': 'bg-gradient-to-r from-yellow-50 to-yellow-100/50',
        'NEUROTICISM': 'bg-gradient-to-r from-purple-50 to-purple-100/50'
    };
    return map[key] || 'bg-slate-50';
}

function getIconBg(key: string) {
    const map: Record<string, string> = {
        'EXTRAVERSION': 'bg-orange-100',
        'AGREEABLENESS': 'bg-emerald-100',
        'CONSCIENTIOUSNESS': 'bg-blue-100',
        'OPENNESS': 'bg-yellow-100',
        'NEUROTICISM': 'bg-purple-100'
    };
    return map[key] || 'bg-slate-200';
}

function getIconColor(key: string) {
    const map: Record<string, string> = {
        'EXTRAVERSION': 'text-orange-600',
        'AGREEABLENESS': 'text-emerald-600',
        'CONSCIENTIOUSNESS': 'text-blue-600',
        'OPENNESS': 'text-yellow-600',
        'NEUROTICISM': 'text-purple-600'
    };
    return map[key] || 'text-slate-600';
}

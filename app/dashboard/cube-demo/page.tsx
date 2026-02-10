'use client';

import React, { useState } from 'react';
import PersonalityOrigami from '@/src/components/3d/PersonalityOrigami';
import { Box, Maximize, Cuboid, Hand } from 'lucide-react';

const MOCK_PROFILES = {
    'equilibrado': {
        label: 'Perfil Equilibrado',
        description: 'Scores médios, indicando flexibilidade.',
        activeTraits: ['N2-', 'E1-', 'A1-', 'S1+', 'O1-'], // Códigos simulados
        scores: { EXTRAVERSION: 50, AGREEABLENESS: 55, CONSCIENTIOUSNESS: 48, OPENNESS: 52, NEUROTICISM: 45 }
    },
    'lider': {
        label: 'Líder Executor',
        description: 'Alta Extroversão e Alta Estabilidade Emocional.',
        activeTraits: ['E1+', 'E2+', 'N1-', 'A1+', 'S1+'], // Gregário, Ativo, Autoconfiante...
        scores: { EXTRAVERSION: 85, AGREEABLENESS: 40, CONSCIENTIOUSNESS: 70, OPENNESS: 60, NEUROTICISM: 20 }
    },
    'criativo': {
        label: 'Criativo Inovador',
        description: 'Alta Abertura e Espontaneidade.',
        activeTraits: ['O1+', 'O2+', 'S1-', 'S2-', 'E2+'],
        scores: { EXTRAVERSION: 60, AGREEABLENESS: 70, CONSCIENTIOUSNESS: 30, OPENNESS: 90, NEUROTICISM: 60 }
    },
    'cliente_real': {
        label: 'Cliente Real (c@empresa)',
        description: 'Perfil Equilibrado (Dados Reais DB).',
        activeTraits: ['E1', 'N1', 'A1', 'C1', 'O1'],
        scores: { EXTRAVERSION: 56, AGREEABLENESS: 53, CONSCIENTIOUSNESS: 55, OPENNESS: 53, NEUROTICISM: 46 }
    }
};

export default function CubeDemoPage() {
    const [currentProfile, setCurrentProfile] = useState<keyof typeof MOCK_PROFILES>('cliente_real');
    const [foldProgress, setFoldProgress] = useState(0);
    const [autoRotate, setAutoRotate] = useState(false);

    // State for manual overrides
    const [manualScores, setManualScores] = useState(MOCK_PROFILES['cliente_real'].scores);
    const [isManualMode, setIsManualMode] = useState(false);

    // Update manual scores when profile changes (unless already in manual mode)
    React.useEffect(() => {
        if (!isManualMode) {
            setManualScores(MOCK_PROFILES[currentProfile].scores);
        }
    }, [currentProfile, isManualMode]);

    const handleManualChange = (trait: string, val: number) => {
        setIsManualMode(true);
        setManualScores(prev => ({ ...prev, [trait]: val }));
    };

    const activeScores = isManualMode ? manualScores : MOCK_PROFILES[currentProfile].scores;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 pt-24 space-y-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
                        <Box size={14} /> Feature Preview
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                        Mapa <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Origami 3D</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Visualização estrutural da personalidade baseada nos 5 Grandes Fatores.
                    </p>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* COLUNA ESQUERDA: CONTROLES */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Seletor de Perfil */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-4">Carregar Perfil</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {(Object.entries(MOCK_PROFILES) as [string, any][]).map(([key, profile]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setIsManualMode(false);
                                            setCurrentProfile(key as any);
                                        }}
                                        className={`w-full text-left p-3 rounded-xl transition-all border-2 relative overflow-hidden ${currentProfile === key && !isManualMode
                                            ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500'
                                            : 'border-slate-100 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="font-bold text-slate-900 text-sm">{profile.label}</div>
                                        <div className="text-xs text-slate-500">{profile.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Controles Manuais (Sliders) */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-sm">Ajuste Fino (Manual)</h3>
                                {isManualMode && (
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">MODO MANUAL</span>
                                )}
                            </div>

                            {Object.entries(activeScores).map(([trait, score]) => (
                                <div key={trait}>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>{trait.substring(0, 3)}</span>
                                        <span>{Math.round(score as number)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={score as number}
                                        onChange={(e) => handleManualChange(trait, parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COLUNA DIREITA: PALCO 3D */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* CONTROLE DESLIZANTE 2D -> 3D */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full flex items-center gap-4">
                            <Maximize size={20} className="text-slate-400" />
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between mb-2">
                                    <span>Mapa Plano (2D)</span>
                                    <span className="text-indigo-600">Cubo (3D)</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={foldProgress}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setFoldProgress(val);
                                        if (val < 0.8) setAutoRotate(false);
                                    }}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                            <Cuboid size={24} className={`transition-colors ${foldProgress > 0.9 ? 'text-indigo-600' : 'text-slate-300'}`} />
                        </div>

                        {/* PALCO */}
                        <div className="h-[500px] md:h-[600px] bg-slate-100 rounded-[2.5rem] relative flex items-center justify-center overflow-hidden inner-shadow shadow-inner border border-slate-200 group perspective-1000">

                            {/* Componente Origami com Dados Reais/Manuais */}
                            <div className="transition-transform duration-500">
                                <PersonalityOrigami
                                    progress={foldProgress}
                                    activeTraits={MOCK_PROFILES[currentProfile as keyof typeof MOCK_PROFILES]?.activeTraits || []}
                                    // Override scores inside component via props if supported, 
                                    // OR pass scores directly if component supports it.
                                    // Checking component signature... 
                                    // Assumption: PersonalityOrigami likely needs `scores` prop or uses `activeTraits` to infer.
                                    // If it doesn't accept scores, I might need to update it.
                                    // Let's pass `customScores={activeScores}` and update the component next if needed.
                                    customScores={activeScores}
                                    autoRotate={autoRotate}
                                />
                            </div>

                            {/* Controles Flutuantes */}
                            <div className="absolute bottom-6 left-0 w-full flex flex-col items-center gap-4 pointer-events-none">
                                {foldProgress > 0.8 && (
                                    <div className="flex gap-2 pointer-events-auto">
                                        <button
                                            onClick={() => setAutoRotate(!autoRotate)}
                                            className="px-6 py-2 bg-white text-slate-900 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg flex items-center gap-2 border border-slate-200"
                                        >
                                            {autoRotate ? 'Pausar' : 'Girar'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center text-xs text-slate-400">
                            Dados carregados de: {isManualMode ? 'Ajuste Manual' : MOCK_PROFILES[currentProfile].label}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        description: 'Alta Extroversão e Baixo Neuroticismo.',
        activeTraits: ['E1+', 'E2+', 'N1-', 'A1+', 'S1+'], // Gregário, Ativo, Autoconfiante...
        scores: { EXTRAVERSION: 85, AGREEABLENESS: 40, CONSCIENTIOUSNESS: 70, OPENNESS: 60, NEUROTICISM: 20 }
    },
    'criativo': {
        label: 'Criativo Inovador',
        description: 'Alta Abertura e Espontaneidade.',
        activeTraits: ['O1+', 'O2+', 'S1-', 'S2-', 'E2+'], // Imaginativo, Aberto, Espontâneo...
        scores: { EXTRAVERSION: 60, AGREEABLENESS: 70, CONSCIENTIOUSNESS: 30, OPENNESS: 90, NEUROTICISM: 60 }
    }
};

export default function CubeDemoPage() {
    const [currentProfile, setCurrentProfile] = useState<keyof typeof MOCK_PROFILES>('lider');
    const [foldProgress, setFoldProgress] = useState(0); // 0 = Aberto, 1 = Fechado
    const [autoRotate, setAutoRotate] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 pt-24 space-y-12">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
                        <Box size={14} /> New Feature Concept
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                        Mapa <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Origami 3D</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Do plano ao tridimensional. Visualize como os traços se conectam e formam a estrutura completa da personalidade.
                    </p>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* COLUNA ESQUERDA: PERFIS */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-4">Selecione um Perfil</h3>
                        {(Object.entries(MOCK_PROFILES) as [string, any][]).map(([key, profile]) => (
                            <button
                                key={key}
                                onClick={() => setCurrentProfile(key as any)}
                                className={`w-full text-left p-4 rounded-xl transition-all border-2 relative overflow-hidden ${currentProfile === key
                                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                        : 'border-slate-100 bg-white hover:border-slate-300'
                                    }`}
                            >
                                <div className="font-bold text-slate-900">{profile.label}</div>
                                <div className="text-xs text-slate-500 mt-1">{profile.description}</div>
                            </button>
                        ))}
                    </div>

                    {/* COLUNA DIREITA: PALCO 3D */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* CONTROLE DESLIZANTE */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full flex items-center gap-4">
                            <Maximize size={20} className="text-slate-400" />
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between mb-2">
                                    <span>Mapa Plano (2D)</span>
                                    <span>Cubo (3D)</span>
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
                            <Cuboid size={20} className={`transition-colors ${foldProgress > 0.9 ? 'text-indigo-600' : 'text-slate-300'}`} />
                        </div>

                        {/* PALCO */}
                        <div className="h-[600px] md:h-[700px] bg-slate-100 rounded-[3rem] relative flex items-center justify-center overflow-hidden inner-shadow shadow-inner border border-slate-200 group">

                            {/* Componente Origami */}
                            <div className="transition-transform duration-500">
                                <PersonalityOrigami
                                    progress={foldProgress}
                                    activeTraits={MOCK_PROFILES[currentProfile].activeTraits}
                                    autoRotate={autoRotate}
                                />
                            </div>

                            {/* Controles Flutuantes e Legenda */}
                            <div className="absolute bottom-8 left-0 w-full flex flex-col items-center gap-4 pointer-events-none">
                                {foldProgress > 0.8 && (
                                    <>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setAutoRotate(!autoRotate)}
                                                className="pointer-events-auto px-5 py-2 bg-white text-slate-900 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg flex items-center gap-2 border border-slate-200"
                                            >
                                                {autoRotate ? 'Pausar Rotação' : 'Girar Auto'}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium bg-white/50 backdrop-blur px-3 py-1 rounded-full animate-bounce">
                                            <Hand size={14} /> Arraste o cubo para girar
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

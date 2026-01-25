'use client';

import React, { useState } from 'react';
import PersonalityCube from '@/src/components/3d/PersonalityCube';
import { Sparkles, Box, RefreshCw } from 'lucide-react';

const MOCK_PROFILES = {
    'equilibrado': {
        label: 'Perfil Equilibrado',
        description: 'Scores médios, indicando flexibilidade e adaptabilidade.',
        scores: {
            EXTRAVERSION: 50,
            AGREEABLENESS: 55,
            CONSCIENTIOUSNESS: 48,
            OPENNESS: 52,
            NEUROTICISM: 45
        }
    },
    'lider': {
        label: 'Líder Executor (Dominante)',
        description: 'Alta Extroversão e Baixo Neuroticismo (Alta Estabilidade).',
        scores: {
            EXTRAVERSION: 85,
            AGREEABLENESS: 40,
            CONSCIENTIOUSNESS: 70,
            OPENNESS: 60,
            NEUROTICISM: 20 // Alta Estabilidade = Baixo N
        }
    },
    'criativo': {
        label: 'Criativo Inovador',
        description: 'Alta Abertura e Baixa Conscienciosidade (Flexível).',
        scores: {
            EXTRAVERSION: 60,
            AGREEABLENESS: 70,
            CONSCIENTIOUSNESS: 30,
            OPENNESS: 90,
            NEUROTICISM: 60
        }
    }
};

export default function CubeDemoPage() {
    const [currentProfile, setCurrentProfile] = useState<keyof typeof MOCK_PROFILES>('lider');
    const [autoRotate, setAutoRotate] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24 space-y-12">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
                        <Box size={14} /> New Feature Concept
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                        Cubo Holográfico <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">TalkingTO 3D</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Uma representação tridimensional, interativa e viva dos 5 Grandes Traços de Personalidade.
                        O cubo reage aos dados, pulsando as faces dominantes e revelando a estrutura psíquica única de cada indivíduo.
                    </p>
                </header>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* CONTROLES */}
                    <div className="space-y-8 order-2 lg:order-1">
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <RefreshCw size={20} className="text-slate-400" /> Simular Perfis
                            </h3>

                            <div className="space-y-4">
                                {(Object.entries(MOCK_PROFILES) as [string, any][]).map(([key, profile]) => (
                                    <button
                                        key={key}
                                        onClick={() => setCurrentProfile(key as any)}
                                        className={`w-full text-left p-5 rounded-xl transition-all border-2 group relative overflow-hidden ${currentProfile === key
                                                ? 'border-indigo-500 bg-indigo-50/50 shadow-indigo-100 shadow-lg'
                                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="relative z-10">
                                            <div className="font-bold text-slate-900 flex justify-between items-center">
                                                {profile.label}
                                                {currentProfile === key && <Sparkles size={16} className="text-indigo-500 animate-pulse" />}
                                            </div>
                                            <div className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                                                {profile.description}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>

                            <h4 className="font-bold text-lg mb-2 relative z-10">Como Funciona?</h4>
                            <p className="text-slate-400 text-sm leading-relaxed relative z-10 mb-6">
                                Cada face representa uma dimensão do Big 5 (OCEAN) + Neuroticismo (frente/trás).
                                A intensidade da cor e o brilho ("Glow") são determinados pelo score.
                                Faces dominantes (High Score) pulsam, chamando atenção visual imediata para os pontos fortes do perfil.
                            </p>

                            <button
                                onClick={() => setAutoRotate(!autoRotate)}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${autoRotate ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/30'}`}
                            >
                                {autoRotate ? 'Pausar Rotação' : 'Girar Automaticamente'}
                            </button>
                        </div>
                    </div>

                    {/* PALCO 3D */}
                    <div className="h-[600px] bg-slate-100 rounded-[3rem] relative flex items-center justify-center overflow-hidden inner-shadow shadow-inner order-1 lg:order-2 border border-slate-200">
                        <div className="absolute inset-0 pattern-grid-lg opacity-5"></div>

                        {/* Cubo Component */}
                        <div className="scale-75 md:scale-100 transition-transform duration-700 ease-spring">
                            <PersonalityCube
                                scores={MOCK_PROFILES[currentProfile].scores}
                                autoRotate={autoRotate}
                            />
                        </div>

                        {/* Legenda Flutuante */}
                        <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none">
                            <span className="inline-block bg-white/50 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-slate-500 border border-white/50 shadow-sm">
                                Renderizado via CSS3D + Framer Motion (GPU Accelerated)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

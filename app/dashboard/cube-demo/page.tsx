'use client';

import React, { useState } from 'react';
import PersonalityOrigami from '@/src/components/3d/PersonalityOrigami';
import { Box, Maximize, Cuboid } from 'lucide-react';

export default function CubeDemoPage() {
    const [foldProgress, setFoldProgress] = useState(0); // 0 = Aberto, 1 = Fechado
    const [autoRotate, setAutoRotate] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 pt-24 space-y-12">
            <div className="max-w-6xl mx-auto">
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

                <div className="flex flex-col gap-8">
                    {/* CONTROLE DESLIZANTE (SLIDER) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-xl mx-auto w-full flex items-center gap-4">
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

                    {/* PALCO 3D (ZONA DE ORIGAMI) */}
                    <div className="h-[700px] md:h-[800px] bg-slate-100 rounded-[3rem] relative flex items-center justify-center overflow-hidden inner-shadow shadow-inner border border-slate-200 group">

                        {/* Componente Origami */}
                        <div className="scale-[0.5] sm:scale-75 md:scale-90 lg:scale-100 transition-transform duration-500">
                            <PersonalityOrigami
                                progress={foldProgress}
                                autoRotate={autoRotate}
                            />
                        </div>

                        {/* Controles Flutuantes e Legenda */}
                        <div className="absolute bottom-8 left-0 w-full flex flex-col items-center gap-4 pointer-events-none">
                            {foldProgress > 0.8 && (
                                <button
                                    onClick={() => setAutoRotate(!autoRotate)}
                                    className="pointer-events-auto px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                                >
                                    {autoRotate ? 'Pausar Rotação' : 'Girar Cubo'}
                                </button>
                            )}

                            <span className="inline-block bg-white/80 backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold text-slate-600 border border-white/50 shadow-lg animate-fade-in-up">
                                {foldProgress < 0.1 ? '👆 Arraste o slider para dobrar o mapa' : foldProgress > 0.9 ? '✨ Estrutura Completa!' : '📐 Dobrando estrutura...'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

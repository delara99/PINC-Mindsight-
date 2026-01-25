'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform, useAnimation } from 'framer-motion';

// --- CONFIGURAÇÃO DAS FACES E CORES ---
// Baseado nas imagens enviadas (Cruz que dobra vira cubo)
const FACES = [
    { id: 'front', label: 'Estabilidade', trait: 'NEUROTICISM_LOW', color: 'bg-cyan-400', glow: 'shadow-cyan-400', txt: 'Controlado' }, // Centro (Front)
    { id: 'back', label: 'Instabilidade', trait: 'NEUROTICISM_HIGH', color: 'bg-pink-400', glow: 'shadow-pink-400', txt: 'Reativo' },   // Topo Extremo (Back ao dobrar)
    { id: 'top', label: 'Extroversão', trait: 'EXTRAVERSION', color: 'bg-orange-400', glow: 'shadow-orange-400', txt: 'Sociável' },    // Topo (Top)
    { id: 'bottom', label: 'Amabilidade', trait: 'AGREEABLENESS', color: 'bg-emerald-400', glow: 'shadow-emerald-400', txt: 'Colaborativo' }, // Base (Bottom)
    { id: 'left', label: 'Conscienciosidade', trait: 'CONSCIENTIOUSNESS', color: 'bg-yellow-400', glow: 'shadow-yellow-400', txt: 'Planejado' }, // Esquerda
    { id: 'right', label: 'Abertura', trait: 'OPENNESS', color: 'bg-purple-400', glow: 'shadow-purple-400', txt: 'Criativo' }      // Direita
];

interface PersonalityCubeProps {
    scores: {
        EXTRAVERSION: number;
        AGREEABLENESS: number;
        CONSCIENTIOUSNESS: number;
        OPENNESS: number;
        NEUROTICISM: number;
    };
    size?: number; // Tamanho do cubo em px
    autoRotate?: boolean;
}

export default function PersonalityCube({ scores, size = 300, autoRotate = true }: PersonalityCubeProps) {
    // Calculando intensidades para efeitos visuais
    const getIntensity = (trait: string) => {
        if (trait === 'NEUROTICISM_LOW') return (100 - scores.NEUROTICISM) / 100;
        if (trait === 'NEUROTICISM_HIGH') return scores.NEUROTICISM / 100;
        return (scores[trait as keyof typeof scores] || 50) / 100;
    };

    // Framer Motion para rotação 3D interativa
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useMotionValue(-15), { stiffness: 60, damping: 20 });
    const rotateY = useSpring(useMotionValue(45), { stiffness: 60, damping: 20 });

    // Auto-rotation logic
    const controls = useAnimation();

    useEffect(() => {
        if (autoRotate) {
            controls.start({
                rotateY: 360 + 45,
                transition: { repeat: Infinity, duration: 20, ease: "linear" }
            });
        }
    }, [autoRotate, controls]);

    // Calcular tamanho da face e translações
    const half = size / 2;

    return (
        <div className="perspective-1000 w-full h-full flex items-center justify-center py-20 overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ perspective: '1200px' }} // Profundidade 3D
        >
            <motion.div
                className="relative preserve-3d"
                style={{
                    width: size,
                    height: size,
                    rotateX,
                    rotateY: autoRotate ? undefined : rotateY, // Se manual, usa spring. Se auto, usa animation.
                    transformStyle: 'preserve-3d'
                }}
                animate={autoRotate ? { rotateY: [45, 405] } : undefined}
                transition={autoRotate ? { repeat: Infinity, duration: 25, ease: "linear" } : undefined}
                onPan={(e, info) => {
                    // Interatividade Manual (Drag)
                    if (!autoRotate) {
                        rotateY.set(rotateY.get() + info.delta.x * 0.5);
                        rotateX.set(rotateX.get() - info.delta.y * 0.5);
                    }
                }}
            >
                {FACES.map((face) => {
                    const intensity = getIntensity(face.trait);
                    const isDominant = intensity > 0.65;

                    // Transformações CSS para montar o cubo
                    let transform = '';
                    switch (face.id) {
                        case 'front': transform = `translateZ(${half}px)`; break;
                        case 'back': transform = `rotateY(180deg) translateZ(${half}px)`; break;
                        case 'right': transform = `rotateY(90deg) translateZ(${half}px)`; break;
                        case 'left': transform = `rotateY(-90deg) translateZ(${half}px)`; break;
                        case 'top': transform = `rotateX(90deg) translateZ(${half}px)`; break;
                        case 'bottom': transform = `rotateX(-90deg) translateZ(${half}px)`; break;
                    }

                    return (
                        <motion.div
                            key={face.id}
                            className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 border-4 border-white/20 backdrop-blur-sm shadow-2xl ${face.color}`}
                            style={{
                                transform,
                                backfaceVisibility: 'visible', // Queremos ver o interior se for transparente (vidro)
                                opacity: 0.9,
                            }}
                            // Efeito "Pulse" se for traço dominante
                            animate={isDominant ? {
                                boxShadow: [`0 0 20px 0px rgba(255,255,255,0.3)`, `0 0 60px 10px rgba(255,255,255,0.6)`, `0 0 20px 0px rgba(255,255,255,0.3)`],
                                filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
                            } : {}}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        >
                            {/* Conteúdo da Face */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                            <h3 className="text-white font-black text-2xl drop-shadow-md uppercase tracking-wide relative z-10 translate-z-10">
                                {face.label}
                            </h3>

                            <div className="flex flex-col items-center mt-2 relative z-10">
                                <span className="text-4xl font-black text-white drop-shadow-lg">
                                    {Math.round(intensity * 100)}%
                                </span>
                                <span className="text-xs font-bold text-white/90 uppercase tracking-widest mt-1 bg-black/20 px-2 py-0.5 rounded">
                                    {intensity > 0.65 ? 'Dominante' : intensity < 0.35 ? 'Baixo' : 'Médio'}
                                </span>
                            </div>

                            {/* Subtexto decorativo */}
                            <div className="absolute bottom-4 text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] z-10">
                                {face.txt}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Núcleo Brilhante (Se o cubo for translúcido) */}
                <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 -translate-x-1/2 -translate-y-1/2 bg-white blur-[50px] rounded-full opacity-40 animate-pulse"
                    style={{ transform: `translateZ(0px)` }}
                />
            </motion.div>

            {/* Instrução */}
            {!autoRotate && (
                <div className="absolute bottom-4 text-slate-400 text-xs font-bold uppercase tracking-widest animate-bounce">
                    Arraste para girar
                </div>
            )}
        </div>
    );
}

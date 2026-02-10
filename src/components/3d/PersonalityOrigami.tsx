'use client';
import React from 'react';
import { motion, useSpring, useAnimationFrame } from 'framer-motion';

// --- CONFIGURAÇÃO DOS SUBTRAÇOS (GRID INTERNO) ---
const GRID_DATA: any = {
    front: { // AZUL - Estabilidade (Centro)
        color: 'bg-cyan-500',
        cells: [
            { txt: 'Despreocupado', code: 'N3-' }, { txt: 'Paciente', code: 'N4-' },
            { txt: 'Controlado', code: 'N2-' }, { txt: 'Autoconfiante', code: 'N1-' }
        ]
    },
    top: { // LARANJA - Extroversão
        color: 'bg-orange-500',
        cells: [
            { txt: 'Gregário', code: 'E2+' }, { txt: 'Ativo', code: 'E1+' },
            { txt: 'Objetivo', code: 'A1+' }, { txt: 'Sociável', code: 'A2+' }
        ]
    },
    bottom: { // VERDE - Amabilidade
        color: 'bg-emerald-500',
        cells: [
            { txt: 'Reflexivo', code: 'E1-' }, { txt: 'Independente', code: 'E2-' },
            { txt: 'Seletivo', code: 'A2-' }, { txt: 'Compreensivo', code: 'A1-' }
        ]
    },
    left: { // AMARELO - Conscienciosidade
        color: 'bg-yellow-500 text-yellow-950',
        cells: [
            { txt: 'Persistente', code: 'S2+' }, { txt: 'Realista', code: 'O1-' },
            { txt: 'Perfeccionista', code: 'O2-' }, { txt: 'Disciplinado', code: 'S1+' }
        ]
    },
    right: { // ROXO - Abertura
        color: 'bg-purple-500',
        cells: [
            { txt: 'Flexível', code: 'S2-' }, { txt: 'Espontâneo', code: 'S1-' },
            { txt: 'Aberto', code: 'O2+' }, { txt: 'Imaginativo', code: 'O1+' }
        ]
    },
    back: { // ROSA - Instabilidade
        color: 'bg-pink-500',
        cells: [
            { txt: 'Inseguro', code: 'N1+' }, { txt: 'Reativo', code: 'N2+' },
            { txt: 'Inquieto', code: 'N3+' }, { txt: 'Irritável', code: 'N4+' }
        ]
    }
};

// Tamanho aumentado para 320px
const FACE_SIZE = 320;

interface OrigamiProps {
    progress: number; // 0 a 1
    activeTraits?: string[];
    customScores?: { [key: string]: number };
    autoRotate?: boolean;
}

export default function PersonalityOrigami({ progress, activeTraits = [], customScores, autoRotate = false }: OrigamiProps) {
    let derivedTraits = [...activeTraits];
    if (customScores) {
        derivedTraits = [];
        const THRESHOLD = 50;
        if ((customScores.EXTRAVERSION || 0) > THRESHOLD) derivedTraits.push('E1+', 'E2+'); else derivedTraits.push('E1-', 'E2-');
        if ((customScores.AGREEABLENESS || 0) > THRESHOLD) derivedTraits.push('A1+', 'A2+'); else derivedTraits.push('A1-', 'A2-');
        if ((customScores.CONSCIENTIOUSNESS || 0) > THRESHOLD) derivedTraits.push('S1+', 'S2+'); else derivedTraits.push('S1-', 'S2-');
        if ((customScores.OPENNESS || 0) > THRESHOLD) derivedTraits.push('O1+', 'O2+'); else derivedTraits.push('O1-', 'O2-');
        if ((customScores.NEUROTICISM || 0) > THRESHOLD) derivedTraits.push('N1+', 'N2+', 'N3+', 'N4+'); else derivedTraits.push('N1-', 'N2-', 'N3-', 'N4-');
    }

    const is3D = progress > 0.9;

    // Animação fluida com Spring para a dobra
    const foldAngle = progress * 90;

    // Controles de rotação com física (Spring)
    const rotateX = useSpring(0, { stiffness: 60, damping: 20 });
    const rotateY = useSpring(0, { stiffness: 60, damping: 20 });

    // Rotação Automática Infinita (Pause Suave)
    useAnimationFrame(() => {
        if (autoRotate && is3D) {
            rotateY.set(rotateY.get() + 0.3); // Roda 0.3 graus por frame
        }
    });

    return (
        <div className="perspective-[2500px] w-full h-full flex items-center justify-center py-20 cursor-grab active:cursor-grabbing scale-75 md:scale-90 lg:scale-100">
            <motion.div
                className="relative preserve-3d"
                style={{
                    width: FACE_SIZE,
                    height: FACE_SIZE,
                    transformStyle: 'preserve-3d',
                    rotateX: rotateX,
                    rotateY: rotateY,
                }}
                animate={{
                    // Pequena inclinação inicial ao entrar no modo 3D, mas respeitando o controle manual (spring)
                    rotateX: is3D && rotateX.get() === 0 ? -25 : rotateX.get()
                }}
                transition={{
                    default: { type: "spring", stiffness: 60, damping: 15 }
                }}
                drag // Habilitado sempre
                dragElastic={0.1}
                onDrag={(event, info) => {
                    rotateY.set(rotateY.get() + info.delta.x * 0.4);
                    rotateX.set(rotateX.get() - info.delta.y * 0.4);
                }}
            >
                {/* --- FACE CENTRAL (BASE) --- */}
                <Face type="front" activeTraits={derivedTraits} />

                {/* --- LATERAIS --- */}
                <FoldableFace type="left" angle={-foldAngle} origin="right" activeTraits={derivedTraits} />
                <FoldableFace type="right" angle={foldAngle} origin="left" activeTraits={derivedTraits} />

                {/* --- TOPO E TRASEIRA --- */}
                <FoldableFace type="top" angle={foldAngle} origin="bottom" activeTraits={derivedTraits}>
                    {/* Ajuste de precisão para fechamento visual */}
                    <FoldableFace
                        type="back"
                        angle={foldAngle + (is3D ? 0.5 : 0)}
                        origin="bottom"
                        yOffset={-FACE_SIZE}
                        activeTraits={derivedTraits}
                    />
                </FoldableFace>

                {/* --- BASE INFERIOR --- */}
                <FoldableFace type="bottom" angle={-foldAngle} origin="top" activeTraits={derivedTraits} />

                {/* --- CAMADA DE COMBINAÇÕES --- */}
                <CombinationsOverlay opacity={1 - progress * 3} />

            </motion.div>
        </div>
    );
}

// --- CAMADA DE COMBINAÇÕES ---
function CombinationsOverlay({ opacity }: { opacity: number }) {
    if (opacity <= 0) return null;

    return (
        <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity }}
        >
            {/* QUADRANTE SUPERIOR ESQUERDO (Laranja + Amarelo) */}
            <div className="absolute top-[-320px] left-[-320px] w-[320px] h-[320px] flex flex-col items-center justify-center text-center">
                <Bubble text="Necessidade de pertencer" />
                <Bubble text="Necessidade de objetividade" className="mt-8" />
                <CurvedArrow rotation={0} />
            </div>

            {/* QUADRANTE SUPERIOR DIREITO (Laranja + Roxo) */}
            <div className="absolute top-[-320px] right-[-320px] w-[320px] h-[320px] flex flex-col items-center justify-center text-center">
                <Bubble text="Necessidade de ação" />
                <Bubble text="Necessidade de socialização" className="mt-8" />
                <CurvedArrow rotation={90} />
            </div>

            {/* QUADRANTE INFERIOR ESQUERDO (Verde + Amarelo) */}
            <div className="absolute bottom-[-320px] left-[-320px] w-[320px] h-[320px] flex flex-col items-center justify-center text-center">
                <Bubble text="Necessidade de estrutura" />
                <Bubble text="Necessidade de autoafirmação" className="mt-8" />
                <CurvedArrow rotation={-90} />
            </div>

            {/* QUADRANTE INFERIOR DIREITO (Verde + Roxo) */}
            <div className="absolute bottom-[-320px] right-[-320px] w-[320px] h-[320px] flex flex-col items-center justify-center text-center">
                <Bubble text="Necessidade de autonomia" />
                <Bubble text="Necessidade de empatia" className="mt-8" />
                <CurvedArrow rotation={180} />
            </div>
        </motion.div>
    );
}

function Bubble({ text, className = "" }: { text: string, className?: string }) {
    return (
        <div className={`bg-white shadow-lg rounded-xl px-4 py-2 border border-slate-200 z-20 max-w-[160px] ${className}`}>
            <span className="text-xs font-bold text-slate-600 leading-tight block">
                {text}
            </span>
        </div>
    );
}

function CurvedArrow({ rotation }: { rotation: number }) {
    return (
        <svg
            width="120" height="120" viewBox="0 0 100 100"
            className="absolute opacity-20 z-10"
            style={{ transform: `rotate(${rotation}deg)` }}
        >
            <path d="M 10 90 Q 50 50 90 10" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="6 4" />
        </svg>
    );
}

// --- SUBCOMPONENTES ---

function Face({ type, children, activeTraits = [] }: any) {
    const data = GRID_DATA[type];
    if (!data) return null;

    return (
        <div
            className={`absolute inset-0 w-full h-full ${data.color} flex flex-wrap content-start backface-visible shadow-sm`}
            style={{
                // Gap hidding technique: inset shadow instead of border to prevent pixel gaps
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
            }}
        >
            {data.cells.map((cell: any, idx: number) => {
                const isActive = activeTraits.length === 0 || activeTraits.includes(cell.code);

                return (
                    <div
                        key={idx}
                        className={`w-1/2 h-1/2 flex flex-col items-center justify-center p-4 text-center transition-all duration-300 relative
                            ${isActive ? 'bg-white/10' : 'bg-black/5 saturate-0 opacity-40'}
                            border-[0.5px] border-black/5
                        `}
                    >
                        {isActive && activeTraits.length > 0 && (
                            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                        )}

                        <span className="text-sm md:text-base font-bold text-white leading-tight drop-shadow-sm">
                            {cell.txt}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-white/70 mt-1 tracking-wider">
                            {cell.code}
                        </span>
                    </div>
                );
            })}
            {children}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/10 pointer-events-none mix-blend-overlay"></div>
        </div>
    );
}

function FoldableFace({ type, angle, origin, children, yOffset = 0, activeTraits }: any) {
    let initialTransform = '';
    const size = FACE_SIZE;

    switch (type) {
        case 'top': initialTransform = `translateY(-${size}px)`; break;
        case 'bottom': initialTransform = `translateY(${size}px)`; break;
        case 'left': initialTransform = `translateX(-${size}px)`; break;
        case 'right': initialTransform = `translateX(${size}px)`; break;
        case 'back': initialTransform = `translateY(-${size}px)`; break;
    }

    return (
        <motion.div
            className={`absolute top-0 left-0 preserve-3d`}
            style={{
                width: size,
                height: size,
                transformOrigin: origin,
            }}
            animate={{
                transform: `${initialTransform} rotate${getAxis(origin)}(${angle}deg)`
            }}
            // Física das dobras: Spring suave
            transition={{ type: "spring", stiffness: 45, damping: 12, mass: 0.8 }}
        >
            <Face type={type} activeTraits={activeTraits} />
            {children}
        </motion.div>
    );
}

function getAxis(origin: string) {
    if (origin === 'bottom' || origin === 'top') return 'X';
    return 'Y';
}

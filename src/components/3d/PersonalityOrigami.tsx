'use client';
import React from 'react';
import { motion, useSpring } from 'framer-motion';

// --- CONFIGURAÇÃO DOS SUBTRAÇOS (GRID INTERNO) ---
const GRID_DATA: any = {
    front: { // AZUL - Estabilidade (Centro)
        color: 'bg-cyan-500', // Mais vibrante
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
        color: 'bg-yellow-500 text-yellow-950', // Texto escuro para contraste
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

// Tamanho base aumentado para melhor leitura
const FACE_SIZE = 260;

interface OrigamiProps {
    progress: number; // 0 a 1
    activeTraits?: string[]; // Lista de códigos ativos ex: ['N1+', 'E2+']
    customScores?: { [key: string]: number }; // Ex: { EXTRAVERSION: 60 }
    autoRotate?: boolean;
}

export default function PersonalityOrigami({ progress, activeTraits = [], customScores, autoRotate = false }: OrigamiProps) {
    // Se customScores for fornecido, calcula os traços ativos dinamicamente
    let derivedTraits = [...activeTraits];
    if (customScores) {
        derivedTraits = [];
        const THRESHOLD = 50;

        // Extroversão (E)
        if ((customScores.EXTRAVERSION || 0) > THRESHOLD) derivedTraits.push('E1+', 'E2+');
        else derivedTraits.push('E1-', 'E2-');

        // Amabilidade (A)
        if ((customScores.AGREEABLENESS || 0) > THRESHOLD) derivedTraits.push('A1+', 'A2+');
        else derivedTraits.push('A1-', 'A2-');

        // Conscienciosidade (S - Self-Control)
        if ((customScores.CONSCIENTIOUSNESS || 0) > THRESHOLD) derivedTraits.push('S1+', 'S2+');
        else derivedTraits.push('S1-', 'S2-');

        // Abertura (O)
        if ((customScores.OPENNESS || 0) > THRESHOLD) derivedTraits.push('O1+', 'O2+');
        else derivedTraits.push('O1-', 'O2-');

        // Neuroticismo (N)
        if ((customScores.NEUROTICISM || 0) > THRESHOLD) derivedTraits.push('N1+', 'N2+', 'N3+', 'N4+');
        else derivedTraits.push('N1-', 'N2-', 'N3-', 'N4-');
    }

    const is3D = progress > 0.8;
    const foldAngle = progress * 90;

    // --- CONTROLES DE ROTAÇÃO MANUAL (DRAG) ---
    const rotateX = useSpring(0, { stiffness: 50, damping: 20 });
    const rotateY = useSpring(0, { stiffness: 50, damping: 20 });

    return (
        <div className="perspective-[2000px] w-full h-full flex items-center justify-center overflow-visible py-20 cursor-grab active:cursor-grabbing sm:scale-75 md:scale-90 lg:scale-100 xl:scale-110">
            <motion.div
                className="relative preserve-3d transition-transform duration-500"
                style={{
                    width: FACE_SIZE,
                    height: FACE_SIZE,
                    transformStyle: 'preserve-3d',
                    rotateX: rotateX,
                    rotateY: rotateY,
                }}
                animate={{
                    // Se estivermos arrastando, o 'style' assume. Se for autoRotate, o 'animate' assume.
                    rotateX: is3D ? -20 : 0,
                    rotateY: is3D && autoRotate ? 360 + 45 : (is3D ? rotateY.get() || 0 : 0)
                }}
                transition={{
                    rotateY: autoRotate ? { repeat: Infinity, duration: 25, ease: "linear" } : { duration: 0 },
                    default: { duration: 0.8 }
                }}
                drag={is3D} // Só permite arrastar se for cubo
                dragElastic={0.1}
                onDrag={(event, info) => {
                    // Soma o drag à rotação atual para controle contínuo
                    rotateY.set(rotateY.get() + info.delta.x * 0.5);
                    rotateX.set(rotateX.get() - info.delta.y * 0.5);
                }}
            >
                {/* --- FACE CENTRAL (BASE FIXA) --- */}
                <Face type="front" activeTraits={derivedTraits} />

                {/* --- FACES DOBRÁVEIS --- */}
                <FoldableFace type="top" angle={foldAngle} origin="bottom" activeTraits={derivedTraits}>
                    <FoldableFace type="back" angle={foldAngle} origin="bottom" yOffset={-FACE_SIZE} activeTraits={derivedTraits} />
                </FoldableFace>

                <FoldableFace type="bottom" angle={-foldAngle} origin="top" activeTraits={derivedTraits} />
                <FoldableFace type="left" angle={-foldAngle} origin="right" activeTraits={derivedTraits} />
                <FoldableFace type="right" angle={foldAngle} origin="left" activeTraits={derivedTraits} />

            </motion.div>
        </div>
    );
}

// --- SUBCOMPONENTES ---

function Face({ type, children, activeTraits = [] }: any) {
    const data = GRID_DATA[type];
    if (!data) return null;

    return (
        <div className={`absolute inset-0 w-[${FACE_SIZE}px] h-[${FACE_SIZE}px] ${data.color} shadow-2xl flex flex-wrap content-start backface-visible border-4 border-white/20 overflow-hidden`}>
            {/* GRID INTERNO 2x2 */}
            {data.cells.map((cell: any, idx: number) => {
                const isActive = activeTraits.length === 0 || activeTraits.includes(cell.code);
                // Se activeTraits estiver vazio, mostra todos (modo demo passivo). Se tiver dados, apaga os inativos.

                return (
                    <div
                        key={idx}
                        className={`w-1/2 h-1/2 border border-black/5 flex flex-col items-center justify-center p-2 text-center transition-all duration-500
                            ${isActive ? 'opacity-100 bg-white/10 backdrop-brightness-110' : 'opacity-30 grayscale blur-[1px]'}
                        `}
                    >
                        <span className="text-xs sm:text-sm font-black text-white uppercase leading-tight drop-shadow-md tracking-tighter shadow-black">
                            {cell.txt}
                        </span>
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-white/90 mt-1 bg-black/20 px-1.5 rounded">
                            {cell.code}
                        </span>

                        {/* Indicador de "Meu Resultado" */}
                        {isActive && activeTraits.length > 0 && (
                            <motion.div
                                layoutId={`active-${cell.code}`}
                                className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"
                                transition={{ duration: 0.3 }}
                            />
                        )}
                    </div>
                );
            })}
            {children}

            {/* Brilho interno */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none mix-blend-overlay"></div>
        </div>
    );
}

function FoldableFace({ type, angle, origin, children, yOffset = 0, activeTraits }: any) {
    let initialTransform = '';
    const size = FACE_SIZE;

    // Posicionamento estático no plano 2D
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
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
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

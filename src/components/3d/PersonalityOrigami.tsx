'use client';
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

// --- CONFIGURAÇÃO DOS SUBTRAÇOS (GRID INTERNO) ---
// Baseado na imagem fornecida (Mapeamento exato)
const GRID_DATA: any = {
    front: { // AZUL - Estabilidade (Centro)
        color: 'bg-cyan-400',
        borderColor: 'border-cyan-300',
        cells: [
            { txt: 'Despreocupado', code: 'N3-' }, { txt: 'Paciente', code: 'N4-' },
            { txt: 'Controlado', code: 'N2-' }, { txt: 'Autoconfiante', code: 'N1-' }
        ]
    },
    top: { // LARANJA - Extroversão
        color: 'bg-orange-400',
        borderColor: 'border-orange-300',
        cells: [
            { txt: 'Gregário', code: 'E2+' }, { txt: 'Ativo', code: 'E1+' },
            { txt: 'Objetivo', code: 'A1+' }, { txt: 'Sociável', code: 'A2+' }
        ]
    },
    bottom: { // VERDE - Amabilidade
        color: 'bg-emerald-400',
        borderColor: 'border-emerald-300',
        cells: [
            { txt: 'Reflexivo', code: 'E1-' }, { txt: 'Independente', code: 'E2-' },
            { txt: 'Seletivo', code: 'A2-' }, { txt: 'Compreensivo', code: 'A1-' }
        ]
    },
    left: { // AMARELO - Conscienciosidade
        color: 'bg-yellow-400',
        borderColor: 'border-yellow-300',
        cells: [
            { txt: 'Persistente', code: 'S2+' }, { txt: 'Realista', code: 'O1-' },
            { txt: 'Perfeccionista', code: 'O2-' }, { txt: 'Disciplinado', code: 'S1+' }
        ]
    },
    right: { // ROXO - Abertura
        color: 'bg-purple-400',
        borderColor: 'border-purple-300',
        cells: [
            { txt: 'Flexível', code: 'S2-' }, { txt: 'Espontâneo', code: 'S1-' },
            { txt: 'Aberto', code: 'O2+' }, { txt: 'Imaginativo', code: 'O1+' }
        ]
    },
    back: { // ROSA - Instabilidade (Topo do Topo)
        color: 'bg-pink-400',
        borderColor: 'border-pink-300',
        cells: [
            { txt: 'Inseguro', code: 'N1+' }, { txt: 'Reativo', code: 'N2+' },
            { txt: 'Inquieto', code: 'N3+' }, { txt: 'Irritável', code: 'N4+' }
        ]
    }
};

interface OrigamiProps {
    progress: number; // 0 (Aberto 2D) a 1 (Fechado 3D)
    autoRotate?: boolean;
}

export default function PersonalityOrigami({ progress, autoRotate = false }: OrigamiProps) {
    // Converter progresso (0-1) em graus (0-90)
    // 0 = Plano, 1 = Cubo Fechado
    const foldAngle = progress * 90;

    // Rotação Global do Cubo (para visualizar em 3D quando fechado)
    // Se progress < 0.5 (Aberto), rotação é 0 (Frente para tela).
    // Se progress > 0.5 (Fechado), começa a girar para mostrar 3D.
    const globalRotationX = progress > 0.8 ? -20 : 0;
    const globalRotationY = progress > 0.8 && autoRotate ? [0, 360] : (progress > 0.8 ? 45 : 0);

    return (
        <div className="perspective-[1500px] w-full h-full flex items-center justify-center overflow-visible py-20">
            <motion.div
                className="relative preserve-3d transition-transform duration-500"
                style={{
                    width: 200,
                    height: 200,
                    transformStyle: 'preserve-3d',
                }}
                animate={{
                    rotateX: globalRotationX,
                    rotateY: globalRotationY as any
                }}
                transition={{
                    rotateY: { repeat: Infinity, duration: 20, ease: "linear" },
                    default: { duration: 0.5 }
                }}
            >
                {/* --- FACE CENTRAL (BASE FIXA) --- */}
                <Face type="front" />

                {/* --- FACES DOBRÁVEIS --- */}

                {/* TOPO (Laranja) + BACK (Rosa) anexado a ele */}
                <FoldableFace type="top" angle={foldAngle} origin="bottom">
                    {/* A Face BACK (Rosa) está conectada ao topo da face TOP */}
                    <FoldableFace type="back" angle={foldAngle} origin="bottom" yOffset={-200} />
                </FoldableFace>

                {/* BAIXO (Verde) */}
                <FoldableFace type="bottom" angle={-foldAngle} origin="top" />

                {/* ESQUERDA (Amarelo) */}
                <FoldableFace type="left" angle={-foldAngle} origin="right" />

                {/* DIREITA (Roxo) */}
                <FoldableFace type="right" angle={foldAngle} origin="left" />

            </motion.div>
        </div>
    );
}

// --- SUBCOMPONENTES ---

function Face({ type, children }: { type: string, children?: React.ReactNode }) {
    const data = GRID_DATA[type];
    if (!data) return null;

    return (
        <div className={`absolute inset-0 w-[200px] h-[200px] ${data.color} shadow-lg flex flex-wrap content-start backface-visible border-2 border-white/50`}>
            {/* GRID INTERNO 2x2 */}
            {data.cells.map((cell: any, idx: number) => (
                <div key={idx} className={`w-1/2 h-1/2 border border-black/10 flex flex-col items-center justify-center p-1 text-center`}>
                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase leading-tight drop-shadow-sm">{cell.txt}</span>
                    <span className="text-[8px] sm:text-[10px] font-mono text-white/80 mt-0.5">{cell.code}</span>
                </div>
            ))}
            {children}

            {/* Label Central (Opcional, para identificar a face inteira) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <span className="text-3xl font-black text-black uppercase -rotate-45">{type}</span>
            </div>
        </div>
    );
}

function FoldableFace({ type, angle, origin, children, yOffset = 0 }: any) {
    // Define a posição inicial no plano 2D antes de dobrar
    let initialTransform = '';
    const size = 200;

    // Posicionamento relativo ao pai (Centro ou outra face)
    switch (type) {
        case 'top': initialTransform = `translateY(-${size}px)`; break; // Acima do centro
        case 'bottom': initialTransform = `translateY(${size}px)`; break; // Abaixo do centro
        case 'left': initialTransform = `translateX(-${size}px)`; break; // Esquerda do centro
        case 'right': initialTransform = `translateX(${size}px)`; break; // Direita do centro
        case 'back': initialTransform = `translateY(-${size}px)`; break; // Acima do Top
    }

    return (
        <motion.div
            className="absolute top-0 left-0 w-[200px] h-[200px] preserve-3d"
            style={{
                transformOrigin: origin, // Ponto de Dobra
            }}
            animate={{
                transform: `${initialTransform} rotate${getAxis(origin)}(${angle}deg)`
            }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
            <Face type={type} />
            {children}
        </motion.div>
    );
}

function getAxis(origin: string) {
    // Se a origem é bottom/top, roda no eixo X. Se left/right, no eixo Y.
    if (origin === 'bottom' || origin === 'top') return 'X';
    return 'Y';
}

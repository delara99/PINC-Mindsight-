'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function GlobalHelpButton() {
    const pathname = usePathname();

    // Não mostrar o botão se já estivermos na página de ajuda
    if (pathname === '/help') return null;

    return (
        <Link
            href="/help"
            className="fixed bottom-6 right-6 z-[9999] group flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white shadow-2xl transition-all duration-300 ease-out h-12 w-12 hover:w-32 rounded-full hover:rounded-xl overflow-hidden"
            aria-label="Ajuda e Suporte"
        >
            <div className="absolute left-0 w-12 flex justify-center">
                <HelpCircle size={24} className="animate-pulse-slow" />
            </div>

            <span className="opacity-0 group-hover:opacity-100 whitespace-nowrap pl-8 text-sm font-medium transition-opacity duration-300 delay-75">
                Precisa de ajuda?
            </span>

            {/* Efeito Glow sutil (Frontend Specialist Requirement: "Micro-interactions" & "Layered Depth") */}
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 group-hover:ring-white/20 transition-all" />
        </Link>
    );
}

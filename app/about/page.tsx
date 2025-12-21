'use client';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../../src/config/api';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function AboutPage() {
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings`);
            return res.json();
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!settings?.showAbout) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Página não encontrada</h1>
                <Link href="/" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft size={16} /> Voltar para Home
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <img src={settings?.businessLogo || '/logo.png'} alt="Logo" className="h-10 w-auto object-contain" />
                    </Link>
                    <Link href="/" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
                        <ArrowLeft size={16} /> Voltar
                    </Link>
                </div>
            </header>

            {/* Content */}
            <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
                <h1 className="text-4xl md:text-5xl font-extrabold text-black mb-8 tracking-tight">
                    {settings?.aboutTitle || 'Sobre Nós'}
                </h1>

                <div className="prose prose-lg prose-headings:text-black prose-p:text-black max-w-none">
                    {/* Render content handling basic line breaks */}
                    {settings?.aboutContent?.split('\n').map((paragraph: string, idx: number) => (
                        paragraph.trim() ? <p key={idx}>{paragraph}</p> : <br key={idx} />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-gray-900 font-medium">PINC By Sued.Inc - 2025 - CNPJ: 57.810.083/0001-00</p>
                </div>
            </footer>
        </main>
    );
}

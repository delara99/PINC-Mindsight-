
'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, BrainCircuit, ShieldCheck, CheckCircle, ArrowRight, Target, Grid3x3, Shield, FileText, Star, Loader2, Menu, X } from 'lucide-react';
import { MethodologySection } from '../src/components/landing/methodology-section';
import { FeaturesGrid } from '../src/components/landing/features-grid';
import { TalkingToTeaser } from '../src/components/landing/talking-to-teaser';
import { PincCoachSection } from '../src/components/landing/PincCoachSection';
import { API_URL } from '../src/config/api';
import { useState } from 'react';

// Icon mapping
const iconMap: any = {
    'target': Target,
    'grid': Grid3x3,
    'users': Users,
    'shield': Shield,
    'file-text': FileText,
    'star': Star,
    'check': CheckCircle,
    'brain': BrainCircuit
};

export default function Home() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Fetch site settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/site-settings`);
                if (!res.ok) return {}; // Fallback empty
                return res.json();
            } catch (e) {
                return {}; // Fallback
            }
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <main className="min-h-screen bg-white text-gray-800 font-sans">

            {/* HEADER */}
            <header className="fixed top-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="PINC Logo" className="h-10 md:h-12 w-auto object-contain" />
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
                        <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
                        <Link href="/company" className="hover:text-primary transition-colors font-semibold text-primary">Metodologia</Link>
                        <Link href="/business" className="hover:text-primary transition-colors">Para Empresas</Link>
                        <Link href="#plans" className="hover:text-primary transition-colors">Planos</Link>
                        <Link href="/about" className="hover:text-primary transition-colors">Sobre Nós</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/auth/login" className="text-sm font-semibold text-primary hover:text-primary-hover">
                                Área do Cliente
                            </Link>
                            <Link
                                href="/auth/register"
                                className="bg-secondary hover:bg-secondary-hover text-black font-bold py-2.5 px-6 rounded-full text-sm transition-transform hover:scale-105 shadow-lg shadow-secondary/30"
                            >
                                COMEÇAR AGORA
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={toggleMenu}
                            aria-label="Menu Principal"
                        >
                            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-xl py-4 px-4 flex flex-col h-[calc(100vh-64px)] overflow-y-auto animate-in slide-in-from-top-2">
                        <div className="space-y-1 mb-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Navegação</p>
                            <Link href="#features" onClick={toggleMenu} className="block px-4 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 rounded-xl">Funcionalidades</Link>
                            <Link href="/company" onClick={toggleMenu} className="block px-4 py-3 text-lg font-medium text-primary hover:bg-primary/5 rounded-xl">Metodologia</Link>
                            <Link href="/business" onClick={toggleMenu} className="block px-4 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 rounded-xl">Para Empresas</Link>
                            <Link href="#plans" onClick={toggleMenu} className="block px-4 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 rounded-xl">Planos</Link>
                            <Link href="/about" onClick={toggleMenu} className="block px-4 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 rounded-xl">Sobre Nós</Link>
                        </div>

                        <div className="mt-auto border-t border-gray-100 pt-6 pb-8 space-y-3">
                            <Link href="/auth/login" onClick={toggleMenu} className="flex justify-center items-center w-full px-4 py-3 border border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">
                                Já tenho conta
                            </Link>
                            <Link
                                href="/auth/register"
                                onClick={toggleMenu}
                                className="flex justify-center items-center w-full bg-secondary hover:bg-secondary-hover text-black font-bold py-4 px-6 rounded-xl shadow-lg shadow-secondary/20 active:scale-95 transition-transform"
                            >
                                COMEÇAR AGORA <ArrowRight size={18} className="ml-2" />
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* HERO SECTION - DYNAMIC */}
            <section
                className="pt-32 pb-20 text-white overflow-hidden relative"
                style={{
                    background: `linear-gradient(to bottom right, ${settings?.heroBgColor || '#EC1B8E'}, ${settings?.heroBgColor || '#EC1B8E'}dd)`
                }}
            >
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 skew-x-12 transform origin-bottom translate-x-32" />

                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-6">

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tighter" style={{ color: settings?.heroTextColor || '#FFFFFF' }}>
                            {settings?.heroTitle || 'Revele quem você'} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500" style={{ color: settings?.accentColor ? 'inherit' : undefined }}>
                                {settings?.heroSubtitle || 'realmente é.'}
                            </span>
                        </h1>
                        <p className="text-lg opacity-90 leading-relaxed max-w-lg font-medium mt-4" style={{ color: settings?.heroTextColor || '#FFFFFF' }}>
                            {settings?.heroDescription || 'Não é horóscopo. É ciência. Use o método Big Five para entender sua personalidade, alavancar sua carreira e melhorar seus relacionamentos.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-8">
                            <Link
                                href="/trial"
                                className="group flex items-center justify-center gap-3 text-lg font-bold py-4 px-10 rounded-full bg-white text-slate-900 shadow-2xl transition-all hover:scale-105 hover:bg-slate-50 hover:shadow-white/20"
                            >
                                Ver Degustação
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Abstract Card Visual */}
                        <div className="bg-white rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                            <div className="flex items-center gap-4 mb-6 border-b pb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center font-bold text-white">HD</div>
                                <div>
                                    <h4 className="font-bold text-gray-800">Henrique De Lara</h4>
                                    <p className="text-xs text-gray-500">CEO da Sued.in</p>
                                </div>
                                <div className="ml-auto text-green-600 font-bold text-sm">98% Compatível</div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">Extroversão</div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[85%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">Amabilidade</div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[92%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">Conscienciosidade</div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-[78%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TALKING TO TEASER (MARKETING CARD) */}
            <TalkingToTeaser />

            {/* METHODOLOGY SHOWCASE */}
            <MethodologySection />

            {/* FEATURES SECTION - DYNAMIC */}
            {settings?.showFeatures && settings?.features?.length > 0 && (
                <FeaturesGrid features={settings.features} />
            )}

            {/* PINC COACH SECTION - NEW AI FEATURE */}
            <PincCoachSection />

            {/* PRICING SECTION - DYNAMIC */}
            {settings?.showPricing && settings?.pricingPlans?.length > 0 && (
                <section id="plans" className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Planos e Preços</h2>
                            <p className="text-lg text-gray-600">Escolha o plano ideal para o tamanho da sua equipe</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-8">
                            {settings.pricingPlans.map((plan: any) => (
                                <div
                                    key={plan.id}
                                    className={`rounded-2xl p-8 border-2 w-full max-w-sm ${plan.highlighted ? 'border-primary bg-primary/5 shadow-xl scale-105' : 'border-gray-200 bg-white'}`}
                                >
                                    {plan.highlighted && (
                                        <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                                            MAIS POPULAR
                                        </div>
                                    )}
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-extrabold text-gray-900">
                                            {plan.currency} {Number(String(plan.price).replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-gray-500">/{plan.period}</span>
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {plan.features?.map((feat: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={18} />
                                                <span className="text-gray-700">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/auth/register"
                                        className={`block w-full text-center py-3 px-6 rounded-full font-bold transition-all ${plan.highlighted
                                            ? 'bg-primary text-white hover:bg-primary-hover shadow-lg'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        {plan.buttonText}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FOOTER */}
            {/* FOOTER */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <img src="/logo.png" alt="PINC Logo" className="h-10 w-auto" />
                            <p className="text-gray-500 text-sm">
                                © 2025 Sued Inc. Todos os direitos reservados.
                            </p>
                        </div>

                        <div className="max-w-lg text-center md:text-right">
                            <p className="text-gray-400 text-xs leading-relaxed">
                                O PINC é uma ferramenta de autoconhecimento e desenvolvimento. Os relatórios gerados não substituem avaliações psicológicas clínicas ou acompanhamento profissional especializado quando necessário.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

        </main>
    );
}
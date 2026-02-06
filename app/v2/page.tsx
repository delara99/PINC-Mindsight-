'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    LayoutDashboard, Users, BrainCircuit, ShieldCheck, CheckCircle,
    ArrowRight, Target, Grid3x3, Shield, FileText, Star, Loader2,
    Menu, X, Sparkles, Layers, Zap, Globe
} from 'lucide-react';
import { API_URL } from '@/src/config/api';
import { useState, useRef } from 'react';

/**
 * 🎨 DESIGN COMMITMENT: SWISS PUNK / OPENAI-INSPIRED
 * 
 * - **Topological Choice:** Strict Grids with Asymmetric Typography. Abandoned the "Soft SaaS" look.
 * - **Geometry:** Sharp edges (rounded-sm or none) vs High Contrast.
 * - **Typography:** Massive, high-tracking headings. Inter predominantly.
 * - **Palette:** Monochrome (Black/White/Slate-50) + PINC Purple (#7c3aed) as sole accent.
 * - **Risk Factor:** Using heavy black borders and raw layout structures instead of shadows.
 * - **Cliché Liquidation:** No soft shadows, no gradient blobs, no glassmorphism cards.
 */

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

export default function HomeV2() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Fetch site settings (reusing existing API)
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/site-settings`);
                if (!res.ok) return {};
                return res.json();
            } catch (e) { return {}; }
        }
    });

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white text-black font-sans selection:bg-purple-100 selection:text-purple-900">

            {/* HEADER - Kept White as requested, but cleaner */}
            <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="PINC Logo" className="h-10 w-auto object-contain" />
                    </div>

                    {/* Desktop Nav - Swiss Style: Uppercase/Small/Bold or Normal? PINC is friendly. */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-gray-500">
                        <Link href="#features" className="hover:text-black transition-colors">Funcionalidades</Link>
                        <Link href="/company" className="hover:text-black transition-colors">Metodologia</Link>
                        <Link href="/business" className="hover:text-black transition-colors">Para Empresas</Link>
                        <Link href="#plans" className="hover:text-black transition-colors">Planos</Link>
                        <Link href="/about" className="hover:text-black transition-colors">Sobre Nós</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/auth/login" className="text-sm font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                                Entrar
                            </Link>
                            <Link
                                href="/auth/register"
                                className="bg-black hover:bg-purple-600 text-white font-bold py-2.5 px-6 rounded-md text-sm transition-all hover:translate-y-[-1px]"
                            >
                                Começar Agora
                            </Link>
                        </div>
                        <button className="md:hidden p-2 text-black" onClick={toggleMenu} aria-label="Menu">
                            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 py-6 px-6 flex flex-col gap-4 shadow-xl">
                        <Link href="#features" className="text-lg font-medium text-gray-900">Funcionalidades</Link>
                        <Link href="/company" className="text-lg font-medium text-gray-900">Metodologia</Link>
                        <Link href="/business" className="text-lg font-medium text-gray-900">Para Empresas</Link>
                        <Link href="#plans" className="text-lg font-medium text-gray-900">Planos</Link>
                        <div className="border-t border-gray-100 pt-4 mt-2 flex flex-col gap-3">
                            <Link href="/auth/login" className="w-full text-center py-3 border border-gray-200 rounded-md font-bold">Entrar</Link>
                            <Link href="/auth/register" className="w-full text-center py-3 bg-black text-white rounded-md font-bold">Criar Conta</Link>
                        </div>
                    </div>
                )}
            </header>

            {/* HERO SECTION - OPENAI STYLE: Massive Typography, Left Aligned, Clean */}
            <section className="pt-40 pb-24 md:pt-52 md:pb-32 px-6 border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto grid lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-7 space-y-8">
                        {/* Status Pill */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 mb-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Ciência Comportamental v2.0
                        </div>

                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-black">
                            Revele quem <br />
                            <span className="text-purple-600">você é.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed max-w-2xl tracking-tight">
                            {settings?.heroDescription || 'Não é horóscopo. É ciência. Use o método Big Five para entender sua personalidade, alavancar sua carreira e melhorar seus relacionamentos.'}
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link
                                href="/trial"
                                className="inline-flex items-center gap-2 bg-black text-white hover:bg-purple-600 px-8 py-4 rounded-md font-bold text-lg transition-all"
                            >
                                Iniciar Degustação <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="/company"
                                className="inline-flex items-center gap-2 bg-slate-100 text-slate-900 hover:bg-slate-200 px-8 py-4 rounded-md font-bold text-lg transition-all"
                            >
                                Ver Metodologia
                            </Link>
                        </div>
                    </div>

                    {/* Right Visual - Abstract / Geometric */}
                    <div className="lg:col-span-5 relative">
                        <div className="relative aspect-square md:aspect-[4/5] bg-slate-50 border border-gray-200 rounded-lg overflow-hidden">
                            {/* Abstract Grid Background */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                            {/* Floating UI Elements matching OpenAI generic/tech vibe */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="w-64 bg-white border border-gray-200 rounded-md shadow-xl p-6 relative z-10"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="w-10 h-10 bg-purple-600 rounded-md flex items-center justify-center text-white"><Sparkles size={20} /></div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-gray-400 uppercase">Score</div>
                                            <div className="text-2xl font-bold text-black">98%</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { l: 'Abertura', v: 85, c: 'bg-purple-600' },
                                            { l: 'Conscienciosidade', v: 92, c: 'bg-black' },
                                            { l: 'Extroversão', v: 64, c: 'bg-gray-400' }
                                        ].map((stat, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs font-bold mb-1">{stat.l}</div>
                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${stat.c}`} style={{ width: `${stat.v}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Background Elements */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                    className="absolute -top-10 -right-10 w-48 h-48 border border-dashed border-purple-200 rounded-full z-0"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                                    className="absolute -bottom-10 -left-10 w-64 h-64 border border-dashed border-gray-200 rounded-full z-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TEASER / TRUST SECTION - Minimal Grid */}
            <section className="py-24 border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 md:gap-px bg-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                        {[
                            { icon: BrainCircuit, title: "Base Científica", desc: "Fundamentado no modelo Big Five, padrão ouro da psicologia moderna." },
                            { icon: Target, title: "Precisão de Dados", desc: "Algoritmos calibrados com milhares de perfis brasileiros para máxima assertividade." },
                            { icon: Users, title: "Comparativo 360", desc: "Entenda como você se compara à média da população e profissionais da sua área." }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-10 hover:bg-slate-50 transition-colors group">
                                <feature.icon className="w-10 h-10 text-black mb-6 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                                <h3 className="text-xl font-bold text-black mb-3">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURES GRID - Swiss Style */}
            {settings?.showFeatures && (
                <section id="features" className="py-32 bg-slate-50">
                    <div className="max-w-[1440px] mx-auto px-6">
                        <div className="mb-20 max-w-2xl">
                            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight mb-6">Funcionalidades Poderosas.</h2>
                            <p className="text-xl text-gray-500">Ferramentas desenhadas para profundidade, clareza e ação.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {settings.features?.map((feat: any, idx: number) => {
                                const Icon = iconMap[feat.icon] || Star;
                                return (
                                    <div key={idx} className="bg-white border border-gray-200 rounded-md p-8 hover:border-black transition-colors duration-300">
                                        <div className="w-12 h-12 bg-black text-white rounded-md flex items-center justify-center mb-6">
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3">{feat.title}</h3>
                                        <p className="text-gray-500 font-medium leading-relaxed">{feat.description}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* METHODOLOGY - Dark Section for Contrast (OpenAI often alternates) */}
            <section className="py-32 bg-black text-white selection:bg-purple-900 selection:text-white">
                <div className="max-w-[1440px] mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
                    <div>
                        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 leading-tight">
                            Muito além de <br />
                            <span className="text-purple-500">um simples teste.</span>
                        </h2>
                        <p className="text-xl text-gray-400 mb-12 leading-relaxed max-w-lg">
                            Esqueça relatórios complexos. O TalkingTo transforma dados brutos do Big Five em insights acionáveis sobre sua carreira e vida.
                        </p>

                        <div className="space-y-8">
                            {[
                                { title: "Dicotomia 360", desc: "Mapa Visual de Competências" },
                                { title: "Análise de Facetas", desc: "Detalhe granular de cada traço de personalidade" },
                                { title: "Dicas de Desenvolvimento", desc: "Plano de ação personalizado baseado em seus gaps" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 border-l border-white/20 pl-6 hover:border-purple-500 transition-colors cursor-default">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                                        <p className="text-gray-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative border border-white/10 rounded-lg p-8 bg-white/5 backdrop-blur-sm">
                        {/* Mockup Illustration */}
                        <div className="space-y-6 opacity-80">
                            <div className="h-4 bg-white/10 rounded w-1/3 mb-8"></div>
                            <div className="space-y-3">
                                <div className="h-2 bg-white/5 rounded w-full"></div>
                                <div className="h-2 bg-white/5 rounded w-5/6"></div>
                                <div className="h-2 bg-white/5 rounded w-4/6"></div>
                            </div>
                            <div className="pt-8 grid grid-cols-2 gap-4">
                                <div className="h-24 bg-purple-900/40 rounded border border-purple-500/30"></div>
                                <div className="h-24 bg-white/5 rounded"></div>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-600 rounded-full blur-3xl opacity-50"></div>
                    </div>
                </div>
            </section>

            {/* PRICING - Clean Table */}
            {settings?.showPricing && (
                <section id="plans" className="py-32 bg-white">
                    <div className="max-w-[1440px] mx-auto px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-black">Planos Flexíveis</h2>
                            <p className="text-xl text-gray-500">Transparência total. Sem custos ocultos.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {settings.pricingPlans?.map((plan: any, idx: number) => (
                                <div
                                    key={plan.id}
                                    className={`relative p-8 rounded-lg border ${plan.highlighted ? 'border-black bg-slate-50 shadow-xl' : 'border-gray-200 bg-white'}`}
                                >
                                    {plan.highlighted && <div className="absolute top-0 right-0 bg-black text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>}

                                    <h3 className="text-xl font-bold text-black mb-2">{plan.name}</h3>
                                    <div className="mb-8">
                                        <span className="text-4xl font-bold tracking-tight">
                                            R$ {Number(String(plan.price).replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-gray-500 text-sm">/{plan.period === 'monthly' ? 'mês' : 'ano'}</span>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        {plan.features?.map((feature: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                                <CheckCircle size={16} className="mt-0.5 text-purple-600 shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href="/auth/register"
                                        className={`block w-full py-3 text-center rounded-md font-bold text-sm transition-all ${plan.highlighted
                                            ? 'bg-black text-white hover:bg-gray-800'
                                            : 'bg-white border border-gray-200 text-black hover:bg-gray-50'
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

            {/* FOOTER - Minimal */}
            <footer className="py-12 border-t border-gray-100 bg-white">
                <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center text-white font-bold text-xs">P</div>
                        <span className="font-bold text-lg tracking-tight">PINC.</span>
                    </div>
                    <div className="flex gap-8 text-sm text-gray-500 font-medium">
                        <Link href="#" className="hover:text-black">Termos</Link>
                        <Link href="#" className="hover:text-black">Privacidade</Link>
                        <Link href="#" className="hover:text-black">Contato</Link>
                    </div>
                    <div className="text-xs text-gray-400">
                        © 2025 Sued Inc.
                    </div>
                </div>
            </footer>

        </main>
    );
}

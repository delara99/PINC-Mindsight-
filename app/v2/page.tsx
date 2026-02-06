'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, BrainCircuit, ShieldCheck, CheckCircle,
    ArrowRight, Target, Grid3x3, Shield, FileText, Star, Loader2,
    Menu, X, Sparkles, Layers, Zap, Globe, MessageSquare, Layout, BarChart3, Bot
} from 'lucide-react';
import { API_URL } from '@/src/config/api';
import { useState } from 'react';

/**
 * 🎨 DESIGN COMMITMENT: SWISS PUNK / OPENAI-INSPIRED (V2 REFINED)
 * 
 * - **Refinements:** Removed "Version" pill. Centralized Pricing. Added Coach Section.
 * - **Footer:** Exact match of Production footer.
 * - **Coach Section:** Adapted to Swiss Style (Light Mode + High Contrast).
 */

// Icon mapping (Matches V1 FeaturesGrid)
const iconMap: any = {
    'target': Target,
    'grid': Grid3x3,
    'users': Users,
    'shield': Shield,
    'file-text': FileText,
    'star': Star,
    'check': CheckCircle,
    'brain': BrainCircuit,
    'zap': Zap,
    'layout': Layout,
    'chart': BarChart3,
    'message': MessageSquare
};

export default function HomeV2() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Fetch site settings
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

            {/* HEADER */}
            <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="PINC Logo" className="h-10 w-auto object-contain" />
                    </div>

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

            {/* HERO SECTION - Updated (Removed Pill) */}
            <section className="pt-32 pb-20 md:pt-52 md:pb-32 px-6 border-b border-gray-100">
                <div className="max-w-[1440px] mx-auto grid lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-7 space-y-8">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-black">
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

                    {/* Right Visual */}
                    <div className="lg:col-span-5 relative">
                        <div className="relative aspect-square md:aspect-[4/5] bg-slate-50 border border-gray-200 rounded-lg overflow-hidden">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                            <div className="absolute inset-0 flex items-center justify-center sh">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="w-64 bg-white border border-gray-200 rounded-md shadow-2xl p-6 relative z-10"
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
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TEASER */}
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

            {/* PINC COACH SECTION (NEW) - Swiss Style */}
            <section className="py-32 bg-white border-b border-gray-100 overflow-hidden relative">
                {/* Subtle BG Patter */}
                <div className="absolute top-0 right-0 opacity-5">
                    <Bot size={400} />
                </div>

                <div className="max-w-[1440px] mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
                    <div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 leading-tight">
                            PINC Coach. <br />
                            <span className="text-purple-600">Seu perfil, explicado.</span>
                        </h2>
                        <p className="text-lg md:text-xl text-gray-500 mb-8 leading-relaxed">
                            Não basta saber seu perfil. O diferencial é saber usar isso na prática.
                            A PINC Coach interpreta seu relatório com você, em tempo real, sem linguagem técnica.
                        </p>

                        <div className="space-y-4 mb-10">
                            {[
                                "Tire dúvidas sobre seu perfil 24h por dia",
                                "Melhore sua comunicação e tomada de decisão",
                                "Explicações diretas e acionáveis"
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 text-base md:text-lg font-medium text-gray-800">
                                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircle size={14} />
                                    </div>
                                    <span className="leading-tight">{item}</span>
                                </div>
                            ))}
                        </div>

                        <Link
                            href="/auth/register?plan=pro"
                            className="inline-flex items-center gap-2 border-b-2 border-black pb-1 text-lg font-bold hover:text-purple-600 hover:border-purple-600 transition-all"
                        >
                            Quero acesso à PINC Coach <ArrowRight size={18} />
                        </Link>
                    </div>

                    {/* Chat Simulation - V2 Style */}
                    <div className="relative mt-10 lg:mt-0">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 shadow-2xl skew-y-1 transform transition-all hover:skew-y-0 duration-500 max-w-md mx-auto lg:mx-0">
                            {/* Header */}
                            <div className="flex items-center gap-4 border-b border-gray-200 pb-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                                    <Bot size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-black text-lg">PINC Coach</h3>
                                    <p className="text-xs text-green-600 flex items-center gap-1 font-bold">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>

                            {/* Chat */}
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    <div className="bg-black text-white px-6 py-4 rounded-2xl rounded-tr-none max-w-[90%] text-sm font-medium">
                                        Tenho dificuldade em delegar... O que meu perfil diz?
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white border border-gray-200 text-gray-800 px-6 py-4 rounded-2xl rounded-tl-none max-w-[95%] text-sm shadow-sm">
                                        <p className="mb-3 font-medium">Você tem <strong>Conscienciosidade Alta (88)</strong>.</p>
                                        <p className="text-gray-500">Isso te torna um excelente executor, mas gera a crença de "se eu não fizer, sai errado".</p>

                                        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100 text-purple-900 text-xs font-bold flex gap-2 items-center">
                                            <Sparkles size={14} />
                                            Dica: Delegue o "resultado", não o "processo".
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* FEATURES GRID - Title Hardcoded but Cards Dynamic */}
            {settings?.showFeatures && (
                <section id="features" className="py-32 bg-slate-50 border-b border-gray-100">
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

            {/* METHODOLOGY */}
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

            {/* PRICING - Centralized */}
            {settings?.showPricing && (
                <section id="plans" className="py-32 bg-white">
                    <div className="max-w-[1440px] mx-auto px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-black">Planos Flexíveis</h2>
                            <p className="text-xl text-gray-500">Transparência total. Sem custos ocultos.</p>
                        </div>

                        {/* Flex Container for Centralizing */}
                        <div className="flex flex-wrap justify-center gap-8">
                            {settings.pricingPlans?.map((plan: any, idx: number) => (
                                <div
                                    key={plan.id}
                                    className={`relative p-8 rounded-lg border w-full md:w-[350px] ${plan.highlighted ? 'border-black bg-slate-50 shadow-xl' : 'border-gray-200 bg-white'}`}
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

            {/* FOOTER - Production Replica */}
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

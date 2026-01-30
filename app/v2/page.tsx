'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Play,
    Menu,
    X,
    Sparkles,
    BrainCircuit,
    Bot,
    Target,
    Users,
    Activity,
    Lock
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- COMPONENTS ---

// 1. NAVBAR
const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-[#8B1D98]/90 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/v2" className="flex items-center gap-2 group">
                    <img src="/logo.png" alt="PINC" className="h-10 w-auto brightness-0 invert" />
                    {/* Nota: Assumindo que o logo.png original precisa ser invertido para branco no fundo roxo, ou usamos CSS filter */}
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/90">
                    <Link href="#methodology" className="hover:text-white transition-colors">Metodologia</Link>
                    <Link href="#coach" className="hover:text-white transition-colors">PINC Coach</Link>
                    <Link href="#features" className="hover:text-white transition-colors">Recursos</Link>
                    <Link href="#pricing" className="hover:text-white transition-colors">Planos</Link>
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="/auth/login" className="text-white hover:text-white/80 text-sm font-bold">
                        Login
                    </Link>
                    <Link
                        href="/auth/register"
                        className="bg-white text-[#8B1D98] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-pink-50 transition-all hover:scale-105 shadow-lg"
                    >
                        Criar Conta
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-[#6a1575] border-b border-white/10 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6 text-white text-lg font-medium">
                            <Link href="#methodology" onClick={() => setIsOpen(false)}>Metodologia</Link>
                            <Link href="#coach" onClick={() => setIsOpen(false)}>PINC Coach</Link>
                            <Link href="#pricing" onClick={() => setIsOpen(false)}>Planos</Link>
                            <hr className="border-white/10" />
                            <Link href="/auth/login" className="opacity-80">Login</Link>
                            <Link href="/auth/register" className="bg-white text-[#8B1D98] text-center py-3 rounded-full font-bold">Começar Agora</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

// 2. HERO SECTION (Refined Option 1)
const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#8B1D98]">
            {/* Background Noise & Gradient */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-150 contrast-150 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-500 rounded-full mix-blend-screen filter blur-[128px] opacity-30"></div>

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10 text-white">
                <div className="space-y-8 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6 mx-auto lg:mx-0">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                            <span className="text-xs font-bold tracking-widest uppercase opacity-90">PINC Science</span>
                        </div>

                        <h1 className="font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-6">
                            Autoconhecimento <br />
                            <span className="text-white/70">transforma</span> a sua vida.
                        </h1>

                        <p className="text-lg md:text-xl text-pink-100/80 leading-relaxed font-medium max-w-lg mx-auto lg:mx-0 lg:border-l-2 lg:border-pink-400/50 lg:pl-6">
                            Aprenda a utilizar seus talentos naturais para melhorar seus relacionamentos e sua produtividade com a ciência do Big Five.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
                    >
                        <Link href="/auth/register" className="bg-white text-[#8B1D98] px-8 py-4 rounded-full font-bold text-lg hover:bg-pink-50 transition-all hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2">
                            Ver Degustação <ArrowRight size={20} />
                        </Link>
                        <Link href="#methodology" className="flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white font-bold hover:bg-white/10 transition-all">
                            <Play size={18} fill="currentColor" /> Como funciona
                        </Link>
                    </motion.div>

                    <div className="pt-4 flex items-center justify-center lg:justify-start gap-3 text-sm font-medium text-pink-200/60">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-white/20 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                                    {(i * 9) + 4}%
                                </div>
                            ))}
                        </div>
                        +2.000 perfis analisados hoje.
                    </div>
                </div>

                {/* Hero Visual - Floating Card */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="hidden lg:block relative perspective-1000"
                >
                    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl rotate-y-12 rotate-x-6 hover:rotate-0 transition-all duration-700 ease-out group">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 p-0.5">
                                <div className="w-full h-full bg-[#8B1D98] rounded-2xl flex items-center justify-center text-xl font-bold text-white">HD</div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white">Henrique De Lara</h3>
                                <p className="text-pink-200 font-medium">CEO Visionário</p>
                            </div>
                            <div className="ml-auto bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase border border-green-500/30">
                                Alta Performance
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-white/80">
                                    <span>Extroversão</span>
                                    <span>85%</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "85%" }}
                                        transition={{ delay: 1, duration: 1.5 }}
                                        className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full relative"
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </motion.div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-white/80">
                                    <span>Abertura</span>
                                    <span>92%</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "92%" }}
                                        transition={{ delay: 1.2, duration: 1.5 }}
                                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-bold text-white/80">
                                    <span>Conscienciosidade</span>
                                    <span>78%</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "78%" }}
                                        transition={{ delay: 1.4, duration: 1.5 }}
                                        className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -right-6 bg-white text-[#8B1D98] p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce-slow">
                            <div className="bg-pink-100 p-2 rounded-lg">
                                <Sparkles size={20} className="text-pink-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Match Cultural</p>
                                <p className="text-xl font-black">98%</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

// 3. METHODOLOGY (TalkingTo)
const Methodology = () => {
    return (
        <section id="methodology" className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                {/* Visual - Radar Chart */}
                <div className="order-2 md:order-1 relative flex justify-center">
                    <div className="w-full max-w-md aspect-square bg-slate-50 rounded-full border border-slate-100 p-8 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { subject: 'Abertura', A: 120, fullMark: 150 },
                                { subject: 'Conscienciosidade', A: 98, fullMark: 150 },
                                { subject: 'Extroversão', A: 86, fullMark: 150 },
                                { subject: 'Amabilidade', A: 99, fullMark: 150 },
                                { subject: 'Estabilidade', A: 85, fullMark: 150 },
                            ]}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="User" dataKey="A" stroke="#8B1D98" strokeWidth={3} fill="#8B1D98" fillOpacity={0.2} />
                            </RadarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm text-xs font-bold text-slate-600">
                                Seu DNA Comportamental
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="order-1 md:order-2 space-y-6">
                    <span className="text-pink-600 font-bold tracking-widest text-sm uppercase">Metodologia PINC</span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-[#8B1D98] leading-tight">
                        A Ciência por trás <br /> do seu potencial.
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        A PINC utiliza o modelo <strong>Big Five</strong> — o padrão ouro da psicologia mundial — para mapear sua personalidade. Mas não paramos aí.
                    </p>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Nossa tecnologia exclusiva <strong>TalkingTo™</strong> traduz gráficos complexos em uma narrativa humana, clara e acionável sobre quem você realmente é.
                    </p>

                    <div className="grid grid-cols-2 gap-6 pt-6">
                        {[
                            { icon: BrainCircuit, title: "Sem Achismos", desc: "Dados científicos, não horóscopo." },
                            { icon: Target, title: "Prático", desc: "Aplique no seu trabalho amanhã." }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                                    <item.icon size={20} />
                                </div>
                                <h4 className="font-bold text-slate-900">{item.title}</h4>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// 4. PINC COACH (IA)
const PincCoach = () => {
    return (
        <section id="coach" className="py-24 bg-slate-900 overflow-hidden relative">
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/40 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-900/40 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
            </div>

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="space-y-8">
                    <span className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-500/30">
                        <Sparkles size={14} /> Novo: Exclusivo no Plano Pro
                    </span>

                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                        Sua Coach Pessoal <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            Disponível 24/7.
                        </span>
                    </h2>

                    <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                        Dúvidas sobre como lidar com um chefe difícil? Ou como se preparar para uma reunião?
                        A <strong>PINC Coach IA</strong> conhece seu perfil a fundo e te dá conselhos personalizados em tempo real.
                    </p>

                    <ul className="space-y-4">
                        {["Conselhos baseados no seu Big Five", "Privativo e seguro", "Melhora sua tomada de decisão"].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-white">
                                <CheckCircle2 size={20} className="text-green-400" />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-purple-50 transition-colors">
                        Testar PINC Coach <ArrowRight size={18} />
                    </Link>
                </div>

                {/* Chat UI */}
                <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white">Dra. PINC</h4>
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online
                            </span>
                        </div>
                    </div>
                    <div className="space-y-4 font-sans text-sm">
                        <div className="flex justify-end">
                            <div className="bg-purple-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                                Sinto que procrastino muito. O que meu perfil diz sobre isso?
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <div className="bg-slate-700 text-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] space-y-2">
                                <p>Olhando seu perfil, sua <strong>Conscienciosidade</strong> é moderada, mas sua <strong>Abertura</strong> é muito alta.</p>
                                <p>Isso significa que você não procrastina por preguiça, mas porque <strong>se distrai com novas ideias</strong> o tempo todo.</p>
                                <p className="text-purple-300 font-bold">💡 Tente a técnica Pomodoro para focar em uma ideia de cada vez.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// 5. PRICING
const Pricing = () => {
    return (
        <section id="pricing" className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <h2 className="text-4xl font-extrabold text-[#8B1D98] mb-4">Invista em você</h2>
                    <p className="text-slate-500 text-lg">
                        Custo menor que uma pizza. Retorno para a vida toda.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Basic Plan */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-lg hover:shadow-xl transition-all">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Relatório Essencial</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-sm font-bold text-slate-400">R$</span>
                            <span className="text-4xl font-black text-slate-900">29,90</span>
                            <span className="text-sm text-slate-400">/único</span>
                        </div>
                        <ul className="space-y-4 mb-8 text-sm text-slate-600">
                            <li className="flex gap-3"><CheckCircle2 className="text-green-500 shrink-0" size={18} /> Gráfico Big Five Completo</li>
                            <li className="flex gap-3"><CheckCircle2 className="text-green-500 shrink-0" size={18} /> Resumo dos 5 Traços</li>
                            <li className="flex gap-3"><CheckCircle2 className="text-green-500 shrink-0" size={18} /> Acesso Vitalício</li>
                        </ul>
                        <Link href="/auth/register" className="block w-full py-4 rounded-xl border-2 border-slate-100 text-slate-900 font-bold text-center hover:bg-slate-50 transition-colors">
                            Começar Básico
                        </Link>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-[#1f1f2e] text-white rounded-[2rem] p-8 border border-purple-500/30 shadow-2xl relative overflow-hidden transform md:-translate-y-4 hover:scale-[1.02] transition-transform">
                        <div className="absolute top-0 right-0 bg-purple-500 text-xs font-bold px-3 py-1 rounded-bl-xl text-white">RECOMENDADO</div>
                        <h3 className="text-xl font-bold text-white mb-2">PINC Professional</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-sm font-bold text-purple-300">R$</span>
                            <span className="text-4xl font-black text-white">97,00</span>
                            <span className="text-sm text-purple-300">/único</span>
                        </div>
                        <ul className="space-y-4 mb-8 text-sm text-gray-300">
                            <li className="flex gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={18} /> <strong>Relatório Completo (50+ págs)</strong></li>
                            <li className="flex gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={18} /> Análise de Competências</li>
                            <li className="flex gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={18} /> Dicas de Carreira & Liderança</li>
                            <li className="flex gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={18} /> <span className="text-white font-bold">Acesso ao PINC Coach IA</span></li>
                        </ul>
                        <Link href="/auth/register?plan=pro" className="block w-full py-4 rounded-xl bg-purple-600 text-white font-bold text-center hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/50">
                            Liberar Acesso Completo
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

// 6. FOOTER (Minimal Recreate)
const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-100 py-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-6 md:flex-row md:justify-between text-center md:text-left">

                {/* Logo & Copyright */}
                <div className="flex flex-col items-center md:items-start gap-2">
                    <img src="/logo.png" alt="PINC" className="h-8 w-auto mix-blend-multiply opacity-80" />
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                        © 2025 Sued Inc. Todos os direitos reservados.
                    </p>
                </div>

                {/* Disclaimer */}
                <div className="max-w-md">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        O PINC é uma ferramenta de autoconhecimento e desenvolvimento. Os relatórios gerados não substituem avaliações psicológicas clínicas ou acompanhamento profissional especializado quando necessário.
                    </p>
                </div>

            </div>
        </footer>
    );
};

// --- MAIN PAGE ---
export default function PageV2() {
    return (
        <main className="font-sans antialiased text-slate-900 bg-white selection:bg-purple-100 selection:text-purple-900">
            <Navbar />
            <Hero />
            <Methodology />
            <PincCoach />
            <Pricing />
            <Footer />
        </main>
    );
}

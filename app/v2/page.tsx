'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    BrainCircuit,
    Target,
    Users,
    Zap,
    CheckCircle2,
    Menu,
    X,
    Sparkles,
    Globe,
    ChevronRight,
    Play,
    Pause
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- COMPONENTS ---

const NavbarV2 = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-white/20 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl leading-none">P</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">PINC</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <Link href="#solutions" className="hover:text-black transition-colors">Soluções</Link>
                    <Link href="#methodology" className="hover:text-black transition-colors">Ciência</Link>
                    <Link href="#pricing" className="hover:text-black transition-colors">Preços</Link>
                    <Link href="/auth/login" className="hover:text-black transition-colors">Login</Link>
                    <Link
                        href="/auth/register"
                        className="bg-black text-white px-5 py-2.5 rounded-full font-bold hover:bg-slate-800 transition-all hover:scale-105"
                    >
                        Começar Agora
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b absolute w-full overflow-hidden"
                    >
                        <div className="px-6 py-6 flex flex-col gap-4">
                            <Link href="#solutions" className="text-lg font-medium">Soluções</Link>
                            <Link href="#methodology" className="text-lg font-medium">Ciência</Link>
                            <Link href="#pricing" className="text-lg font-medium">Preços</Link>
                            <hr />
                            <Link href="/auth/login" className="text-lg font-medium">Login</Link>
                            <Link href="/auth/register" className="bg-black text-white text-center py-3 rounded-xl font-bold">Começar Agora</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

const HeroV2 = () => {
    return (
        <section className="relative min-h-screen pt-32 pb-20 overflow-hidden bg-slate-50 flex flex-col justify-center">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-yellow-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nova Era do RH</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900">
                            DECODIFIQUE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 animate-gradient-x">
                                PESSOAS
                            </span>.
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-lg font-medium">
                            Não contrate currículos. Contrate potencial.
                            A plataforma de People Analytics que revela o invisível.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link
                                href="/auth/register"
                                className="group flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-2xl text-lg font-bold hover:scale-105 transition-transform shadow-xl shadow-black/10"
                            >
                                Testar Grátis
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#demo"
                                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                <Play size={20} fill="currentColor" className="text-slate-900" />
                                Ver Demo
                            </Link>
                        </div>

                        <div className="pt-8 flex items-center gap-4 text-sm font-semibold text-slate-500">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <p>Usado por +500 empresas inovadoras</p>
                        </div>
                    </div>

                    {/* INTERACTIVE BENTO GRID VISUAL */}
                    <div className="relative perspective-1000">
                        <div className="grid grid-cols-2 gap-4 auto-rows-[200px] md:auto-rows-[240px]">
                            {/* Card 1: Radar Chart (Big) */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="col-span-2 row-span-2 bg-white rounded-3xl p-6 shadow-2xl shadow-indigo-500/10 border border-indigo-50 flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-2xl text-slate-900">Perfil Comportamental</h3>
                                        <p className="text-slate-500">Análise Big Five</p>
                                    </div>
                                    <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">Alta Performance</div>
                                </div>
                                <div className="flex-1 w-full h-full min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                            { subject: 'Abertura', A: 120, fullMark: 150 },
                                            { subject: 'Conscienciosidade', A: 98, fullMark: 150 },
                                            { subject: 'Extroversão', A: 86, fullMark: 150 },
                                            { subject: 'Amabilidade', A: 99, fullMark: 150 },
                                            { subject: 'Estabilidade', A: 85, fullMark: 150 },
                                        ]}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                            <Radar name="Candidate" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.3} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Card 2: Match Score */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="col-span-1 bg-[#111] text-white rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                <Target className="text-white/50" />
                                <div>
                                    <div className="text-4xl font-black mb-1">98%</div>
                                    <div className="text-sm text-white/70 font-medium">Culture Fit</div>
                                </div>
                            </motion.div>

                            {/* Card 3: Soft Skills */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="col-span-1 bg-lime-400 rounded-3xl p-6 flex flex-col justify-between"
                            >
                                <BrainCircuit className="text-slate-900 opacity-60" />
                                <div>
                                    <div className="flex gap-1 mb-2">
                                        <StarRating stars={5} />
                                    </div>
                                    <div className="text-lg font-bold text-slate-900 leading-tight">Liderança <br />Natural</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const StarRating = ({ stars }: { stars: number }) => (
    <>
        {[...Array(stars)].map((_, i) => (
            <svg key={i} className="w-4 h-4 fill-slate-900" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </>
);

const FeatureMarquee = () => {
    return (
        <div className="py-10 bg-white border-y border-slate-100 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

            <div className="flex items-center gap-16 animate-marquee whitespace-nowrap opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Repeat content to ensure seamless loop */}
                {[...Array(2)].map((_, i) => (
                    <React.Fragment key={i}>
                        <div className="text-2xl font-bold flex items-center gap-2"><Globe className="w-6 h-6" /> RemoteFirst</div>
                        <div className="text-2xl font-bold flex items-center gap-2"><Zap className="w-6 h-6" /> AgileTeams</div>
                        <div className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> CultureMatch</div>
                        <div className="text-2xl font-bold flex items-center gap-2"><BrainCircuit className="w-6 h-6" /> NeuroScience</div>
                        <div className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6" /> HighPerformance</div>
                        <div className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6" /> A.I.Powered</div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

// ... CSS for marquee would be needed in globals or style tag. 
// Adding style tag for demo purposes.
const MarqueeStyle = () => (
    <style jsx global>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            animation: marquee 30s linear infinite;
        }
        .animate-blob {
            animation: blob 7s infinite;
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
        .animation-delay-4000 {
            animation-delay: 4s;
        }
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes gradient-x {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 15s ease infinite;
        }
    `}</style>
);

const BentoFeatures = () => {
    return (
        <section className="py-32 px-6 bg-white" id="solutions">
            <div className="max-w-7xl mx-auto">
                <div className="mb-20 max-w-2xl">
                    <h2 className="text-5xl font-bold tracking-tight mb-6 text-slate-900">Muito mais que um teste de personalidade.</h2>
                    <p className="text-xl text-slate-500">
                        Nossa IA analisa mais de 50 pontos de dados para criar predições precisas sobre comportamento, motivação e fit cultural.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 auto-rows-[400px]">
                    {/* Feature 1: Recruitment (Large) */}
                    <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 md:p-12 relative overflow-hidden group border border-slate-100 transition-all hover:shadow-xl hover:border-slate-300">
                        <div className="relative z-10 max-w-sm">
                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-6">
                                <Users size={24} />
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Recrutamento Preditivo</h3>
                            <p className="text-slate-600 text-lg">Pare de adivinhar. Use dados para saber quem vai performar melhor e ficar mais tempo.</p>
                        </div>
                        <img
                            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2940&auto=format&fit=crop"
                            alt="Meeting"
                            className="absolute right-0 bottom-0 w-1/2 h-full object-cover rounded-tl-3xl opacity-80 group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    {/* Feature 2: Development (Tall) */}
                    <div className="md:row-span-2 bg-black text-white rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-violet-600 blur-[100px] opacity-40"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur text-white rounded-xl flex items-center justify-center mb-6">
                                <BrainCircuit size={24} />
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Mindsight AI Trainer</h3>
                            <p className="text-slate-400 text-lg mb-8">Um coach virtual personalizado para cada colaborador, baseado em seus gaps.</p>

                            {/* Chat Sim */}
                            <div className="space-y-4">
                                <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none">
                                    <p className="text-xs text-white/50 mb-1">Mindsight AI</p>
                                    <p className="text-sm">Notei que sua Amabilidade está baixa hoje. Tente focar em escuta ativa na reunião das 14h.</p>
                                </div>
                                <div className="bg-violet-600 p-4 rounded-2xl rounded-tr-none ml-8">
                                    <p className="text-sm">Ótima dica! Como posso praticar isso?</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3: Analytics (Small) */}
                    <div className="bg-violet-50 rounded-3xl p-8 border border-violet-100 flex flex-col justify-center items-center text-center group hover:bg-violet-100 transition-colors">
                        <div className="w-16 h-16 bg-violet-200 text-violet-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Target size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-violet-900">Team Analytics</h3>
                        <p className="text-violet-700 mt-2">Equacione seus times para máxima sinergia.</p>
                    </div>

                    {/* Feature 4: Safety (Small) */}
                    <div className="bg-orange-50 rounded-3xl p-8 border border-orange-100 flex flex-col justify-center items-center text-center group hover:bg-orange-100 transition-colors">
                        <div className="w-16 h-16 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-orange-900">Turnover Risk</h3>
                        <p className="text-orange-700 mt-2">Identifique riscos de saída antes que aconteçam.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const CtaSection = () => (
    <section className="py-20 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8">
                Pronto para ver o <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                    invisível?
                </span>
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                Junte-se a 500+ empresas que transformaram sua gestão de pessoas com dados reais.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                    href="/auth/register"
                    className="bg-green-500 hover:bg-green-400 text-black px-10 py-5 rounded-2xl text-xl font-bold transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(74,222,128,0.5)]"
                >
                    Criar Conta Grátis
                </Link>
                <Link
                    href="/contact"
                    className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-10 py-5 rounded-2xl text-xl font-bold transition-all"
                >
                    Falar com Vendas
                </Link>
            </div>
        </div>
    </section>
);

const FooterV2 = () => (
    <footer className="bg-white py-12 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs font-bold">P</div>
                <span className="font-bold text-slate-900">PINC</span>
            </div>
            <p className="text-slate-400 text-sm">© 2025 Sued Inc. Science of Human Potential.</p>
            <div className="flex gap-6 text-slate-500 text-sm font-medium">
                <Link href="#" className="hover:text-black">Privacy</Link>
                <Link href="#" className="hover:text-black">Terms</Link>
                <Link href="#" className="hover:text-black">Twitter</Link>
            </div>
        </div>
    </footer>
);

export default function HomeV2() {
    return (
        <main className="font-sans text-slate-900 selection:bg-green-200">
            <MarqueeStyle />
            <NavbarV2 />
            <HeroV2 />
            <FeatureMarquee />
            <BentoFeatures />
            <CtaSection />
            <FooterV2 />
        </main>
    );
}

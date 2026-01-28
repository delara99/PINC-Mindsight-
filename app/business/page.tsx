'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, BarChart3, Users, ShieldCheck, Home, Menu, X, LogIn } from 'lucide-react';
import LeadFormModal from '../../src/components/business/LeadFormModal';

export default function BusinessLandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* HEADER */}
            <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image src="/pinc-logo.png" alt="PINC" width={80} height={30} className="object-contain w-16 md:w-20" />
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider border-l border-slate-300 pl-2">Business</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#solucoes" className="hover:text-purple-700 transition-colors">Soluções</a>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-slate-100 text-slate-900 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                        >
                            Fale com um especialista
                        </button>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-purple-700 px-3 py-2 transition-all">
                            <Home size={16} />
                            Home
                        </Link>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <Link href="/business/login?tab=candidate" className="text-sm font-bold text-slate-700 hover:text-purple-700 px-3 py-2">
                            Sou Candidato
                        </Link>
                        <Link href="/business/login?tab=company" className="bg-slate-900 hover:bg-purple-900 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
                            <LogIn size={14} />
                            Acesso RH
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={toggleMenu}
                        aria-label="Menu"
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-2xl py-6 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 z-40 h-[calc(100vh-64px)] overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Navegação</p>
                                <a href="#solucoes" onClick={toggleMenu} className="block px-4 py-3 text-lg font-medium text-slate-700 hover:bg-slate-50 rounded-xl">Soluções</a>
                                <button
                                    onClick={() => { toggleMenu(); setIsFormOpen(true); }}
                                    className="block w-full text-left px-4 py-3 text-lg font-bold text-purple-700 hover:bg-purple-50 rounded-xl"
                                >
                                    Fale com um especialista
                                </button>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-3">
                                <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl border border-slate-100">
                                    <Home size={18} className="text-purple-600" />
                                    Voltar para Site Principal
                                </Link>

                                <Link href="/business/login?tab=candidate" className="flex items-center gap-3 px-4 py-3 text-slate-700 font-bold hover:bg-slate-50 rounded-xl border border-slate-100">
                                    <Users size={18} className="text-purple-600" />
                                    Área do Candidato
                                </Link>

                                <Link href="/business/login?tab=company" onClick={toggleMenu} className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-4 rounded-xl text-base font-bold shadow-lg active:scale-95 transition-transform mt-4">
                                    Acessar Portal RH <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* HERO SECTION */}
            <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-6 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-100/50 skew-x-12 translate-x-32 hidden md:block"></div>

                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center relative z-10">
                    <div className="order-2 md:order-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest mb-6 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                            Solução Corporativa v2.0
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                            Decisões de gente baseadas em <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">dados.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-8 md:mb-10 max-w-lg">
                            Mapeie a cultura da sua empresa e descubra talentos ocultos com o motor comportamental mais avançado do mercado.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/business/login" className="inline-flex justify-center items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto">
                                Começar Agora <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500 flex-shrink-0" /> Compliance LGPD</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500 flex-shrink-0" /> Big Five Validado</div>
                        </div>
                    </div>

                    {/* Visual Section - Hidden on very small screens if needed, or adjusted */}
                    <div className="relative order-1 md:order-2 mb-8 md:mb-0">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-3xl blur-2xl"></div>
                        <div className="bg-white border border-slate-100 p-2 rounded-2xl shadow-2xl relative">
                            {/* Abstract UI Representation */}
                            <div className="aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                                <div className="absolute top-0 left-0 right-0 h-8 md:h-10 bg-white border-b border-slate-100 flex items-center px-4 gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                </div>
                                <div className="p-4 md:p-8 mt-4 grid grid-cols-2 gap-3 md:gap-4 h-full content-center">
                                    <div className="bg-white p-2 md:p-4 rounded-lg shadow-sm border border-slate-100 h-24 md:h-32 w-full animate-pulse opacity-80"></div>
                                    <div className="bg-white p-2 md:p-4 rounded-lg shadow-sm border border-slate-100 h-24 md:h-32 w-full animate-pulse opacity-60"></div>
                                    <div className="bg-white p-2 md:p-4 rounded-lg shadow-sm border border-slate-100 col-span-2 h-28 md:h-40 w-full animate-pulse opacity-40"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="py-16 md:py-24 bg-white" id="solucoes">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Potência analítica para o RH</h2>
                        <p className="text-lg text-slate-600">Esqueça os testes convencionais. O PINC entrega profundidade clínica com usabilidade corporativa.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        <div className="group p-6 md:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">People Analytics Real</h3>
                            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                                Dashboards consolidados que mostram não apenas quem são seus colaboradores, mas como eles interagem e perfomam juntos.
                            </p>
                        </div>
                        <div className="group p-6 md:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Mapping de Cultura</h3>
                            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                                Entenda o DNA comportamental de cada time. Identifique gaps de competência e riscos de turnover antes que aconteçam.
                            </p>
                        </div>
                        <div className="group p-6 md:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Segurança Enterprise</h3>
                            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                                Controle de acesso granular, logs de auditoria e conformidade total com LGPD. Seus dados corporativos blindados.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="py-16 md:py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black mb-6 md:mb-8 tracking-tight">Pronto para transformar seu RH?</h2>
                    <p className="text-lg md:text-xl text-slate-400 mb-8 md:mb-10 max-w-2xl mx-auto">
                        Junte-se a empresas que usam dados comportamentais para construir equipes de alta performance.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/business/login" className="bg-white text-slate-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-white/20 w-full sm:w-auto block">
                            Acessar Plataforma
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="bg-white border-t border-slate-100 py-8 md:py-12">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm">© {new Date().getFullYear()} PINC Business. Todos os direitos reservados.</p>
                </div>
            </footer>

            <LeadFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
        </div>
    );
}


import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, BarChart3, Users, Lock, ShieldCheck } from 'lucide-react';

export default function BusinessLandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* HERDER */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Logo Placeholder - PINC */}
                        <div className="bg-slate-900 text-white p-1 rounded font-bold text-xl tracking-tight">PINC</div>
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-l border-slate-300 pl-3 ml-2">Business</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <a href="#solucoes" className="hover:text-slate-900 transition-colors">Soluções</a>
                        <a href="#metodologia" className="hover:text-slate-900 transition-colors">Metodologia</a>
                        <a href="#planos" className="hover:text-slate-900 transition-colors">Planos Enterprise</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/business/login" className="text-sm font-bold text-slate-700 hover:text-slate-900 px-4 py-2">
                            Área do Candidato
                        </Link>
                        <Link href="/business/login" className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            Acesso RH
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="pt-32 pb-24 px-6 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-100/50 skew-x-12 translate-x-32"></div>

                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-widest mb-6 border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                            Solução Corporativa v2.0
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                            Decisões de gente baseadas em <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">ciência de dados.</span>
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed mb-10 max-w-lg">
                            Mapeie a cultura da sua empresa e descubra talentos ocultos com o motor de avaliação comportamental mais avançado do mercado.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/business/login" className="inline-flex justify-center items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                                Começar Agora <ArrowRight size={18} />
                            </Link>
                            <a href="#demo" className="inline-flex justify-center items-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all">
                                Agendar Demo
                            </a>
                        </div>
                        <div className="mt-10 flex items-center gap-6 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Compliance LGPD</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Big Five Validado</div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-3xl blur-2xl"></div>
                        <div className="bg-white border border-slate-100 p-2 rounded-2xl shadow-2xl relative">
                            {/* Abstract UI Representation */}
                            <div className="aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
                                <div className="absolute top-0 left-0 right-0 h-10 bg-white border-b border-slate-100 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="p-8 mt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 h-32"></div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 h-32"></div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 col-span-2 h-40"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="py-24 bg-white" id="solucoes">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Potência analítica para o RH</h2>
                        <p className="text-lg text-slate-600">Esqueça os testes de perfil convencionais. O PINC entrega profundidade clínica com usabilidade corporativa.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                                <BarChart3 size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">People Analytics Real</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Dashboards consolidados que mostram não apenas quem são seus colaboradores, mas como eles interagem e perfomam juntos.
                            </p>
                        </div>
                        <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
                                <Users size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Mapping de Cultura</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Entenda o DNA comportamental de cada time. Identifique gaps de competência e riscos de turnover antes que aconteçam.
                            </p>
                        </div>
                        <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 transition-all hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Segurança Enterprise</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Controle de acesso granular, logs de auditoria e conformidade total com LGPD. Seus dados corporativos blindados.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Pronto para transformar seu RH?</h2>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Junte-se a empresas que usam dados comportamentais para construir equipes de alta performance.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/business/login" className="bg-white text-slate-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-white/20">
                            Acessar Plataforma
                        </Link>
                        <button className="bg-transparent border border-slate-700 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all">
                            Falar com Consultor
                        </button>
                    </div>
                </div>
            </section>

            <footer className="bg-white border-t border-slate-100 py-12">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm">© {new Date().getFullYear()} PINC Business. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}

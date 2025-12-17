'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle, ArrowRight, Target, FileText, Loader2 } from 'lucide-react';
import { API_URL } from '@/src/config/api';

export default function Home() {
    // Fetch site settings
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

    return (
        <main className="min-h-screen bg-white text-gray-800 font-sans">

            {/* HEADER */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img src="/logo-pinc.png" alt="PINC Logo" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
                        <Link href="#relatorios" className="hover:text-primary transition-colors">Relatórios</Link>
                        <Link href="#conexoes" className="hover:text-primary transition-colors">Conexões</Link>
                        <Link href="#comparacao" className="hover:text-primary transition-colors">Comparação</Link>
                        <Link href="#plans" className="hover:text-primary transition-colors">Planos</Link>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login" className="text-sm font-semibold text-gray-700 hover:text-primary transition-colors">
                            Entrar
                        </Link>
                        <Link
                            href="/auth/register"
                            className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-full text-sm transition-all hover:scale-105 shadow-lg shadow-primary/20"
                        >
                            Começar Agora
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="pt-32 pb-24 relative overflow-hidden bg-gradient-to-br from-[#8F088F] to-[#5e055e] text-white">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 transform origin-bottom translate-x-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 blur-3xl rounded-full mix-blend-overlay" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-fade-in-up">
                        <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                        Tecnologia Big Five
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-8 max-w-4xl tracking-tight">
                        Muito mais que um teste: <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                            uma análise completa de quem você é.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-indigo-100 leading-relaxed max-w-2xl mb-10">
                        Entenda seu perfil comportamental, melhore seus relacionamentos e descubra seus pontos fortes com nossa tecnologia baseada em dados.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link
                            href="/trial"
                            className="flex items-center justify-center gap-2 bg-secondary text-gray-900 text-lg font-bold py-4 px-10 rounded-full shadow-xl shadow-secondary/20 transition-all hover:scale-105 hover:bg-white"
                        >
                            Fazer Análise Gratuita <ArrowRight size={20} />
                        </Link>
                        <Link
                            href="#relatorios"
                            className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-lg font-bold py-4 px-10 rounded-full transition-all hover:bg-white/20"
                        >
                            Ver Funcionalidades
                        </Link>
                    </div>

                    {/* Dashboard Preview (Floating) */}
                    <div className="mt-20 -mb-40 relative max-w-5xl w-full mx-auto">
                        <div className="absolute inset-0 bg-secondary/20 blur-3xl rounded-full transform scale-75" />
                        <img 
                            src="/feature-dashboard.png" 
                            alt="Dashboard Preview" 
                            className="relative rounded-2xl shadow-2xl border-4 border-white/10 w-full hover:scale-[1.01] transition-transform duration-700" 
                        />
                    </div>
                </div>
            </section>

            {/* SPACER FOR FLOATING IMAGE */}
            <div className="h-32 bg-white" />

            {/* FEATURE 1: RELATÓRIOS (Text Left, Image Right) */}
            <section id="relatorios" className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 space-y-8">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-primary">
                                <FileText size={24} className="stroke-[3]" />
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                Seu Manual de <br /> Instruções Pessoal
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Chega de gráficos complexos sem explicação. Receba uma análise detalhada sobre como você funciona, seus drivers motivacionais e onde você pode evoluir.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Análise detalhada por competência',
                                    'Pontos fortes e de atenção',
                                    'Dicas práticas de desenvolvimento'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                            <CheckCircle size={14} strokeWidth={3} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="order-1 lg:order-2 relative">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-50 to-pink-50 rounded-full blur-3xl opacity-70" />
                            <img 
                                src="/feature-report-bars.png" 
                                alt="Relatório de Barras" 
                                className="relative rounded-2xl shadow-2xl border border-gray-100 rotate-2 hover:rotate-0 transition-transform duration-500" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURE 2: CONEXÕES (Image Left, Text Right) */}
            <section id="conexoes" className="py-24 bg-gray-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-bl from-purple-100 to-indigo-100 rounded-full blur-3xl opacity-70" />
                            <img 
                                src="/feature-connections.png" 
                                alt="Minhas Conexões" 
                                className="relative rounded-2xl shadow-2xl border border-gray-200 -rotate-2 hover:rotate-0 transition-transform duration-500" 
                            />
                        </div>
                        <div className="space-y-8">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                                <Users size={24} className="stroke-[3]" />
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                Conecte-se de <br /> verdade
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Convide amigos, parceiros ou colegas de trabalho. Crie um espaço seguro para compartilhar resultados, trocar percepções e crescerem juntos.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Convide ilimitadas pessoas',
                                    'Controle total de privacidade',
                                    'Feed de atualizações de perfil'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                            <CheckCircle size={14} strokeWidth={3} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURE 3: COMPARAÇÃO (Text Left, Image Right) */}
            <section id="comparacao" className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 space-y-8">
                            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
                                <Target size={24} className="stroke-[3]" />
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                Entenda a dinâmica <br /> dos seus relacionamentos
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Descubra por que você tem afinidade com alguns e atritos com outros. Nossa ferramenta cruza perfis para revelar a sintonia e como melhorar a convivência.
                            </p>
                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                <p className="text-orange-800 font-medium italic">
                                    "A funcionalidade de comparação salvou nossa comunicação no time."
                                </p>
                                <p className="text-orange-600 text-sm mt-2 font-bold">- Usuário Beta</p>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 relative">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-pink-50 to-orange-50 rounded-full blur-3xl opacity-70" />
                            <img 
                                src="/feature-report-radar.png" 
                                alt="Comparação de Perfis" 
                                className="relative rounded-2xl shadow-2xl border border-gray-100 rotate-1 hover:rotate-0 transition-transform duration-500 bg-white" 
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            {settings?.showPricing && settings?.pricingPlans?.length > 0 && (
                <section id="plans" className="py-24 bg-gray-900 text-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-extrabold mb-4">Escolha sua Jornada</h2>
                            <p className="text-lg text-gray-400">Planos flexíveis para você ou sua empresa.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-8">
                            {settings.pricingPlans.map((plan: any) => (
                                <div
                                    key={plan.id}
                                    className={`rounded-2xl p-8 border-2 w-full max-w-sm transition-all duration-300 ${plan.highlighted 
                                        ? 'border-secondary bg-white/10 backdrop-blur-sm shadow-2xl scale-105' 
                                        : 'border-gray-800 bg-white/5'}`}
                                >
                                    {plan.highlighted && (
                                        <div className="bg-secondary text-gray-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                                            RECOMENDADO
                                        </div>
                                    )}
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-extrabold">
                                            {plan.currency} {Number(String(plan.price).replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-gray-400">/{plan.period}</span>
                                    </div>
                                    <ul className="space-y-4 mb-8">
                                        {plan.features?.map((feat: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <CheckCircle className="text-secondary flex-shrink-0 mt-0.5" size={18} />
                                                <span className="text-gray-300">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/auth/register"
                                        className={`block w-full text-center py-4 px-6 rounded-full font-bold transition-all hover:scale-[1.02] ${plan.highlighted
                                            ? 'bg-secondary text-gray-900 hover:bg-white'
                                            : 'bg-white/10 text-white hover:bg-white/20'
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
            <footer className="bg-black text-white py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo-pinc.png" alt="Logo" className="h-8 opacity-80 grayscale hover:grayscale-0 transition-all" />
                        <span className="text-gray-500 text-sm">© 2024 PINC Mindsight</span>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-400">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacidade</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contato</Link>
                    </div>
                </div>
            </footer>

        </main>
    );
}
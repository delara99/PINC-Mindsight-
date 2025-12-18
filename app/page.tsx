'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, BrainCircuit, ShieldCheck, CheckCircle, ArrowRight, Target, Grid3x3, Shield, FileText, Star, Loader2 } from 'lucide-react';
import { MethodologySection } from '@/src/components/landing/methodology-section';
import { FeaturesGrid } from '@/src/components/landing/features-grid';
import { API_URL } from '@/src/config/api';

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
            <header className="fixed top-0 w-full z-50 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="PINC Logo" className="h-12 w-auto object-contain" />
                    </div>
                    <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
                        <Link href="#features" className="hover:text-primary transition-colors">Funcionalidades</Link>
                        <Link href="/business" className="hover:text-primary transition-colors font-semibold text-primary">Para Empresas</Link>
                        <Link href="#plans" className="hover:text-primary transition-colors">Planos</Link>
                        <Link href="/about" className="hover:text-primary transition-colors">Sobre</Link>
                    </nav>
                    <div className="flex items-center gap-4">
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
                </div>
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
                        {settings?.heroBadge && (
                            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                                {settings.heroBadge}
                            </div>
                        )}
                        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight" style={{ color: settings?.heroTextColor || '#FFFFFF' }}>
                            {settings?.heroTitle || 'Descubra os Talentos'} <br />
                            <span style={{ color: settings?.accentColor || '#FFC107' }}>{settings?.heroSubtitle || 'Ocultos na Sua Equipe'}</span>
                        </h1>
                        <p className="text-lg opacity-90 leading-relaxed max-w-lg" style={{ color: settings?.heroTextColor || '#FFFFFF' }}>
                            {settings?.heroDescription || 'A ferramenta definitiva baseada no Big Five para mapeamento de perfil comportamental e inteligência organizacional.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link
                                href="/trial"
                                className="flex items-center justify-center gap-2 text-lg font-bold py-4 px-8 rounded-full shadow-xl transition-all hover:translate-y-[-2px]"
                                style={{
                                    backgroundColor: settings?.accentColor || '#FFC107',
                                    color: '#000'
                                }}
                            >
                                {settings?.primaryButtonText || 'Ver Degustação'} <ArrowRight size={20} />
                            </Link>
                            {/* Button removed as per user request */}
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

            {/* METHODOLOGY SHOWCASE */}
            <MethodologySection />

            {/* FEATURES SECTION - DYNAMIC */}
            {settings?.showFeatures && settings?.features?.length > 0 && (
                <FeaturesGrid features={settings.features} />
            )}

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
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <img src="/logo.png" alt="PINC Logo" className="h-12 w-auto" />
                        <p className="text-gray-900 font-medium">
                            PINC By Sued.Inc - 2025 - CNPJ: 57.810.083/0001-00
                        </p>
                    </div>
                </div>
            </footer>

        </main>
    );
}
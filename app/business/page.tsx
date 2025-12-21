'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LeadFormModal } from '../../src/components/business/LeadFormModal';
import { ArrowRight, Check, BarChart, Users, Brain, Target, Shield, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../../src/config/api';

export default function BusinessPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    const openForm = () => setIsFormOpen(true);

    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings`);
            if (!res.ok) return null;
            return res.json();
        }
    });

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Navbar Replacement (or assumes Layout wrapper) - For standalone page look */}
            {/* We will assume it's wrapped in the main RootLayout which has the Navbar. 
                We might need to adjust the Navbar to be 'sticky' or transparent if desired, 
                but for now we stick to the content. */}

            <LeadFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

            {/* Hero Section */}
            <section
                className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden"
                style={{ background: `linear-gradient(to bottom, ${settings?.businessHeroBgColor || '#f0f9ff'} 0%, #ffffff 100%)` }}
            >
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 text-center lg:text-left">

                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 flex justify-center lg:justify-start"
                            >
                                <Link href="/">
                                    <img src={settings?.businessLogo || '/logo.png'} alt="Logo Empresa" className="h-16 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
                                </Link>
                            </motion.div>

                            {settings?.businessHeroBadge && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-full px-4 py-1.5 shadow-sm text-sm font-bold text-primary mb-6"
                                >
                                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                                    {settings.businessHeroBadge}
                                </motion.div>
                            )}

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
                                style={{ color: settings?.businessHeroTextColor || '#111827' }}
                            >
                                {settings?.businessHeroTitle || 'Impulsione o seu'} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                                    {settings?.businessHeroSubtitle || 'Capital Humano'}
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                            >
                                {settings?.businessHeroDescription ||
                                    'A plataforma definitiva de inteligência comportamental para empresas que buscam contratar melhor, desenvolver líderes e reduzir o turnover com dados científicos.'}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            >
                                <button
                                    onClick={openForm}
                                    className="bg-primary hover:bg-primary-hover text-white text-lg font-bold px-8 py-4 rounded-xl shadow-xl shadow-primary/25 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                                >
                                    Fale com um Consultor <ArrowRight size={20} />
                                </button>
                                <Link href="/auth/register" className="px-8 py-4 rounded-xl font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors">
                                    Criar Conta Grátis
                                </Link>
                            </motion.div>
                        </div>

                        <div className="flex-1 relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.7 }}
                                className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-xl"
                            >
                                {/* Placeholder for a dashboard screenshot or generic graphic */}
                                <div className="bg-gray-900 aspect-[4/3] relative flex items-center justify-center overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 mix-blend-overlay" />
                                    {/* Abstract Dashboard UI Representation */}
                                    <div className="w-[90%] h-[80%] bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-2xl transform rotate-1 group-hover:rotate-0 transition-transform duration-700">
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-1/3 h-32 bg-gray-700 rounded-lg animate-pulse" />
                                            <div className="w-1/3 h-32 bg-gray-700 rounded-lg animate-pulse delay-75" />
                                            <div className="w-1/3 h-32 bg-gray-700 rounded-lg animate-pulse delay-150" />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="h-4 bg-gray-700 rounded w-3/4" />
                                            <div className="h-4 bg-gray-700 rounded w-1/2" />
                                            <div className="h-4 bg-gray-700 rounded w-5/6" />
                                        </div>
                                        {/* Floating Elements */}
                                        <div className="absolute -right-6 top-10 bg-white p-3 rounded-lg shadow-xl animate-bounce duration-[3000ms]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                                <span className="text-xs font-bold text-gray-900">Match: 98%</span>
                                            </div>
                                        </div>
                                        <div className="absolute -left-4 bottom-10 bg-white p-3 rounded-lg shadow-xl animate-bounce duration-[4000ms]">
                                            <div className="flex items-center gap-2">
                                                <Users size={14} className="text-primary" />
                                                <span className="text-xs font-bold text-gray-900">Turnover: -40%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof / Stats */}
            <section className="py-10 border-y border-gray-100 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: "Empresas Atendidas", value: "500+" },
                            { label: "Avaliações Realizadas", value: "1M+" },
                            { label: "Precisão do Algoritmo", value: "92%" },
                            { label: "Redução de Turnover", value: "30%" },
                        ].map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <div className="text-3xl lg:text-4xl font-extrabold text-blue-600 mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Props / Features */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                            A tecnologia que transforma o seu RH
                        </h2>
                        <p className="text-xl text-gray-600">
                            Uma plataforma completa para escalar sua cultura e garantir contratações assertivas em todos os níveis.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Brain size={32} />,
                                title: "Mapeamento Comportamental",
                                description: "Utilize o Big Five, a metodologia mais aceita cientificamente, para entender profundamente cada colaborador."
                            },
                            {
                                icon: <Target size={32} />,
                                title: "Contratação Preditiva",
                                description: "Identifique os candidatos com maior fit cultural e técnico antes mesmo da entrevista."
                            },
                            {
                                icon: <BarChart size={32} />,
                                title: "Analytics de Pessoas",
                                description: "Dashboards intuitivos que transformam dados subjetivos em métricas claras para tomada de decisão."
                            },
                            {
                                icon: <Shield size={32} />,
                                title: "Segurança Empresarial",
                                description: "Conformidade total com a LGPD, criptografia de ponta a ponta e gestão de acessos granular."
                            },
                            {
                                icon: <Zap size={32} />,
                                title: "Implementação Rápida",
                                description: "Onboarding ágil e integrações via API para conectar com seus sistemas de RH favoritos."
                            },
                            {
                                icon: <Users size={32} />,
                                title: "Gestão de Times",
                                description: "Ferramentas para líderes desenvolverem suas equipes e melhorarem a comunicação interna."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all border border-gray-100 group">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-8">Pronto para elevar o nível do seu RH?</h2>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                        Fale com nossos consultores e descubra como nossa plataforma pode economizar horas do seu time e milhões para sua empresa.
                    </p>
                    <button
                        onClick={openForm}
                        className="bg-white text-primary hover:bg-gray-100 text-lg font-bold px-10 py-5 rounded-full shadow-lg transition-all transform hover:scale-105"
                    >
                        Solicitar Demonstração Gratuita
                    </button>
                    <p className="mt-6 text-sm text-gray-500">
                        Não é necessário cartão de crédito. Cancelamento a qualquer momento.
                    </p>
                </div>
            </section>

            {/* Footer Simple (Assuming Main Layout has footer, but if we want this page standalone, we might keep it minimal) */}
        </div>
    );
}

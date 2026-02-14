'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowRight,
    BrainCircuit,
    Heart,
    Zap,
    Users,
    ShieldCheck,
    Search,
    Activity,
    Sparkles,
    MousePointerClick,
    Fingerprint,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../../src/config/api';

// Animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

export default function AboutPage() {
    // Determine header logo from settings if possible, else default
    const { data: settings } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/site-settings`);
                return res.json();
            } catch (e) {
                return null;
            }
        }
    });

    return (
        <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-pink-100 selection:text-pink-900">
            {/* NAVIGATION */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img src="/logo.png" alt="PINC Logo" className="h-10 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            <ArrowLeft size={16} /> Voltar para Home
                        </Link>
                        <Link
                            href="/auth/register"
                            className="bg-black text-white hover:bg-gray-800 px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105"
                        >
                            Quero meu relatório
                        </Link>
                    </div>
                </div>
            </nav>

            {/* 1. HERO SECTION */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-gradient-to-br from-pink-50 to-blue-50 rounded-full blur-3xl opacity-50 -z-10" />

                <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
                            Entender como você funciona <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">muda tudo.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            A PINC traduz a complexidade da sua mente em relatórios claros, práticos e acionáveis. Sem rótulos, apenas clareza.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
                    >
                        <Link
                            href="/auth/register"
                            className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-lg font-bold px-8 py-4 rounded-full transition-all hover:shadow-xl hover:shadow-pink-200"
                        >
                            Quero entender como eu funciono <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* 2. NOSSA ESSÊNCIA */}
            <section className="py-24 bg-white relative">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="space-y-6"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                Por que criamos a PINC?
                            </h2>
                            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                                <p>
                                    Nascemos de uma frustração comum: testes de personalidade genéricos, diagnósticos clínicos frios ou aquela linguagem acadêmica que ninguém entende.
                                </p>
                                <p>
                                    Acreditamos que o autoconhecimento não deveria ser um luxo, nem um mistério. Ele deve ser <strong>claro, direto e democrático.</strong>
                                </p>
                                <p>
                                    A PINC não é terapia. Não é um diagnóstico médico. É uma ferramenta de clareza. Unimos a precisão do <strong>Big Five</strong> com uma camada interpretativa humana para mostrar quem você é de verdade — e como usar isso a seu favor.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="bg-gray-50 rounded-3xl p-8 md:p-12 border border-gray-100"
                        >
                            <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                                <Sparkles className="text-pink-500" /> O Jeito PINC de Ser
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { isNot: true, text: "Não usamos termos clínicos complexos" },
                                    { isNot: false, text: "Usamos linguagem simples e humana" },
                                    { isNot: true, text: "Não damos rótulos limitantes" },
                                    { isNot: false, text: "Mostramos como você funciona na prática" },
                                    { isNot: true, text: "Não prometemos soluções mágicas" },
                                    { isNot: false, text: "Entregamos dados científicos acionáveis" }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3">
                                        {item.isNot ? (
                                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                <span className="text-red-500 font-bold text-xs">✕</span>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={14} className="text-green-600" />
                                            </div>
                                        )}
                                        <span className={item.isNot ? "text-gray-400 line-through decoration-gray-300" : "text-gray-900 font-medium"}>
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. COMO A PINC FUNCIONA */}
            <section className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Como a mágica acontece</h2>
                        <p className="text-gray-500 text-lg">Do teste ao relatório em minutos.</p>
                    </div>

                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-4 gap-8"
                    >
                        {[
                            {
                                icon: MousePointerClick,
                                title: "1. Você responde",
                                desc: "Perguntas simples e diretas sobre suas preferências e reações.",
                                color: "bg-blue-100 text-blue-600"
                            },
                            {
                                icon: BrainCircuit,
                                title: "2. Análise Big Five",
                                desc: "Mapeamos os 5 grandes traços da sua personalidade com precisão científica.",
                                color: "bg-purple-100 text-purple-600"
                            },
                            {
                                icon: Activity,
                                title: "3. TalkingTo™",
                                desc: "Nosso motor exclusivo cruza seus dados para criar narrativas hiper-personalizadas.",
                                color: "bg-pink-100 text-pink-600"
                            },
                            {
                                icon: Fingerprint,
                                title: "4. Seu Relatório",
                                desc: "Você recebe um guia completo sobre sua mente, talentos e pontos cegos.",
                                color: "bg-orange-100 text-orange-600"
                            }
                        ].map((step, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeIn}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                            >
                                <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center mb-6`}>
                                    <step.icon size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 4. O MÉTODO TALKINGTO */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="order-2 md:order-1 relative"
                        >
                            {/* Abstract Visualization of "Methods" */}
                            <div className="bg-gradient-to-tr from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative shadow-2xl overflow-hidden aspect-square md:aspect-auto md:min-h-[400px] flex items-center justify-center">
                                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                                <div className="text-center space-y-4 z-10 relative">
                                    <div className="inline-flex items-center justify-center p-4 bg-white/10 rounded-full backdrop-blur-sm mb-4">
                                        <Search size={32} className="text-pink-400" />
                                    </div>
                                    <h4 className="text-2xl font-bold">Mais que traços isolados</h4>
                                    <p className="text-gray-300 max-w-xs mx-auto text-sm">
                                        Não dizemos apenas que você é "Extrovertido". Cruzamos isso com sua "Estabilidade" para revelar <strong>como</strong> sua extroversão se manifesta sob pressão.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="order-1 md:order-2 space-y-8">
                            <span className="text-pink-600 font-bold tracking-wider text-sm uppercase">Interpretativo, não apenas descritivo</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                                O Método TalkingTo™
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                A maioria dos testes te dá uma lista de características: "Você é organizado". O método TalkingTo vai além.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                É uma forma inteligente de cruzar padrões. Analisamos como seus traços conversam entre si. Identificamos não só o que você faz, mas <strong>como você decide, reage, se adapta e influencia</strong> o mundo ao seu redor.
                            </p>
                            <div className="flex gap-4">
                                <div className="pl-4 border-l-4 border-pink-500">
                                    <p className="font-bold text-gray-900">Clareza Estratégica</p>
                                    <p className="text-sm text-gray-500">Para tomadas de decisão</p>
                                </div>
                                <div className="pl-4 border-l-4 border-purple-500">
                                    <p className="font-bold text-gray-900">Inteligência Relacional</p>
                                    <p className="text-sm text-gray-500">Para interações melhores</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. PARA QUEM É */}
            <section className="py-24 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Para quem criamos a PINC?</h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            A PINC é para qualquer pessoa que sente que poderia performar melhor ou viver melhor se tivesse o manual de instruções da própria mente.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[
                            "Profissionais buscando alta performance",
                            "Pessoas em transição de carreira",
                            "Líderes que querem entender seus times",
                            "Estudantes decidindo o futuro",
                            "Curiosos sobre a própria mente",
                            "Quem quer autoconhecimento sem terapia"
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white/5 border border-white/10 p-6 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors cursor-default"
                            >
                                <div className="bg-pink-500/20 p-2 rounded-lg text-pink-400">
                                    <CheckCircle2 size={20} />
                                </div>
                                <span className="font-medium text-lg">{item}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6 & 7. COMPROMISSO E CONFIANÇA */}
            <section className="py-24 bg-white text-center">
                <div className="max-w-4xl mx-auto px-6 space-y-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Nosso Compromisso</h2>
                        <p className="text-xl text-gray-600 italic">
                            "Ciência aplicada à vida real. Sem julgamento, sem promessas milagrosas, apenas a verdade sobre o seu potencial."
                        </p>
                        <div className="mt-8 flex flex-col items-center space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <p className="text-gray-900 font-bold text-lg">Henrique De Lara e Cristiano Amorim</p>
                            <p className="text-xs text-pink-600 font-bold uppercase tracking-widest">Fundadores e Idealizadores da PINC</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-gray-100">
                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <ShieldCheck size={24} />
                            </div>
                            <h4 className="font-bold text-gray-900">Base Científica Sólida</h4>
                            <p className="text-sm text-gray-500">Fundamentado no modelo Big Five, o padrão ouro da psicologia moderna.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <h4 className="font-bold text-gray-900">Linguagem Humana</h4>
                            <p className="text-sm text-gray-500">Zero 'psicologuês'. Falamos a sua língua para gerar impacto real.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                                <Heart size={24} />
                            </div>
                            <h4 className="font-bold text-gray-900">Respeito ao Indivíduo</h4>
                            <p className="text-sm text-gray-500">Seus dados são seus. Sua privacidade é nossa prioridade absoluta.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. CTA FINAL */}
            <section className="py-32 bg-gradient-to-b from-white to-pink-50/50">
                <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
                    <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                        Pronto para se conhecer?
                    </h2>
                    <p className="text-xl text-gray-600">
                        O primeiro passo para mudar sua carreira, seus relacionamentos e sua vida começa com um relatório.
                    </p>
                    <div className="pt-8">
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white text-lg font-bold px-10 py-5 rounded-full transition-all hover:scale-105 shadow-xl hover:shadow-2xl"
                        >
                            Quero meu relatório agora
                        </Link>
                    </div>
                </div>
            </section>

            {/* FOOTER SIMPLE */}
            <footer className="bg-white py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 text-sm">
                    <p>PINC By Sued.Inc © 2025. Todos os direitos reservados.</p>
                    <p className="mt-2">CNPJ: 57.810.083/0001-00</p>
                </div>
            </footer>
        </main>
    );
}

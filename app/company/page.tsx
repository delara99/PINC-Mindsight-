'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Brain, TrendingUp, Heart, Building2, Target, Zap, CheckCircle, Shield, MessageCircle, UserPlus, BarChart3, SparklesIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function CompanyPage() {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    const features = [
        {
            icon: Brain,
            title: 'Análise Profunda',
            description: 'Baseado no Big Five, o modelo científico mais validado de personalidade no mundo.'
        },
        {
            icon: Shield,
            title: 'Segurança Total',
            description: 'Seus dados são protegidos e você controla quem pode ver seus resultados.'
        },
        {
            icon: UserPlus,
            title: 'Conexões Reais',
            description: 'Conecte-se com outras pessoas e compreenda melhor suas relações.'
        },
        {
            icon: BarChart3,
            title: 'Relatórios Inteligentes',
            description: 'Interpretações claras e aplicáveis, não apenas gráficos vazios.'
        }
    ];

    const useCases = [
        {
            emoji: '💼',
            title: 'Empresas e RH',
            description: 'Melhore contratações, desenvolva líderes e construa equipes mais eficazes.'
        },
        {
            emoji: '👥',
            title: 'Líderes e Equipes',
            description: 'Compreenda sua equipe, melhore a comunicação e potencialize resultados.'
        },
        {
            emoji: '❤️',
            title: 'Casais e Parceiros',
            description: 'Fortaleça relacionamentos através do autoconhecimento mútuo.'
        },
        {
            emoji: '🚀',
            title: 'Desenvolvimento Pessoal',
            description: 'Acelere seu crescimento pessoal e profissional com insights profundos.'
        },
        {
            emoji: '🎯',
            title: 'Autoconhecimento',
            description: 'Descubra seus padrões, forças e áreas de desenvolvimento.'
        },
        {
            emoji: '🤝',
            title: 'Relações Interpessoais',
            description: 'Entenda melhor como você se relaciona com diferentes pessoas.'
        }
    ];

    const steps = [
        {
            number: '01',
            title: 'Responda o Inventário',
            description: 'Complete um questionário cientificamente validado em cerca de 15 minutos.'
        },
        {
            number: '02',
            title: 'Análise Automática',
            description: 'Nossa plataforma processa suas respostas com algoritmos avançados.'
        },
        {
            number: '03',
            title: 'Receba seu Relatório',
            description: 'Acesse um relatório completo com interpretações claras e aplicáveis.'
        },
        {
            number: '04',
            title: 'Conecte-se com Pessoas',
            description: 'Compartilhe resultados de forma controlada e segura.'
        },
        {
            number: '05',
            title: 'Compare Perfis',
            description: 'Gere relatórios de compatibilidade e compreensão mútua.'
        }
    ];

    return (
        <main className="min-h-screen bg-white">
            {/* HEADER / NAVBAR */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm py-3 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="inline-block">
                        <img
                            src="/images/pinc-logo-full.png"
                            alt="PINC Logo"
                            className="h-10 w-auto hover:opacity-80 transition-opacity"
                        />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login" className="text-sm font-bold text-gray-600 hover:text-primary transition-colors hidden sm:block">
                            Login
                        </Link>
                        <Link href="/auth/register" className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-full hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                            Começar Agora
                        </Link>
                    </div>
                </div>
            </div>

            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary via-purple-700 to-pink-600 text-white pt-32">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">


                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >


                            <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                                Entenda pessoas, desenvolva relações e tome decisões melhores
                            </h1>

                            <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed">
                                A <span className="font-bold">PINC</span> é uma plataforma de análise comportamental baseada no <span className="font-bold">Big Five</span>, que transforma respostas em relatórios claros, interpretações profundas e insights aplicáveis ao seu dia a dia.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/auth/register"
                                    className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-gray-100 font-bold px-8 py-4 rounded-full text-lg shadow-2xl hover:shadow-white/50 transition-all hover:scale-105 active:scale-95"
                                >
                                    Acessar a Plataforma
                                    <ArrowRight size={20} />
                                </Link>
                                <Link
                                    href="/trial"
                                    className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold px-8 py-4 rounded-full text-lg border-2 border-white/50 transition-all"
                                >
                                    Testar Gratuitamente
                                </Link>
                            </div>

                            <div className="mt-8 flex items-center gap-6 text-sm">

                                <div className="flex items-center gap-2">
                                    <CheckCircle size={20} className="text-green-300" />
                                    <span>Resultados instantâneos</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Visual */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="hidden lg:block"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl blur-3xl"></div>
                                <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="bg-white/20 rounded-xl p-4 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                                                <div className="h-3 bg-white/40 rounded w-3/4 mb-2"></div>
                                                <div className="h-3 bg-white/30 rounded w-1/2"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
                    </svg>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                            Por que a PINC é diferente?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Vamos além de gráficos e números. Oferecemos interpretações claras, segurança total e ferramentas para melhorar suas relações.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                onMouseEnter={() => setHoveredCard(index)}
                                onMouseLeave={() => setHoveredCard(null)}
                                className="relative group"
                            >
                                <div className={`p-8 rounded-2xl border-2 transition-all duration-300 ${hoveredCard === index
                                    ? 'border-primary bg-gradient-to-br from-primary/5 to-pink-50 shadow-xl scale-105'
                                    : 'border-gray-200 bg-white'
                                    }`}>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${hoveredCard === index
                                        ? 'bg-gradient-to-br from-primary to-pink-600 text-white scale-110'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        <feature.icon size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600">{feature.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PINC COACH AI SECTION */}
            <section className="py-24 bg-slate-950 relative overflow-hidden text-white">
                {/* Abstract Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-500 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >

                            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                                Conheça a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">PINC COACH</span>
                            </h2>
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                                Nossa IA interpretativa revolucionária que analisa seus dados de personalidade e oferece mentoria personalizada em tempo real. Não apenas dados, mas sabedoria aplicada ao seu contexto.
                            </p>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="bg-purple-500/20 p-3 rounded-xl text-purple-400">
                                        <MessageCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-1">Diálogo Natural</h4>
                                        <p className="text-slate-400 text-sm">Converse como se estivesse com um especialista humano. Tire dúvidas, peça conselhos e explore seus resultados.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="bg-pink-500/20 p-3 rounded-xl text-pink-400">
                                        <Target size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-1">Planos de Ação</h4>
                                        <p className="text-slate-400 text-sm">Receba tarefas práticas e desafios baseados no seu perfil para desenvolver suas soft skills.</p>
                                    </div>
                                </div>
                            </div>

                            <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-slate-950 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all shadow-xl hover:shadow-white/10">
                                Experimentar PINC COACH <ArrowRight size={20} />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            {/* AI Interface Mockup */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl bg-opacity-80">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

                                {/* Header Mockup */}
                                <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                                        PC
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">PINC COACH</h4>
                                        <p className="text-xs text-green-400 flex items-center gap-1.5 font-bold tracking-wide uppercase"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" /> Online Agora</p>
                                    </div>
                                </div>

                                {/* Chat Bubbles */}
                                <div className="space-y-4 font-medium">
                                    <div className="bg-slate-800/80 rounded-2xl rounded-tl-none p-4 text-slate-200 text-sm leading-relaxed border border-white/5">
                                        Olá! Analisei seu perfil e notei que você tem alta <strong className="text-purple-400">Conscienciosidade</strong>. Isso é ótimo para liderança! Como posso te ajudar a aplicar isso hoje?
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl rounded-tr-none p-4 text-white text-sm ml-auto max-w-[90%] shadow-lg shadow-purple-900/20">
                                        Quero melhorar minha comunicação com a equipe. Às vezes sou muito direto.
                                    </div>
                                    <div className="bg-slate-800/80 rounded-2xl rounded-tl-none p-4 text-slate-200 text-sm leading-relaxed border border-white/5">
                                        Entendido. Baseado na sua pontuação de <strong className="text-pink-400">Amabilidade</strong>, sugiro começar as reuniões com 2 minutos de "quebra-gelo" pessoal. Isso suaviza sua assertividade natural. Quer um roteiro prático?
                                    </div>
                                    <div className="flex gap-2 mt-4 ml-4">
                                        <div className="h-2 w-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                        <div className="h-2 w-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <div className="h-2 w-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* HOW IT WORKS SECTION */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                            Como funciona?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Em 5 passos simples, você tem acesso a insights profundos sobre você e suas relações.
                        </p>
                    </motion.div>

                    <div className="space-y-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col md:flex-row items-center gap-8"
                            >
                                <div className={`flex-1 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-pink-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                                                {step.number}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                                <p className="text-gray-600 text-lg">{step.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex-1 ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'} hidden md:block`}>
                                    <div className="w-full h-64 bg-gradient-to-br from-primary/10 to-pink-100 rounded-2xl flex items-center justify-center">
                                        <div className="text-6xl">
                                            {index === 0 && '📝'}
                                            {index === 1 && '🤖'}
                                            {index === 2 && '📊'}
                                            {index === 3 && '🤝'}
                                            {index === 4 && '💡'}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* DIFFERENTIALS SECTION */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                            Diferenciais da PINC
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Não somos apenas mais um teste de personalidade. Somos uma plataforma completa de desenvolvimento humano.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {[
                            {
                                icon: Brain,
                                title: 'Interpretações Claras',
                                description: 'Não apenas gráficos. Você recebe explicações detalhadas sobre o que cada resultado significa na prática.'
                            },
                            {
                                icon: Shield,
                                title: 'Área Segura',
                                description: 'Seus resultados ficam protegidos em uma área exclusiva. Você decide quem pode ver.'
                            },
                            {
                                icon: Users,
                                title: 'Conexões Inteligentes',
                                description: 'Conecte-se com outras pessoas, compartilhe resultados e construa relações mais profundas.'
                            },
                            {
                                icon: BarChart3,
                                title: 'Relatórios Relacionais',
                                description: 'Compare perfis entre duas pessoas e entenda a dinâmica única de cada relação.'
                            },
                            {
                                icon: MessageCircle,
                                title: 'Chat Integrado',
                                description: 'Converse com suas conexões diretamente na plataforma de forma segura.'
                            },
                            {
                                icon: Target,
                                title: 'Devolutiva Especializada',
                                description: 'Agende sessões com profissionais para aprofundar sua compreensão.'
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="flex gap-4 p-6 rounded-2xl border-2 border-gray-200 hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-pink-50 transition-all group"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-togroup-hover:scale-110 transition-transform-br from-primary to-pink-600 text-white rounded-xl flex items-center justify-center">
                                    <item.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-gray-600">{item.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* USE CASES SECTION */}
            <section className="py-20 bg-gradient-to-br from-primary/5 to-pink-50">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                            Para quem é a PINC?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Nossa plataforma atende diferentes necessidades, do desenvolvimento pessoal à gestão empresarial.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {useCases.map((useCase, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl p-8 shadow-lg border-2 border-transparent hover:border-primary hover:shadow-2xl transition-all group"
                            >
                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{useCase.emoji}</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                                <p className="text-gray-600">{useCase.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="py-24 bg-gradient-to-br from-primary via-purple-700 to-pink-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>

                <div className="relative max-w-5xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl lg:text-6xl font-extrabold mb-6">
                            Comece sua jornada de autoconhecimento agora
                        </h2>
                        <p className="text-xl lg:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
                            Milhares de pessoas já transformaram suas relações e decisões com a PINC. Você será o próximo?
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/auth/register"
                                className="inline-flex items-center justify-center gap-3 bg-white text-primary hover:bg-gray-100 font-bold px-10 py-5 rounded-full text-xl shadow-2xl hover:shadow-white/50 transition-all hover:scale-105 active:scale-95"
                            >
                                Acessar a Plataforma
                                <ArrowRight size={24} />
                            </Link>
                            <Link
                                href="/trial"
                                className="inline-flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold px-10 py-5 rounded-full text-xl border-2 border-white/50 transition-all"
                            >
                                Começar Teste Grátis
                            </Link>
                        </div>

                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-300" />
                                <span>100% Seguro e Confidencial</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-300" />
                                <span>Baseado em Ciência</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-300" />
                                <span>Resultados Instantâneos</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

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

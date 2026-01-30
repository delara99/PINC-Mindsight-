'use client';
import { motion } from 'framer-motion';
import { Share2, Sparkles, ArrowRight, Layers, Users, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export function MethodologySection() {
    return (
        <section className="py-24 bg-slate-900 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-purple-900/10 skew-x-12 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-full bg-indigo-900/10 -skew-x-12 blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">

                {/* LEFT: MARKETING COPY */}
                <div className="space-y-8">


                    <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                        Muito além de um teste. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                            Um manual sobre você.
                        </span>
                    </h2>

                    <p className="text-lg text-slate-400 leading-relaxed">
                        Esqueça relatórios complexos que precisam de um psicólogo para traduzir.
                        O <strong>TalkingTo</strong> transforma a precisão científica do <em>Big Five</em> em uma linguagem que você entende, se identifica e aplica no seu dia a dia.
                    </p>

                    <div className="space-y-5">
                        <FeatureItem
                            icon={BrainCircuit}
                            title="Arquétipos Claros"
                            desc="Descubra se você é um 'Arquiteto', 'Mediador' ou 'Visionário' e o que isso significa na prática."
                        />
                        <FeatureItem
                            icon={Layers}
                            title="Mapa de Competências 360°"
                            desc="Veja visualmente onde estão seus pontos fortes e onde você gasta mais energia."
                        />
                        <FeatureItem
                            icon={Users}
                            title="Inteligência Relacional"
                            desc="Entenda por que você se dá bem com alguns e tem atrito com outros."
                        />
                    </div>

                    <div className="pt-4">
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-white/10 transition-all hover:-translate-y-1"
                        >
                            Descobrir meu Perfil <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>

                {/* RIGHT: VISUAL SHOWCASE (MOCKUP RECREATION) */}
                <div className="relative">
                    {/* Floating Cards Composition */}
                    <div className="relative w-full aspect-square md:aspect-[4/3]">

                        {/* 1. Main Header Card (Back Layer) */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            className="absolute top-0 right-0 w-[90%] bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-6 shadow-2xl border border-white/10 z-10"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded">RELATÓRIO OFICIAL</span>
                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-1">Arquétipo TalkingTO</h3>
                            <p className="text-purple-200 text-sm">Análise de Perfil Comportamental Avançada</p>
                            <div className="mt-6 flex gap-2">
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-3/4 bg-white/40"></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 2. Trait Cards (Floating) */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="absolute top-[35%] left-0 w-[55%] bg-white rounded-2xl p-5 shadow-2xl z-20"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <Sparkles className="text-orange-600" size={16} />
                                </div>
                                <span className="text-2xl font-black text-slate-800">50</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">Extroversão</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">MÉDIO</span>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                Você tem um perfil 'Ouvinte Ativo'. Equilibra bem momentos de fala e de escuta.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="absolute bottom-[10%] right-[5%] w-[55%] bg-white rounded-2xl p-5 shadow-2xl z-30"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <BrainCircuit className="text-purple-600" size={16} />
                                </div>
                                <span className="text-2xl font-black text-slate-800">85</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm">Conscienciosidade</h4>
                            <span className="text-[10px] font-bold text-purple-600 uppercase">ALTO</span>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                Foco extremo em resultados e organização. Você é o motor da execução.
                            </p>
                        </motion.div>

                        {/* 3. Radar Chart (Mini) */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="absolute bottom-0 left-[20%] w-[140px] h-[140px] bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center shadow-xl z-40 transform translate-y-1/4 -rotate-6"
                        >
                            <div className="relative w-24 h-24 opacity-80">
                                <div className="absolute inset-0 border border-purple-500/30 rounded-full" />
                                <div className="absolute inset-4 border border-purple-500/30 rounded-full" />
                                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                                    <polygon points="50,10 90,40 70,90 30,90 10,40" fill="rgba(168, 85, 247, 0.4)" stroke="#A855F7" strokeWidth="2" />
                                </svg>
                            </div>
                        </motion.div>

                    </div>
                </div>

            </div>
        </section>
    );
}

function FeatureItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <Icon size={24} className="text-purple-400" />
            </div>
            <div>
                <h3 className="text-white font-bold text-lg">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    )
};

'use client';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { BrainCircuit, Share2, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Mock Data for the Visual
const data = [
    { subject: 'Abertura', A: 90, B: 65, fullMark: 100 },
    { subject: 'Conscienciosidade', A: 85, B: 90, fullMark: 100 },
    { subject: 'Extroversão', A: 50, B: 90, fullMark: 100 },
    { subject: 'Amabilidade', A: 70, B: 60, fullMark: 100 },
    { subject: 'Estabilidade', A: 80, B: 50, fullMark: 100 },
];

export const MethodologySection = () => {
    return (
        <section className="relative py-24 bg-gray-900 overflow-hidden text-white">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    
                    {/* Left: Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 text-sm font-bold text-blue-300">
                            <Sparkles size={16} />
                            <span>Metodologia Exclusiva</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                            Ciência que Gera <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                Conexões Reais
                            </span>
                        </h2>

                        <p className="text-lg text-gray-300 leading-relaxed max-w-xl">
                            Não é apenas um teste de personalidade. É um sistema de inteligência comportamental baseado no Big Five.
                            Cruze relatórios, identifique sinergias ocultas e construa equipes que se completam matematicamente.
                        </p>

                        <ul className="space-y-4">
                            {[
                                { title: 'Análise Profunda', desc: 'Mapeamento preciso de 5 grandes traços.' },
                                { title: 'Cross-Profile', desc: 'Descubra a compatibilidade entre duas pessoas.' },
                                { title: 'Insights Acionáveis', desc: 'Dicas práticas para melhorar a comunicação.' }
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="mt-1 p-1 bg-green-500/20 rounded-full">
                                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{item.title}</h4>
                                        <p className="text-sm text-gray-400">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="pt-4">
                            <Link 
                                href="/auth/register"
                                className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold py-4 px-8 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                Experimentar Agora <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative">
                        {/* Floating Card */}
                        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                            {/* Header of Card */}
                            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                                        VS
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Análise de Sinergia</div>
                                        <div className="text-xs text-gray-400">Você vs Candidato</div>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                                    92% COMPATÍVEL
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Você"
                                            dataKey="A"
                                            stroke="#60A5FA"
                                            fill="#3B82F6"
                                            fillOpacity={0.3}
                                        />
                                        <Radar
                                            name="Candidato"
                                            dataKey="B"
                                            stroke="#A855F7"
                                            fill="#8B5CF6"
                                            fillOpacity={0.3}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Floating Stats */}
                            <div className="absolute -top-6 -right-6 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-xl animate-bounce-slow hidden md:block">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                        <BrainCircuit size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Gap de Conscienciosidade</div>
                                        <div className="font-bold text-white">+5% (Equilibrado)</div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -left-6 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-xl animate-bounce-slow delay-700 hidden md:block">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <Share2 size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Potencial de Troca</div>
                                        <div className="font-bold text-white">Alto Nível</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

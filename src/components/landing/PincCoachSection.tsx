
'use client';

import { motion } from 'framer-motion';
import { Sparkles, MessageSquare, BrainCircuit, Zap, CheckCircle, ArrowRight, Bot } from 'lucide-react';
import Link from 'next/link';

export function PincCoachSection() {
    return (
        <section className="py-24 relative overflow-hidden bg-[#0f0f16]">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* LEFT CONTENT */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Sparkles size={14} className="text-purple-400" />
                            Exclusivo Plano Professional
                        </div>

                        <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                            PINC Coach <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                Sua IA de Interpretação Pessoal
                            </span>
                        </h2>

                        <p className="text-lg text-gray-400 leading-relaxed">
                            Não basta saber seu perfil. O diferencial é saber <strong className="text-white">usar isso na prática.</strong>
                            <br /><br />
                            A PINC Coach é uma inteligência artificial treinada com o método TalkingTo para interpretar o seu relatório com você, em tempo real.
                        </p>

                        <div className="space-y-4">
                            {[
                                { title: 'Perguntar qualquer coisa', desc: 'Tire dúvidas sobre seu perfil 24h por dia.' },
                                { title: 'Aplicar na vida real', desc: 'Melhore comunicação e tomada de decisão.' },
                                { title: 'Sem linguagem técnica', desc: 'Explicações simples e diretas, sem "papo clínico".' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors">
                                    <div className="bg-purple-500/20 p-2 rounded-lg h-fit">
                                        <CheckCircle size={20} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{item.title}</h4>
                                        <p className="text-sm text-gray-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <Link
                                href="/auth/register?plan=pro"
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-purple-900/40 transition-all hover:scale-105"
                            >
                                Quero acesso à PINC Coach <ArrowRight size={20} />
                            </Link>
                            <p className="text-xs text-gray-500 mt-4 ml-2">Disponível imediatamente após o upgrade.</p>
                        </div>
                    </div>

                    {/* RIGHT VISUAL - CHAT SIMULATION */}
                    <div className="relative">
                        {/* Blob Backing */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-[2rem] opacity-20 blur-xl transform rotate-3" />

                        <div className="relative bg-slate-900 border border-slate-700 rounded-[2rem] p-6 shadow-2xl overflow-hidden">
                            {/* Chat Header */}
                            <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-0.5 shadow-lg shadow-purple-500/20">
                                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                                        <Bot size={24} className="text-purple-400" />
                                        {/* Placeholder para foto de Doutora se quiser trocar depois */}
                                        {/* <img src="/doctor-avatar.png" className="w-full h-full object-cover" /> */}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Dra. PINC</h3>
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        Online e analisando seu perfil
                                    </p>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="space-y-6">
                                {/* Message 1 (User) */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex justify-end"
                                >
                                    <div className="bg-slate-800 text-gray-200 px-5 py-3 rounded-2xl rounded-tr-none max-w-[85%] text-sm">
                                        Por que eu sinto tanta dificuldade em delegar tarefas para minha equipe?
                                    </div>
                                </motion.div>

                                {/* Message 2 (AI) */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-purple-600/10 border border-purple-500/20 text-gray-100 px-5 py-4 rounded-2xl rounded-tl-none max-w-[95%] text-sm shadow-sm relative">
                                        <Sparkles size={14} className="absolute -top-2 -left-2 text-purple-400 fill-purple-400" />
                                        <p className="mb-2">Olá! Analisando seu perfil <strong>TalkingTo</strong>, vejo que sua <strong>Conscienciosidade é muito Alta (88)</strong>.</p>
                                        <p>Isso faz de você um excelente executor, super organizado, mas cria a crença de que <em>"se eu não fizer, não vai ficar bom"</em>.</p>
                                        <div className="mt-3 bg-slate-950/50 p-3 rounded-lg border-l-2 border-pink-500 text-xs text-gray-300">
                                            💡 <strong>Dica Prática:</strong> Tente começar delegando o "resultado" esperado, e não o "processo". Solte o controle do "como" e foque no "o quê".
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Typing Indicator */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    transition={{ delay: 2.5 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100" />
                                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200" />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Fake Input */}
                            <div className="mt-8 pt-4 border-t border-slate-800 flex gap-2 opacity-50 pointer-events-none">
                                <div className="h-10 bg-slate-800 rounded-lg flex-1" />
                                <div className="h-10 w-10 bg-purple-600 rounded-lg" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

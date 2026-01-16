'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowRight, Brain, Target, Users, Zap, Shield, Lock,
    Activity, Layers, Fingerprint, Microscope, ChevronDown, CheckCircle
} from 'lucide-react';
import { API_URL } from '../../src/config/api';

export default function EarlyAccessPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    // Form State
    const [formStep, setFormStep] = useState(0); // 0: Idle, 1: Success
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        interest: 'Autoconhecimento'
    });
    const [submitting, setSubmitting] = useState(false);

    // 1. Check Access
    useEffect(() => {
        fetch(`${API_URL}/api/v1/site-settings`)
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                if (!data?.enableEarlyAccess) {
                    // Redirect or show "Coming Soon"
                    // For now, let's keep it accessible but show a banner if disabled? 
                    // Or strict redirect? User said "control enabling/disabling". 
                    // Usually means access control.
                    // But if I redirect immediately, user can't preview it easily without login.
                    // Lets check if user is admin? No, public page.
                    // Strict mode:
                    setLoading(false);
                    // router.push('/'); // Uncomment to enforce
                } else {
                    setEnabled(true);
                    setLoading(false);
                }
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/site-settings/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormStep(1);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;

    // Se desabilitado e não estamos em dev (simplificação), redirecionar
    if (!enabled && !loading) {
        // Opcional: mostrar tela de "Em breve" ao invés de redirect
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white text-center p-4">
                <Brain size={48} className="text-purple-500 mb-6 opacity-50" />
                <h1 className="text-2xl font-bold mb-2">Acesso Antecipado Encerrado</h1>
                <p className="text-gray-400 mb-8 max-w-md">O período de coleta de amostras está temporariamente fechado ou ainda não iniciou.</p>
                <button onClick={() => router.push('/')} className="text-purple-400 hover:text-purple-300">Voltar para Home</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden font-sans">
            <style>{`
                /* Forçar texto branco no Autofill */
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active,
                select:-webkit-autofill,
                select:-webkit-autofill:hover,
                select:-webkit-autofill:focus {
                    -webkit-text-fill-color: #ffffff !important;
                    -webkit-box-shadow: 0 0 0 30px #0A0A0B inset !important;
                    transition: background-color 5000s ease-in-out 0s;
                    color: white !important; /* Fallback */
                }
                /* Garantir cor branca nos inputs em geral */
                input, select {
                    color: white !important;
                }
            `}</style>

            {/* Navbar Minimal */}
            <nav className="fixed top-0 w-full z-50 bg-[#FFFFFF] border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo-pinc.png" alt="PINC Mindsight" className="h-12 w-auto" />
                    </div>
                    <a href="#join" className="hidden md:block px-5 py-2 bg-black text-white hover:bg-gray-800 rounded-full text-sm font-medium transition-all shadow-lg shadow-gray-200/50">
                        Participar do Beta
                    </a>
                </div>
            </nav>

            {/* 1. HERO SECTION */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden items-center justify-center flex flex-col px-6">
                {/* Background Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium uppercase tracking-wider mb-4"
                    >
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Acesso Antecipado
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
                    >
                        Entenda como você <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">funciona</span>, <br className="hidden md:block" />
                        não apenas quem você é.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
                    >
                        Unindo a ciência do TalkingTO, tecnologia avançada e inteligência psicológica aplicada.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        <a
                            href="#join"
                            className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl shadow-purple-900/20 group"
                        >
                            Quero Participar do Acesso Antecipado <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                        <p className="text-xs text-gray-500 mt-2 sm:mt-0">
                            Inventário completo gratuito para participantes do beta.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* 2. O PROBLEMA (Testes Tradicionais) */}
            <section className="py-24 bg-gray-900/30 border-y border-white/5 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold">
                                Por que os testes tradicionais <br />
                                <span className="text-gray-500">não são suficientes?</span>
                            </h2>
                            <p className="text-lg text-gray-400 leading-relaxed">
                                A maioria das ferramentas de mercado coloca você em caixas. Elas rotulam, mas não explicam a dinâmica. Saber que você é "alto em extroversão" não explica como você reage sob pressão, toma decisões ou se comunica em momentos críticos.
                            </p>
                            <ul className="space-y-4 pt-4">
                                {[
                                    "Rótulos estáticos e limitantes",
                                    "Falta de contexto prático",
                                    "Resultados genéricos",
                                    "Pouca profundidade psicológica"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-300">
                                        <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">✕</div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl -z-10" />
                            <div className="bg-[#121214] border border-white/10 rounded-2xl p-8 transform rotate-2 hover:rotate-0 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full" />
                                    <div>
                                        <div className="h-4 w-32 bg-gray-800 rounded mb-2" />
                                        <div className="h-3 w-20 bg-gray-800 rounded opacity-50" />
                                    </div>
                                </div>
                                <div className="space-y-3 opacity-50">
                                    <div className="h-3 w-full bg-gray-800 rounded" />
                                    <div className="h-3 w-5/6 bg-gray-800 rounded" />
                                    <div className="h-3 w-4/6 bg-gray-800 rounded" />
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/5 text-center text-gray-500 text-sm font-mono">
                                    RELATÓRIO GENÉRICO PADRÃO
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. O MÉTODO PINC */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Uma nova camada de inteligência</h2>
                        <p className="text-xl text-gray-400">
                            O PINC mantém o rigor científico do <span className="text-white font-semibold">TalkingTO</span> e adiciona uma Camada Interpretativa Avançada que revela o "como" e o "porquê".
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: Users, title: "Perfil Social", desc: "Como você interage e influencia pessoas.", color: "text-blue-400", bg: "bg-blue-900/20" },
                            { icon: Layers, title: "Perfil Estruturado", desc: "Sua relação com regras, prazos e qualidade.", color: "text-green-400", bg: "bg-green-900/20" },
                            { icon: Target, title: "Perfil Explorador", desc: "Abertura ao novo e criatividade.", color: "text-yellow-400", bg: "bg-yellow-900/20" },
                            { icon: Brain, title: "Perfil Analítico", desc: "Processamento de informação e lógica.", color: "text-purple-400", bg: "bg-purple-900/20" },
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-[#121214] border border-white/10 p-8 rounded-2xl hover:border-white/20 transition-all group"
                            >
                                <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <card.icon size={24} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. FUNCIONALIDADES */}
            <section className="py-24 bg-gray-900/30 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="order-2 md:order-1 grid grid-cols-2 gap-4">
                            <div className="bg-[#0A0A0B] p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center justify-center aspect-square">
                                <Fingerprint size={40} className="text-pink-500 mb-4" />
                                <span className="font-bold">Identidade Única</span>
                            </div>
                            <div className="bg-[#0A0A0B] p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center justify-center aspect-square">
                                <Microscope size={40} className="text-blue-500 mb-4" />
                                <span className="font-bold">Análise Profunda</span>
                            </div>
                            <div className="bg-[#0A0A0B] p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center justify-center aspect-square">
                                <Shield size={40} className="text-green-500 mb-4" />
                                <span className="font-bold">100% Seguro</span>
                            </div>
                            <div className="bg-[#0A0A0B] p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center justify-center aspect-square">
                                <Zap size={40} className="text-yellow-500 mb-4" />
                                <span className="font-bold">Instantâneo</span>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 flex flex-col justify-center">
                            <h2 className="text-3xl font-bold mb-6">O que analisamos?</h2>
                            <p className="text-gray-400 mb-8 max-w-md">
                                Nossa plataforma decodifica padrões complexos em uma linguagem simples e acionável.
                            </p>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                                    <div>
                                        <h4 className="font-bold text-lg">Avaliação TalkingTO Completa</h4>
                                        <p className="text-sm text-gray-500">Os 5 grandes fatores e suas facetas.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1 bg-gray-800 rounded-full" />
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-300">Necessidades Psicológicas</h4>
                                        <p className="text-sm text-gray-500">O que motiva e desmotiva você.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1 bg-gray-800 rounded-full" />
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-300">Relatórios Interpretativos</h4>
                                        <p className="text-sm text-gray-500">Insights claros, sem "psicologês".</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. FASE DE AMOSTRAGEM (Storytelling) */}
            <section className="py-24 px-6 text-center">
                <div className="max-w-4xl mx-auto space-y-8 bg-gradient-to-b from-[#121214] to-transparent p-12 rounded-3xl border border-white/5">
                    <Activity size={48} className="mx-auto text-green-500 mb-4" />
                    <h2 className="text-3xl md:text-5xl font-bold">Por que estamos em fase de amostragem?</h2>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        O método PINC precisa de dados reais para calibrar seus algoritmos interpretativos. Ao participar agora, você não está apenas fazendo um teste — está ajudando a construir a próxima geração de avaliações comportamentais.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                        <div>
                            <div className="text-3xl font-bold text-white mb-2">Validar</div>
                            <p className="text-sm text-gray-500">Refinar a precisão dos padrões estatísticos identificados.</p>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-2">Evoluir</div>
                            <p className="text-sm text-gray-500">Treinar a inteligência interpretativa com casos reais.</p>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-2">Recompensar</div>
                            <p className="text-sm text-gray-500">Oferecer acesso vitalício gratuito aos primeiros usuários.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. FORMULÁRIO (JOIN) */}
            <section id="join" className="py-24 bg-purple-900/10 border-t border-white/10 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

                <div className="max-w-xl mx-auto px-6 relative z-10">
                    <div className="bg-[#121214] border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl shadow-purple-900/20">

                        {formStep === 0 ? (
                            <div className="space-y-8">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold mb-4">Garanta seu Acesso</h2>
                                    <p className="text-gray-400">Entre para a lista de espera e receba seu inventário completo gratuitamente assim que liberado.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-gray-500"
                                            style={{ colorScheme: 'dark' }}
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Principal</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder:text-gray-500"
                                            style={{ colorScheme: 'dark' }}
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Tenho interesse em...</label>
                                        <select
                                            value={formData.interest}
                                            onChange={e => setFormData({ ...formData, interest: e.target.value })}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all appearance-none"
                                            style={{ colorScheme: 'dark' }}
                                        >
                                            <option value="Autoconhecimento">Autoconhecimento</option>
                                            <option value="Profissional">Desenvolvimento Profissional</option>
                                            <option value="Relacionamentos">Relacionamentos</option>
                                            <option value="RH/Gestão">RH e Gestão de Equipes</option>
                                            <option value="Psicologia">Psicologia Clínica</option>
                                        </select>
                                    </div>

                                    <div className="flex items-start gap-3 pt-2">
                                        <input id="terms" type="checkbox" required className="mt-1 bg-transparent border-gray-600 rounded text-purple-600 focus:ring-purple-500" />
                                        <label htmlFor="terms" className="text-xs text-gray-500">
                                            Concordo em participar do programa de Acesso Antecipado e receber comunicações sobre o lançamento.
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                    >
                                        {submitting ? 'Enviando...' : 'Quero Participar do Beta'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="text-center py-12 space-y-6">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={40} className="text-green-500" />
                                </div>
                                <h3 className="text-3xl font-bold">Cadastro Confirmado!</h3>
                                <p className="text-gray-400">
                                    Você está na lista. Assim que nossa plataforma estiver pronta para o seu perfil, enviaremos um convite exclusivo para o seu e-mail.
                                </p>
                                <div className="pt-8 text-sm text-gray-600">
                                    Fique de olho na sua caixa de entrada (e spam) nas próximas semanas.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 8. FOOTER */}
            <footer className="py-12 border-t border-gray-100 bg-[#FFFFFF]">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/logo-pinc.png" alt="PINC Mindsight" className="h-10 w-auto" />
                        </div>
                        <p className="text-xs text-gray-500">© 2025 Sued Inc. Todos os direitos reservados.</p>
                    </div>
                    <div className="text-xs text-gray-500 max-w-md text-center md:text-right">
                        O PINC é uma ferramenta de autoconhecimento e desenvolvimento. Os relatórios gerados não substituem avaliações psicológicas clínicas ou acompanhamento profissional especializado quando necessário.
                    </div>
                </div>
            </footer>
        </div>
    );
}

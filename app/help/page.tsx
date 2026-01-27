'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, MessageSquare, Zap, Target, Users, BookOpen, CreditCard, Shield, ArrowRight, Sparkles, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

// --- DATA: FAQ & Categories ---
const categories = [
    {
        id: 'plans',
        title: 'Planos & Assinaturas',
        description: 'Tudo sobre preços, B2B, B2C e upgrades.',
        icon: <CreditCard className="w-8 h-8" />,
        colSpan: 'md:col-span-2',
        bg: 'bg-slate-50'
    },
    {
        id: 'method',
        title: 'Metodologia PINC',
        description: 'Como funciona a ciência por trás da análise.',
        icon: <Target className="w-8 h-8" />,
        colSpan: 'md:col-span-1',
        bg: 'bg-white'
    },
    {
        id: 'team',
        title: 'Para Gestores',
        description: 'Gerencie times e avalie candidatos.',
        icon: <Users className="w-8 h-8" />,
        colSpan: 'md:col-span-1',
        bg: 'bg-primary/5'
    },
    {
        id: 'coach',
        title: 'PINC Coach IA',
        description: 'Como usar sua assistente inteligente.',
        icon: <Sparkles className="w-8 h-8" />,
        colSpan: 'md:col-span-2',
        bg: 'bg-gradient-to-br from-slate-900 to-slate-800 text-white'
    }
];

const faqs = [
    {
        category: 'plans',
        question: 'Qual a diferença entre os planos B2C e B2B?',
        answer: 'Os planos B2C (Essencial, Profissional) são focados no autodesenvolvimento individual. Já os planos B2B (Corporativos) oferecem painéis de gestão, comparação de times, análise de cultura e gestão de vários colaboradores em um só lugar.'
    },
    {
        category: 'plans',
        question: 'Posso cancelar minha assinatura a qualquer momento?',
        answer: 'Sim! Nossos planos mensais não possuem fidelidade. Você pode cancelar direto pelo painel financeiro sem multas ou taxas ocultas.'
    },
    {
        category: 'method',
        question: 'O teste PINC é confiável?',
        answer: 'Absolutamente. O PINC é baseado na teoria do Big Five, o modelo mais aceito cientificamente na psicologia moderna. Nossos algoritmos são calibrados constantemente para garantir precisão acima de 90% na descrição comportamental.'
    },
    {
        category: 'method',
        question: 'Quanto tempo leva para responder?',
        answer: 'O teste completo leva cerca de 10 a 15 minutos em média. É rápido, intuitivo e pode ser feito pelo celular.'
    },
    {
        category: 'team',
        question: 'Como convido meu time para fazer o teste?',
        answer: 'No Dashboard de Gestor, basta acessar a aba "Convidar", inserir os e-mails e pronto. Eles receberão um link único e os resultados aparecerão automaticamente no seu painel assim que concluírem.'
    },
    {
        category: 'coach',
        question: 'A PINC Coach substitui um psicólogo?',
        answer: 'Não. A PINC Coach é uma ferramenta de IA treinada em psicologia comportamental para oferecer insights de carreira e autoconhecimento, mas não realiza diagnósticos clínicos nem substitui terapia.'
    }
];

// --- COMPONENTS ---

function Accordion({ item, isOpen, onClick }: { item: any, isOpen: boolean, onClick: () => void }) {
    return (
        <div className="group border-b border-slate-200 overflow-hidden transition-all duration-300">
            <button
                onClick={onClick}
                className="w-full py-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors px-4 -mx-4"
            >
                <div className="flex items-center gap-4">
                    <span className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                    <span className="text-lg font-medium text-slate-900 group-hover:text-primary transition-colors">
                        {item.question}
                    </span>
                </div>
            </button>
            <div
                className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
            >
                <div className="pl-14 pr-4 text-slate-600 leading-relaxed text-lg">
                    {item.answer}
                </div>
            </div>
        </div>
    );
}

export default function HelpPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const filteredFaqs = faqs.filter(f =>
        f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary selection:text-white">

            {/* --- HERO SECTION --- */}
            <header className="relative pt-32 pb-20 px-6 md:px-12 lg:px-24 overflow-hidden border-b border-slate-100">
                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <span className="inline-block py-1 px-3 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-widest uppercase mb-6">
                            Suporte & Knowledge Base
                        </span>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9]">
                            COMO PODEMOS <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600"> AJUDAR VOCÊ?</span>
                        </h1>
                        <p className="text-xl text-slate-500 max-w-2xl mb-12 font-light">
                            Explore nossa base de conhecimento, entenda a metodologia ou converse com nossa IA. Estamos aqui para desbloquear seu potencial.
                        </p>

                        {/* Search Bar Big */}
                        <div className="relative max-w-3xl group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <Search size={28} />
                            </div>
                            <input
                                type="text"
                                placeholder="Busque por 'planos', 'metodologia', 'cancelamento'..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 hover:bg-white focus:bg-white border-2 border-transparent focus:border-primary/20 hover:shadow-xl focus:shadow-2xl rounded-2xl py-6 pl-20 pr-6 text-xl outline-none transition-all duration-300 placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-b from-slate-50 to-white -z-10" />
                <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            </header>

            {/* --- CATEGORIES GRID (Broken Grid) --- */}
            <section className="py-24 px-6 md:px-12 lg:px-24 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-16">
                        <h2 className="text-4xl font-bold tracking-tight">Tópicos Principais</h2>
                        <span className="text-slate-400 font-mono text-sm hidden md:block">01 — CATEGORIAS</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        {categories.map((cat, idx) => (
                            <div
                                key={cat.id}
                                className={`group relative p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-slate-100 overflow-hidden flex flex-col justify-between ${cat.colSpan} ${cat.bg}`}
                            >
                                <div className="relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 ${cat.bg.includes('slate-900') ? 'bg-white/10 text-white' : 'bg-white shadow-lg text-primary'}`}>
                                        {cat.icon}
                                    </div>
                                    <h3 className={`text-3xl font-bold mb-3 ${cat.bg.includes('slate-900') ? 'text-white' : 'text-slate-900'}`}>
                                        {cat.title}
                                    </h3>
                                    <p className={`text-lg leading-relaxed ${cat.bg.includes('slate-900') ? 'text-slate-300' : 'text-slate-500'}`}>
                                        {cat.description}
                                    </p>
                                </div>
                                <div className="relative z-10 flex justify-end">
                                    <span className={`p-3 rounded-full transition-all duration-300 ${cat.bg.includes('slate-900') ? 'bg-white text-slate-900 hover:bg-primary hover:text-white' : 'bg-slate-900 text-white group-hover:bg-primary'}`}>
                                        <ArrowRight size={20} />
                                    </span>
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section className="py-24 px-6 md:px-12 lg:px-24 bg-slate-50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold tracking-widest text-xs uppercase mb-4 block">Perguntas Frequentes</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Tire suas dúvidas</h2>
                        <p className="text-xl text-slate-500">Se não encontrar a resposta aqui, nossa IA pode ajudar.</p>
                    </div>

                    <div className="space-y-2">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, idx) => (
                                <Accordion
                                    key={idx}
                                    item={faq}
                                    isOpen={openFaq === idx}
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <p>Nenhuma pergunta encontrada para "{searchTerm}".</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* --- PINC COACH CTA (Widget Style) --- */}
            <section className="py-32 px-6 md:px-12 lg:px-24 bg-white relative overflow-hidden">
                <div className="max-w-6xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-2xl text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12 isolate">

                    {/* Content */}
                    <div className="relative z-10 max-w-2xl text-white">
                        <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                            <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="font-mono text-green-400 text-sm font-bold">IA ONLINE</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                            Ainda ficou com <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">alguma dúvida?</span>
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                            A <strong className="text-white">PINC Coach</strong> analisa o contexto completo da plataforma e pode explicar detalhes específicos sobre os planos, metodologia ou ajudar você a interpretar seus resultados agora mesmo.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link href="/dashboard/coach" className="px-8 py-5 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-100 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2">
                                <Sparkles size={20} className="text-primary" />
                                Perguntar para IA
                            </Link>
                            <Link href="mailto:ajuda@pinc.app.br" className="px-8 py-5 bg-transparent border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                                Falar com Humano
                            </Link>
                        </div>
                    </div>

                    {/* Visual Decor */}
                    <div className="relative w-64 h-64 md:w-96 md:h-96 flex-shrink-0 animate-in zoom-in spin-in-3 duration-[2s]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-600 rounded-full blur-[100px] opacity-50 animate-pulse" />
                        <div className="relative bg-gradient-to-br from-slate-800 to-black p-8 rounded-3xl border border-white/10 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500">
                            {/* Fake Chat Interface */}
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
                                    <div className="bg-slate-800 rounded-r-xl rounded-bl-xl p-3 text-xs text-slate-300">
                                        Como funciona o plano corporativo para 50 pessoas?
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-row-reverse">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">IA</div>
                                    <div className="bg-primary/20 text-white rounded-l-xl rounded-br-xl p-3 text-xs border border-primary/30">
                                        O plano Business oferece painel gestor completo. Para 50 vidas, temos condições especiais...
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center text-slate-500 text-[10px] justify-center pt-2">
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100" />
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Footer Simple */}
            <footer className="py-12 text-center text-slate-400 text-sm bg-white border-t border-slate-100">
                <p>&copy; {new Date().getFullYear()} PINC Mindsight. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}


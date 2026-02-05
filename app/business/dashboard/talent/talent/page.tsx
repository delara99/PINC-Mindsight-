import { Rocket, Users, Target, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button'; // Assumindo existência ou usar HTML puro

export default function TalentIntelligenceDashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BrainIcon className="text-indigo-600 w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inteligência de Talento</h1>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wider">Beta</span>
                    </div>
                    <p className="text-slate-500 max-w-2xl text-lg">
                        Transforme dados de colaboradores em decisões estratégicas. Analise fit cultural, crie planos de desenvolvimento e simule cenários.
                    </p>
                </div>
            </div>

            {/* Main Actions Grid */}
            <div className="grid md:grid-cols-3 gap-6">

                {/* Card 1: Análise de Fit */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[4rem] group-hover:scale-110 transition-transform origin-top-right"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                            <Target size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Análise de Fit (Cargo)</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Crie perfis ideais para "Analista de Marketing" e descubra quais colaboradores possuem maior compatibilidade.
                        </p>
                        <Link href="/business/talent/jobs/create" className="inline-flex items-center text-blue-600 font-bold hover:gap-2 transition-all">
                            Criar Perfil <ArrowRightIcon className="ml-1 w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Card 2: Análise de Equipe */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[4rem] group-hover:scale-110 transition-transform origin-top-right"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                            <Users size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Análise de Equipe</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Descubra como um novo membro impacta a dinâmica e cultura do time existente. Preveja conflitos.
                        </p>
                        <span className="inline-flex items-center text-slate-400 font-bold cursor-not-allowed">
                            Em Breve
                        </span>
                    </div>
                </div>

                {/* Card 3: Planos de Ação */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[4rem] group-hover:scale-110 transition-transform origin-top-right"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-orange-600">
                            <Rocket size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Planos de Ação (PDI)</h3>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Geração automática de planos de desenvolvimento baseados em gaps de competência reais.
                        </p>
                        <span className="inline-flex items-center text-slate-400 font-bold cursor-not-allowed">
                            Em Breve
                        </span>
                    </div>
                </div>

            </div>

            {/* Hero Section Inferior */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden text-center md:text-left">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Primeiro Passo: Defina um Perfil Ideal
                        </h2>
                        <p className="text-slate-300 text-lg leading-relaxed">
                            Para calcular a "Nota de Fit" (compatibilidade), a IA do PINC precisa saber o que você espera de cada cargo. Crie seu primeiro Perfil de Cargo em menos de 2 minutos.
                        </p>
                    </div>

                    <Link href="/business/talent/jobs/create">
                        <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl text-lg hover:bg-slate-100 hover:scale-105 transition-all shadow-xl shadow-white/10 flex items-center gap-2">
                            <BrainCircuit className="text-purple-600" />
                            Criar Perfil de Cargo
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function BrainIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.97-3.465" /><path d="M20 18a4 4 0 0 0-1.97-3.465" /></svg>
    )
}

function ArrowRightIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    )
}

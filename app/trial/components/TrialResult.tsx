'use client';

import { useTrialStore } from '../../../src/store/trial-store';
import { Lock, Unlock, ArrowRight, CheckCircle, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';

export function TrialResult() {
    const { userInfo, answers } = useTrialStore();

    // Mapeamento de Questões por Traço (Baseado no TrialQuiz)
    const TRAITS_MAP = {
        'Extroversão': [1, 2],
        'Amabilidade': [3, 4],
        'Conscienciosidade': [5, 6],
        'Estabilidade Emocional': [7, 8],
        'Abertura': [9, 10]
    };

    // Função de Cálculo Real
    const calculateScore = (questionIds: number[]) => {
        let total = 0;
        let max = questionIds.length * 5; // 5 é o score máximo por questão

        questionIds.forEach(id => {
            total += answers[id] || 3; // Fallback para neutro se não respondido
        });

        return (total / max) * 100;
    };

    // Calcular todos os scores
    const scores = {
        extroversion: calculateScore(TRAITS_MAP['Extroversão']),
        agreeableness: calculateScore(TRAITS_MAP['Amabilidade']),
        conscientiousness: calculateScore(TRAITS_MAP['Conscienciosidade']),
        neuroticism: calculateScore(TRAITS_MAP['Estabilidade Emocional']),
        openness: calculateScore(TRAITS_MAP['Abertura'])
    };

    const percentage = scores.extroversion;

    return (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in duration-700">
            {/* Header de Impacto */}
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                    Uau, {userInfo.name}! 🚀
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Seu perfil preliminar aponta para um potencial incrível. Analisamos suas respostas e encontramos padrões fascinantes.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Cartão Liberado - Extroversão */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-primary/20 relative group hover:border-primary transition-all">
                    <div className="bg-primary/5 p-4 border-b border-primary/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Unlock className="w-5 h-5 text-primary" />
                            <span className="font-bold text-gray-900">Extroversão</span>
                        </div>
                        <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">LIBERADO</span>
                    </div>
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <span className="text-5xl font-extrabold text-gray-900">{Math.round(percentage)}%</span>
                            <p className="text-sm text-gray-500 mt-1">Nível de Energia Social</p>
                        </div>

                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-6">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-purple-600"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>

                        <p className="text-gray-600 text-sm leading-relaxed">
                            {percentage > 60
                                ? "Você tende a ser comunicativo e energizado por interações sociais. Líderes com este perfil costumam ser excelentes em motivar equipes e criar redes de contato."
                                : percentage > 40
                                    ? "Você possui um equilíbrio saudável entre interação social e tempo reservado. Adapta-se bem a diferentes ambientes, ouvindo e falando na medida certa."
                                    : "Você possui uma abordagem mais reflexiva e observadora. Perfis como o seu são excelentes ouvintes, analistas profundos e estrategistas focados."
                            }
                        </p>
                    </div>
                </div>

                {/* Cartão Bloqueado - Teaser dos outros 4 (COM DADOS REAIS REVELADOS NA INTUIÇÃO) */}
                <div className="bg-gray-50 rounded-2xl border border-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40 z-10 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Desbloqueie seu Perfil Completo</h3>
                        <p className="text-gray-600 mb-6 max-w-xs">
                            Tenha acesso detalhado aos outros 4 traços de personalidade e descubra seus talentos ocultos.
                        </p>
                        <Link
                            href={`/auth/register?name=${encodeURIComponent(userInfo.name)}&email=${encodeURIComponent(userInfo.email || '')}`}
                            className="bg-secondary hover:bg-secondary-hover text-black font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                        >
                            Ver Relatório Completo <ArrowRight className="w-5 h-5" />
                        </Link>

                        <div className="flex flex-col items-center mt-6 gap-2">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Sem cartão de crédito necessário
                            </p>
                            <button
                                onClick={() => {
                                    if (confirm('Tem certeza? Seus dados serão perdidos.')) {
                                        const { resetTrial } = useTrialStore.getState();
                                        resetTrial();
                                        sessionStorage.removeItem('trial-storage'); // Force clear
                                        window.location.href = '/';
                                    }
                                }}
                                className="px-6 py-2 mt-2 text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                            >
                                Sair e encerrar sessão
                            </button>
                        </div>
                    </div>

                    {/* Fundo simulado 'borrado' - AGORA COM DADOS REAIS DO USUÁRIO PARA FIDELIDADE */}
                    <div className="p-6 opacity-30 space-y-6 filter blur-sm select-none pointer-events-none">
                        {[
                            { name: 'Amabilidade', score: scores.agreeableness, color: 'bg-green-500' },
                            { name: 'Conscienciosidade', score: scores.conscientiousness, color: 'bg-blue-500' },
                            { name: 'Estabilidade Emocional', score: scores.neuroticism, color: 'bg-red-500' },
                            { name: 'Abertura', score: scores.openness, color: 'bg-yellow-500' }
                        ].map((trait, i) => (
                            <div key={i}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-gray-800">{trait.name}</span>
                                    <span>{Math.round(trait.score)}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full">
                                    <div className={`h-full ${trait.color}`} style={{ width: `${trait.score}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Social Proof / Comparação */}
            <div className="bg-gray-900 text-white rounded-2xl p-8 mb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-2 font-bold">
                            <Users className="w-5 h-5" />
                            <span>COMPARAÇÃO DE MERCADO</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">
                            {percentage > 50 ? "Perfil de Liderança Dinâmica" : "Perfil de Especialista Estratégico"}
                        </h3>
                        <p className="text-gray-300 max-w-lg">
                            Cruzando seus dados preliminares com nossa base de profissionais, identificamos alta aderência a
                            {percentage > 50 ? " funções que exigem influência e comunicação." : " funções que exigem análise profunda e foco."}
                        </p>
                    </div>
                    <div className="flex -space-x-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-12 h-12 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-xs font-bold">
                                {['JD', 'AM', 'RK', 'LZ'][i - 1]}
                            </div>
                        ))}
                        <div className="w-12 h-12 rounded-full border-2 border-gray-900 bg-primary flex items-center justify-center text-xs font-bold">
                            +10k
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

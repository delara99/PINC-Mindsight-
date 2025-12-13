'use client';
import { API_URL } from '@/src/config/api';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useTrialStore } from '@/src/store/trial-store';
import ClientDashboard from '@/src/components/dashboard/client-overview';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ClientLayoutWrapper() {
    const user = useAuthStore((state) => state.user);
    const { answers, userInfo, resetTrial } = useTrialStore();
    const [mounted, setMounted] = useState(false);
    const hasTrialData = Object.keys(answers).length > 0;

    // Fetch assessments to check for pending ones
    const { data: assessments } = useQuery({
        queryKey: ['my-assessments-status'],
        queryFn: async () => {
            // Se não tiver token, nem tenta (embora ClientWrapper exija user/token, bom garantir)
            const token = useAuthStore.getState().token;
            if (!token) return [];
            
            const response = await fetch(`${API_URL}/api/v1/assessments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return [];
            return response.json();
        },
        enabled: !!user
    });

    useEffect(() => {
        useTrialStore.persist.rehydrate();
        setMounted(true);
    }, []);

    // Prevent hydration mismatch for persistent store
    if (!mounted) return null;

    // Encontrar avaliação pendente (IN_PROGRESS e do tipo BIG_FIVE idealmente, mas assumindo a primeira pendente)
    const pendingAssessment = assessments?.find((a: any) => a.assignmentStatus !== 'COMPLETED');
    const hasCredits = user && Number(user.credits) > 0;

    // Estado para controle de inicialização do teste
    const [initiating, setInitiating] = useState(false);
    const router = useRouter(); // Necessário importar useRouter

    // Função para iniciar teste (casos onde persistência falhou ou compra foi avulsa)
    const handleInitAssessment = async () => {
        try {
            setInitiating(true);
            const token = useAuthStore.getState().token;
            const response = await fetch(`${API_URL}/api/v1/assessments/init-big-five`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const assignment = await response.json();
                router.push(`/dashboard/take-assessment/${assignment.id}`);
            } else {
                alert('Não foi possível iniciar o inventário. Contate o suporte.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        } finally {
            setInitiating(false);
        }
    };

    // Calculo Dinâmico do Perfil
    const scoreExtroversion = ((answers[1] || 3) + (answers[2] || 3)) / 2;
    const profileText = scoreExtroversion > 3.5 ? "Liderança Inovadora e Comunicativa" : "Estratégia e Análise Profunda";

    if (hasTrialData) {
        return (
            <div className="space-y-8">
                {/* Trial Upsell Banner */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                     <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2">Olá, {user?.name || userInfo.name}! 👋</h2>
                        <p className="text-gray-300 mb-6 max-w-xl">
                            Identificamos que você iniciou sua jornada de autoconhecimento. 
                            Seu perfil preliminar indica alta compatibilidade com <strong>{profileText}</strong>.
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            {hasCredits ? (
                                pendingAssessment ? (
                                    <Link href={`/dashboard/take-assessment/${pendingAssessment.id}`}>
                                        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                                            <ArrowUpRight className="w-5 h-5" />
                                            Finalizar Inventário
                                        </button>
                                    </Link>
                                ) : (
                                    <button 
                                        onClick={handleInitAssessment}
                                        disabled={initiating}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                                    >
                                        <ArrowUpRight className="w-5 h-5" />
                                        {initiating ? 'Iniciando...' : 'Iniciar Inventário'}
                                    </button>
                                )
                            ) : (
                                <Link href="/dashboard/plans">
                                    <button className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                                        <ArrowUpRight className="w-5 h-5" />
                                        Desbloquear Relatório Completo
                                    </button>
                                </Link>
                            )}
                            
                            <button 
                                onClick={() => {
                                    if(confirm('Isso irá remover seu resultado preliminar.')) resetTrial();
                                }}
                                className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm"
                            >
                                Dispensar Resultado
                            </button>
                        </div>
                     </div>
                </div>
                <ClientDashboard />
            </div>
        );
    }

    return <ClientDashboard />;
}

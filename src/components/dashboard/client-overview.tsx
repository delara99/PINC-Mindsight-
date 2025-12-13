'use client';
import { API_URL } from '@/src/config/api';
import { useAuthStore } from '@/src/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PlayCircle, Award, History, ArrowRight } from 'lucide-react';

export default function ClientDashboard() {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);

    const { data: assessments, isLoading } = useQuery({
        queryKey: ['my-assessments-history'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/assessments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar histórico');
            return response.json();
        },
        enabled: !!token
    });

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
                <h1 className="text-3xl font-bold mb-2">Olá, {user?.name || 'Candidato'}! 👋</h1>
                <p className="text-indigo-100 text-lg mb-6 max-w-2xl">
                    Bem-vindo à sua área de desenvolvimento. Você tem avaliações pendentes para completar.
                </p>
                <div className="flex flex-wrap gap-4">
                    <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10">
                        <span className="block text-xs font-bold uppercase tracking-wider opacity-70">Seus Créditos</span>
                        <span className="text-3xl font-bold">{user?.credits || 0}</span>
                    </div>
                </div>
                <div className="mt-8">
                    <Link href="/dashboard/my-assessments">
                        <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg">
                            <PlayCircle size={20} />
                            Responder Avaliações
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                            <Award size={20} />
                        </div>
                        <h2 className="font-bold text-gray-800">Meus Resultados</h2>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                        Visualize os relatórios detalhados das avaliações que você já completou.
                    </p>
                    <Link href="/dashboard/my-assessments">
                        <button className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
                            Acessar Relatórios <ArrowRight size={16} />
                        </button>
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <History size={20} />
                        </div>
                        <h2 className="font-bold text-gray-800">Histórico de Atividades</h2>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-sm text-gray-400 text-center py-4">Carregando...</div>
                        ) : assessments?.length > 0 ? (
                            assessments.slice(0, 5).map((assessment: any) => (
                                <div key={assessment.id} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 text-sm">{assessment.title}</h4>
                                        <p className="text-xs text-gray-400">
                                            {new Date(assessment.assignedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${assessment.assignmentStatus === 'COMPLETED'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {assessment.assignmentStatus === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-400 text-center py-4">
                                Nenhuma atividade recente.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

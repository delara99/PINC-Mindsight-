'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { FileText, User, Calendar, Award } from 'lucide-react';
import { API_URL } from '@/src/config/api';

interface Report {
    id: string;
    userName: string;
    userEmail: string;
    assessmentTitle: string;
    completedAt: string;
    scores: Record<string, number>;
}

const TRAIT_TRANSLATIONS: Record<string, string> = {
    'OPENNESS': 'Abertura',
    'CONSCIENTIOUSNESS': 'Conscienciosidade',
    'EXTRAVERSION': 'Extroversão',
    'AGREEABLENESS': 'Amabilidade',
    'NEUROTICISM': 'Neuroticismo'
};

export default function ReportsPage() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);

    const { data: reports, isLoading } = useQuery<Report[]>({
        queryKey: ['reports'],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/assessments/completed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar relatórios');
            return response.json();
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
                <p className="text-gray-500 mt-1">{reports?.length || 0} avaliações completadas</p>
            </div>

            {!reports || reports.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Nenhum relatório gerado</h3>
                    <p className="text-gray-500 max-w-sm mt-2">
                        Assim que os candidatos responderem às avaliações, os relatórios aparecerão aqui.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <User size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{report.userName}</h3>
                                            <p className="text-sm text-gray-500">{report.userEmail}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} />
                                            <span>{report.assessmentTitle}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} />
                                            <span>{new Date(report.completedAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(report.scores).map(([trait, score]) => (
                                            <div
                                                key={trait}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg"
                                            >
                                                <Award size={14} className="text-blue-600" />
                                                <span className="text-xs font-medium text-blue-900">
                                                    {TRAIT_TRANSLATIONS[trait] || trait}: {score.toFixed(1)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                                    className="text-white hover:text-white/90 bg-[#cc0058] hover:bg-[#a30046] px-4 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto text-center"
                                >
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
'use client';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/store/auth-store';
import { FileText, User, Calendar, Award, CheckCircle, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { API_URL } from '../../../src/config/api';
import { useState } from 'react';

interface Report {
    id: string;
    userName: string;
    userEmail: string;
    assessmentTitle: string;
    completedAt: string;
    scores?: Record<string, number>;
    viewedByAdmin?: boolean;
    deletedAt?: string;
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
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

    // Query Ativos
    const { data: reports, isLoading: isLoadingReports } = useQuery<Report[]>({
        queryKey: ['reports'],
        queryFn: async () => {
             const response = await fetch(`${API_URL}/api/v1/assessments/completed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar relatórios');
            return response.json();
        }
    });

    // Query Deletados
    const { data: deletedReports, isLoading: isLoadingDeleted } = useQuery<Report[]>({
        queryKey: ['deleted-reports'],
        queryFn: async () => {
             const response = await fetch(`${API_URL}/api/v1/assessments/admin/deleted-list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar lixeira');
            return response.json();
        },
        enabled: activeTab === 'deleted'
    });

    const markAsViewedMutation = useMutation({
        mutationFn: async (reportId: string) => {
             const res = await fetch(`${API_URL}/api/v1/users/reports/${reportId}/mark-viewed`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao marcar como visualizado');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
    });

    const restoreMutation = useMutation({
        mutationFn: async (id: string) => {
             const res = await fetch(`${API_URL}/api/v1/assessments/${id}/restore`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao restaurar');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            queryClient.invalidateQueries({ queryKey: ['deleted-reports'] });
            alert('Inventário restaurado com sucesso! Ele voltou para a lista de ativos.');
        },
        onError: () => alert('Erro ao restaurar inventário.')
    });

    const currentData = activeTab === 'active' ? reports : deletedReports;
    const isLoading = activeTab === 'active' ? isLoadingReports : isLoadingDeleted;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
                    <p className="text-gray-500 mt-1">
                        {activeTab === 'active' 
                            ? `${reports?.length || 0} avaliações completadas` 
                            : `${deletedReports?.length || 0} avaliações na lixeira`}
                    </p>
                </div>
                
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'active' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                       Ativos
                    </button>
                    <button
                        onClick={() => setActiveTab('deleted')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                            activeTab === 'deleted' 
                                ? 'bg-white text-red-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                       <Trash2 size={16} />
                       Lixeira
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : !currentData || currentData.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        {activeTab === 'active' ? <FileText className="w-8 h-8 text-gray-400" /> : <Trash2 className="w-8 h-8 text-gray-400" />}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        {activeTab === 'active' ? 'Nenhum relatório gerado' : 'Lixeira vazia'}
                    </h3>
                    <p className="text-gray-500 max-w-sm mt-2">
                        {activeTab === 'active' 
                            ? 'Assim que os candidatos responderem às avaliações, os relatórios aparecerão aqui.' 
                            : 'Inventários excluídos pelos usuários aparecerão aqui.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {currentData.map((report) => (
                        <div
                            key={report.id}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                             {activeTab === 'deleted' && (
                                <div className="absolute top-0 right-0 bg-red-100 text-red-600 px-3 py-1 rounded-bl-xl text-xs font-bold">
                                    EXCLUÍDO
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <User size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{report.userName}</h3>
                                            <p className="text-sm text-gray-500">{report.userEmail}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} />
                                            <span>{report.assessmentTitle}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} />
                                            <span>{report.completedAt ? new Date(report.completedAt).toLocaleDateString('pt-BR') : 'Data não disp.'}</span>
                                        </div>
                                    </div>

                                    {report.scores && (
                                        <div className="flex flex-wrap gap-2">
                                        {Object.entries(report.scores).map(([trait, score]) => (
                                            <div
                                                key={trait}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg"
                                            >
                                                <Award size={14} className="text-blue-600" />
                                                <span className="text-xs font-medium text-blue-900">
                                                    {TRAIT_TRANSLATIONS[trait] || trait}: {typeof score === 'number' ? score.toFixed(1) : score}
                                                </span>
                                            </div>
                                        ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                    {activeTab === 'active' ? (
                                        <>
                                            <button
                                                onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                                                className="text-white hover:text-white/90 bg-[#cc0058] hover:bg-[#a30046] px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-center flex-shrink-0"
                                            >
                                                Ver Detalhes
                                            </button>

                                            {!report.viewedByAdmin && (
                                                <button
                                                    onClick={() => markAsViewedMutation.mutate(report.id)}
                                                    disabled={markAsViewedMutation.isPending}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-center flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <CheckCircle size={16} />
                                                    {markAsViewedMutation.isPending ? 'Marcando...' : 'Visualizado'}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if(confirm('Tem certeza que deseja restaurar este inventário? Ele voltará para o cliente.')) {
                                                    restoreMutation.mutate(report.id);
                                                }
                                            }}
                                            disabled={restoreMutation.isPending}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-center flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <RefreshCw size={16} />
                                            {restoreMutation.isPending ? 'Restaurando...' : 'Restaurar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
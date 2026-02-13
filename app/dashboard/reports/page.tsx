'use client';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/store/auth-store';
import { FileText, User, Calendar, Award, CheckCircle, Trash2, RefreshCw, AlertCircle, MessageCircle, Search, X } from 'lucide-react';
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
    'OPENNESS': 'ABERTURA À EXPERIÊNCIA',
    'CONSCIENTIOUSNESS': 'CONSCIENCIOSIDADE',
    'EXTRAVERSION': 'EXTROVERSÃO',
    'AGREEABLENESS': 'AMABILIDADE',
    'NEUROTICISM': 'ESTABILIDADE EMOCIONAL',
    'NEUROTICISMO': 'ESTABILIDADE EMOCIONAL', // Legacy
    'ESTABILIDADE': 'ESTABILIDADE EMOCIONAL'
};

const safeRenderScore = (score: any) => {
    if (typeof score === 'number') return score.toFixed(1);
    if (typeof score === 'string') return score;
    // Se for objeto (novo formato calculation engine?), extrair valor
    if (score && typeof score === 'object') {
        const val = score.score ?? score.normalizedScore ?? score.value ?? 0;
        return typeof val === 'number' ? val.toFixed(1) : String(val);
    }
    return '-';
};


export default function ReportsPage() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

    // Filtros Avançados
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [viewStatus, setViewStatus] = useState<'all' | 'viewed' | 'not_viewed'>('all');

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

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/api/v1/assessments/${id}/soft-delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao excluir');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            queryClient.invalidateQueries({ queryKey: ['deleted-reports'] });
            alert('Relatório movido para a lixeira! Você pode restaurá-lo a qualquer momento.');
        },
        onError: () => alert('Erro ao excluir relatório.')
    });


    const currentData = activeTab === 'active' ? reports : deletedReports;
    const isLoading = activeTab === 'active' ? isLoadingReports : isLoadingDeleted;

    // Lógica de Filtragem
    const filteredReports = currentData?.filter(report => {
        const matchesSearch = (
            report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.assessmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const matchesStatus =
            viewStatus === 'all' ? true :
                viewStatus === 'viewed' ? report.viewedByAdmin :
                    !report.viewedByAdmin;

        const reportDate = new Date(report.completedAt);
        // Ajuste de data para comparar corretamente (zerar horas do input)
        // new Date(startDate) retorna UTC, precisamos considerar timezone ou apenas string compare se formato for ISO
        // Vamos simplificar comparando timestamps
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T23:59:59') : null;

        const matchesStart = start ? reportDate >= start : true;
        const matchesEnd = end ? reportDate <= end : true;

        return matchesSearch && matchesStatus && matchesStart && matchesEnd;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
                        <p className="text-gray-500 mt-1">
                            Gerencie e analise os resultados das avaliações.
                        </p>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'active'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setActiveTab('deleted')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'deleted'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Trash2 size={16} />
                            Lixeira
                        </button>
                    </div>
                </div>

                {/* --- BARRA DE FILTROS AVANÇADA --- */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Busca Textual */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por nome, email ou teste..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 block w-full rounded-lg border-gray-300 bg-gray-50 border focus:bg-white focus:ring-primary focus:border-primary sm:text-sm py-2.5 transition-colors"
                            />
                        </div>

                        {/* Filtros de Data */}
                        <div className="flex gap-2">
                            <div className="relative">
                                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400">DE</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 bg-gray-50 border focus:bg-white focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 h-[42px]"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400">ATÉ</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 bg-gray-50 border focus:bg-white focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 h-[42px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100 pt-4">
                        {/* Filtro de Status Visual */}
                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                            <span className="text-xs font-bold text-gray-500 uppercase mr-2">Status:</span>
                            <button
                                onClick={() => setViewStatus('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${viewStatus === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                Todos ({currentData?.length || 0})
                            </button>
                            <button
                                onClick={() => setViewStatus('not_viewed')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap flex items-center gap-1 ${viewStatus === 'not_viewed' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${viewStatus === 'not_viewed' ? 'bg-red-500' : 'bg-gray-300'}`} />
                                Não Visualizados
                            </button>
                            <button
                                onClick={() => setViewStatus('viewed')}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap flex items-center gap-1 ${viewStatus === 'viewed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <CheckCircle size={12} />
                                Visualizados
                            </button>
                        </div>

                        {/* Botão Limpar e Contador */}
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-xs font-medium text-gray-400">
                                Exibindo <strong>{filteredReports?.length || 0}</strong> resultados
                            </span>
                            {(searchTerm || startDate || endDate || viewStatus !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStartDate('');
                                        setEndDate('');
                                        setViewStatus('all');
                                    }}
                                    className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                    <X size={14} /> Limpar Filtros
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : !filteredReports || filteredReports.length === 0 ? (
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
                    {filteredReports.map((report) => (
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
                                            <span>{report.completedAt ? new Date(report.completedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data não disp.'}</span>
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
                                                        {TRAIT_TRANSLATIONS[String(trait).toUpperCase()] || String(trait).toUpperCase()}: {safeRenderScore(score)}
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
                                                onClick={() => router.push(`/dashboard/my-report?reportId=${report.id}`)}
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-center flex items-center justify-center gap-2 flex-shrink-0"
                                            >
                                                <MessageCircle size={16} />
                                                Relatório TalkingTO
                                            </button>

                                            <button
                                                onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                                                className="text-white hover:text-white/90 bg-[#cc0058] hover:bg-[#a30046] px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-center flex-shrink-0"
                                            >
                                                Relatório Especialista
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (!report.viewedByAdmin) {
                                                        markAsViewedMutation.mutate(report.id);
                                                    }
                                                }}
                                                disabled={markAsViewedMutation.isPending || report.viewedByAdmin}
                                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-center flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-80
                                                    ${report.viewedByAdmin
                                                        ? 'bg-green-600 text-white cursor-default'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                            >
                                                <CheckCircle size={16} className={report.viewedByAdmin ? 'text-white' : 'text-gray-500'} />
                                                {markAsViewedMutation.isPending && !report.viewedByAdmin
                                                    ? 'Marcando...'
                                                    : report.viewedByAdmin ? 'Visualizado' : 'Não Visualizado'}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (confirm('⚠️ Tem certeza que deseja mover este relatório para a lixeira?\n\nVocê poderá restaurá-lo depois se necessário.')) {
                                                        deleteMutation.mutate(report.id);
                                                    }
                                                }}
                                                disabled={deleteMutation.isPending}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-center flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (confirm('Tem certeza que deseja restaurar este inventário? Ele voltará para o cliente.')) {
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
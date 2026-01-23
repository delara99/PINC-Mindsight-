'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import TalkingToReport from '@/src/components/reports/TalkingToReport';
import { useRouter } from 'next/navigation';

export default function EmployeeReportView() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        fetchReport();
    }, [userId]);

    const fetchReport = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            let assignmentId = '';

            // 1. Tentar buscar na lista de relatórios do negócio
            try {
                const listRes = await axios.get(`${API_URL}/api/v1/business/reports`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userReport = listRes.data.find((r: any) => r.userId === userId);
                if (userReport) {
                    assignmentId = userReport.reportId;
                }
            } catch (ignore) { }

            // 2. Se não achou na lista (ex: lista vazia ou erro), tentar buscar direto do usuário
            if (!assignmentId) {
                const directRes = await axios.get(`${API_URL}/api/v1/assessments/user/${userId}/completed`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (directRes.data && directRes.data.length > 0) {
                    assignmentId = directRes.data[0].id;
                }
            }

            if (!assignmentId) {
                setError('Relatório não encontrado.');
                setLoading(false);
                return;
            }

            // 3. Buscar Detalhe UNIFICADO (TalkingTO Engine)
            // Agora usamos o endpoint que garante o uso do motor inteligente
            const detailRes = await axios.get(`${API_URL}/api/v1/business/reports/${assignmentId}/unified`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Dados do Relatório Unificado:', detailRes.data);
            setReport(detailRes.data);
        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar o relatório detalhado.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Gerando análise comportamental (TalkingTO)...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="p-8 min-h-screen bg-slate-50">
                <Link href="/business/dashboard/reports" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 font-medium transition-colors">
                    <ArrowLeft size={18} />
                    Voltar para Relatórios
                </Link>
                <div className="bg-white border border-red-100 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">!</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar</h3>
                    <p className="text-slate-500">{error || 'Não foi possível encontrar o relatório solicitado.'}</p>
                </div>
            </div>
        );
    }

    const { user } = report;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 font-bold mb-2 transition-colors px-4 py-2 hover:bg-white rounded-lg"
                >
                    <ArrowLeft size={18} />
                    Voltar para Lista
                </button>

                <TalkingToReport
                    reportData={report}
                    userName={user?.name || 'Colaborador'}
                    isAdmin={true}
                />
            </div>
        </div>
    );
}

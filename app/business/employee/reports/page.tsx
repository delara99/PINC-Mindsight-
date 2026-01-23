'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { AlertCircle } from 'lucide-react';
import TalkingToReport from '@/src/components/reports/TalkingToReport';
import { useRouter } from 'next/navigation';

export default function EmployeeReports() {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const token = localStorage.getItem('accessToken');

            // 1. Get list
            const listRes = await axios.get(`${API_URL}/api/v1/assessments/my-assignments-list`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Find completed
            const completed = listRes.data.find((a: any) => a.assignmentStatus === 'COMPLETED');

            if (!completed) {
                setLoading(false);
                return;
            }

            // 2. Get Details (Triggers Calculation via Unified Engine)
            const idToFetch = completed.assignmentId || completed.id;

            // Usando rota unificada do Business para garantir motor TalkingTO
            const detailRes = await axios.get(`${API_URL}/api/v1/business/reports/${idToFetch}/unified`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Dados do Relatório (Colaborador):', detailRes.data);
            setReport(detailRes.data);

        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar seu relatório.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Gerando sua análise completa...</p>
            </div>
        </div>
    );

    if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-lg border border-red-100">{error}</div>;

    if (!report) {
        return (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="text-slate-400" size={40} />
                </div>
                <h3 className="text-slate-900 font-bold text-2xl mb-3">Relatório Indisponível</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    Você ainda não completou nenhuma avaliação de perfil. Responda o inventário para desbloquear sua análise completa.
                </p>
                <button
                    onClick={() => router.push('/business/employee/inventory')}
                    className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                >
                    Ir para Inventário
                </button>
            </div>
        );
    }

    const { user } = report;

    return (
        <div className="animate-in fade-in duration-500 pb-12">
            <TalkingToReport
                reportData={report}
                userName={user?.name || 'Você'}
                isAdmin={false}
            />
        </div>
    );
}

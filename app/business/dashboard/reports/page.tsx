'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Search, FileText, Loader2 } from 'lucide-react';
import { API_URL } from '@/src/config/api';
import TalkingToReport from '@/src/components/reports/TalkingToReport';
import { generateClientPDF } from '@/src/utils/generateClientPDF';

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // PDF Generation State
    const [pdfGenerating, setPdfGenerating] = useState<string | null>(null);
    const [pdfData, setPdfData] = useState<any>(null); // Full data for hidden report

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get(`${API_URL}/api/v1/business/reports`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setReports(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const handleGeneratePDF = async (reportId: string, userName: string) => {
        if (pdfGenerating) return; // Prevent double click
        setPdfGenerating(reportId);
        setPdfData(null);

        try {
            const token = localStorage.getItem('accessToken');

            // 1. Fetch Full Report Data (Detalhado / Unified)
            // Use reportId (que é o ID da avaliação) + /unified endpoint para garantir layout correto
            const res = await axios.get(`${API_URL}/api/v1/business/reports/${reportId}/unified`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Set Data -> Trigger Render of Hidden Component
            setPdfData({
                data: res.data,
                userName: userName
            });

            // 3. Aguarda renderização (via setTimeout para garantir DOM update)
            setTimeout(async () => {
                const success = await generateClientPDF('report-hidden-container', `Relatorio_${userName.replace(/\s+/g, '_')}`);
                if (!success) alert('Erro ao gerar PDF. Tente novamente.');

                // Cleanup
                setPdfGenerating(null);
                setPdfData(null);
            }, 2500); // Tempo para imagens carregarem no hidden container

        } catch (error) {
            console.error('Erro ao buscar dados completos:', error);
            alert('Erro ao buscar dados do relatório. Verifique se a conexão está ativa.');
            setPdfGenerating(null);
        }
    };

    return (
        <div>
            {/* --- HIDDEN CONTAINER FOR PDF GENERATION --- */}
            {pdfData && (
                <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '1200px', zIndex: -1 }}>
                    <div id="report-hidden-container" className="p-8 bg-slate-50">
                        <TalkingToReport
                            reportData={pdfData.data}
                            userName={pdfData.userName}
                            isAdmin={true}
                        // onDownloadPdf prop removida no modo passivo
                        />
                        {/* Footer for PDF */}
                        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
                            Relatório gerado automaticamente por PINC Mindsight - TalkingTO AI Technology
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Relatórios de Perfil</h1>
                <p className="text-slate-500">Acesse as análises detalhadas de seus colaboradores.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar relatório..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Colaborador</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Avaliação</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Concluído em</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Carregando relatórios...</td></tr>
                        ) : reports.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum relatório disponível.</td></tr>
                        ) : (
                            reports.map((report) => (
                                <tr key={report.reportId} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{report.userName}</div>
                                        <div className="text-xs text-slate-500">{report.userEmail}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                            {report.assessmentTitle}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(report.completedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => window.location.href = `/business/dashboard/reports/${report.userId}`}
                                                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-bold transition-colors"
                                            >
                                                <FileText size={18} />
                                                Visualizar
                                            </button>
                                            <button
                                                onClick={() => handleGeneratePDF(report.reportId, report.userName)}
                                                disabled={pdfGenerating !== null}
                                                className={`inline-flex items-center gap-2 font-bold transition-colors ${pdfGenerating === report.reportId ? 'text-purple-600 cursor-wait' : 'text-slate-600 hover:text-purple-600 disabled:opacity-30'}`}
                                            >
                                                {pdfGenerating === report.reportId ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <Download size={18} />
                                                )}
                                                {pdfGenerating === report.reportId ? 'Gerando...' : 'PDF'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

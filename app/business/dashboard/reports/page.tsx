
"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Search, FileText } from 'lucide-react';

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/reports`, {
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

    const handleDownload = async (userId: string, userName: string) => {
        setDownloading(userId);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/reports/${userId}/pdf`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Create Blob URL
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Relatorio_${userName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            alert('Erro ao baixar PDF. Verifique se o relatório está completo.');
            console.error(error);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div>
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
                                                onClick={() => handleDownload(report.userId, report.userName)}
                                                disabled={downloading === report.userId}
                                                className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 font-bold disabled:opacity-50 transition-colors"
                                            >
                                                {downloading === report.userId ? (
                                                    <span className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></span>
                                                ) : (
                                                    <Download size={18} />
                                                )}
                                                PDF
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

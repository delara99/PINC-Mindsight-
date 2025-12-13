'use client';
import { API_URL } from '@/src/config/api';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/src/store/auth-store';

export default function ViewReportPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const [loading, setLoading] = useState(true);

    const assignmentId = searchParams.get('assignmentId');
    const connectionId = params.id as string;

    const pdfUrl = `${API_URL}/api/v1/reports/download/${assignmentId}?token=${token}`;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `relatorio-${assignmentId}.pdf`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Voltar
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <h1 className="text-xl font-bold text-gray-900">
                            Relatório de Avaliação
                        </h1>
                    </div>

                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
                    >
                        <Download size={18} />
                        Baixar PDF
                    </button>
                </div>
            </div>

            {/* PDF Viewer */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
                    {loading && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                                <p className="text-gray-600">Carregando relatório...</p>
                            </div>
                        </div>
                    )}

                    <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title="Relatório PDF"
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setLoading(false);
                            alert('Erro ao carregar relatório. Verifique se o relatório existe.');
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

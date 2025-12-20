'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, User as UserIcon, Calendar, CheckCircle, Download } from 'lucide-react';
import { useAuthStore } from '@/src/store/auth-store';
import { BigFiveChart } from '@/src/components/dashboard/big-five-chart';
import { TraitCard } from '@/src/components/dashboard/TraitCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_URL } from '@/src/config/api';

export default function AssessmentDetailsPage() {
    const params = useParams();
    const { token } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [feedback, setFeedback] = useState('');
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const { data: assignment, isLoading, error } = useQuery({
        queryKey: ['assignment-details', params.id],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/assessments/assignments/${params.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Erro ${res.status}: ${errorText || res.statusText}`);
            }
            return res.json();
        },
        enabled: !!token // Só executa se tiver token
    });

    const submitFeedbackMutation = useMutation({
        mutationFn: async (feedbackData: { feedback: string }) => {
            const res = await fetch(`${API_URL}/api/v1/assessments/assignments/${params.id}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(feedbackData)
            });
            if (!res.ok) throw new Error('Erro ao salvar feedback');
            return res.json();
        },
        onSuccess: () => {
            alert('Feedback salvo com sucesso!');
            queryClient.invalidateQueries({ queryKey: ['assignment-details', params.id] });
        },
        onError: (err) => {
            alert('Erro ao salvar feedback: ' + err.message);
        }
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando detalhes...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Erro ao carregar detalhes: {error.message}</div>;

    const { user, assessment, responses, result } = assignment;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h1 className="text-2xl font-display font-bold text-gray-900">Detalhes da Avaliação</h1>
                {/* Botão Exportar PDF - Captura da Tela */}
                <button
                    onClick={async () => {
                        if (!reportRef.current) return;

                        setIsExporting(true);
                        try {
                            // Capturar o conteúdo da tela
                            const canvas = await html2canvas(reportRef.current, {
                                scale: 2, // Qualidade alta
                                useCORS: true,
                                logging: false,
                                backgroundColor: '#ffffff',
                                windowHeight: reportRef.current.scrollHeight,
                                windowWidth: reportRef.current.scrollWidth
                            });

                            // Criar PDF com múltiplas páginas se necessário
                            const imgData = canvas.toDataURL('image/png');
                            const pdf = new jsPDF({
                                orientation: 'portrait',
                                unit: 'mm',
                                format: 'a4'
                            });

                            const imgWidth = 210; // A4 width in mm
                            const pageHeight = 297; // A4 height in mm
                            const imgHeight = (canvas.height * imgWidth) / canvas.width;
                            let heightLeft = imgHeight;
                            let position = 0;

                            // Primeira página
                            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;

                            // Adicionar páginas extras se necessário
                            while (heightLeft > 0) {
                                position = heightLeft - imgHeight;
                                pdf.addPage();
                                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                                heightLeft -= pageHeight;
                            }

                            pdf.save(`relatorio-${user.name || 'candidato'}.pdf`);
                        } catch (error) {
                            console.error('Erro ao gerar PDF:', error);
                            alert('Erro ao exportar PDF');
                        } finally {
                            setIsExporting(false);
                        }
                    }}
                    disabled={isExporting}
                    className="ml-auto bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
                </button>
            </div>

            {/* Conteúdo capturável para PDF */}
            <div ref={reportRef}>

                {/* Informações do Candidato e Avaliação */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">{assessment.title}</h2>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                <UserIcon className="w-4 h-4 mr-1" />
                                {user.name || user.email}
                                <Calendar className="w-4 h-4 ml-4 mr-1" />
                                {new Date(assignment.completedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Concluído
                        </div>
                    </div>

                    {/* Detalhes por Traço - Usando dados calculados pela API com fallback */}
                    {assignment.calculatedScores?.scores?.length > 0 ? (
                        <div className="mt-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráfico de Competências</h3>
                            {assignment.calculatedScores.scores.map((trait: any, index: number) => (
                                <TraitCard
                                    key={index}
                                    traitName={trait.name}
                                    overallScore={trait.score}
                                    interpretation={(({
                                        'HIGH': 'Alto',
                                        'AVERAGE': 'Médio',
                                        'LOW': 'Baixo',
                                        'VERY_HIGH': 'Muito Alto',
                                        'VERY_LOW': 'Muito Baixo'
                                    })[trait.level as string] || trait.level)}
                                    facets={trait.facets?.map((f: any) => ({
                                        facet: f.facetName,
                                        normalizedScore: Math.max(0, typeof f.score === 'number' ? f.score : 0),
                                        rawScore: f.rawScore !== undefined ? Math.max(0, f.rawScore) : Math.max(0, ((typeof f.score === 'number' ? f.score : 0) / 20))
                                    })) || []}
                                    defaultExpanded={true}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Gráfico Radar - Usando dados calculados com fallback */}
                {/* Gráfico Radar - Usando dados calculados Corretos */}
                {assignment.calculatedScores?.scores ? (
                    (() => {
                        // Preparar dados achatados para o gráfico (Formato "Trait::Facet": score 0-5)
                        const chartData: Record<string, number> = {};

                        // Mapeamento de chaves EN para PT para o gráfico (nomes devem bater com os do BigFiveChart)
                        const traitTranslation: Record<string, string> = {
                            'OPENNESS': 'Abertura à Experiência',
                            'CONSCIENTIOUSNESS': 'Conscienciosidade',
                            'EXTRAVERSION': 'Extroversão',
                            'AGREEABLENESS': 'Amabilidade',
                            'NEUROTICISM': 'Estabilidade Emocional',
                            // Fallbacks
                            'Abertura a Experiências': 'Abertura à Experiência'
                        };

                        // Garantir que scores seja iterável (pode ser array ou objeto)
                        const scoresList = Array.isArray(assignment.calculatedScores.scores)
                            ? assignment.calculatedScores.scores
                            : Object.values(assignment.calculatedScores.scores);

                        scoresList.forEach((trait: any) => {
                            const traitNamePT = traitTranslation[trait.traitKey] || traitTranslation[trait.traitName] || trait.traitName;

                            if (trait.facets && trait.facets.length > 0) {
                                trait.facets.forEach((facet: any) => {
                                    // O gráfico espera score 0-5
                                    // facet.score vem 0-100 agora
                                    chartData[`${traitNamePT}::${facet.facetName}`] = (typeof facet.score === 'number' ? facet.score : 0) / 20;
                                });
                            }
                        });

                        return Object.keys(chartData).length > 0 ? (
                            <BigFiveChart scores={chartData} />
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mt-6">
                                <p className="text-yellow-800 font-medium">⚠️ Dados de facetas insuficientes para o gráfico.</p>
                            </div>
                        );
                    })()
                ) : result?.scores && typeof result.scores === 'object' && Object.keys(result.scores).length > 0 ? (
                    <BigFiveChart scores={result.scores} />
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mt-6">
                        <p className="text-yellow-800 font-medium">⚠️ Aguardando cálculo de scores...</p>
                    </div>
                )}

                {/* Respostas Detalhadas - Melhorado */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Respostas do Candidato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {assessment.questions.map((question: any, index: number) => {
                            const response = responses.find((r: any) => r.questionId === question.id);
                            return (
                                <div key={question.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-600 font-medium mb-1.5 line-clamp-2">
                                        {index + 1}. {question.text}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">Resposta:</span>
                                        <span className="text-sm font-bold text-primary">{response ? response.answer : '-'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Área de Feedback */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback do Administrador</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Este feedback ficará visível para o candidato na área "Minhas Avaliações".
                    </p>
                    <textarea
                        className="w-full min-h-[150px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-y"
                        placeholder="Escreva aqui sua avaliação e observações sobre o perfil do candidato..."
                        defaultValue={assignment.feedback || ''}
                        onChange={(e) => setFeedback(e.target.value)}
                    ></textarea>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => submitFeedbackMutation.mutate({ feedback: feedback || assignment.feedback })}
                            disabled={submitFeedbackMutation.isPending}
                            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                        >
                            <Save className="w-4 h-4" />
                            {submitFeedbackMutation.isPending ? 'Salvando...' : 'Salvar Feedback'}
                        </button>
                    </div>
                </div>
            </div>{/* Fim do conteúdo capturável */}
        </div>
    );
}

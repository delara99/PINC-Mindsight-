'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, User as UserIcon, Calendar, CheckCircle, Download, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../../src/store/auth-store';
import { BigFiveChart } from '../../../../src/components/dashboard/big-five-chart';
import { TraitCard } from '../../../../src/components/dashboard/TraitCard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_URL } from '../../../../src/config/api';

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

                    {/* Detalhes por Traço - Processar dados salvos */}
                    {(() => {
                        // Tentar usar calculatedScores primeiro, senão processar result.scores
                        const calcScores = assignment.calculatedScores?.scores;
                        const hasCalcScores = calcScores && (Array.isArray(calcScores) ? calcScores.length > 0 : Object.keys(calcScores).length > 0);

                        if (hasCalcScores) {
                            const scoresList = Array.isArray(calcScores) ? calcScores : Object.values(calcScores);
                            return (
                                <div className="mt-6 space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise por Traço de Personalidade</h3>
                                    {scoresList.map((trait: any, index: number) => {
                                        // Tradução dos nomes de traços para português
                                        const traitTranslation: Record<string, string> = {
                                            'OPENNESS': 'Abertura à Experiência',
                                            'CONSCIENTIOUSNESS': 'Conscienciosidade',
                                            'EXTRAVERSION': 'Extroversão',
                                            'AGREEABLENESS': 'Amabilidade',
                                            'NEUROTICISM': 'Estabilidade Emocional',
                                            'Neuroticismo': 'Estabilidade Emocional'
                                        };
                                        const keyToUse = trait.traitKey || trait.traitName || trait.name;
                                        const displayName = traitTranslation[keyToUse] || keyToUse;

                                        return (
                                            <TraitCard
                                                key={index}
                                                traitName={displayName}
                                                overallScore={trait.score}
                                                interpretation={((({
                                                    'HIGH': 'Alto',
                                                    'AVERAGE': 'Médio',
                                                    'LOW': 'Baixo',
                                                    'VERY_HIGH': 'Muito Alto',
                                                    'VERY_LOW': 'Muito Baixo'
                                                })[trait.level as string] || trait.level))}
                                                facets={trait.facets?.map((f: any) => ({
                                                    facet: f.name || f.facetName || f.facet, // Fallback robusto para nome da faceta
                                                    normalizedScore: Math.max(0, typeof f.score === 'number' ? f.score : 0),
                                                    rawScore: f.rawScore !== undefined ? Math.max(0, f.rawScore) : Math.max(0, ((typeof f.score === 'number' ? f.score : 0) / 20))
                                                })) || []}
                                                customTexts={{
                                                    summary: trait.customTexts?.summary || trait.interpretation, // Use Backend Description (Config Ativa) as fallback
                                                    practicalImpact: trait.customTexts?.practicalImpact,
                                                    expertSynthesis: trait.customTexts?.expertSynthesis,
                                                    expertHypothesis: trait.customTexts?.expertHypothesis
                                                }}
                                                defaultExpanded={true}
                                            />
                                        )
                                    })}
                                </div>
                            );
                        }

                        // Processar result.scores (formato: "Traço::Faceta": score)
                        if (result?.scores && typeof result.scores === 'object') {
                            const scoresByTrait: Record<string, { facets: Array<{ name: string; score: number }> }> = {};

                            Object.entries(result.scores).forEach(([key, score]) => {
                                if (typeof key === 'string' && key.includes('::')) {
                                    const [traitName, facetName] = key.split('::');
                                    if (!scoresByTrait[traitName]) {
                                        scoresByTrait[traitName] = { facets: [] };
                                    }
                                    scoresByTrait[traitName].facets.push({
                                        name: facetName,
                                        score: typeof score === 'number' ? score : 0
                                    });
                                }
                            });

                            if (Object.keys(scoresByTrait).length > 0) {
                                return (
                                    <div className="mt-6 space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise por Traço de Personalidade</h3>
                                        {Object.entries(scoresByTrait).map(([traitName, data]) => {
                                            // Tradução dos nomes de traços para português
                                            const traitTranslation: Record<string, string> = {
                                                'OPENNESS': 'Abertura à Experiência',
                                                'CONSCIENTIOUSNESS': 'Conscienciosidade',
                                                'EXTRAVERSION': 'Extroversão',
                                                'AGREEABLENESS': 'Amabilidade',
                                                'NEUROTICISM': 'Estabilidade Emocional',
                                                'Neuroticismo': 'Estabilidade Emocional'
                                            };
                                            const keyToUse = traitName;
                                            const displayName = traitTranslation[keyToUse] || keyToUse;
                                            const avgScore = data.facets.reduce((sum, f) => sum + f.score, 0) / data.facets.length;
                                            const normalizedAvg = avgScore * 20; // Converter 0-5 para 0-100

                                            let interpretation = 'Médio';
                                            if (normalizedAvg >= 80) interpretation = 'Muito Alto';
                                            else if (normalizedAvg >= 60) interpretation = 'Alto';
                                            else if (normalizedAvg >= 40) interpretation = 'Médio';
                                            else if (normalizedAvg >= 20) interpretation = 'Baixo';
                                            else interpretation = 'Muito Baixo';

                                            return (
                                                <TraitCard
                                                    key={traitName}
                                                    traitName={displayName}
                                                    overallScore={normalizedAvg}
                                                    interpretation={interpretation}
                                                    facets={data.facets.map(f => {
                                                        // Backend retorna 0-100, não precisa multiplicar
                                                        const scoreValue = typeof f.score === 'number' ? f.score : 0;
                                                        return {
                                                            facet: f.name,
                                                            normalizedScore: Math.round(Math.max(0, Math.min(100, scoreValue))),
                                                            rawScore: scoreValue / 20 // Converter 0-100 para 0-5
                                                        };
                                                    })}
                                                    defaultExpanded={true}
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            }
                        }

                        return null;
                    })()}
                </div>

                {/* --- SEÇÕES INTERPRETATIVAS AVANÇADAS (ADMIN VIEW) --- */}
                {assignment.calculatedScores?.interpretationSections && assignment.calculatedScores.interpretationSections.length > 0 && (
                    <div className="space-y-6 mt-8 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2 rounded-lg shadow-sm">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Análise Avançada de Padrões</h2>
                        </div>

                        {assignment.calculatedScores.interpretationSections.map((section: any) => (
                            <div key={section.code} className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6 border-l-4 border-violet-500 pl-4">
                                    <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                                </div>
                                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {section.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Gráfico Radar - Priorizar Calculated Scores (Tempo Real) */}
                {assignment.calculatedScores?.scores ? (
                    (() => {
                        // Preparar dados achatados para o gráfico (Formato "Trait::Facet": score 0-5)
                        const chartData: Record<string, number> = {};

                        // Mapeamento completo de chaves EN para PT para o gráfico
                        const traitTranslation: Record<string, string> = {
                            'OPENNESS': 'Abertura à Experiência',
                            'CONSCIENTIOUSNESS': 'Conscienciosidade',
                            'EXTRAVERSION': 'Extroversão',
                            'AGREEABLENESS': 'Amabilidade',
                            'NEUROTICISM': 'Estabilidade Emocional',
                            'Neuroticismo': 'Estabilidade Emocional',
                            // Variações e Fallbacks
                            'Openness': 'Abertura à Experiência',
                            'Conscientiousness': 'Conscienciosidade',
                            'Extraversion': 'Extroversão',
                            'Agreeableness': 'Amabilidade',
                            'Neuroticism': 'Estabilidade Emocional',
                            'Abertura a Experiências': 'Abertura à Experiência',
                            'Abertura': 'Abertura à Experiência',
                            'Estabilidade': 'Estabilidade Emocional'
                        };

                        // Garantir que scores seja iterável (pode ser array ou objeto)
                        const scoresList = Array.isArray(assignment.calculatedScores.scores)
                            ? assignment.calculatedScores.scores
                            : Object.values(assignment.calculatedScores.scores);

                        scoresList.forEach((trait: any) => {
                            // DEBUG: Log do trait completo
                            console.log('[Report] Processing trait:', {
                                traitKey: trait.traitKey,
                                traitName: trait.traitName,
                                name: trait.name,
                                facetsCount: trait.facets?.length || 0
                            });

                            // SEMPRE traduzir usando a chave inglesa primeiro, depois o nome
                            let traitNamePT = traitTranslation[trait.traitKey];

                            // Se não encontrou pela chave, tentar pelo nome
                            if (!traitNamePT) {
                                traitNamePT = traitTranslation[trait.traitName];
                            }

                            // Se ainda não encontrou, tentar por trait.name
                            if (!traitNamePT) {
                                traitNamePT = traitTranslation[trait.name];
                            }

                            // Se ainda não encontrou, usar o valor original (mas garantir que não seja undefined)
                            if (!traitNamePT) {
                                traitNamePT = trait.traitName || trait.name || trait.traitKey || 'Traço Desconhecido';
                            }

                            // VALIDAÇÃO FINAL: Se ainda for undefined/null, pular este trait
                            if (!traitNamePT || traitNamePT === 'undefined' || traitNamePT === 'null') {
                                console.warn('[Report] ⚠️ Pulando trait com nome inválido:', trait);
                                return; // Pular este trait
                            }

                            console.log('[Report] ✅ Using trait name:', traitNamePT);

                            if (trait.facets && trait.facets.length > 0) {
                                trait.facets.forEach((facet: any) => {
                                    // O gráfico espera score 0-5
                                    // facet.score vem 0-100 agora (do service v2)
                                    // Se vier rawScore (0-5), usar direto? Não, o service retorna score=0-100.
                                    // Mas vamos garantir: se for > 5, assume 0-100 e divide por 20.
                                    let val = typeof facet.score === 'number' ? facet.score : 0;
                                    if (val > 5) val = val / 20;

                                    const facetNameFinal = facet.name || facet.facetName || 'Faceta Desconhecida';

                                    console.log('[Report] Adding to chart:', `${traitNamePT}::${facetNameFinal} = ${val}`);
                                    chartData[`${traitNamePT}::${facetNameFinal}`] = val;
                                });
                            }
                        });

                        return Object.keys(chartData).length > 0 ? (
                            <BigFiveChart scores={chartData} />
                        ) : (
                            // Fallback para tentar result.scores se o calculated score falhou nas facetas (ex: config antiga)
                            result?.scores && typeof result.scores === 'object' && Object.keys(result.scores).length > 0 ? (
                                <BigFiveChart scores={result.scores} />
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mt-6">
                                    <p className="text-yellow-800 font-medium">⚠️ Nenhuma faceta encontrada nos dados calculados.</p>
                                </div>
                            )
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dúvidas sobre seu resultado</h3>
                    <textarea
                        className="w-full min-h-[150px] p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-y text-sm"
                        placeholder="Utilize este espaço para descrever suas dúvidas ou pontos que gostaria de aprofundar sobre o seu resultado. O especialista terá acesso ao seu inventário completo e utilizará essa informação para orientar o atendimento."
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
                            {submitFeedbackMutation.isPending ? 'Enviando...' : 'Enviar para o especialista'}
                        </button>
                    </div>
                </div>
            </div>{/* Fim do conteúdo capturável */}
        </div>
    );
}

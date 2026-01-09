'use client';
import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Target, Brain, Heart, Users, Sparkles, TrendingUp, AlertCircle, Download, Share2, Lightbulb, Briefcase } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FacetScore {
    facet: string;
    rawScore: number;
    normalizedScore: number;
}

interface TraitScore {
    trait: string;
    rawScore: number;
    normalizedScore: number;
    interpretation: string;
    description: string;
    facets: FacetScore[];
    customTexts?: {
        summary?: string;
        practicalImpact?: { context: string; text: string }[];
        expertSynthesis?: string;
        expertHypothesis?: { type: string; text: string }[];
    };
}

interface BigFiveResultProps {
    result: {
        totalQuestions: number;
        answeredQuestions: number;
        completionPercentage: number;
        traits: TraitScore[];
        recommendations: string[];
        interpretationSections?: { code: string; title: string; content: string; order: number }[];
        timestamp: Date;
    };
}

const traitIcons: Record<string, any> = {
    'Abertura à Experiência': Sparkles,
    'Conscienciosidade': Target,
    'Extroversão': Users,
    'Amabilidade': Heart,
    'Estabilidade Emocional': Brain
};

const traitColors: Record<string, string> = {
    'Abertura à Experiência': 'from-purple-500 to-pink-500',
    'Conscienciosidade': 'from-blue-500 to-cyan-500',
    'Extroversão': 'from-orange-500 to-yellow-500',
    'Amabilidade': 'from-green-500 to-emerald-500',
    'Estabilidade Emocional': 'from-indigo-500 to-purple-500'
};

const interpretationColors: Record<string, string> = {
    'Muito Alto': 'bg-green-100 text-green-800 border-green-300',
    'Alto': 'bg-blue-100 text-blue-800 border-blue-300',
    'Médio': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Baixo': 'bg-orange-100 text-orange-800 border-orange-300',
    'Muito Baixo': 'bg-red-100 text-red-800 border-red-300'
};

const traitShortNames: Record<string, string> = {
    'Abertura à Experiência': 'Abertura',
    'Conscienciosidade': 'Consciência',
    'Extroversão': 'Extroversão',
    'Amabilidade': 'Amabilidade',
    'Estabilidade Emocional': 'Estabilidade'
};

export default function BigFiveResults({ result }: BigFiveResultProps) {
    const [expandedTrait, setExpandedTrait] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const toggleTrait = (trait: string) => {
        setExpandedTrait(expandedTrait === trait ? null : trait);
    };

    // Preparar dados para radar chart
    const radarData = result.traits.map(trait => ({
        trait: traitShortNames[trait.trait] || trait.trait,
        score: Math.round(trait.normalizedScore),
        fullMark: 100
    }));

    // Exportar para PDF
    const exportToPDF = async () => {
        if (!contentRef.current) return;

        try {
            setExporting(true);

            // Capturar conteúdo como imagem
            const canvas = await html2canvas(contentRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Dimensões A4
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth - 20; // Margem de 10mm de cada lado
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 10; // Margem superior

            // Adicionar imagem (primeira página)
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight - 20;

            // Se precisar de mais páginas
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight - 20;
            }

            // Download
            const date = new Date().toISOString().split('T')[0];
            pdf.save(`perfil-big-five-${date}.pdf`);

        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div ref={contentRef} className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-pink-600 text-white rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Seu Perfil de Personalidade</h1>
                        <p className="text-white/90 text-base md:text-lg">Baseado no modelo Big Five de personalidade</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={16} />
                                <span>{result.answeredQuestions} de {result.totalQuestions} perguntas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} />
                                <span>{result.completionPercentage}% completo</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={exportToPDF}
                            disabled={exporting}
                            className="w-full md:w-auto justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {exporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    Exportar PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-2xl p-4 md:p-8 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Gráfico Radar - Visão Geral</h2>
                <div className="h-64 md:h-96 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis
                                dataKey="trait"
                                tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                            />
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke="#EC1B8E"
                                fill="#EC1B8E"
                                fillOpacity={0.6}
                                strokeWidth={3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Circular Progress Cards */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Scores por Traço</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {result.traits.map(trait => {
                        const Icon = traitIcons[trait.trait] || Brain;

                        return (
                            <div key={trait.trait} className="text-center p-2">
                                <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-3">
                                    {/* Circular Progress */}
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="50%"
                                            cy="50%"
                                            r="45%"
                                            stroke="#e5e7eb"
                                            strokeWidth="8"
                                            fill="none"
                                        />
                                        <circle
                                            cx="50%"
                                            cy="50%"
                                            r="45%"
                                            stroke="#EC1B8E"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeLinecap="round"
                                            pathLength={100} // Simplificando cálculo SVG
                                            strokeDasharray="100" // reset
                                            strokeDashoffset={100 - trait.normalizedScore}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <Icon className="mx-auto mb-1 text-primary w-4 h-4 md:w-5 md:h-5" />
                                            <span className="text-base md:text-lg font-bold text-gray-800">{Math.round(trait.normalizedScore)}</span>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-xs font-semibold text-gray-700 leading-tight">{trait.trait}</h3>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Trait Details */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Detalhamento por Traço</h2>

                {result.traits.map(trait => {
                    const Icon = traitIcons[trait.trait] || Brain;
                    const isExpanded = expandedTrait === trait.trait;
                    const interpretationColor = interpretationColors[trait.interpretation] || interpretationColors['Médio'];

                    return (
                        <div key={trait.trait} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Trait Header */}
                            <button
                                onClick={() => toggleTrait(trait.trait)}
                                className="w-full p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-gray-50 transition-colors gap-4"
                            >
                                <div className="flex items-center gap-4 flex-1 w-full">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Icon className="text-white" size={24} />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-800 truncate">{trait.trait}</h3>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{trait.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 pl-[4rem] md:pl-0">
                                    <div className="text-left md:text-right">
                                        <div className="text-2xl md:text-3xl font-bold text-gray-800">{Math.round(trait.normalizedScore)}</div>
                                        <div className={`text-xs font-semibold px-3 py-1 rounded-full border mt-1 inline-block ${interpretationColor}`}>
                                            {trait.interpretation}
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                </div>
                            </button>

                            {/* Facets (Expandable) */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50 p-6">
                                    {/* --- Custom Interpretative Texts --- */}
                                    {trait.customTexts && (
                                        <div className="mb-8 p-6 bg-white rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>

                                            {trait.customTexts.summary && (
                                                <div className="mb-6">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 uppercase tracking-wide mb-2">
                                                        <Sparkles className="w-4 h-4 text-indigo-500" /> Resumo do Comportamento
                                                    </h4>
                                                    <p className="text-gray-700 leading-relaxed text-base">{trait.customTexts.summary}</p>
                                                </div>
                                            )}

                                            {trait.customTexts.practicalImpact && trait.customTexts.practicalImpact.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3">
                                                        <Briefcase className="w-4 h-4 text-indigo-500" /> Impacto Prático
                                                    </h4>
                                                    <div className="grid gap-3">
                                                        {trait.customTexts.practicalImpact.map((p, idx) => (
                                                            <div key={idx} className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                                                {p.context && <span className="block text-xs font-bold text-indigo-600 uppercase mb-1">{p.context}</span>}
                                                                <span className="text-gray-800 text-sm">{p.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {trait.customTexts.expertSynthesis && (
                                                <div className="mt-6 pt-6 border-t border-indigo-50">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-purple-900 uppercase tracking-wide mb-3">
                                                        <Lightbulb className="w-4 h-4 text-purple-500" /> Síntese do Especialista
                                                    </h4>
                                                    <div className="bg-purple-50 p-4 rounded-lg text-purple-900 italic text-sm border-l-4 border-purple-400">
                                                        "{trait.customTexts.expertSynthesis}"
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Facetas Detalhadas</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {trait.facets.map(facet => (
                                            <div key={facet.facet} className="bg-white rounded-lg p-4 border border-gray-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold text-gray-700">{facet.facet}</span>
                                                    <span className="text-lg font-bold text-primary">{Math.round(facet.normalizedScore)}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-primary to-pink-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${facet.normalizedScore}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>


            {/* Advanced Interpretation Sections */}
            {
                result.interpretationSections && result.interpretationSections.length > 0 && (
                    <div className="space-y-6 mt-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Análise Avançada de Padrões</h2>
                        </div>

                        <div className="grid gap-8">
                            {result.interpretationSections?.map((section: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transition-all hover:shadow-xl">
                                    <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                                        <div className="h-6 w-1 bg-purple-500 rounded-full"></div>
                                        <h3 className="text-xl font-bold text-gray-800">
                                            {section.title}
                                        </h3>
                                    </div>
                                    <div className="p-8">
                                        <div
                                            className="prose prose-lg prose-indigo max-w-none text-gray-600 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: section.content }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Recommendations */}
            {
                result.recommendations && result.recommendations.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <TrendingUp className="text-white" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Recomendações de Desenvolvimento</h2>
                        </div>
                        <p className="text-gray-600 mb-6">Baseado no seu perfil, sugerimos as seguintes ações:</p>
                        <div className="space-y-3">
                            {result.recommendations.map((rec, index) => (
                                <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-blue-200">
                                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <p className="text-gray-700">{rec}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Disclaimer */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-sm text-gray-600">
                <p className="font-semibold text-gray-700 mb-2">📋 Sobre este relatório:</p>
                <p>Este perfil de personalidade é baseado no modelo científico Big Five e tem fins informativos e de desenvolvimento profissional.
                    Os resultados refletem suas respostas neste momento específico e podem variar ao longo do tempo.
                    Não devem ser usados como única base para decisões críticas de carreira ou seleção.</p>
            </div>
        </div>
    );
}

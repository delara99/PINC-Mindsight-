'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { FileBarChart, Download, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function EmployeeReports() {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

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

            // 2. Get Details (Triggers Calculation)
            const detailRes = await axios.get(`${API_URL}/api/v1/assessments/assignments/${completed.assignmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Report Data:', detailRes.data);
            setReport(detailRes.data);

        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar seu relatório.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Carregando relatório...</div>;
    if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-lg border border-red-100">{error}</div>;

    if (!report) {
        return (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="text-slate-400" size={32} />
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-2">Nenhum relatório disponível</h3>
                <p className="text-slate-500">
                    Você ainda não completou nenhuma avaliação. Vá para "Responder Inventário" para começar.
                </p>
            </div>
        );
    }

    const { calculatedScores } = report;
    const scores = calculatedScores?.scores || [];
    const advancedSections = calculatedScores?.interpretationSections || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Seu Relatório TalkingTO</h1>
                    <p className="text-slate-500">Análise detalhada do seu perfil comportamental.</p>
                </div>
                <button disabled className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-bold text-sm cursor-not-allowed">
                    <Download size={16} /> Exportar PDF (Em breve)
                </button>
            </header>

            {/* Main Insights Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                {scores.map((trait: any) => (
                    <div key={trait.key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-700 text-sm">{trait.name}</h3>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trait.level === 'ALTO' ? 'bg-red-50 text-red-600' :
                                trait.level === 'BAIXO' ? 'bg-blue-50 text-blue-600' :
                                    'bg-yellow-50 text-yellow-600'
                                }`}>{trait.level || 'MÉDIO'}</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 mb-1">{trait.score}<span className="text-xs text-slate-400 font-normal">/100</span></div>

                        {/* Mini Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-slate-900 rounded-full" style={{ width: `${trait.score}%` }}></div>
                        </div>

                        {trait.interpretation && (
                            <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                                {trait.interpretation.length > 80 ? trait.interpretation.slice(0, 80) + '...' : trait.interpretation}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Detailed Analysis Sections (TalkingTO Logic) */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileBarChart className="text-purple-600" size={24} />
                    Interpretação Aprofundada
                </h2>

                {scores.map((trait: any) => (
                    <div key={trait.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {trait.name}
                                <span className="text-sm font-normal text-slate-500">({trait.score} - {trait.level})</span>
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Custom Texts from CMS if available */}
                            {trait.customTexts ? (
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-purple-900 text-sm leading-relaxed">
                                    {trait.customTexts.text_interpretation}
                                </div>
                            ) : (
                                <p className="text-slate-600 leading-relaxed">
                                    {trait.interpretation || "Análise detalhada não disponível."}
                                </p>
                            )}

                            {/* Facetas se houver */}
                            {trait.facets && trait.facets.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {trait.facets.map((facet: any) => (
                                        <div key={facet.name} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                                            <span className="text-slate-600">{facet.name}</span>
                                            <span className="font-bold text-slate-900">{facet.level}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Needs & Risks (se disponível no customTexts) */}
                            {trait.customTexts && trait.customTexts.needs && (
                                <div className="grid md:grid-cols-2 gap-4 mt-4">
                                    <div className="p-3 bg-green-50 rounded border border-green-100">
                                        <span className="block text-xs font-bold text-green-700 uppercase mb-1">Motivador</span>
                                        <p className="text-sm text-green-900">{trait.customTexts.needs.primary}</p>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded border border-amber-100">
                                        <span className="block text-xs font-bold text-amber-700 uppercase mb-1">Risco Potencial</span>
                                        <p className="text-sm text-amber-900">{trait.customTexts.needs.risk}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Advanced Sections (Interpretation Engine) */}
                {advancedSections.map((section: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl border-l-4 border-l-purple-600 shadow-md p-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-3">{section.title}</h3>
                        <div className="prose prose-sm text-slate-600 max-w-none" dangerouslySetInnerHTML={{ __html: section.content }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

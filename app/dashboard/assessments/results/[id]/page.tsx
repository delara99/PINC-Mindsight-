'use client';
import { API_URL } from '../../../../../src/config/api';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../../src/store/auth-store';
import BigFiveResults from '../../../../../src/components/assessment/BigFiveResults';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

export default function AssessmentResultPage() {
    const params = useParams();
    const token = useAuthStore((state) => state.token);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const assessmentId = params.id as string;

    useEffect(() => {
        async function fetchResult() {
            if (!token || !assessmentId) {
                setError('Autenticação necessária');
                setLoading(false);
                return;
            }

            try {
                // Buscar assignment
                // Buscar assignment (Forçando atualização sem cache)
                const assignmentRes = await fetch(`${API_URL}/api/v1/assessments/assignments/${assessmentId}?_t=${Date.now()}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store'
                });

                if (!assignmentRes.ok) {
                    throw new Error('Avaliação não encontrada ou você não possui acesso');
                }

                const assignment = await assignmentRes.json();

                // ===== DEBUG CRÍTICO =====
                console.log('[FRONTEND DEBUG] Assignment recebido:', assignment);
                console.log('[FRONTEND DEBUG] calculatedScores existe?', !!assignment.calculatedScores);
                console.log('[FRONTEND DEBUG] calculatedScores.scores existe?', !!assignment.calculatedScores?.scores);
                console.log('[FRONTEND DEBUG] result existe?', !!assignment.result);
                // ===== FIM DEBUG =====

                // FIX: Priorizar scores calculados em tempo real (que incluem novos textos interpretativos)
                if (assignment.calculatedScores && assignment.calculatedScores.scores) {
                    console.log('[FRONTEND DEBUG] ✅ Usando cálculo em tempo real');

                    const baseResult = assignment.result?.data || {};

                    // CORREÇÃO: Mapear campos do backend para o formato esperado pelo BigFiveResults
                    const mappedTraits = assignment.calculatedScores.scores.map((trait: any) => ({
                        traitKey: trait.key,           // key → traitKey
                        traitName: trait.name,         // name → traitName
                        score: trait.score,
                        rawScore: trait.rawScore,
                        level: trait.level,
                        interpretation: trait.interpretation,
                        facets: trait.facets,
                        customTexts: trait.customTexts
                    }));

                    // Garantir estrutura compatível com BigFiveResults
                    const freshResult = {
                        ...baseResult,
                        traits: mappedTraits,  // Usar array mapeado
                        timeSpent: assignment.timeSpent,
                        // Defaults seguros caso baseResult falhe
                        answeredQuestions: baseResult.answeredQuestions || assignment.responses?.length || 0,
                        totalQuestions: baseResult.totalQuestions || 50,
                        completionPercentage: baseResult.completionPercentage || 100,
                        _debugSource: 'REAL_TIME_CALCULATION',
                        _debug: assignment.calculatedScores._debug,
                        _success: assignment.calculatedScores._success,
                        _textError: assignment.calculatedScores._textError,
                        _steps: assignment.calculatedScores._steps
                    };

                    setResult(freshResult);
                    setLoading(false);
                    return;
                }

                // Verificar se já tem resultado calculado (Snapshot Antigo)
                if (assignment.result && assignment.result.data) {
                    console.log('[FRONTEND DEBUG] ⚠️ Usando SNAPSHOT ANTIGO (calculatedScores não disponível)');
                    setResult({
                        ...assignment.result.data,
                        timeSpent: assignment.timeSpent,
                        _debugSource: 'OLD_SNAPSHOT',
                        _warning: 'Dados antigos - calculatedScores não retornado pelo backend'
                    });
                    setLoading(false);
                    return;
                }

                // Se não tem resultado, buscar respostas e calcular
                const responses = assignment.responses?.map((r: any) => ({
                    questionId: r.questionId,
                    value: r.answer || r.value
                })) || [];

                if (responses.length === 0) {
                    throw new Error('Nenhuma resposta encontrada para esta avaliação');
                }

                const calcRes = await fetch(`${API_URL}/api/v1/assessments/${assignment.assessment?.id || assessmentId}/calculate-big-five`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ responses })
                });

                if (!calcRes.ok) {
                    const errorData = await calcRes.json();
                    throw new Error(errorData.message || 'Erro ao calcular resultados');
                }

                const calculatedResult = await calcRes.json();
                setResult({ ...calculatedResult, timeSpent: assignment.timeSpent });

            } catch (err: any) {
                console.error('Erro:', err);
                setError(err.message || 'Erro ao carregar resultado');
            } finally {
                setLoading(false);
            }
        }

        fetchResult();
    }, [assessmentId, token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600">Calculando seu perfil de personalidade...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-20">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-red-600" />
                        <h2 className="text-lg font-bold text-red-800">Erro</h2>
                    </div>
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="max-w-2xl mx-auto mt-20">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-yellow-600" />
                        <h2 className="text-lg font-bold text-yellow-800">Sem Resultados</h2>
                    </div>
                    <p className="text-yellow-700">Nenhum resultado encontrado para esta avaliação.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* DEBUG: Mostrar fonte dos dados */}
            {result._debugSource && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${result._debugSource === 'REAL_TIME_CALCULATION'
                    ? 'bg-green-100 border border-green-300 text-green-800'
                    : 'bg-yellow-100 border border-yellow-300 text-yellow-800'
                    }`}>
                    <strong>DEBUG:</strong> {result._debugSource === 'REAL_TIME_CALCULATION' ? '✅ Dados Atualizados' : '⚠️ Dados Antigos (Snapshot)'}
                    {result._warning && <div className="text-xs mt-1">{result._warning}</div>}
                </div>
            )}

            {/* Mostrar erros detalhados do backend */}
            {result._debug && result._error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                    <div className="font-bold mb-2">🔴 ERRO NO BACKEND - Paso {result._step}: {result._stepName}</div>
                    <div className="text-sm mb-2">Tipo: <code className="bg-red-200 px-2 py-1 rounded">{result._error}</code></div>
                    <div className="text-sm">Mensagem: {result._message}</div>
                    {result._stack && (
                        <details className="mt-2">
                            <summary className="cursor-pointer text-xs">Stack Trace</summary>
                            <pre className="text-xs mt-1 overflow-auto max-h-40 bg-red-200 p-2 rounded">{result._stack}</pre>
                        </details>
                    )}
                </div>
            )}

            {/* Mostrar avisos de textos */}
            {result._debug && result._textError && !result._error && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg text-sm">
                    <strong>⚠️ Aviso:</strong> Scores calculados com sucesso, mas textos interpretativos não foram carregados.
                    <div className="text-xs mt-1">Motivo: {result._textError}</div>
                </div>
            )}
            {result.timeSpent > 0 && (
                <div className="mb-6 flex justify-end">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100 shadow-sm">
                        <Clock size={16} />
                        Tempo de Realização: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                    </div>
                </div>
            )}
            {/* Debug visual removido para produção */}
            <BigFiveResults result={result} />
        </div>
    );
}

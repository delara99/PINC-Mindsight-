'use client';
import { API_URL } from '@/src/config/api';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/src/store/auth-store';
import BigFiveResults from '@/src/components/assessment/BigFiveResults';
import { Loader2, AlertCircle } from 'lucide-react';

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
                const assignmentRes = await fetch(`${API_URL}/api/v1/assessments/assignments/${assessmentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!assignmentRes.ok) {
                    throw new Error('Avaliação não encontrada ou você não possui acesso');
                }

                const assignment = await assignmentRes.json();

                // Verificar se já tem resultado calculado
                if (assignment.result && assignment.result.data) {
                    setResult({ ...assignment.result.data, timeSpent: assignment.timeSpent });
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
             {result.timeSpent > 0 && (
                <div className="mb-6 flex justify-end">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100 shadow-sm">
                        <Clock size={16} />
                        Tempo de Realização: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                    </div>
                </div>
            )}
            <BigFiveResults result={result} />
        </div>
    );
}

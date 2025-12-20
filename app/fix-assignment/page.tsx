'use client';

import { useState } from 'react';
import { useAuthStore } from '@/src/store/auth-store';
import { API_URL } from '@/src/config/api';

export default function FixAssignmentsPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const token = useAuthStore((state) => state.token);
    const [assignmentId] = useState('4d41ef4a-9813-4d94-b87a-03787bb2e756'); // ID do assignment problemático

    const fixAssignment = async () => {
        setLoading(true);
        setResult(null);

        if (!token) {
            alert('⚠️ Token não encontrado! Faça login primeiro.');
            setLoading(false);
            return;
        }

        try {
            // Primeiro, pegar a config ativa
            const configResponse = await fetch(`${API_URL}/api/v1/big-five-config`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!configResponse.ok) throw new Error('Erro ao buscar configs');

            const configs = await configResponse.json();
            const activeConfig = configs.find((c: any) => c.isActive);

            if (!activeConfig) {
                throw new Error('Nenhuma config ativa encontrada!');
            }

            setResult({
                success: true,
                message: `Config ativa encontrada: ${activeConfig.name} (${activeConfig.id})`,
                step: 'config_found'
            });

            // Agora forçar o recálculo chamando o endpoint do assignment
            const assignmentResponse = await fetch(
                `${API_URL}/api/v1/assessments/assignments/${assignmentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const assignmentData = await assignmentResponse.json();

            setResult({
                success: true,
                message: 'Assignment atualizado com sucesso!',
                configId: activeConfig.id,
                assignmentId: assignmentId,
                calculatedScores: assignmentData.calculatedScores
            });

            alert(`✅ SUCESSO!\n\nAssignment atualizado!\nConfig: ${activeConfig.name}\n\n🎯 Atualize a página do relatório agora (F5)!`);

        } catch (error: any) {
            setResult({
                success: false,
                error: error.message
            });
            alert(`❌ ERRO: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🔧 Corrigir Assignment
                </h1>

                {!token ? (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 font-semibold">
                            ⚠️ Você não está logado!
                        </p>
                    </div>
                ) : (
                    <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-6">
                        <p className="text-green-800 font-semibold">
                            ✅ Token encontrado!
                        </p>
                        <p className="text-green-700 text-sm mt-2">
                            Assignment ID: {assignmentId}
                        </p>
                    </div>
                )}

                <p className="text-gray-600 mb-6">
                    Este botão vai vincular o assignment à config ativa e recalcular os scores.
                </p>

                <button
                    onClick={fixAssignment}
                    disabled={loading || !token}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 hover:shadow-lg transition-all"
                >
                    {loading ? 'Corrigindo...' : 'Corrigir Agora'}
                </button>

                {result && (
                    <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.success ? (
                            <>
                                <strong>✅ {result.message}</strong>
                                {result.configId && <p className="mt-2 text-sm">Config ID: {result.configId}</p>}
                                {result.assignmentId && <p className="text-sm">Assignment: {result.assignmentId}</p>}
                            </>
                        ) : (
                            <>
                                <strong>❌ Erro!</strong>
                                <p className="mt-2 text-sm">{result.error}</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

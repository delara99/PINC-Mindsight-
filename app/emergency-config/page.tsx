'use client';

import { useState } from 'react';
import { useAuthStore } from '../../src/store/auth-store';
import { API_URL } from '../../src/config/api';

export default function EmergencyConfigPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const token = useAuthStore((state) => state.token);

    const createConfig = async () => {
        setLoading(true);
        setResult(null);

        if (!token) {
            alert('⚠️ Token não encontrado!\n\nVocê precisa estar logado no sistema.\nVá para a página de login primeiro.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/reset-config`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: data.message,
                    configId: data.configId,
                    traits: data.traits,
                    facets: data.facets
                });
                alert(`✅ SUCESSO!\n\n${data.message}\n\nConfig ID: ${data.configId}\nTraços: ${data.traits}\nFacetas: ${data.facets}\n\n🎯 Agora atualize a página dos relatórios (F5)!`);
            } else {
                throw new Error(data.message || 'Erro desconhecido');
            }
        } catch (error: any) {
            setResult({
                success: false,
                error: error.message
            });
            alert(`❌ ERRO: ${error.message}\n\nVerifique se você tem permissão de admin.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🚨 Emergência Big Five
                </h1>

                {!token ? (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 font-semibold">
                            ⚠️ Você não está logado!
                        </p>
                        <p className="text-yellow-700 text-sm mt-2">
                            Por favor, faça login primeiro e depois volte a esta página.
                        </p>
                    </div>
                ) : (
                    <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-6">
                        <p className="text-green-800 font-semibold">
                            ✅ Token encontrado!
                        </p>
                        <p className="text-green-700 text-sm mt-2">
                            Você está autenticado e pode criar a configuração.
                        </p>
                    </div>
                )}

                <p className="text-gray-600 mb-6">
                    Clique no botão abaixo para criar uma configuração Big Five completa do zero.
                </p>

                <button
                    onClick={createConfig}
                    disabled={loading || !token}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 hover:shadow-lg transition-all"
                >
                    {loading ? 'Criando...' : 'Criar Configuração Completa'}
                </button>

                {result && (
                    <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.success ? (
                            <>
                                <strong>✅ Sucesso!</strong>
                                <p className="mt-2 text-sm">Config ID: {result.configId}</p>
                                <p className="text-sm">Traços: {result.traits}</p>
                                <p className="text-sm">Facetas: {result.facets}</p>
                            </>
                        ) : (
                            <>
                                <strong>❌ Erro!</strong>
                                <p className="mt-2 text-sm">{result.error}</p>
                            </>
                        )}
                    </div>
                )}

                <div className="mt-6 text-sm text-gray-500">
                    <strong>O que isso faz:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Desativa configs antigas</li>
                        <li>Cria 5 traços Big Five</li>
                        <li>Cria 30 facetas (6 por traço)</li>
                        <li>Marca como ativa</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

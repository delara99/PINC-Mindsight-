'use client';

import { useState } from 'react';
import { useAuthStore } from '../../src/store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function FixPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const token = useAuthStore((state) => state.token);

    const handleFix = async () => {
        setLoading(true);
        setResult(null);

        try {
            // Tenta primeiro no UserController (rota mais robusta)
            const response = await fetch(`${API_URL}/api/v1/users/fix-my-assignments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            setResult(data);
        } catch (error: any) {
            setResult({ success: false, message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🔧 Corrigir Meus Assignments
                </h1>
                <p className="text-gray-600 mb-8">
                    Este  endpoint vincula seus assignments completados à configuração Big Five ativa do seu tenant.
                </p>

                <button
                    onClick={handleFix}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6"
                >
                    {loading ? '⏳ Corrigindo...' : '✨ Corrigir Agora'}
                </button>

                {result && (
                    <div className={`p-6 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                            {result.success ? '✅ Sucesso!' : '❌ Erro'}
                        </h2>
                        <p className="text-gray-700 mb-4">{result.message}</p>

                        {result.configId && (
                            <div className="bg-white p-4 rounded border border-gray-200">
                                <p className="text-sm text-gray-600">Config ID:</p>
                                <p className="font-mono text-xs text-gray-900 break-all">{result.configId}</p>
                            </div>
                        )}

                        {result.success && (
                            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm text-blue-800 font-medium">
                                    🎉 Pronto! Agora você pode usar o botão "Relacional" nas conexões!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 p-4 bg-yellow-50 rounded border border-yellow-200">
                    <h3 className="font-bold text-yellow-900 mb-2">⚠️ Quando usar:</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Erro: "usuário não possui resultado Big Five válido"</li>
                        <li>• Botão "Relacional" não funciona</li>
                        <li>• Após migração de dados</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

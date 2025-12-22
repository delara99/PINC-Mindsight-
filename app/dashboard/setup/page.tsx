'use client';
import { useState } from 'react';
import { useAuthStore } from '../../../src/store/auth-store';
import { API_URL } from '../../../src/config/api';

export default function SetupPage() {
    const token = useAuthStore((state) => state.token);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const populateTexts = async () => {
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch(`${API_URL}/api/v1/setup/populate-texts`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setResult(data);
        } catch (error: any) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">🛠️ Setup do Sistema</h1>

            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-6">
                <h2 className="font-bold text-yellow-800 mb-2">⚠️ Atenção</h2>
                <p className="text-yellow-700">
                    Esta página vai popular o banco de dados com textos interpretativos.
                    Execute apenas uma vez ou quando necessário.
                </p>
            </div>

            <button
                onClick={populateTexts}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 mb-6 w-full"
            >
                {loading ? 'Populando banco de dados...' : '🚀 Popular Textos Interpretativos'}
            </button>

            {result && (
                <div className="space-y-4">
                    {result.error ? (
                        <div className="bg-red-100 border border-red-300 p-4 rounded-lg">
                            <h3 className="font-bold text-red-800 mb-2">❌ Erro</h3>
                            <p className="text-red-700">{result.error}</p>
                            {result.stack && (
                                <pre className="mt-2 text-xs bg-red-200 p-2 rounded overflow-auto max-h-60">
                                    {result.stack}
                                </pre>
                            )}
                        </div>
                    ) : result.success ? (
                        <div className="bg-green-100 border border-green-300 p-4 rounded-lg">
                            <h3 className="font-bold text-green-800 mb-2">✅ Sucesso!</h3>
                            <p className="text-green-700 text-lg mb-3">{result.message}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded">
                                    <div className="text-sm text-gray-600">Configs Processadas</div>
                                    <div className="text-2xl font-bold text-green-600">{result.configs}</div>
                                </div>
                                <div className="bg-white p-3 rounded">
                                    <div className="text-sm text-gray-600">Total Possível</div>
                                    <div className="text-2xl font-bold text-gray-700">{result.totalPossible}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <pre className="text-xs overflow-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">📝 Próximos Passos</h3>
                <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Execute o botão acima para popular os textos</li>
                    <li>Vá para <a href="/dashboard/diagnostic" className="underline">/dashboard/diagnostic</a> e execute o diagnóstico</li>
                    <li>Verifique se os textos foram criados (deve mostrar número {'>'} 0)</li>
                    <li>Teste o relatório normal para ver se os textos aparecem</li>
                </ol>
            </div>
        </div>
    );
}

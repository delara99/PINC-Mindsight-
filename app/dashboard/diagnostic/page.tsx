'use client';
import { useState } from 'react';
import { useAuthStore } from '../../../../src/store/auth-store';
import { API_URL } from '../../../../src/config/api';

export default function DiagnosticPage() {
    const token = useAuthStore((state) => state.token);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runDiagnostic = async () => {
        setLoading(true);
        setResults(null);

        try {
            // 1. Check interpretative texts
            const textsRes = await fetch(`${API_URL}/api/v1/diagnostic/interpretative-texts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const textsData = await textsRes.json();

            // 2. Check configs
            const configsRes = await fetch(`${API_URL}/api/v1/diagnostic/configs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const configsData = await configsRes.json();

            // 3. Check specific assignment
            const assignmentId = 'a4c64bd6-c9ed-4620-a3b5-5541a55233be';
            const assignmentRes = await fetch(`${API_URL}/api/v1/diagnostic/assignment/${assignmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const assignmentData = await assignmentRes.json();

            setResults({
                texts: textsData,
                configs: configsData,
                assignment: assignmentData,
                timestamp: new Date().toISOString()
            });
        } catch (error: any) {
            setResults({
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">🔍 Diagnóstico do Sistema</h1>

            <button
                onClick={runDiagnostic}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 mb-6"
            >
                {loading ? 'Executando diagnóstico...' : 'Executar Diagnóstico Completo'}
            </button>

            {results && (
                <div className="space-y-6">
                    {results.error && (
                        <div className="bg-red-100 border border-red-300 p-4 rounded-lg">
                            <h2 className="font-bold text-red-800 mb-2">❌ Erro</h2>
                            <p className="text-red-700">{results.error}</p>
                        </div>
                    )}

                    {!results.error && (
                        <>
                            {/* Textos Interpretativos */}
                            <div className="bg-white border rounded-lg p-6">
                                <h2 className="text-xl font-bold mb-4">📝 Textos Interpretativos</h2>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Total de Textos</div>
                                        <div className="text-2xl font-bold">{results.texts.total || 0}</div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded">
                                        <div className="text-sm text-gray-600">Combinações Únicas</div>
                                        <div className="text-2xl font-bold">{results.texts.summary?.length || 0}</div>
                                    </div>
                                </div>
                                <details className="mt-4">
                                    <summary className="cursor-pointer font-semibold">Ver detalhes</summary>
                                    <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                                        {JSON.stringify(results.texts, null, 2)}
                                    </pre>
                                </details>
                            </div>

                            {/* Configurações */}
                            <div className="bg-white border rounded-lg p-6">
                                <h2 className="text-xl font-bold mb-4">⚙️ Configurações Big Five</h2>
                                <div className="bg-gray-50 p-3 rounded mb-4">
                                    <div className="text-sm text-gray-600">Total de Configs</div>
                                    <div className="text-2xl font-bold">{results.configs.total || 0}</div>
                                </div>
                                {results.configs.configs?.map((config: any, idx: number) => (
                                    <div key={idx} className="border-l-4 border-blue-500 pl-4 mb-3 bg-blue-50 p-3">
                                        <div className="font-semibold">{config.name}</div>
                                        <div className="text-sm text-gray-600">ID: {config.id}</div>
                                        <div className="text-sm text-gray-600">Tenant: {config.tenantId}</div>
                                        <div className="text-sm text-gray-600">Ativa: {config.isActive ? '✅' : '❌'}</div>
                                        <div className="text-sm font-bold mt-2">
                                            Textos: {config.textsCount} | Traits: {config.traitsCount}
                                        </div>
                                    </div>
                                ))}
                                <details className="mt-4">
                                    <summary className="cursor-pointer font-semibold">Ver JSON completo</summary>
                                    <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                                        {JSON.stringify(results.configs, null, 2)}
                                    </pre>
                                </details>
                            </div>

                            {/* Assignment Específico */}
                            <div className="bg-white border rounded-lg p-6">
                                <h2 className="text-xl font-bold mb-4">🎯 Assignment teste13</h2>
                                {results.assignment.error ? (
                                    <div className="text-red-600">{results.assignment.error}</div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-50 p-3 rounded">
                                                <div className="text-xs text-gray-600">Assignment ID</div>
                                                <div className="text-sm font-mono">{results.assignment.assignmentId}</div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded">
                                                <div className="text-xs text-gray-600">User Email</div>
                                                <div className="text-sm">{results.assignment.userEmail}</div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded">
                                                <div className="text-xs text-gray-600">Config ID</div>
                                                <div className="text-sm font-mono">{results.assignment.configId || 'NULL'}</div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded">
                                                <div className="text-xs text-gray-600">Config Name</div>
                                                <div className="text-sm">{results.assignment.configName || 'NULL'}</div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded">
                                                <div className="text-xs text-gray-600">User Tenant ID</div>
                                                <div className="text-sm font-mono">{results.assignment.userTenantId || 'NULL'}</div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded">
                                                <div className="text-xs text-gray-600">Config Tenant ID</div>
                                                <div className="text-sm font-mono">{results.assignment.configTenantId || 'NULL'}</div>
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded font-bold text-center ${results.assignment.textsInConfig > 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {results.assignment.textsInConfig > 0
                                                ? `✅ ${results.assignment.textsInConfig} textos disponíveis na config`
                                                : '❌ NENHUM texto disponível na config'}
                                        </div>
                                    </div>
                                )}
                                <details className="mt-4">
                                    <summary className="cursor-pointer font-semibold">Ver JSON completo</summary>
                                    <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                                        {JSON.stringify(results.assignment, null, 2)}
                                    </pre>
                                </details>
                            </div>

                            {/* Timestamp */}
                            <div className="text-center text-sm text-gray-500">
                                Executado em: {new Date(results.timestamp).toLocaleString('pt-BR')}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

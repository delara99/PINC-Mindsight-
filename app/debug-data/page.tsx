'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/src/store/auth-store';
import { API_URL } from '@/src/config/api';

export default function DebugPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                // Buscar configs
                const configsRes = await fetch(`${API_URL}/api/v1/big-five-config`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const configs = await configsRes.json();

                // Buscar assignments completados
                const assignmentsRes = await fetch(`${API_URL}/api/v1/assessments/completed`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const assignments = await assignmentsRes.json();

                setData({ configs, assignments });
            } catch (error: any) {
                console.error('Erro:', error);
                setData({ error: error.message });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">🔍 Debug - Configs & Assignments</h1>

                {data?.error && (
                    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                        <strong>❌ Erro:</strong> {data.error}
                    </div>
                )}

                {/* Configs */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">📋 Configurações Big Five</h2>
                    {data?.configs?.map((config: any) => (
                        <div key={config.id} className={`border-l-4 p-4 mb-4 rounded ${config.isActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                            <div className="font-mono text-xs mb-2">ID: {config.id}</div>
                            <div className="font-bold text-lg">{config.name}</div>
                            <div className="text-sm text-gray-600 mt-2">
                                <div>Tenant ID: <code className="bg-gray-200 px-2 py-1 rounded">{config.tenantId}</code></div>
                                <div>Ativa: {config.isActive ? '✅ SIM' : '❌ NÃO'}</div>
                                <div>Traços: {config.traits?.length || 0}</div>
                                <div>Criada: {new Date(config.createdAt).toLocaleString('pt-BR')}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Assignments */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">📊 Assignments Completados</h2>
                    {data?.assignments?.slice(0, 5).map((assignment: any) => (
                        <div key={assignment.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 mb-4 rounded">
                            <div className="font-mono text-xs mb-2">ID: {assignment.id}</div>
                            <div className="font-bold">{assignment.userName} ({assignment.userEmail})</div>
                            <div className="text-sm text-gray-600 mt-2">
                                <div>Assessment: {assignment.assessmentTitle}</div>
                                <div>Completado: {new Date(assignment.completedAt).toLocaleString('pt-BR')}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* JSON Completo */}
                <details className="bg-gray-800 text-green-400 p-4 rounded font-mono text-xs">
                    <summary className="cursor-pointer font-bold">Ver JSON Completo</summary>
                    <pre className="mt-4 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
                </details>
            </div>
        </div>
    );
}

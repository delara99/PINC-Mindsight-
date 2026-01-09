'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { API_URL } from '../../../../src/config/api';
import { useAuthStore } from '../../../../src/store/auth-store';

interface Pattern {
    id: string;
    code: string;
    name: string;
    description: string;
    conditions: any;
    priority: number;
    active: boolean;
    patternNeeds?: any[];
}

export default function InterpretationPatternsPage() {
    const router = useRouter();
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (token) loadPatterns();
    }, [token]);

    const loadPatterns = async () => {
        try {
            console.log('DEBUG TOKEN:', token ? `Exists (${token.length} chars)` : 'MISSING');
            console.log('Fetching patterns from:', `${API_URL}/api/v1/interpretation/patterns`);

            const res = await fetch(`${API_URL}/api/v1/interpretation/patterns`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Erro API: ${res.status} - ${text}`);
            }

            const data = await res.json();
            if (data.success) {
                setPatterns(data.data);
            } else {
                throw new Error(data.message || 'Falha ao carregar');
            }
        } catch (error: any) {
            console.error('Erro detalhado:', error);
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando padrões...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Padrões Interpretativos
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Gerencie os padrões de detecção baseados em scores Big Five
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        onClick={() => router.push('/dashboard/metrics-config')}
                        className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        ← Voltar
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/metrics-config/interpretation-patterns/new')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        + Novo Padrão
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Erro: </strong>
                    <span className="block sm:inline">{errorMsg}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setErrorMsg('')}>
                        <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
                    </span>
                </div>
            )}

            {/* Patterns List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {patterns.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum padrão encontrado</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Comece criando um novo padrão interpretativo
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                + Criar Primeiro Padrão
                            </button>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {patterns.map((pattern) => (
                            <li key={pattern.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {pattern.name}
                                            </h3>
                                            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pattern.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {pattern.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                Prioridade: {pattern.priority}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {pattern.description}
                                        </p>
                                        <div className="mt-2">
                                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                                {pattern.code}
                                            </span>
                                            <span className="ml-3 text-xs text-gray-500">
                                                Condições: {JSON.stringify(pattern.conditions)}
                                            </span>
                                        </div>
                                        {pattern.patternNeeds && pattern.patternNeeds.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {pattern.patternNeeds.map((pn: any) => (
                                                    <span key={pn.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                                        {pn.need.name} ({pn.intensity}%)
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4 flex gap-2">
                                        <button
                                            onClick={() => router.push(`/dashboard/metrics-config/interpretation-patterns/${pattern.id}`)}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Como funcionam os padrões?
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Padrões interpretativos detectam combinações específicas de scores Big Five.
                                Por exemplo: <code className="bg-blue-100 px-1 rounded">E &gt; 70 AND A &gt; 70</code> identifica um "Perfil Social".
                            </p>
                            <p className="mt-1">
                                Cada padrão pode estar vinculado a necessidades psicológicas que serão exibidas no relatório.
                            </p>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}

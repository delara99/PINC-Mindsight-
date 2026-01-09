'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../../src/store/auth-store';
import { API_URL } from '../../../../../src/config/api';

export default function NewPatternPage() {
    const router = useRouter();
    const token = useAuthStore((state: any) => state.token);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(0);
    const [conditionsJson, setConditionsJson] = useState('{\n    "E": { "min": 50 }\n}');
    const [active, setActive] = useState(true);

    const handleSave = async () => {
        setError('');
        setSaving(true);

        try {
            let parsedConditions;
            try {
                parsedConditions = JSON.parse(conditionsJson);
            } catch (e) {
                throw new Error('JSON de condições inválido');
            }

            const res = await fetch(`${API_URL}/api/v1/interpretation/patterns`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    code: code.toUpperCase(),
                    description,
                    priority,
                    conditions: parsedConditions
                    // tenantId é opcional
                })
            });

            const data = await res.json();
            if (data.success) {
                router.push('/dashboard/metrics-config/interpretation-patterns');
            } else {
                setError(data.message || 'Erro ao criar padrão');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Novo Padrão Interpretativo
                </h1>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Voltar
                </button>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="bg-white shadow rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome do Padrão</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Ex: Extroversão Alta"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Código (Único)</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Ex: HIGH_EXTROVERSION"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descrição</label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Prioridade (0-100)</label>
                            <input
                                type="number"
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value))}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <div className="mt-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={(e) => setActive(e.target.checked)}
                                        className="form-checkbox h-5 w-5 text-indigo-600"
                                    />
                                    <span className="ml-2 text-gray-700">Ativo</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Condições (JSON)
                            <span className="ml-2 text-xs text-gray-500 font-normal">
                                Regras de gatilho para o Big Five
                            </span>
                        </label>
                        <textarea
                            rows={10}
                            value={conditionsJson}
                            onChange={(e) => setConditionsJson(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 font-mono text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {saving ? 'Criando...' : 'Criar Padrão'}
                    </button>
                </div>
            </div>
        </div>
    );
}

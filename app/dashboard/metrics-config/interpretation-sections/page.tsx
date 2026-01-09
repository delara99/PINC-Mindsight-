'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../src/store/auth-store';
import { API_URL } from '../../../../src/config/api';

interface InterpretationSection {
    id: string;
    position: number;
    title: string;
    description: string;
    type: string;
    active: boolean;
}

export default function InterpretationSectionsPage() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const [sections, setSections] = useState<InterpretationSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSection, setNewSection] = useState({ title: '', code: '', description: '', position: 0 });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (token) loadSections();
    }, [token]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/interpretation/sections`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: newSection.title,
                    code: newSection.code,
                    template: newSection.description,
                    audience: 'CLIENT',
                    displayOrder: Number(newSection.position)
                })
            });

            const data = await res.json();
            if (data.success) {
                setShowCreateModal(false);
                loadSections();
                setNewSection({ title: '', code: '', description: '', position: 0 });
            } else {
                alert(data.message || 'Erro ao criar');
            }
        } catch (e) {
            alert('Erro ao criar seção');
        } finally {
            setCreating(false);
        }
    };

    const loadSections = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/interpretation/sections`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSections(data.data);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar seções:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Carregando seções...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Seções Interpretativas
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Gerencie os blocos de conteúdo do relatório avançado
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
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        + Nova Seção
                    </button>
                </div>
            </div>

            {sections.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma seção encontrada</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Verifique se a migração das seções foi executada corretamente.
                    </p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {sections.map((section) => (
                            <li key={section.id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs">
                                                {section.position}
                                            </span>
                                            <p className="ml-4 text-sm font-medium text-indigo-600 truncate">
                                                {section.title}
                                            </p>
                                        </div>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${section.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {section.active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                Tipo: {section.type}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p className="line-clamp-1">{section.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Nova Seção</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Título</label>
                                <input
                                    className="w-full border p-2 rounded mt-1"
                                    value={newSection.title}
                                    onChange={e => setNewSection({ ...newSection, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Código (ex: OVERVIEW)</label>
                                <input
                                    className="w-full border p-2 rounded mt-1"
                                    value={newSection.code}
                                    onChange={e => setNewSection({ ...newSection, code: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Posição</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded mt-1"
                                    value={newSection.position}
                                    onChange={e => setNewSection({ ...newSection, position: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Texto/Template</label>
                                <textarea
                                    className="w-full border p-2 rounded mt-1"
                                    rows={4}
                                    value={newSection.description}
                                    onChange={e => setNewSection({ ...newSection, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    {creating ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

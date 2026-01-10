'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Save, Trash2, X, AlertCircle } from 'lucide-react';

import { API_URL } from '../../../../src/config/api';
import { useAuthStore } from '../../../../src/store/auth-store';

interface Need {
    id: string;
    code: string;
    name: string;
    active: boolean;
    clientTitle: string;
    clientDescription: string;
    clientImpact: string;
    specialistTitle: string;
    specialistDescription: string;
    specialistAnalysis: string;
    favorableEnvironments: string; // JSON string or array
    unfavorableEnvironments: string;
    recommendations: string;
}

export default function PsychologicalNeedsPage() {
    const router = useRouter();
    const [needs, setNeeds] = useState<Need[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Estado do formulário de edição
    const [editForm, setEditForm] = useState<Partial<Need>>({});

    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (token) loadNeeds();
    }, [token]);

    const loadNeeds = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/v1/interpretation/needs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNeeds(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar necessidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectNeed = (need: Need) => {
        setSelectedNeed(need);
        setEditForm({ ...need }); // Copia para edição
    };

    const handleSave = async () => {
        if (!selectedNeed || !editForm) return;

        try {
            setIsSaving(true);

            // Helpers para formatar JSON array
            const formatArray = (val: string | any[]) => {
                if (Array.isArray(val)) return val;
                if (!val) return [];
                // Se for string JSON parseável
                try {
                    const parsed = JSON.parse(val);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) { }
                // Se for string pura (separada por linhas)
                return val.split('\n').filter(line => line.trim().length > 0);
            };

            const payload = {
                ...editForm,
                favorableEnvironments: formatArray(editForm.favorableEnvironments || []),
                unfavorableEnvironments: formatArray(editForm.unfavorableEnvironments || []),
                recommendations: formatArray(editForm.recommendations || [])
            };

            const res = await fetch(`${API_URL}/api/v1/interpretation/needs/${selectedNeed.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            if (json.success) {
                alert('Definições salvas com sucesso!');
                loadNeeds();
                setSelectedNeed(null);
            } else {
                alert('Erro ao salvar: ' + (json.message || 'Erro desconhecido'));
            }
        } catch (e) {
            console.error(e);
            alert('Erro de conexão ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper para exibir array no textarea (join por \n)
    const arrayToText = (val: string | any[]): string => {
        if (Array.isArray(val)) return val.join('\n');
        try {
            const parsed = JSON.parse(val as string);
            if (Array.isArray(parsed)) return parsed.join('\n');
        } catch (e) { }
        return val as string || '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Necessidades</h1>
                    <p className="text-sm text-gray-600 mt-1">Edite os textos, definições e recomendações que aparecem nos relatórios.</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/metrics-config')}
                    className="px-4 py-2 border rounded-md shadow-sm text-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                    Voltar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {needs.map((need) => (
                    <div
                        key={need.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                        onClick={() => handleSelectNeed(need)}
                    >
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-900">{need.name}</h3>
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-mono">
                                    {need.code}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-3 mb-4">{need.clientDescription}</p>
                            <div className="text-indigo-600 text-sm font-medium flex items-center gap-1 group-hover:underline">
                                <Edit size={14} /> Editar Definições
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Edição Full Screen / Large */}
            {selectedNeed && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
                        {/* Header Modal */}
                        <div className="flex justify-between items-center px-6 py-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Editando: {selectedNeed.name}
                                </h2>
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle size={12} /> Atenção: Alterações aqui impactam diretamente a geração de novos relatórios.
                                </p>
                            </div>
                            <button onClick={() => setSelectedNeed(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Coluna Esquerda: Dados Básicos e Cliente */}
                                <div className="space-y-6">
                                    <div className="bg-white p-5 rounded-lg border shadow-sm">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Identificação</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Nome</label>
                                                <input
                                                    className="w-full border rounded p-2 text-sm"
                                                    value={editForm.name || ''}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Código (Não alterar)</label>
                                                <input
                                                    className="w-full border rounded p-2 text-sm bg-gray-100 text-gray-500"
                                                    value={editForm.code || ''}
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-lg border shadow-sm border-l-4 border-l-blue-500">
                                        <h3 className="font-bold text-blue-900 mb-4 border-b pb-2">Visão do Cliente (Relatório)</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Título Amigável</label>
                                                <input
                                                    className="w-full border rounded p-2 text-sm"
                                                    value={editForm.clientTitle || ''}
                                                    onChange={e => setEditForm({ ...editForm, clientTitle: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Descrição para o Cliente</label>
                                                <textarea
                                                    className="w-full border rounded p-2 text-sm h-32"
                                                    value={editForm.clientDescription || ''}
                                                    onChange={e => setEditForm({ ...editForm, clientDescription: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Impacto (Texto de Apoio)</label>
                                                <textarea
                                                    className="w-full border rounded p-2 text-sm h-24"
                                                    value={editForm.clientImpact || ''}
                                                    onChange={e => setEditForm({ ...editForm, clientImpact: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Coluna Direita: Especialista e Técnicos */}
                                <div className="space-y-6">
                                    <div className="bg-white p-5 rounded-lg border shadow-sm border-l-4 border-l-purple-500">
                                        <h3 className="font-bold text-purple-900 mb-4 border-b pb-2">Visão do Especialista</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Análise Técnica</label>
                                                <textarea
                                                    className="w-full border rounded p-2 text-sm h-32"
                                                    value={editForm.specialistAnalysis || ''}
                                                    onChange={e => setEditForm({ ...editForm, specialistAnalysis: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-lg border shadow-sm">
                                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Ambientes e Recomendações (Listas)</h3>
                                        <p className="text-xs text-gray-400 mb-2">Digite um item por linha.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-green-700 mb-1">Ambientes Favoráveis</label>
                                                <textarea
                                                    className="w-full border rounded p-2 text-sm h-24 bg-green-50"
                                                    value={arrayToText(editForm.favorableEnvironments || [])}
                                                    onChange={e => setEditForm({ ...editForm, favorableEnvironments: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-red-700 mb-1">Ambientes Desfavoráveis</label>
                                                <textarea
                                                    className="w-full border rounded p-2 text-sm h-24 bg-red-50"
                                                    value={arrayToText(editForm.unfavorableEnvironments || [])}
                                                    onChange={e => setEditForm({ ...editForm, unfavorableEnvironments: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-yellow-700 mb-1">Recomendações</label>
                                                <textarea
                                                    className="w-full border rounded p-2 text-sm h-24 bg-yellow-50"
                                                    value={arrayToText(editForm.recommendations || [])}
                                                    onChange={e => setEditForm({ ...editForm, recommendations: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t px-6 py-4 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setSelectedNeed(null)}
                                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-primary text-white rounded font-medium flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isSaving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

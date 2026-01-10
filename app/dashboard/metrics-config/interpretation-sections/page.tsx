'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../src/store/auth-store';
import { API_URL } from '../../../../src/config/api';
import { Edit, Trash2, Plus, GripVertical, Save, X, Info } from 'lucide-react';

interface InterpretationSection {
    id: string;
    displayOrder: number; // Mapeado do DB
    title: string;
    template: string; // Conteúdo do DB
    code: string;
    active: boolean;
    audience: string;
}

export default function InterpretationSectionsPage() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const [sections, setSections] = useState<InterpretationSection[]>([]);
    const [loading, setLoading] = useState(true);

    // Edição / Criação
    const [editingSection, setEditingSection] = useState<Partial<InterpretationSection> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (token) loadSections();
    }, [token]);

    const loadSections = async () => {
        try {
            setLoading(true);
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

    const handleSave = async () => {
        if (!editingSection) return;
        setIsSaving(true);
        try {
            const isNew = !editingSection.id;
            const url = isNew
                ? `${API_URL}/api/v1/interpretation/sections`
                : `${API_URL}/api/v1/interpretation/sections/${editingSection.id}`;

            const payload = {
                title: editingSection.title,
                code: editingSection.code,
                template: editingSection.template,
                audience: editingSection.audience || 'CLIENT',
                displayOrder: Number(editingSection.displayOrder || 0)
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setEditingSection(null);
                loadSections();
                alert('Seção salva com sucesso!');
            } else {
                alert(data.message || 'Erro ao salvar');
            }
        } catch (e) {
            alert('Erro de conexão');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta seção? Isso afetará todos os relatórios futuros.')) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/interpretation/sections/${id}/delete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) loadSections();
        } catch (e) {
            alert('Erro ao remover');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando seções...</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* GUIA EDUCACIONAL */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 shadow-sm mb-8 space-y-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-700">
                        <Info size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-purple-900">Arquitetura do Relatório</h2>
                        <p className="text-purple-800 mt-1 max-w-4xl text-sm leading-relaxed">
                            Aqui você define a "espinha dorsal" do relatório <strong>Análise Avançada de Padrões</strong>.
                            Cada seção é um bloco (capítulo) que será renderizado se estiver ativo.
                            Dentro de cada seção, você usa <strong>Templates</strong> para injetar o conteúdo dinâmico (os textos dos padrões que o candidato "ativou").
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 text-xs mt-2 pl-[60px]">
                    <div className="bg-white/60 p-2 px-3 rounded border border-purple-100 flex items-center gap-2">
                        <span className="font-mono bg-purple-100 text-purple-800 px-1 rounded">{`{{CATEGORY_LOGIC}}`}</span>
                        <span>Injeta o texto do padrão da categoria "Lógica"</span>
                    </div>
                    <div className="bg-white/60 p-2 px-3 rounded border border-purple-100 flex items-center gap-2">
                        <span className="font-mono bg-purple-100 text-purple-800 px-1 rounded">{`{{NEEDS_LIST}}`}</span>
                        <span>Injeta a lista de necessidades psicológicas detectadas</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Gerenciar Seções</h1>
                    <p className="mt-1 text-xs text-gray-500">
                        Arraste para reordenar (edite a ordem numérica) ou clique em editar para mudar o template.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/dashboard/metrics-config')}
                        className="px-4 py-2 border rounded-md shadow-sm text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Voltar
                    </button>
                    <button
                        onClick={() => setEditingSection({ title: '', code: 'SEC_NEW', template: '', displayOrder: sections.length + 10, audience: 'CLIENT' })}
                        className="px-4 py-2 bg-primary text-white rounded-md shadow-sm text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={16} /> Nova Seção
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {sections.map((section) => (
                    <div key={section.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="text-gray-400 cursor-move">
                            <GripVertical size={20} />
                        </div>
                        <div className="w-12 text-center font-mono text-sm font-bold text-gray-500 bg-gray-100 rounded px-1">
                            {section.displayOrder}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{section.title}</h3>
                            <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{section.code}</span>
                                {section.template && (
                                    <span className="truncate max-w-[300px] italic opacity-70">
                                        Template: {section.template.substring(0, 50)}...
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditingSection(section)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(section.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Editor */}
            {editingSection && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center px-6 py-4 border-b">
                            <h2 className="text-xl font-bold">
                                {editingSection.id ? 'Editar Seção' : 'Nova Seção'}
                            </h2>
                            <button onClick={() => setEditingSection(null)}><X className="text-gray-400" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-6 gap-4">
                                <div className="col-span-4">
                                    <label className="block text-sm font-medium mb-1">Título da Seção (Cabeçalho no Relatório)</label>
                                    <input
                                        className="w-full border rounded p-2"
                                        value={editingSection.title || ''}
                                        onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium mb-1">Ordem</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded p-2"
                                        value={editingSection.displayOrder || 0}
                                        onChange={e => setEditingSection({ ...editingSection, displayOrder: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium mb-1">Código</label>
                                    <input
                                        className="w-full border rounded p-2 font-mono text-xs bg-gray-50"
                                        value={editingSection.code || ''}
                                        onChange={e => setEditingSection({ ...editingSection, code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium">Template de Conteúdo</label>
                                    <div className="text-xs text-blue-600 flex gap-1 items-center bg-blue-50 px-2 py-1 rounded">
                                        <Info size={12} />
                                        Variáveis: {`{{CATEGORY_xxx}}, {{NEEDS_LIST}}, {{E_SCORE}}`}
                                    </div>
                                </div>
                                <textarea
                                    className="w-full h-[300px] border rounded p-4 font-mono text-sm bg-slate-50 leading-relaxed"
                                    value={editingSection.template || ''}
                                    onChange={e => setEditingSection({ ...editingSection, template: e.target.value })}
                                    placeholder="Ex: Nesta seção, analisamos sua lógica. {{CATEGORY_LOGIC}}"
                                />
                                <div className="mt-2 text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded">
                                    <p><b>Tags Inteligentes Disponíveis:</b></p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li><code>{`{{CATEGORY_LOGIC}}`}</code>: Insere o texto do melhor padrão da cat. Lógica.</li>
                                        <li><code>{`{{CATEGORY_ADAPT}}`}</code>: Adaptação. <code>{`{{CATEGORY_CONCR}}`}</code>: Concreto.</li>
                                        <li><code>{`{{CATEGORY_EMOT}}`}</code>: Emoção. <code>{`{{CATEGORY_REC}}`}</code>: Recomendações.</li>
                                        <li><code>{`{{NEEDS_LIST}}`}</code>: Lista de necessidades psicológicas identificadas.</li>
                                        <li><code>{`{{AUTO_PATTERNS}}`}</code>: Lista simples de todos padrões.</li>
                                        <li><code>{`{{E_SCORE}}`}</code>, <code>{`{{A_SCORE}}`}</code>...: Pontuação numérica (0-100).</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setEditingSection(null)} className="px-4 py-2 border rounded">Cancelar</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-primary text-white rounded flex items-center gap-2">
                                <Save size={16} /> Salvar Seção
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { useAuthStore } from '@/src/store/auth-store';
import { Sparkles, Save, Search, RefreshCw, Database, Layers, BrainCircuit, Type } from 'lucide-react';

export default function TalkingToTextsTab({ isActive }: { isActive: boolean }) {
    // Only fetch if tab is active to save resources? 
    // Or fetch once. Let's keep it simple.

    const token = useAuthStore((state) => state.token);
    const [loading, setLoading] = useState(true);
    const [texts, setTexts] = useState<any[]>([]);
    const [filter, setFilter] = useState('');
    const [textTypeFilter, setTextTypeFilter] = useState('ALL'); // DIMENSION, FINE_TUNED
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        if (token && isActive) {
            fetchTexts();
        }
    }, [token, isActive]);

    const fetchTexts = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/talking-to/admin/texts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTexts(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        if (!confirm('Isso irá verificar e criar textos padrão faltantes. Continuar?')) return;
        setSeeding(true);
        try {
            await axios.post(`${API_URL}/api/v1/talking-to/admin/seed`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Sistema sincronizado com sucesso!');
            fetchTexts();
        } catch (err) {
            console.error(err);
            alert('Erro ao sincronizar.');
        } finally {
            setSeeding(false);
        }
    };

    const handleSave = async (id: string) => {
        setSaving(true);
        try {
            await axios.post(`${API_URL}/api/v1/talking-to/admin/texts`, {
                id,
                content: editContent
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTexts(texts.map(t => t.id === id ? { ...t, content: editContent } : t));
            setEditingId(null);
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const filteredTexts = texts.filter(t =>
        (textTypeFilter === 'ALL' || t.group === textTypeFilter) &&
        (t.key.toLowerCase().includes(filter.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(filter.toLowerCase())) ||
            t.content.toLowerCase().includes(filter.toLowerCase()))
    );

    const getGroupIcon = (group: string) => {
        if (group === 'DIMENSION') return <Layers size={16} />;
        if (group === 'FINE_TUNED') return <BrainCircuit size={16} />;
        return <Type size={16} />;
    };

    if (!isActive) return null;

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {[
                        { id: 'DIMENSION', label: 'Dimensões (Ocean)', icon: Layers },
                        { id: 'FINE_TUNED', label: 'Interpretação Fina', icon: BrainCircuit },
                        { id: 'ALL', label: 'Todos', icon: Database },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setTextTypeFilter(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${textTypeFilter === tab.id
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por chave ou conteúdo..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-sm"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleSeed}
                        disabled={seeding || !token}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
                    >
                        <RefreshCw size={18} className={seeding ? "animate-spin" : ""} />
                        <span className="hidden md:inline">Sincronizar</span>
                    </button>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-20 text-slate-400 animate-pulse">Carregando textos...</div>
            ) : filteredTexts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <Database className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">Nenhum texto encontrado</h3>
                    <p className="text-slate-500">Tente sincronizar para inicializar o banco.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredTexts.map((text) => (
                        <div key={text.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${text.group === 'DIMENSION' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {getGroupIcon(text.group)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm md:text-base">
                                                {text.description || text.key}
                                            </h3>
                                            <code className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono">
                                                {text.key}
                                            </code>
                                        </div>
                                    </div>

                                    {!editingId || editingId !== text.id ? (
                                        <button
                                            onClick={() => {
                                                setEditingId(text.id);
                                                setEditContent(text.content);
                                            }}
                                            className="text-sm font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-lg transition-colors"
                                        >
                                            Editar
                                        </button>
                                    ) : null}
                                </div>

                                {editingId === text.id ? (
                                    <div className="animate-in fade-in zoom-in-95 duration-200">
                                        <textarea
                                            className="w-full h-48 p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-medium text-slate-700 resize-y leading-relaxed"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-3 mt-4">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleSave(text.id)}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-70"
                                            >
                                                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                                Salvar Alterações
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-line">
                                        {text.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

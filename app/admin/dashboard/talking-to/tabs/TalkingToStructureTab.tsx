'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { useAuthStore } from '@/src/store/auth-store';
import { Layers, ChevronDown, ChevronRight, Plus, X, Save, Trash2, RefreshCw } from 'lucide-react';

export default function TalkingToStructureTab({ isActive }: { isActive: boolean }) {
    const token = useAuthStore((state) => state.token);
    const [loading, setLoading] = useState(true);
    const [dimensions, setDimensions] = useState<any[]>([]);
    const [expandedDim, setExpandedDim] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);

    // Facet Editing State
    const [editingFacet, setEditingFacet] = useState<any | null>(null);
    const [isFacetModalOpen, setIsFacetModalOpen] = useState(false);
    const [selectedDimId, setSelectedDimId] = useState<string | null>(null);

    const [facetFormData, setFacetFormData] = useState({
        dichotomy: '',
        facetLow: '',
        facetHigh: '',
        concept: ''
    });

    useEffect(() => {
        if (token && isActive) {
            fetchStructure();
        }
    }, [token, isActive]);

    const fetchStructure = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/v1/talking-to/admin/structure`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDimensions(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        if (!confirm('Isso irá REINICIAR toda a estrutura para o padrão do Excel (apagando edições personalizadas). Continuar?')) return;
        setSeeding(true);
        try {
            await axios.post(`${API_URL}/api/v1/talking-to/admin/structure/seed`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Estrutura reiniciada com sucesso!');
            fetchStructure();
        } catch (err) {
            console.error(err);
            alert('Erro ao reiniciar estrutura.');
        } finally {
            setSeeding(false);
        }
    };

    const handleSaveDimension = async (dim: any) => {
        try {
            await axios.put(`${API_URL}/api/v1/talking-to/admin/structure/${dim.id}`, dim, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Dimensão atualizada!');
            fetchStructure();
        } catch (err) {
            alert('Erro ao salvar dimensão.');
        }
    };

    // Facet Handlers
    const openFacetModal = (dimId: string, facet?: any) => {
        setSelectedDimId(dimId);
        if (facet) {
            setEditingFacet(facet);
            setFacetFormData({
                dichotomy: facet.dichotomy,
                facetLow: facet.facetLow,
                facetHigh: facet.facetHigh,
                concept: facet.concept
            });
        } else {
            setEditingFacet(null);
            setFacetFormData({
                dichotomy: '',
                facetLow: '',
                facetHigh: '',
                concept: ''
            });
        }
        setIsFacetModalOpen(true);
    };

    const handleSaveFacet = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...facetFormData, dimensionId: selectedDimId };

            if (editingFacet) {
                await axios.put(`${API_URL}/api/v1/talking-to/admin/structure/facets/${editingFacet.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/api/v1/talking-to/admin/structure/facets`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setIsFacetModalOpen(false);
            fetchStructure();
        } catch (err) {
            alert('Erro ao salvar faceta.');
        }
    };

    const handleDeleteFacet = async (id: string) => {
        if (!confirm('Excluir esta faceta permanentemente?')) return;
        try {
            await axios.delete(`${API_URL}/api/v1/talking-to/admin/structure/facets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStructure();
        } catch (err) {
            alert('Erro ao excluir.');
        }
    };

    if (!isActive) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Estrutura do Modelo Psicométrico</h2>
                    <p className="text-sm text-slate-500">Gerencie Traços, Dicotomias, Subtraços e Conceitos.</p>
                </div>
                <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <RefreshCw size={18} className={seeding ? "animate-spin" : ""} />
                    Restaurar Padrão (Excel)
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando estrutura...</div>
            ) : (
                <div className="space-y-4">
                    {dimensions.map(dim => (
                        <div key={dim.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div
                                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 bg-slate-50/50"
                                onClick={() => setExpandedDim(expandedDim === dim.id ? null : dim.id)}
                            >
                                {expandedDim === dim.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dim.color }} />
                                <h3 className="font-bold text-lg text-slate-800">{dim.name} ({dim.key})</h3>
                                <div className="ml-auto text-sm text-slate-500 font-mono bg-white border border-slate-100 px-2 py-1 rounded">
                                    {dim.facets?.length || 0} Facetas
                                </div>
                            </div>

                            {expandedDim === dim.id && (
                                <div className="p-6 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                    {/* Dimension Editor */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Dicotomia (Geral)</label>
                                            <input
                                                className="w-full mt-1 p-2 border rounded-lg"
                                                value={dim.dichotomy || ''}
                                                onChange={e => {
                                                    const newDims = dimensions.map(d => d.id === dim.id ? { ...d, dichotomy: e.target.value } : d);
                                                    setDimensions(newDims);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Polo Baixo</label>
                                            <input
                                                className="w-full mt-1 p-2 border rounded-lg"
                                                value={dim.questionTraitLow || ''}
                                                onChange={e => {
                                                    const newDims = dimensions.map(d => d.id === dim.id ? { ...d, questionTraitLow: e.target.value } : d);
                                                    setDimensions(newDims);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Polo Alto</label>
                                            <input
                                                className="w-full mt-1 p-2 border rounded-lg"
                                                value={dim.questionTraitHigh || ''}
                                                onChange={e => {
                                                    const newDims = dimensions.map(d => d.id === dim.id ? { ...d, questionTraitHigh: e.target.value } : d);
                                                    setDimensions(newDims);
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-4 flex justify-end">
                                            <button
                                                onClick={() => handleSaveDimension(dim)}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-bold"
                                            >
                                                <Save size={14} /> Salvar Alterações do Traço
                                            </button>
                                        </div>
                                    </div>

                                    {/* Facets Table */}
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-700">Subtraços Dicotômicos & Conceitos</h4>
                                        <button
                                            onClick={() => openFacetModal(dim.id)}
                                            className="flex items-center gap-2 text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100"
                                        >
                                            <Plus size={16} /> Adicionar Faceta
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-3">Subtraço Dicotômico</th>
                                                    <th className="px-4 py-3">Polo Baixo</th>
                                                    <th className="px-4 py-3">Polo Alto</th>
                                                    <th className="px-4 py-3">Conceito</th>
                                                    <th className="px-4 py-3 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {dim.facets.map((facet: any) => (
                                                    <tr key={facet.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-medium text-slate-800">{facet.dichotomy}</td>
                                                        <td className="px-4 py-3 text-red-500 font-medium">{facet.facetLow}</td>
                                                        <td className="px-4 py-3 text-green-600 font-medium">{facet.facetHigh}</td>
                                                        <td className="px-4 py-3 text-slate-600 bg-slate-50/50">
                                                            <span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                                                                {facet.concept}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                            <button
                                                                onClick={() => openFacetModal(dim.id, facet)}
                                                                className="p-1 hover:bg-slate-200 rounded text-blue-600"
                                                            >
                                                                <Save size={16} className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteFacet(facet.id)}
                                                                className="p-1 hover:bg-slate-200 rounded text-red-500"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Facet Modal */}
            {isFacetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingFacet ? 'Editar Faceta' : 'Nova Faceta'}
                            </h3>
                            <button onClick={() => setIsFacetModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveFacet} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Subtraço Dicotômico</label>
                                <input
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Ex: ouvinte-falante"
                                    value={facetFormData.dichotomy}
                                    onChange={e => setFacetFormData({ ...facetFormData, dichotomy: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Polo Baixo</label>
                                    <input
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="Ex: ouvinte"
                                        value={facetFormData.facetLow}
                                        onChange={e => setFacetFormData({ ...facetFormData, facetLow: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Polo Alto</label>
                                    <input
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="Ex: falante"
                                        value={facetFormData.facetHigh}
                                        onChange={e => setFacetFormData({ ...facetFormData, facetHigh: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Conceito</label>
                                <input
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Ex: comunicação"
                                    value={facetFormData.concept}
                                    onChange={e => setFacetFormData({ ...facetFormData, concept: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">
                                Salvar Faceta
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

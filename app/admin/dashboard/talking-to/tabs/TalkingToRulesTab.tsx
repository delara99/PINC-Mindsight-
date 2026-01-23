'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { useAuthStore } from '@/src/store/auth-store';
import { Plus, Trash2, Edit, AlertCircle, CheckCircle2, SlidersHorizontal, ArrowRight, BrainCircuit, X } from 'lucide-react';

export default function TalkingToRulesTab({ isActive }: { isActive: boolean }) {
    const token = useAuthStore((state) => state.token);
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        domain: 'OCEAN_E',
        priority: 1,
        conditions: '{\n  "scores": {\n    "E": { "min": 50 }\n  }\n}',
        messageId: '',
        isActive: true
    });

    // Auxiliary State
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        if (isActive && token) {
            fetchRules();
            fetchMessages();
        }
    }, [isActive, token]);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/v1/talking-to/admin/rules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRules(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            // We need a list of messages to link. Reusing the texts endpoint.
            // Ideally we should have a lightweight endpoint for dropdowns, but this works for MVP.
            const res = await axios.get(`${API_URL}/api/v1/talking-to/admin/texts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let parsedConditions;
            try {
                parsedConditions = JSON.parse(formData.conditions);
            } catch (e) {
                alert('JSON de Condições Inválido');
                return;
            }

            const payload = {
                ...formData,
                conditions: parsedConditions
            };

            if (editingRule) {
                await axios.put(`${API_URL}/api/v1/talking-to/admin/rules/${editingRule.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/api/v1/talking-to/admin/rules`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setIsModalOpen(false);
            setEditingRule(null);
            fetchRules();
            alert('Regra salva com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar regra');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await axios.delete(`${API_URL}/api/v1/talking-to/admin/rules/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRules();
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir');
        }
    };

    const openModal = (rule?: any) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                name: rule.name,
                domain: rule.domain,
                priority: rule.priority,
                conditions: JSON.stringify(rule.conditions, null, 2),
                messageId: rule.messageId,
                isActive: rule.isActive
            });
        } else {
            setEditingRule(null);
            setFormData({
                name: '',
                domain: 'OCEAN_E',
                priority: 1,
                conditions: '{\n  "scores": {\n    "E": { "min": 50 }\n  }\n}',
                messageId: messages[0]?.id || '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    if (!isActive) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Header / Intro */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 flex items-start gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100 text-indigo-600">
                    <BrainCircuit size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-indigo-900">Motor de Regras Semânticas</h3>
                    <p className="text-indigo-700/80 text-sm mt-1 max-w-3xl">
                        Aqui você define a "inteligência" do sistema. Crie regras que cruzam dimensões e facetas para gerar interpretações ultra-precisas.
                        O sistema avalia essas regras em ordem de prioridade.
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    {/* Filters mock */}
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Filtrar por:</span>
                    <button onClick={fetchRules} className="text-sm font-semibold text-slate-600 hover:text-purple-600 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">Atualizar</button>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={18} />
                    Nova Regra
                </button>
            </div>

            {/* Table / List */}
            {loading ? (
                <div className="text-center py-20 text-slate-400 animate-pulse">Carregando regras...</div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">Nome da Regra</th>
                                <th className="px-6 py-4 font-bold">Domínio</th>
                                <th className="px-6 py-4 font-bold">Prioridade</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rules.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhuma regra encontrada. Crie a primeira!</td>
                                </tr>
                            ) : rules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <span className="font-bold text-slate-800">{rule.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                            {rule.domain}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {rule.priority}
                                    </td>
                                    <td className="px-6 py-4">
                                        {rule.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                <CheckCircle2 size={12} /> Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                <AlertCircle size={12} /> Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal(rule)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(rule.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">{editingRule ? 'Editar Regra' : 'Nova Regra'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Regra</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Domínio</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.domain}
                                        onChange={e => setFormData({ ...formData, domain: e.target.value })}
                                    >
                                        <option value="OCEAN_O">Openness (O)</option>
                                        <option value="OCEAN_C">Conscientiousness (C)</option>
                                        <option value="OCEAN_E">Extraversion (E)</option>
                                        <option value="OCEAN_A">Agreeableness (A)</option>
                                        <option value="OCEAN_N">Neuroticism (N)</option>
                                        <option value="CROSS_TRAIT">Cruzamento de Traços (Complexo)</option>
                                        <option value="ARCHETYPE">Arquétipo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Prioridade (Maior = Antes)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 accent-indigo-600 rounded"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span className="text-sm font-bold text-slate-700">Regra Ativa</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Mensagem Associada</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.messageId}
                                    onChange={e => setFormData({ ...formData, messageId: e.target.value })}
                                >
                                    <option value="">Selecione uma mensagem...</option>
                                    {messages.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.key} - {m.description?.substring(0, 50)}...
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Crie novas mensagens na aba "Biblioteca de Conteúdo".</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Condições (JSON)</label>
                                <p className="text-xs text-slate-500 mb-2">Configure os limites min/max para scores.</p>
                                <textarea
                                    required
                                    className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm bg-slate-50"
                                    value={formData.conditions}
                                    onChange={e => setFormData({ ...formData, conditions: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                Salvar Regra de Inteligência
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

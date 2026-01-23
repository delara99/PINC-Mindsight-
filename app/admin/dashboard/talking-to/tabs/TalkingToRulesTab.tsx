'use client';
import { useState } from 'react';
import { Plus, Trash2, Edit, AlertCircle, CheckCircle2, SlidersHorizontal, ArrowRight, BrainCircuit } from 'lucide-react';

export default function TalkingToRulesTab({ isActive }: { isActive: boolean }) {
    const [rules, setRules] = useState<any[]>([
        // Mock data for UI visualization
        { id: 1, name: 'Perfil Ouvinte Seletivo', domain: 'CROSS_TRAIT', conditions: 4, active: true },
        { id: 2, name: 'Extroversão Alta', domain: 'OCEAN_E', conditions: 1, active: true },
        { id: 3, name: 'Liderança Dominante', domain: 'ARCHETYPE', conditions: 6, active: false },
    ]);

    if (!isActive) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    <button className="text-sm font-semibold text-slate-600 hover:text-purple-600 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">Todos</button>
                    <button className="text-sm font-semibold text-slate-600 hover:text-purple-600 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">Ocean</button>
                    <button className="text-sm font-semibold text-slate-600 hover:text-purple-600 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">Cruzamentos</button>
                </div>
                <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95">
                    <Plus size={18} />
                    Nova Regra
                </button>
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-bold">Nome da Regra</th>
                            <th className="px-6 py-4 font-bold">Domínio</th>
                            <th className="px-6 py-4 font-bold">Condições Lógicas</th>
                            <th className="px-6 py-4 font-bold">Status</th>
                            <th className="px-6 py-4 font-bold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rules.map((rule) => (
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
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                                        <SlidersHorizontal size={14} className="text-slate-400" />
                                        <span>{rule.conditions} Critérios</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                            E {'>'} 50 <ArrowRight size={10} />
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {rule.active ? (
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
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Empty State Help */}
            <div className="border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 text-center">
                <p className="text-slate-500 text-sm">
                    Dica: Comece criando regras simples para as dimensões principais (OCEAN) e depois avance para regras complexas cruzando facetas.
                </p>
            </div>
        </div>
    );
}

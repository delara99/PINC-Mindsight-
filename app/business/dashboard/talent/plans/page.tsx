"use client";
import React, { useState, useEffect } from 'react';
import { Target, Calendar, CheckSquare, ListTodo, Plus, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { HelpTooltip } from '@/src/components/ui/HelpTooltip';

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        employeeId: '',
        title: '',
        type: 'DEVELOPMENT'
    });

    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        const baseUrl = url.startsWith('http') ? url : `https://${url}`;
        if (baseUrl.includes('/api/v1')) return baseUrl;
        return `${baseUrl}/api/v1`;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                // Fetch Plans
                const plansRes = await fetch(`${getApiUrl()}/business/talent-intelligence/plans`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (plansRes.ok) setPlans(await plansRes.json());

                // Fetch Candidates for Select
                const candidatesRes = await fetch(`${getApiUrl()}/business/talent-intelligence/candidates-list`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (candidatesRes.ok) setCandidates(await candidatesRes.json());

            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCreate = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('accessToken');

            // Auto-generate title if empty
            const finalData = {
                ...formData,
                title: formData.title || `PDI: ${formData.type === 'ONBOARDING' ? 'Integração' : 'Desenvolvimento'}`
            };

            const response = await fetch(`${getApiUrl()}/business/talent-intelligence/plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(finalData)
            });

            if (response.ok) {
                const newPlan = await response.json();
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Link href="/business/dashboard/talent" className="hover:text-purple-600 transition-colors">Inteligência de Talento</Link>
                    <span>/</span>
                    <span className="text-slate-900 font-medium">Planos de Ação</span>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                            Planos de Desenvolvimento (PDI)
                            <HelpTooltip text="Crie planos de ação estruturados para promover o crescimento, onboarding e correção de gaps dos seus colaboradores." />
                        </h1>
                        <p className="text-slate-500">Acompanhe a evolução da sua equipe com planos estruturados.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium shadow-lg hover:shadow-orange-200"
                    >
                        <Plus size={20} />
                        Novo PDI
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ListTodo className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum plano ativo</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Crie planos para Onboarding ou Desenvolvimento de competências.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 font-medium transition-colors"
                    >
                        Criar Plano
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                            {/* Status Stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${plan.type === 'ONBOARDING' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>

                            <div className="flex justify-between items-start mb-4 pl-2">
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${plan.type === 'ONBOARDING' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {plan.type === 'ONBOARDING' ? 'Integração' : plan.type === 'PERFORMANCE' ? 'Correção de Performance' : 'Desenvolvimento'}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">{plan.title}</h3>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {plan.employee?.name ? plan.employee.name.substring(0, 2).toUpperCase() : '??'}
                                </div>
                            </div>

                            <div className="space-y-3 pl-2 mb-6">
                                <div className="flex items-center text-sm text-slate-500">
                                    <Target size={14} className="mr-2" />
                                    <span>Colaborador: <span className="text-slate-900 font-medium">{plan.employee?.name || 'Desconhecido'}</span></span>
                                </div>
                                <div className="flex items-center text-sm text-slate-500">
                                    <Calendar size={14} className="mr-2" />
                                    <span>Criado em: {new Date(plan.createdAt).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>

                            <div className="pl-2 pt-4 border-t border-slate-100 flex justify-between items-center group-hover:pl-0 transition-all">
                                <div className="text-xs text-slate-400 font-medium">{plan.progress || 0}% Concluído (Simulado)</div>
                                <button className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Ver Plano <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Novo Plano (PDI)</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Colaborador</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                >
                                    <option value="">Selecione um colaborador...</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Plano</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="DEVELOPMENT">Desenvolvimento (PDI)</option>
                                    <option value="ONBOARDING">Integração (Onboarding)</option>
                                    <option value="PERFORMANCE">Performance (PIP)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder={formData.type === 'ONBOARDING' ? "Integração Novos Talentos" : "Melhoria de Liderança"}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-start gap-2">
                                <Sparkles size={16} className="text-orange-600 mt-0.5" />
                                <div className="text-xs text-orange-800">
                                    <span className="font-bold">IA Suggest:</span> As tarefas e marcos serão gerados automaticamente com base no perfil do colaborador.
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button
                                onClick={handleCreate}
                                disabled={isSaving || !formData.employeeId}
                                className="w-full py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckSquare size={18} />}
                                Gerar Plano
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

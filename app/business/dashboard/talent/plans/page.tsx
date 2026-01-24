"use client";
import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, CheckCircle, Clock, ArrowRight, Loader2, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ActionPlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        employeeId: '',
        title: '',
        type: 'DEVELOPMENT'
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                // Fetch Plans
                const plansRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/talent-intelligence/plans`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (plansRes.ok) setPlans(await plansRes.json());

                // Fetch Candidates for Select
                const candidatesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/talent-intelligence/candidates-list`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (candidatesRes.ok) setCandidates(await candidatesRes.json());

            } catch (error) {
                console.error("Error fetching data:", error);
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

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/business/talent-intelligence/plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(finalData)
            });

            if (response.ok) {
                const newPlan = await response.json();
                // We need to re-fetch or construct the full object because create returns limited data
                // Quick hack: add to list manually with incomplete user data or reload
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Link href="/business/dashboard/talent" className="hover:text-purple-600 transition-colors">Inteligência de Talento</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">Planos de Ação</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Planos de Desenvolvimento (PDI)</h1>
                    <p className="text-slate-500">Acompanhe a evolução da sua equipe com planos estruturados.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium shadow-lg hover:shadow-orange-200"
                >
                    <Plus size={20} />
                    Novo PDI
                </button>
            </div>

            {/* Plans List */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-600" size={32} /></div>
            ) : plans.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
                    <ClipboardList className="mx-auto text-slate-400 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-900">Nenhum plano ativo</h3>
                    <p className="text-slate-500 mb-6">Crie planos para Onboarding ou Desenvolvimento de competências.</p>
                    <button onClick={() => setShowCreateModal(true)} className="px-6 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">Criar Plano</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.type === 'ONBOARDING' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{plan.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span className="font-medium text-slate-900">{plan.employee?.name || 'Colaborador'}</span>
                                        <span>•</span>
                                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded uppercase tracking-wider">{plan.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Progress Bar */}
                                <div className="w-full md:w-48">
                                    <div className="flex justify-between text-xs mb-1 font-bold text-slate-600">
                                        <span>Progresso</span>
                                        <span>{plan.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${plan.progress}%` }}></div>
                                    </div>
                                </div>

                                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-orange-600">
                                    <ArrowRight size={20} />
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
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Novo Plano (PDI)</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Colaborador</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                >
                                    <option value="">Selecione um colaborador...</option>
                                    {candidates.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Plano</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="DEVELOPMENT">Desenvolvimento (PDI)</option>
                                    <option value="ONBOARDING">Onboarding (Integração)</option>
                                    <option value="PERFORMANCE">Performance (PIP)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Melhoria de Liderança"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="bg-orange-50 p-4 rounded-lg flex gap-3">
                                <Sparkles className="text-orange-600 shrink-0" size={20} />
                                <div>
                                    <h4 className="font-bold text-orange-800 text-sm">IA Suggest</h4>
                                    <p className="text-xs text-orange-700">As tarefas e marcos serão gerados automaticamente com base no perfil do colaborador.</p>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={!formData.employeeId || isSaving}
                                className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                Gerar Plano
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

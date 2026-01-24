"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Circle, Calendar, Clock, Loader2, Plus, Trash2, Save, FileText, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { HelpTooltip } from '@/src/components/ui/HelpTooltip';

export default function PlanDetailsPage({ params }: { params: { id: string } }) {
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<any[]>([
        { id: 1, text: 'Reunião de Alinhamento Inicial', completed: true },
        { id: 2, text: 'Definição de Metas de Curto Prazo', completed: true },
        { id: 3, text: 'Treinamento Técnico Específico', completed: false },
        { id: 4, text: 'Mentoria com Líder Sênior', completed: false },
        { id: 5, text: 'Avaliação de Resultados (30 dias)', completed: false },
    ]);
    const [newTask, setNewTask] = useState('');

    const getApiUrl = () => {
        const url = process.env.NEXT_PUBLIC_API_URL || 'https://pinc-mindsight-production.up.railway.app';
        const baseUrl = url.startsWith('http') ? url : `https://${url}`;
        if (baseUrl.includes('/api/v1')) return baseUrl;
        return `${baseUrl}/api/v1`;
    };

    useEffect(() => {
        const fetchPlan = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                // Como não temos endpoint específico de detalhes ainda, vamos buscar a lista e filtrar (MVP)
                // Idealmente seria GET /plans/:id
                const response = await fetch(`${getApiUrl()}/business/talent-intelligence/plans`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const plans = await response.json();
                    const found = plans.find((p: any) => p.id === params.id);
                    if (found) setPlan(found);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [params.id]);

    const toggleTask = (taskId: number) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    };

    const addTask = () => {
        if (!newTask.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
        setNewTask('');
    };

    const deleteTask = (taskId: number) => {
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-orange-600" size={40} /></div>;
    if (!plan) return <div className="text-center py-20">Plano não encontrado. <Link href="/business/dashboard/talent/plans" className="text-orange-600 underline">Voltar</Link></div>;

    const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <Link href="/business/dashboard/talent/plans" className="inline-flex items-center text-sm text-slate-500 hover:text-orange-600 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" />
                    Voltar para Planos
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${plan.type === 'ONBOARDING' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                {plan.type === 'ONBOARDING' ? 'Integração' : plan.type === 'PERFORMANCE' ? 'PIP' : 'Desenvolvimento'}
                            </span>
                            <span className="text-slate-400 text-sm flex items-center gap-1"><Calendar size={14} /> {new Date(plan.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">{plan.title}</h1>
                        <p className="text-slate-500 text-lg">Colaborador: <span className="text-slate-900 font-medium">{plan.employee?.name || 'N/A'}</span></p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500 font-medium mb-1">Progresso Geral</div>
                        <div className="text-3xl font-bold text-orange-600">{progress}%</div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Tasks */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <CheckSquare className="text-orange-600" size={20} />
                            Plano de Ação / Tarefas
                            <HelpTooltip text="Lista de atividades acordadas para atingir o objetivo do plano." />
                        </h3>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {tasks.map((task) => (
                            <div key={task.id} className={`p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors ${task.completed ? 'bg-slate-50/50' : ''}`}>
                                <button
                                    onClick={() => toggleTask(task.id)}
                                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent hover:border-orange-500'}`}
                                >
                                    <CheckCircle size={14} />
                                </button>
                                <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                    {task.text}
                                </span>
                                <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        {/* New Task Input */}
                        <div className="p-4 bg-slate-50 flex gap-2">
                            <input
                                type="text"
                                placeholder="Adicionar nova tarefa..."
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                            />
                            <button
                                onClick={addTask}
                                disabled={!newTask.trim()}
                                className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Details */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-slate-400" />
                            Resumo
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b border-slate-50">
                                <span className="text-slate-500">Status</span>
                                <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Em Andamento</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-50">
                                <span className="text-slate-500">Início</span>
                                <span className="font-medium text-slate-900">{new Date(plan.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-50">
                                <span className="text-slate-500">Prazo Estimado</span>
                                <span className="font-medium text-slate-900">45 dias</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-100 flex items-center justify-center gap-2">
                            <Save size={18} />
                            Salvar Alterações
                        </button>
                    </div>

                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                        <h4 className="font-bold text-orange-800 mb-2 text-sm uppercase tracking-wider">Dica da IA</h4>
                        <p className="text-sm text-orange-700 leading-relaxed">
                            Baseado no perfil do colaborador, sugerimos focar em tarefas práticas (on-the-job) em vez de apenas teóricas para aumentar o engajamento.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

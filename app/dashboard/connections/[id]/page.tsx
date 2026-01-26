'use client';
import { API_URL } from '../../../../src/config/api';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../src/store/auth-store';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Settings, MessageSquare, FileText, BarChart2, Send, Lock, GitCompare, Plus, Calendar, Trash2, Sparkles, BrainCircuit } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

export default function ConnectionDetailPage() {
    const { id } = useParams(); // Connection ID
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user); // My User
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'inventories' | 'chat' | 'crossProfile'>('overview');
    const [messageInput, setMessageInput] = useState('');
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch Connection Details
    const { data: detail, isLoading: loadingDetail } = useQuery({
        queryKey: ['connection-detail', id],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/connections/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar conexão');
            return res.json();
        }
    });

    // Fetch Comparison Data
    const { data: comparisonData, isLoading: loadingComparison } = useQuery({
        queryKey: ['connection-comparison', id],
        enabled: activeTab === 'overview' && !!detail,
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/connections/${id}/comparison`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return null; // Silent fail if forbidden
            return res.json();
        }
    });

    // Fetch Shared Content (Inventories etc) - Only when tab is relevant
    const { data: sharedContent, isLoading: loadingShared } = useQuery({
        queryKey: ['shared-content', id],
        enabled: activeTab === 'overview' || activeTab === 'inventories',
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/connections/${id}/shared-content`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar dados');
            return res.json();
        }
    });

    // Fetch Messages - Poll every 3s
    const { data: messagesResponse } = useQuery({
        queryKey: ['connection-messages', id],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/connections/${id}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        refetchInterval: 3000
    });

    // Handle both admin and regular user responses
    // Admin returns: { connection, messages, messageCount }
    // Regular returns: [...messages]
    const messages = Array.isArray(messagesResponse) ? messagesResponse : (messagesResponse?.messages || []);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Update Settings
    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: any) => {
            const res = await fetch(`${API_URL}/api/v1/connections/${id}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(newSettings)
            });
            if (!res.ok) throw new Error('Erro ao salvar');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connection-detail', id] });
            alert('Configurações salvas!');
        }
    });

    // Send Message
    const sendMessageMutation = useMutation({
        mutationFn: async (text: string) => {
            await fetch(`${API_URL}/api/v1/connections/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: text })
            });
        },
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries({ queryKey: ['connection-messages', id] });
        }
    });

    // Fetch Cross Profile Reports
    const { data: crossProfileReports, isLoading: loadingReports } = useQuery({
        queryKey: ['cross-profile-list', id],
        enabled: activeTab === 'crossProfile',
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/cross-profile/connection/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar relatórios');
            return res.json();
        }
    });

    // PINC Match AI Mutation
    const generateAiMatchMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/connections/${id}/ai-match`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao gerar análise');
            return res.json();
        },
        onSuccess: (data) => {
            setAiSummary(data.insight);
        },
        onError: () => alert('Não foi possível gerar a análise agora. Tente mais tarde.')
    });

    const generateReportMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/cross-profile/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ connectionId: id })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Erro ao gerar relatório');
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['cross-profile-list', id] });
            router.push(`/dashboard/connections/cross-profile/${data.id}`);
        },
        onError: (err) => alert(err.message)
    });

    const deleteReportMutation = useMutation({
        mutationFn: async (reportId: string) => {
            const res = await fetch(`${API_URL}/api/v1/cross-profile/${reportId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao deletar relatório');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cross-profile-list', id] });
            alert('Relatório removido com sucesso!');
        },
        onError: (err) => alert(err.message)
    });

    if (loadingDetail) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const partner = detail?.partner;
    const mySettings = detail?.mySettings || {};
    const theirSettings = detail?.theirSettings || {};

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* Left Sidebar: Info & Settings */}
            <div className="w-full md:w-1/4 bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-6">
                <div className="text-center">
                    <div className="w-20 h-20 bg-primary/10 text-primary text-3xl font-bold rounded-full flex items-center justify-center mx-auto mb-3">
                        {partner?.name?.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold">{partner?.name}</h2>
                    <p className="text-sm text-gray-500">{partner?.email}</p>
                    <p className="text-xs text-blue-600 font-bold uppercase mt-1">Conectado</p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Settings size={12} /> O que você compartilha
                    </h3>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mySettings.shareInventories || false}
                                onChange={(e) => updateSettingsMutation.mutate({ ...mySettings, shareInventories: e.target.checked })}
                                className="rounded text-primary focus:ring-primary"
                            />
                            Inventários e Resultados
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mySettings.shareQuestionnaires || false}
                                onChange={(e) => updateSettingsMutation.mutate({ ...mySettings, shareQuestionnaires: e.target.checked })}
                                className="rounded text-primary focus:ring-primary"
                            />
                            Questionários
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mySettings.shareActivityHistory || false}
                                onChange={(e) => updateSettingsMutation.mutate({ ...mySettings, shareActivityHistory: e.target.checked })}
                                className="rounded text-primary focus:ring-primary"
                            />
                            Histórico
                        </label>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Lock size={12} /> Permissões Dele(a)
                    </h3>
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>{theirSettings.shareInventories ? '✅ Compartilha Resultados' : '❌ Resultados Ocultos'}</p>
                        <p>{theirSettings.shareQuestionnaires ? '✅ Compartilha Respostas' : '❌ Respostas Ocultas'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden shadow-sm">

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <BarChart2 size={16} /> Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('inventories')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'inventories' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText size={16} /> Inventários
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <MessageSquare size={16} /> Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('crossProfile')}
                        className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'crossProfile' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <GitCompare size={16} /> Relatórios Relacionais
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-300">

                            {/* 🧠 PINC COACH SECTION */}
                            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-1 shadow-xl shadow-indigo-200/50">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 sm:p-8 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                    <div className="relative z-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                                            <div>
                                                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-white/20 shadow-sm">
                                                    <Sparkles size={14} className="text-yellow-300" /> NOVO
                                                </div>
                                                <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">PINC Coach <span className="text-base font-normal opacity-80">(v2.0)</span></h3>
                                                <p className="text-indigo-100 max-w-xl text-sm md:text-base leading-relaxed">
                                                    Descubra a sinergia oculta entre vocês. Nossa IA analisa os traços de comportamento e gera um mapa de compatibilidade profissional exclusivo.
                                                </p>
                                            </div>

                                            {!aiSummary && (
                                                <button
                                                    onClick={() => generateAiMatchMutation.mutate()}
                                                    disabled={generateAiMatchMutation.isPending || loadingComparison || !comparisonData?.radarData}
                                                    className="group bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-3 whitespace-nowrap"
                                                >
                                                    {generateAiMatchMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <BrainCircuit size={20} />}
                                                    Ativar PINC Coach
                                                </button>
                                            )}
                                        </div>

                                        {aiSummary && (
                                            <div className="bg-white/95 backdrop-blur-sm text-gray-800 rounded-xl p-6 md:p-8 shadow-inner border border-white/40 animate-in zoom-in-95 duration-300">
                                                <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-headings:text-indigo-900 prose-p:text-gray-600 prose-a:text-indigo-600">
                                                    <div className="whitespace-pre-wrap">{aiSummary}</div>
                                                </div>
                                                <div className="mt-6 flex justify-end">
                                                    <button onClick={() => setAiSummary(null)} className="text-xs text-indigo-400 hover:text-indigo-600 font-bold underline">Fechar Análise</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* GRÁFICO E DADOS COMPARATIVOS */}
                            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-xl text-gray-900 mb-8 flex items-center gap-2 border-b pb-4">
                                    <GitCompare className="text-primary" /> Comparativo Estrutural
                                </h3>

                                {theirSettings.shareInventories ? (
                                    <>
                                        {loadingComparison ? (
                                            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
                                        ) : comparisonData?.radarData && comparisonData?.me && comparisonData?.partner ? (
                                            <div className="flex flex-col gap-16">
                                                {/* Chart Section */}
                                                <div className="grid lg:grid-cols-2 gap-12 items-center">
                                                    {/* Radar Chart com melhor visibilidade */}
                                                    <div className="bg-gray-50/50 rounded-3xl p-4 flex flex-col items-center justify-center relative min-h-[420px] border border-gray-100">
                                                        <ResponsiveContainer width="100%" height={400}>
                                                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={comparisonData.radarData}>
                                                                <PolarGrid gridType="polygon" stroke="#cbd5e1" strokeWidth={1} />
                                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                                <Radar
                                                                    name="Você"
                                                                    dataKey="A"
                                                                    stroke="#ec4899"
                                                                    strokeWidth={3}
                                                                    fill="#ec4899"
                                                                    fillOpacity={0.4}
                                                                />
                                                                <Radar
                                                                    name={partner?.name.split(' ')[0]}
                                                                    dataKey="B"
                                                                    stroke="#6366f1"
                                                                    strokeWidth={3}
                                                                    fill="#6366f1"
                                                                    fillOpacity={0.4}
                                                                />
                                                                <Legend wrapperStyle={{ paddingTop: '24px', fontSize: '12px', fontWeight: 'bold' }} />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </div>

                                                    <div className="space-y-8">
                                                        <div>
                                                            <h4 className="font-black text-2xl text-gray-900 mb-3 leading-tight">Mapa de Sobreposição</h4>
                                                            <p className="text-gray-600 leading-relaxed text-base">
                                                                O gráfico ao lado revela a dinâmica invisível da relação. Quanto mais sobreposta as áreas coloridas, maior a semelhança natural. Áreas distintas indicam onde um completa o outro.
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div className="p-5 bg-pink-50/50 rounded-2xl border-l-4 border-pink-500">
                                                                <p className="text-xs font-bold text-pink-400 uppercase mb-1 tracking-wider">Seu Perfil</p>
                                                                <p className="font-bold text-gray-900 text-lg">{comparisonData.me.analysis.archetype_name}</p>
                                                            </div>
                                                            <div className="p-5 bg-indigo-50/50 rounded-2xl border-l-4 border-indigo-500">
                                                                <p className="text-xs font-bold text-indigo-400 uppercase mb-1 tracking-wider">Perfil de {partner?.name.split(' ')[0]}</p>
                                                                <p className="font-bold text-gray-900 text-lg">{comparisonData.partner.analysis.archetype_name}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Detailed Breakdown */}
                                                <div className="space-y-8">
                                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                                        <h3 className="font-bold text-xl text-gray-900">Análise Fator a Fator</h3>
                                                    </div>

                                                    {comparisonData.relationship_analysis?.map((trait: any, index: number) => {
                                                        const meTrait = comparisonData.me.full_analysis?.[index];
                                                        const partnerTrait = comparisonData.partner.full_analysis?.[index];

                                                        return (
                                                            <div key={trait.dimension} className="bg-white group rounded-2xl border border-gray-100 p-0 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                                                                {/* Header do Card */}
                                                                <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
                                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-xl shrink-0 ${index % 2 === 0 ? 'bg-gray-900' : 'bg-primary'}`}>
                                                                        {index + 1}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                                                            <h4 className="font-black text-lg text-gray-900">{trait.dimension}</h4>
                                                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${trait.similarity === 'HIGH' ? 'bg-green-100 text-green-700' : trait.similarity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'}`}>
                                                                                {trait.similarity === 'HIGH' ? 'Alta Sinergia' : trait.similarity === 'MEDIUM' ? 'Complementares' : 'Opostos'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-600 font-medium">"{trait.implication}"</p>
                                                                    </div>
                                                                </div>

                                                                {/* Conteúdo Comparativo */}
                                                                <div className="p-6 grid md:grid-cols-2 gap-8 relative">
                                                                    {/* Linha divisória vertical (desktop) */}
                                                                    <div className="hidden md:block absolute top-6 bottom-6 left-1/2 w-px bg-gray-100 -ml-[0.5px]"></div>

                                                                    {/* Lado Esquerdo (Você) */}
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-extrabold text-pink-500 uppercase tracking-widest flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-pink-500"></div> VOCÊ
                                                                            </span>
                                                                            <span className="text-[10px] font-bold bg-pink-50 text-pink-700 px-2.5 py-1 rounded-md border border-pink-100 shadow-sm">
                                                                                {meTrait?.classification} ({
                                                                                    comparisonData.me.scores[trait.key] ??
                                                                                    comparisonData.me.scores[trait.traitKey] ??
                                                                                    comparisonData.me.scores[trait.dimension.includes('Extroversão') ? 'E' : trait.dimension.includes('Agradabilidade') ? 'A' : trait.dimension.includes('Estrutura') ? 'C' : trait.dimension.includes('Abertura') ? 'O' : 'N'] ??
                                                                                    '-'
                                                                                })
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 leading-relaxed text-justify bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                                            {meTrait?.text_interpretation || 'Análise indisponível.'}
                                                                        </div>
                                                                    </div>

                                                                    {/* Lado Direito (Parceiro) */}
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> {partner?.name.split(' ')[0].toUpperCase()}
                                                                            </span>
                                                                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100 shadow-sm">
                                                                                {partnerTrait?.classification} ({
                                                                                    comparisonData.partner.scores[trait.key] ??
                                                                                    comparisonData.partner.scores[trait.traitKey] ??
                                                                                    comparisonData.partner.scores[trait.dimension.includes('Extroversão') ? 'E' : trait.dimension.includes('Agradabilidade') ? 'A' : trait.dimension.includes('Estrutura') ? 'C' : trait.dimension.includes('Abertura') ? 'O' : 'N'] ??
                                                                                    '-'
                                                                                })
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 leading-relaxed text-justify bg-indigo-50/30 p-4 rounded-xl border border-indigo-50/50">
                                                                            {partnerTrait?.text_interpretation || 'Análise indisponível.'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                                                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                                    <BarChart2 className="text-gray-300" size={32} />
                                                </div>
                                                <h3 className="text-gray-800 font-bold text-lg mb-2">Dados insuficientes para comparação</h3>
                                                <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-6">
                                                    Para visualizar o mapa de compatibilidade e usar a IA, ambos os usuários precisam ter completado o inventário Big Five.
                                                </p>
                                                {!comparisonData && (
                                                    <p className="text-xs text-red-400 font-medium bg-red-50 px-3 py-1 rounded-full">
                                                        Erro: Não foi possível carregar os dados. Verifique a conexão.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-yellow-50 text-yellow-800 p-6 rounded-xl text-sm flex items-center justify-center gap-3 border border-yellow-100 shadow-sm">
                                        <Lock size={20} className="shrink-0" />
                                        <span><strong>Acesso Restrito:</strong> {partner?.name} optou por não compartilhar os resultados dos inventários com você.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventories' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Inventários Compartilhados</h3>
                            {loadingShared && <Loader2 className="animate-spin text-primary" />}
                            {!loadingShared && (!sharedContent?.inventories || sharedContent?.inventories?.length === 0) && (
                                <p className="text-gray-500 text-sm italic">Nenhum inventário compartilhado encontrado.</p>
                            )}
                            {sharedContent?.inventories?.map((inv: any) => (
                                <div key={inv.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{inv.assignment.assessment.title}</h4>
                                        <p className="text-xs text-gray-500">Concluído em: {new Date(inv.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/dashboard/assessments/results/${inv.assignment.id}`)}
                                        className="text-primary text-xs font-bold hover:underline"
                                    >
                                        Ver Relatório
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="h-full flex flex-col">
                            <div className="flex-1 space-y-4 overflow-y-auto pr-2 mb-4">
                                {messages?.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Nenhuma mensagem ainda. Diga olá!</p>}
                                {messages?.map((msg: any) => {
                                    const isMe = msg.senderId === user?.id; // Assuming user store has id
                                    // Fallback if user store is messy
                                    const isMeFallback = msg.senderId === detail?.mySettings?.userId;

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                                <p>{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="flex gap-2 bg-white p-2 rounded-lg border border-gray-200">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && messageInput && sendMessageMutation.mutate(messageInput)}
                                    placeholder="Digite uma mensagem..."
                                    className="flex-1 outline-none text-sm px-2"
                                />
                                <button
                                    onClick={() => messageInput && sendMessageMutation.mutate(messageInput)}
                                    disabled={sendMessageMutation.isPending}
                                    className="bg-primary text-white p-2 rounded-lg hover:bg-primary-hover"
                                >
                                    {sendMessageMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'crossProfile' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-gray-800">Histórico de Análises</h3>
                                <button
                                    onClick={() => generateReportMutation.mutate()}
                                    disabled={generateReportMutation.isPending}
                                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-200"
                                >
                                    {generateReportMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Nova Análise
                                </button>
                            </div>

                            {loadingReports ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-violet-600" /></div>
                            ) : (!crossProfileReports || crossProfileReports.length === 0) ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                    <GitCompare className="mx-auto text-gray-300 mb-3" size={48} />
                                    <h3 className="text-lg font-medium text-gray-900">Nenhum relatório encontrado</h3>
                                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">Gere uma análise de pareamento comportamental para descobrir a sinergia entre vocês.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {crossProfileReports.map((report: any) => (
                                        <div key={report.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center">
                                                    <GitCompare size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-900">Análise de Compatibilidade</span>
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase">
                                                            {report.matchLevel?.replace('_', ' ') || 'Processado'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        Gerado em {new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Tem certeza que deseja apagar este relatório?')) {
                                                            deleteReportMutation.mutate(report.id);
                                                        }
                                                    }}
                                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                    title="Apagar Relatório"
                                                >
                                                    {deleteReportMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/dashboard/connections/cross-profile/${report.id}`)}
                                                    className="px-4 py-2 bg-gray-50 text-gray-700 font-bold text-xs rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors"
                                                >
                                                    Visualizar Relatório
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

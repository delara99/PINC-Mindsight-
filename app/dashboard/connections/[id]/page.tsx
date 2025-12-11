'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Settings, MessageSquare, FileText, BarChart2, Send, Lock } from 'lucide-react';

export default function ConnectionDetailPage() {
    const { id } = useParams(); // Connection ID
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user); // My User
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'inventories' | 'chat'>('overview');
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch Connection Details
    const { data: detail, isLoading: loadingDetail } = useQuery({
        queryKey: ['connection-detail', id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3000/api/v1/connections/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar conexão');
            return res.json();
        }
    });

    // Fetch Shared Content (Inventories etc) - Only when tab is relevant
    const { data: sharedContent, isLoading: loadingShared } = useQuery({
        queryKey: ['shared-content', id],
        enabled: activeTab === 'overview' || activeTab === 'inventories',
        queryFn: async () => {
            const res = await fetch(`http://localhost:3000/api/v1/connections/${id}/shared-content`, {
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
            const res = await fetch(`http://localhost:3000/api/v1/connections/${id}/messages`, {
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
            const res = await fetch(`http://localhost:3000/api/v1/connections/${id}/settings`, {
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
            await fetch(`http://localhost:3000/api/v1/connections/${id}/messages`, {
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
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Comparativo de Perfil</h3>
                                {theirSettings.shareInventories ? (
                                    <p className="text-gray-500 text-sm">Aqui virão os gráficos comparativos (Radar Chart) entre você e {partner?.name}. Esta funcionalidade será implementada no próximo passo.</p>
                                ) : (
                                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm flex items-center gap-2">
                                        <Lock size={16} />
                                        <span>{partner?.name} não está compartilhando resultados com você.</span>
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
                </div>
            </div>
        </div>
    );
}

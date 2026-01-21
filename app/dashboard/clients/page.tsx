'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/store/auth-store';
import { useState } from 'react';
import { Loader2, Plus, CreditCard, X, Edit, Check, Trash2, FileText, ExternalLink, Key, Lock, AlertTriangle, MoreVertical, Phone, Calendar, Mail, Building, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mutation movida para dentro do componente para acessar token
import { API_URL } from '../../../src/config/api';

interface Client {
    id: string;
    name: string | null;
    email: string;
    credits: number;
    createdAt: string;
    status?: 'active' | 'pending' | 'inactive';
    companyName?: string | null;
    userType?: 'INDIVIDUAL' | 'COMPANY';
    plan?: 'START' | 'PRO' | 'BUSINESS';
    mustChangePassword?: boolean;
    phone?: string;
    cpf?: string;
    cnpj?: string;
    viewedByAdmin?: boolean;
}

export default function ClientsPage() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'COMPANY' | 'COUPONS'>('INDIVIDUAL');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null); // State para menu dropdown

    const [tempPassword, setTempPassword] = useState<{ pass: string; name: string } | null>(null);

    // Estados para Cupons
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [newCoupon, setNewCoupon] = useState<{ code: string; discountPercent: number; usageLimit: string; allowedPlans: string[] }>({
        code: '',
        discountPercent: 10,
        usageLimit: '',
        allowedPlans: []
    });

    // Restored States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creditsAmount, setCreditsAmount] = useState<number>(0);
    const [creditAmount, setCreditAmount] = useState('');
    const [creditOperation, setCreditOperation] = useState<'add' | 'remove'>('add');

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [clientType, setClientType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
    const [registerData, setRegisterData] = useState({
        email: '',
        password: '',
        name: '',
        cpf: '',
        cnpj: '',
        companyName: '',
        phone: ''
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Queries
    const { data: clients, isLoading } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: async () => {
            if (activeTab === 'COUPONS') return [];
            const response = await fetch(`${API_URL}/api/v1/users/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar clientes');
            return response.json();
        },
        enabled: !!token && activeTab !== 'COUPONS'
    });

    const { data: coupons, refetch: refetchCoupons } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/coupons`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!token && activeTab === 'COUPONS'
    });

    // Mutations
    const resetPasswordMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(`${API_URL}/api/v1/users/${userId}/admin-reset-password`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Falha ao resetar senha');
            }
            return response.json();
        },
        onSuccess: (data, variables) => {
            const clientName = clients?.find(c => c.id === variables)?.name || 'Cliente';
            setTempPassword({ pass: data.tempPassword, name: clientName });
            setOpenMenuId(null);
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
        onError: (error: any) => {
            alert(error.message);
        }
    });

    const createCouponMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_URL}/api/v1/coupons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Erro ao criar cupom');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            setIsCouponModalOpen(false);
            setNewCoupon({ code: '', discountPercent: 10, usageLimit: '', allowedPlans: [] });
            alert('Cupom criado com sucesso!');
        }
    });

    const deleteCouponMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`${API_URL}/api/v1/coupons/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
        }
    });

    const markClientAsViewedMutation = useMutation({
        mutationFn: async (clientId: string) => {
            const res = await fetch(`${API_URL}/api/v1/users/${clientId}/mark-viewed`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao marcar como visualizado');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            setOpenMenuId(null);
        }
    });

    const handleCreateCoupon = (e: React.FormEvent) => {
        e.preventDefault();
        createCouponMutation.mutate({
            ...newCoupon,
            usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : undefined
        });
    };

    const [editData, setEditData] = useState({
        name: '',
        cpf: '',
        cnpj: '',
        companyName: '',
        phone: '',
        plan: 'START'
    });

    const addCreditsMutation = useMutation({
        mutationFn: async ({ userId, amount }: { userId: string, amount: number }) => {
            const response = await fetch(`${API_URL}/api/v1/users/${userId}/credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount })
            });
            if (!response.ok) throw new Error('Erro ao gerenciar créditos');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsModalOpen(false);
            setCreditAmount('');
            setCreditOperation('add');
            setOpenMenuId(null);
            alert('Créditos atualizados com sucesso!');
        },
        onError: () => alert('Erro ao atualizar créditos.')
    });

    const registerClient = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${API_URL}/api/v1/users/register-client`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...data, userType: clientType })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Falha ao cadastrar cliente');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsRegisterModalOpen(false);
            setRegisterData({ email: '', password: '', name: '', cpf: '', cnpj: '', companyName: '', phone: '' });
            alert('Cliente cadastrado com sucesso!');
        },
        onError: (error: any) => alert(error.message || 'Erro ao cadastrar cliente.')
    });

    const updateClientMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const response = await fetch(`${API_URL}/api/v1/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Falha ao atualizar cliente');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsEditModalOpen(false);
            setEditingClient(null);
            setOpenMenuId(null);
            alert('Cliente atualizado com sucesso!');
        },
        onError: (error: any) => alert(error.message || 'Erro ao atualizar cliente.')
    });

    const deleteClientMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_URL}/api/v1/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Falha ao excluir cliente');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setOpenMenuId(null);
            alert('Cliente excluído com sucesso!');
        },
        onError: (error: any) => alert(error.message || 'Erro ao excluir cliente.')
    });

    const openAddCredits = (clientId: string) => {
        setSelectedClient(clientId);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setEditData({
            name: client.name || '',
            cpf: client.cpf || '',
            cnpj: client.cnpj || '',
            companyName: client.companyName || '',
            phone: client.phone || '',
            plan: client.plan || 'START'
        });
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleUpdateClient = () => {
        if (editingClient) {
            const userType = editData.cpf ? 'INDIVIDUAL' : 'COMPANY';
            updateClientMutation.mutate({
                id: editingClient.id,
                data: { ...editData, userType }
            });
        }
    };

    const handleAddCredits = () => {
        if (selectedClient && creditAmount) {
            const amount = parseInt(creditAmount);
            const finalAmount = creditOperation === 'remove' ? -amount : amount;
            addCreditsMutation.mutate({ userId: selectedClient, amount: finalAmount });
        }
    };

    // Relatórios
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
    const [clientReports, setClientReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [reportClientName, setReportClientName] = useState('');

    const fetchClientReports = async (clientId: string, clientName: string) => {
        setReportClientName(clientName);
        setOpenMenuId(null);
        setIsReportsModalOpen(true);
        setLoadingReports(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/assessments/user/${clientId}/completed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setClientReports(data);
            } else {
                alert('Erro ao carregar relatórios');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar relatórios');
        } finally {
            setLoadingReports(false);
        }
    };

    const handleDownloadReport = async (assignmentId: string, title: string) => {
        try {
            const response = await fetch(`${API_URL}/api/v1/reports/download/${assignmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao baixar PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Relatorio-${title.replace(/\s+/g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('Erro ao baixar PDF');
        }
    };

    return (
        <div className="space-y-8 relative p-2 md:p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Meus Clientes</h1>
                    <p className="text-gray-500 mt-1 text-sm">Gerencie usuários, créditos e acessos.</p>
                </div>
                <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                    <Plus size={18} />
                    Novo Cliente
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-full md:w-fit overflow-x-auto">
                <button
                    onClick={() => setActiveTab('INDIVIDUAL')}
                    className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'INDIVIDUAL' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pessoas (B2C)
                </button>
                <button
                    onClick={() => setActiveTab('COMPANY')}
                    className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'COMPANY' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Gestores Business (B2B)
                </button>
                <button
                    onClick={() => setActiveTab('COUPONS')}
                    className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'COUPONS' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Cupons
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-primary" />
                </div>
            ) : activeTab === 'COUPONS' ? (
                // Tabela de Cupons (Simplificada)
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-700">Gerenciar Cupons</h3>
                        <button onClick={() => setIsCouponModalOpen(true)} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors font-bold text-xs flex items-center gap-1">
                            <Plus size={14} /> Criar Novo
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th className="text-left py-3 px-6">Código</th>
                                    <th className="text-left py-3 px-6">Desconto</th>
                                    <th className="text-left py-3 px-6">Usos</th>
                                    <th className="text-right py-3 px-6">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {Array.isArray(coupons) && coupons.map((coupon: any) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-6 font-mono font-bold text-gray-800">{coupon.code}</td>
                                        <td className="py-3 px-6 text-green-600 font-bold">{coupon.discountPercent}% OFF</td>
                                        <td className="py-3 px-6 text-gray-500 text-sm">{coupon.usageCount} / {coupon.usageLimit || '∞'}</td>
                                        <td className="py-3 px-6 text-right">
                                            <button onClick={() => confirm('Excluir?') && deleteCouponMutation.mutate(coupon.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // Lista de Clientes Otimizada
                <div className="grid gap-4 md:gap-0 bg-transparent md:bg-white md:rounded-2xl md:border md:border-gray-200 md:shadow-sm overflow-visible">
                    {/* Header da Tabela (Desktop) */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/80 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-5">Cliente / Detalhes</div>
                        <div className="col-span-3 text-center">Status & Plano</div>
                        <div className="col-span-3 text-center">Créditos & Info</div>
                        <div className="col-span-1 text-right">Ações</div>
                    </div>

                    {/* Linhas */}
                    {clients?.filter(c => (c.userType || 'INDIVIDUAL') === activeTab).map((client) => (
                        <div key={client.id} className="relative bg-white p-4 md:p-0 rounded-2xl shadow-sm md:shadow-none md:rounded-none md:grid md:grid-cols-12 md:gap-4 md:px-6 md:py-5 border-b border-gray-100 hover:bg-slate-50 transition-colors items-center group">

                            {/* Coluna 1: Cliente Info */}
                            <div className="col-span-5 flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${activeTab === 'COMPANY' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {activeTab === 'COMPANY' ? <Building size={18} /> : <User size={18} />}
                                </div>
                                <div className="space-y-1 overflow-hidden">
                                    <div className="font-bold text-gray-900 truncate" title={client.companyName || client.name || ''}>
                                        {client.companyName || client.name || 'Sem nome'}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1.5 break-all">
                                        <Mail size={12} className="shrink-0" /> {client.email}
                                    </div>
                                    <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                            {activeTab === 'COMPANY' ? (client.cnpj || 'Sem CNPJ') : (client.cpf || 'Sem CPF')}
                                        </span>
                                        {client.phone && (
                                            <span className="flex items-center gap-1">
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <Phone size={10} /> {client.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Coluna 2: Status e Plano */}
                            <div className="col-span-3 flex flex-row md:flex-col gap-2 items-center md:justify-center mt-3 md:mt-0">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border ${client.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                    client.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {client.status === 'active' ? <Check size={10} /> : null}
                                    {client.status === 'active' ? 'Ativo' : client.status === 'pending' ? 'Pendente' : 'Inativo'}
                                </span>

                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${client.plan === 'BUSINESS' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    client.plan === 'PRO' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                        'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}>
                                    {client.plan || 'START'}
                                </span>
                            </div>

                            {/* Coluna 3: Créditos e Data */}
                            <div className="col-span-3 flex md:flex-col items-center justify-between md:justify-center gap-1 mt-3 md:mt-0">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm border border-blue-100">
                                    <CreditCard size={14} />
                                    {client.credits} <span className="text-[10px] uppercase opacity-70">créditos</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                            </div>

                            {/* Coluna 4: Ações (Menu) */}
                            <div className="col-span-1 flex justify-end mt-3 md:mt-0 relative">
                                <button
                                    onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                                    className={`p-2 rounded-lg transition-colors relative z-10 ${openMenuId === client.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <MoreVertical size={20} />
                                    {client.mustChangePassword && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {openMenuId === client.id && (
                                    <>
                                        <div className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenMenuId(null)}></div>
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-30 py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
                                            <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                                <p className="text-xs font-bold text-gray-400 uppercase">Ações Rápidas</p>
                                            </div>

                                            <button
                                                onClick={() => fetchClientReports(client.id, client.name || 'Cliente')}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                                            >
                                                <FileText size={16} className="text-blue-500" /> Relatórios
                                            </button>

                                            <button
                                                onClick={() => openAddCredits(client.id)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                                            >
                                                <CreditCard size={16} className="text-green-500" /> Gerenciar Créditos
                                            </button>

                                            <div className="h-px bg-gray-50 my-1"></div>

                                            <button
                                                onClick={() => openEditModal(client)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Edit size={16} className="text-gray-400" /> Editar Dados
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (confirm(`Resetar senha de ${client.name}?`)) resetPasswordMutation.mutate(client.id);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 flex items-center gap-2 group"
                                            >
                                                <Key size={16} className={`text-amber-500 ${client.mustChangePassword ? 'animate-pulse' : ''}`} />
                                                Resetar Senha
                                                {client.mustChangePassword && <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">!</span>}
                                            </button>

                                            {!client.viewedByAdmin && (
                                                <button
                                                    onClick={() => markClientAsViewedMutation.mutate(client.id)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Check size={16} className="text-gray-400" /> Marcar Visto
                                                </button>
                                            )}

                                            <div className="h-px bg-gray-50 my-1"></div>

                                            <button
                                                onClick={() => {
                                                    if (confirm('Excluir este cliente permanentemente?')) deleteClientMutation.mutate(client.id);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold"
                                            >
                                                <Trash2 size={16} /> Excluir Cliente
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {clients?.filter(c => (c.userType || 'INDIVIDUAL') === activeTab).length === 0 && (
                        <div className="p-10 text-center text-gray-400">Nenhum cliente encontrado nesta categoria.</div>
                    )}
                </div>
            )}

            {/* Modais (Mantidos e inalterados em lógica, apenas renderizados no final) */}
            {isReportsModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold">Relatórios: {reportClientName}</h3>
                                <p className="text-gray-500 mt-1 text-sm">Baixe os resultados em PDF</p>
                            </div>
                            <button onClick={() => setIsReportsModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>
                        {loadingReports ? (
                            <div className="flex justify-center py-10"><Loader2 size={30} className="animate-spin text-primary" /></div>
                        ) : clientReports.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">Nenhuma avaliação concluída.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {clientReports.map((report: any) => (
                                    <div key={report.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/30 transition-all group">
                                        <div>
                                            <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{report.title}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar size={12} /> {new Date(report.completedAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <button onClick={() => handleDownloadReport(report.id, report.title)} className="bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary hover:shadow-md px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
                                            ⬇ PDF
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Cadastro, Edição, Créditos, Senha (Mantendo implementação anterior mas com z-index alto) */}
            {/* Modal Cadastro */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">Novo Cliente</h3>
                                <p className="text-gray-500 text-sm">Preencha os dados abaixo.</p>
                            </div>
                            <button onClick={() => setIsRegisterModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl">
                            <button onClick={() => setClientType('INDIVIDUAL')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${clientType === 'INDIVIDUAL' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Pessoa Física</button>
                            <button onClick={() => setClientType('COMPANY')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${clientType === 'COMPANY' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Pessoa Jurídica</button>
                        </div>
                        {/* Form Fields (Simplificado para brevidade, mas mantendo funcionalidade) */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email *</label>
                                <input type="email" value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome / Razão Social *</label>
                                <input type="text" value={clientType === 'INDIVIDUAL' ? registerData.name : registerData.companyName} onChange={e => clientType === 'INDIVIDUAL' ? setRegisterData({ ...registerData, name: e.target.value }) : setRegisterData({ ...registerData, companyName: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required />
                            </div>
                            {clientType === 'COMPANY' && (
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Fantasia</label>
                                    <input type="text" value={registerData.name} onChange={e => setRegisterData({ ...registerData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">{clientType === 'INDIVIDUAL' ? 'CPF' : 'CNPJ'} *</label>
                                <input type="text" value={clientType === 'INDIVIDUAL' ? registerData.cpf : registerData.cnpj} onChange={e => clientType === 'INDIVIDUAL' ? setRegisterData({ ...registerData, cpf: e.target.value }) : setRegisterData({ ...registerData, cnpj: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone</label>
                                <input type="tel" value={registerData.phone} onChange={e => setRegisterData({ ...registerData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Senha Inicial *</label>
                                <input type="password" value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" required minLength={6} placeholder="Mínimo 6 caracteres" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                            <button onClick={() => setIsRegisterModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={() => registerClient.mutate(registerData)} disabled={registerClient.isPending} className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-hover flex items-center gap-2">
                                {registerClient.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Cadastrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edição */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Editar Cliente</h3>
                                <p className="text-sm text-gray-500">
                                    {editingClient?.userType === 'COMPANY' ? 'Pessoa Jurídica (B2B)' : 'Pessoa Física (B2C)'}
                                </p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            {/* Email (Readonly) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email de Acesso (Não editável)</label>
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed">
                                    <Mail size={16} />
                                    {editingClient?.email}
                                </div>
                            </div>

                            {/* Nome / Razão Social */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    {editingClient?.userType === 'COMPANY' ? 'Razão Social' : 'Nome Completo'}
                                </label>
                                <input
                                    type="text"
                                    value={editingClient?.userType === 'COMPANY' ? editData.companyName : editData.name}
                                    onChange={e => editingClient?.userType === 'COMPANY' ? setEditData({ ...editData, companyName: e.target.value }) : setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            {/* Nome Fantasia (Apenas B2B) */}
                            {editingClient?.userType === 'COMPANY' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Fantasia</label>
                                    <input
                                        type="text"
                                        value={editData.name} // No modelo atual, 'name' é usado como fantasia para PJ visualmente em alguns lugares, ou vice-versa. Ajuste conforme seu backend.
                                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary"
                                        placeholder="Nome comercial da empresa"
                                    />
                                </div>
                            )}

                            {/* Documento e Telefone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        {editingClient?.userType === 'COMPANY' ? 'CNPJ' : 'CPF'}
                                    </label>
                                    <input
                                        type="text"
                                        value={editingClient?.userType === 'COMPANY' ? editData.cnpj : editData.cpf}
                                        onChange={e => editingClient?.userType === 'COMPANY' ? setEditData({ ...editData, cnpj: e.target.value }) : setEditData({ ...editData, cpf: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        value={editData.phone}
                                        onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Plano e Status (Opcional) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Plano de Acesso</label>
                                    <select value={editData.plan} onChange={e => setEditData({ ...editData, plan: e.target.value as any })} className="w-full px-4 py-2 border rounded-lg bg-white outline-none focus:border-primary cursor-pointer hover:border-gray-400 transition-colors">
                                        <option value="START">Start</option>
                                        <option value="PRO">Pro</option>
                                        <option value="BUSINESS">Business</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status da Conta</label>
                                    <div className="px-4 py-2 bg-gray-50 border rounded-lg text-gray-500 text-sm flex items-center justify-between">
                                        <span>{editingClient?.status === 'active' ? 'Ativo' : 'Inativo'}</span>
                                        {/* Status geralmente requer endpoint específico para ativar/desativar, mantido como display por enquanto ou adicione select se o update suportar */}
                                        <div className={`w-2 h-2 rounded-full ${editingClient?.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                            <button onClick={handleUpdateClient} disabled={updateClientMutation.isPending} className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                                {updateClientMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Salvar Alterações</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Créditos */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <CreditCard size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-1">Gerenciar Créditos</h3>
                        <p className="text-gray-500 text-sm mb-6">Adicione ou remova créditos.</p>

                        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                            <button onClick={() => setCreditOperation('add')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${creditOperation === 'add' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Adicionar</button>
                            <button onClick={() => setCreditOperation('remove')} className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${creditOperation === 'remove' ? 'bg-white shadow text-red-500' : 'text-gray-500'}`}>Remover</button>
                        </div>

                        <input type="number" min="1" autoFocus placeholder="Quantidade" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} className="w-full text-center text-3xl font-bold border-b-2 border-gray-200 focus:border-primary outline-none py-2 mb-8 bg-transparent" />

                        <div className="flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                            <button onClick={handleAddCredits} disabled={!creditAmount || addCreditsMutation.isPending} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Senha Temp */}
            {tempPassword && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] backdrop-blur-sm p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border-2 border-primary/20 text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Key className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Senha Resetada!</h3>
                        <p className="text-gray-500 mt-2 text-sm">A senha de <strong>{tempPassword.name}</strong> foi redefinida.</p>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 my-6 relative group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { navigator.clipboard.writeText(tempPassword.pass); alert('Copiado!'); }}>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Senha Temporária</p>
                            <p className="text-2xl font-mono font-bold text-primary">{tempPassword.pass}</p>
                            <p className="text-[10px] text-gray-400 mt-2">Toque para copiar</p>
                        </div>

                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-6 flex gap-3 text-left">
                            <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-yellow-800 leading-relaxed">
                                O usuário será <strong>obrigado</strong> a criar uma nova senha no próximo login.
                            </p>
                        </div>

                        <button onClick={() => setTempPassword(null)} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20">
                            Entendi, fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
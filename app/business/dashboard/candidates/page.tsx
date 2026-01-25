"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, MoreHorizontal, CheckCircle, XCircle, Clock, UserCheck, Shield, Trash2, RefreshCw, Key, FileText, Coins, ArrowRight } from 'lucide-react';
import { API_URL } from '@/src/config/api';

export default function CandidatesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ credits: 0 });
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [initialCredits, setInitialCredits] = useState(0); // Novo campo
    const [createLoading, setCreateLoading] = useState(false);

    // Transfer Modal State
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [transferAmount, setTransferAmount] = useState(1);
    const [transferLoading, setTransferLoading] = useState(false);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/business/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('DEBUG: Employees Data Received:', res.data); // LOG 1
            setEmployees(res.data);

            // Fetch global stats
            const resStats = await axios.get(`${API_URL}/api/v1/business/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(resStats.data);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const generateCode = () => {
        const code = 'PINC-' + Math.floor(1000 + Math.random() * 9000);
        setAccessCode(code);
    };

    useEffect(() => {
        if (isCreateModalOpen && !accessCode) generateCode();
    }, [isCreateModalOpen]);

    // HANDLERS

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/business/employees`, {
                name: newName,
                accessCode: accessCode,
                initialCredits: Number(initialCredits)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsCreateModalOpen(false);
            setNewName('');
            setAccessCode('');
            setInitialCredits(0);
            fetchEmployees();
            alert('Colaborador criado com sucesso!');
        } catch (error) {
            alert('Erro ao criar colaborador.');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/business/employees/${id}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEmployees();
        } catch (error) {
            alert('Erro ao alterar status.');
        }
    };

    // Nova Lógica: Transferir Créditos
    const openTransferModal = (employee: any) => {
        setSelectedEmployee(employee);
        setTransferAmount(1);
        setIsTransferModalOpen(true);
        setOpenMenuId(null);
    };

    const handleTransferCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        setTransferLoading(true);

        if (stats.credits < transferAmount) {
            alert('Você não possui saldo de créditos suficientes.');
            setTransferLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/business/employees/${selectedEmployee.id}/transfer-credit`, {
                amount: Number(transferAmount)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Sucesso! ${transferAmount} créditos transferidos para ${selectedEmployee.name}.`);
            setIsTransferModalOpen(false);
            fetchEmployees();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao transferir créditos.');
        } finally {
            setTransferLoading(false);
        }
    };

    // Liberar Teste (Consome da carteira do colaborador)
    const handleReleaseTest = async (emp: any) => {
        const currentCredits = typeof emp.credits === 'number' ? emp.credits : 0;
        console.log(`DEBUG: handleReleaseTest for ${emp.name} (ID: ${emp.id})`);
        console.log(`DEBUG: Raw Credits: ${emp.credits}, Processed: ${currentCredits}`);

        // Validation: Colaborador tem crédito?
        if (currentCredits < 1) {
            console.log('DEBUG: Block triggered. Opening logic.');
            // BLOQUEIO COM POPUP
            if (confirm(`⚠️ AÇÃO NECESSÁRIA\n\nO colaborador "${emp.name}" não possui créditos atribuídos. (Saldo: ${currentCredits})\n\nÉ necessário transferir créditos para ele antes de liberar o teste.\n\nDeseja abrir a tela de transferência agora?`)) {
                openTransferModal(emp);
            }
            return;
        }

        console.log('DEBUG: Block passed. Proceeding to API.');

        if (!confirm(`Confirmar liberação de teste para "${emp.name}"?\nIsso consumirá 1 crédito do saldo DO COLABORADOR.`)) return;

        try {
            const token = localStorage.getItem('accessToken');
            // Chama o endpoint antigo (que agora usa a nova lógica interna "createAssignmentFromWallet")
            await axios.post(`${API_URL}/api/v1/business/employees/${emp.id}/distribute-credit`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEmployees();
            alert('Teste liberado com sucesso!');
        } catch (error: any) {
            console.error('DEBUG: API Error:', error.response?.data);
            // Se der erro de saldo insuficiente vindo do backend (garantia extra)
            if (error.response?.data?.message?.includes('SALDO_INSUFICIENTE') || error.response?.status === 400) {
                if (confirm(`O colaborador não tem saldo suficiente (Backend Reject). Deseja transferir agora?`)) {
                    openTransferModal(emp);
                }
            } else {
                alert(error.response?.data?.message || 'Erro ao liberar teste.');
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o colaborador "${name}"? Esta ação removerá todos os dados e não pode ser desfeita.`)) return;
        try {
            const token = localStorage.getItem('accessToken');
            await axios.delete(`${API_URL}/api/v1/business/employees/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEmployees();
            setOpenMenuId(null);
            alert('Colaborador excluído com sucesso.');
        } catch (error) {
            alert('Erro ao excluir colaborador.');
        }
    };

    const handleResetCode = async (id: string, name: string) => {
        if (!confirm(`Deseja gerar um novo código de acesso para "${name}"? O código anterior deixará de funcionar.`)) return;
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/business/employees/${id}/reset-code`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEmployees();
            setOpenMenuId(null);
            alert('Código resetado com sucesso! Verifique o novo código na tabela.');
        } catch (error) {
            alert('Erro ao resetar código.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
                    <p className="text-slate-500">Gerencie o acesso (Seu Saldo Global: <span className="font-bold text-purple-600">{stats.credits}</span>)</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                    <Plus size={16} /> Adicionar Colaborador
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Nome</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Código</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-center">Saldo (Créditos)</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Situação Teste</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Carregando...</td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Nenhum colaborador encontrado.</td></tr>
                            ) : (
                                employees.map((emp) => {
                                    const lastAssign = emp.assignments?.[0];
                                    const status = lastAssign?.status || 'NOT_STARTED';
                                    return (
                                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{emp.name || 'Sem nome'}</div>
                                                <div className="text-xs text-slate-400">ID: {emp.id.slice(0, 8)}...</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-600">
                                                <span className="bg-slate-100 px-2 py-1 rounded">{emp.companyName || '???'}</span>
                                            </td>

                                            {/* Coluna Saldo */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                                                    <Coins size={14} className="text-yellow-600" />
                                                    {emp.credits || 0}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(emp.id)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${emp.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                                >
                                                    {emp.status === 'active' ? 'Ativo' : 'Inativo'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                {status === 'COMPLETED' ? (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                            <CheckCircle size={14} /> Concluído
                                                        </div>
                                                        <a href={`/business/dashboard/reports/${emp.id}`} className="text-[10px] text-purple-600 hover:underline">Ver Relatório</a>
                                                    </div>
                                                ) : status === 'IN_PROGRESS' || status === 'PENDING' ? (
                                                    <div className="flex items-center gap-2 text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded border border-blue-100 w-fit">
                                                        <Clock size={14} /> Liberado
                                                    </div>
                                                ) : (
                                                    // Lógica Inteligente de Ação
                                                    (emp.credits || 0) > 0 ? (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const token = localStorage.getItem('accessToken');
                                                                    await axios.post(`${API_URL}/api/v1/business/employees/${emp.id}/distribute-credit`, {}, {
                                                                        headers: { Authorization: `Bearer ${token}` }
                                                                    });
                                                                    fetchEmployees();
                                                                    alert('Teste ativado com sucesso!');
                                                                } catch (e) { alert('Erro ao ativar.'); }
                                                            }}
                                                            className="flex items-center gap-2 text-white font-bold text-xs bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-all shadow-sm w-full justify-center"
                                                        >
                                                            <Shield size={14} /> Ativar Teste
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => openTransferModal(emp)}
                                                            className="flex items-center gap-2 text-slate-600 font-bold text-xs hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-purple-200 transition-all shadow-sm bg-white"
                                                        >
                                                            <Coins size={14} /> Adicionar Créditos
                                                        </button>
                                                    )
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right relative">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)}
                                                    className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {openMenuId === emp.id && (
                                                    <div className="absolute right-8 top-8 z-20 w-56 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1">
                                                        <button
                                                            onClick={() => openTransferModal(emp)}
                                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 rounded-md transition-colors"
                                                        >
                                                            <Coins size={14} /> Transferir Créditos
                                                        </button>
                                                        <div className="h-px bg-slate-100 my-1"></div>
                                                        <button
                                                            onClick={() => handleResetCode(emp.id, emp.name)}
                                                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-md"
                                                        >
                                                            <RefreshCw size={14} /> Resetar Código
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(emp.id, emp.name)}
                                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-md"
                                                        >
                                                            <Trash2 size={14} /> Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Novo Colaborador</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                <input type="text" required className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                                    value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Maria Silva" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Créditos Iniciais</label>
                                    <input type="number" min="0" max={stats.credits} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                                        value={initialCredits} onChange={e => setInitialCredits(Number(e.target.value))} />
                                    <p className="text-[10px] text-slate-400 mt-1">Seu saldo: {stats.credits}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Código (Auto)</label>
                                    <input type="text" readOnly className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-center font-bold text-slate-500" value={accessCode} />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50">Cancelar</button>
                                <button type="submit" disabled={createLoading} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black disabled:opacity-70 flex items-center justify-center gap-2">
                                    {createLoading ? 'Criando...' : 'Criar Acesso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TRANSFER MODAL */}
            {isTransferModalOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Transferir Créditos</h3>
                            <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                        </div>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600">
                                <Coins size={32} />
                            </div>
                            <p className="text-sm text-slate-500">Para: <span className="font-bold text-slate-900">{selectedEmployee.name}</span></p>
                            <p className="text-xs text-slate-400">Saldo atual dele: {selectedEmployee.credits || 0}</p>
                        </div>

                        <form onSubmit={handleTransferCredits} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade a Transferir</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" min="1" max={stats.credits} required className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none text-center font-bold text-lg"
                                        value={transferAmount} onChange={e => setTransferAmount(Number(e.target.value))} />
                                </div>
                                <p className="text-xs text-center mt-2 text-slate-500">Disponível na sua conta: <span className="font-bold text-slate-900">{stats.credits}</span></p>
                            </div>

                            <button type="submit" disabled={transferLoading} className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-200/50 transition-all">
                                {transferLoading ? 'Transferindo...' : 'Confirmar Transferência'} <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

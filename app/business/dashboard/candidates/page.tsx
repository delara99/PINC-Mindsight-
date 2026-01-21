
"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, MoreHorizontal, CheckCircle, XCircle, Clock, UserCheck, Shield } from 'lucide-react';

export default function CandidatesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [credits, setCredits] = useState(0);

    // Create Form
    const [newName, setNewName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);

            // Fetch stats for credits
            const resStats = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCredits(resStats.data.credits || 0);

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
        if (isModalOpen && !accessCode) generateCode();
    }, [isModalOpen]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/employees`, {
                name: newName,
                accessCode: accessCode
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            setNewName('');
            setAccessCode('');
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
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/employees/${id}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEmployees();
        } catch (error) {
            alert('Erro ao alterar status.');
        }
    };

    const handleDistributeCredit = async (id: string, empName: string) => {
        // Validation visually
        if (credits <= 0) {
            alert('Você não tem créditos suficientes para liberar esta avaliação.');
            return;
        }

        if (!confirm(`Deseja utilizar 1 crédito para liberar o teste de ${empName}? Saldo atual: ${credits}`)) return;

        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/employees/${id}/distribute-credit`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEmployees();
            alert('Teste liberado com sucesso!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao liberar crédito.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
                    <p className="text-slate-500">Gerencie o acesso (Créditos Disponíveis: <span className="font-bold text-purple-600">{credits}</span>)</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
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
                                <th className="px-6 py-4 font-semibold text-slate-700">Código de Acesso</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Avaliação</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Data Criação</th>
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
                                            <td className="px-6 py-4 font-mono font-bold text-slate-600 bg-slate-50 rounded-lg select-all text-center border border-slate-100">
                                                {emp.companyName || 'PINC-????'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleToggleStatus(emp.id)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${emp.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                                >
                                                    {emp.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {emp.status === 'active' ? 'Ativo' : 'Inativo'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                {status === 'COMPLETED' ? (
                                                    <div className="flex items-center gap-2 text-green-600 font-medium text-xs">
                                                        <CheckCircle size={14} /> Concluído
                                                    </div>
                                                ) : status === 'IN_PROGRESS' || status === 'PENDING' ? (
                                                    <div className="flex items-center gap-2 text-blue-600 font-medium text-xs">
                                                        <Clock size={14} /> Liberado
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDistributeCredit(emp.id, emp.name)}
                                                        className="flex items-center gap-2 text-slate-500 font-bold text-xs hover:text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded transition-all border border-slate-200 hover:border-purple-200 bg-white"
                                                    >
                                                        <Shield size={14} /> Liberar Teste (-1 Crédito)
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(emp.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-slate-900"><MoreHorizontal size={18} /></button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Novo Colaborador</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Ex: Maria Silva"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Código de Acesso (Login)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-600 bg-slate-50 focus:outline-none text-center tracking-widest"
                                        value={accessCode}
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1 rounded cursor-pointer border border-transparent hover:border-purple-100 whitespace-nowrap"
                                    >
                                        Gerar Novo
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2 bg-yellow-50 p-2 rounded text-yellow-700 border border-yellow-100">
                                    ⚠️ Copie este código e envie para o colaborador. Ele será usado como senha de acesso.
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {createLoading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : 'Criar Acesso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

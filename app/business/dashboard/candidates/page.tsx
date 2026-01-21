
"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Search, MoreHorizontal, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CandidatesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Create Form
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/business/employees`, {
                name: newName,
                email: newEmail
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            setNewName('');
            setNewEmail('');
            fetchEmployees(); // Refresh list
            alert('Convite enviado com sucesso!');
        } catch (error) {
            alert('Erro ao criar colaborador. Verifique se o email já existe.');
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
                    <p className="text-slate-500">Gerencie o acesso e convites da sua equipe.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
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
                            placeholder="Buscar por nome ou email..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Nome</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Avaliação</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Data Criação</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Carregando...</td></tr>
                        ) : employees.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nenhum colaborador encontrado.</td></tr>
                        ) : (
                            employees.map((emp) => {
                                const lastAssign = emp.assignments?.[0];
                                const status = lastAssign?.status || 'NOT_STARTED';
                                return (
                                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{emp.name || 'Sem nome'}</div>
                                            <div className="text-slate-500 text-xs">{emp.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {emp.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                    Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                                    Pendente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {status === 'COMPLETED' ? (
                                                <div className="flex items-center gap-2 text-green-600 font-medium text-xs">
                                                    <CheckCircle size={14} /> Concluído
                                                </div>
                                            ) : status === 'IN_PROGRESS' ? (
                                                <div className="flex items-center gap-2 text-blue-600 font-medium text-xs">
                                                    <Clock size={14} /> Em andamento
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 font-medium text-xs">
                                                    <Clock size={14} /> Não iniciado
                                                </div>
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

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
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
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail Corporativo</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50">Cancelar</button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black disabled:opacity-70"
                                >
                                    {createLoading ? 'Criando...' : 'Enviar Convite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

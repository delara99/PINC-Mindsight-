
"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Building2, UserCircle2, Mail, Lock } from 'lucide-react';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form Creation
    const [newCompany, setNewCompany] = useState({
        name: '',
        email: '',
        password: 'ChangeMe123!',
        cnpj: '',
        plan: 'BUSINESS'
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/users/clients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filtrar apenas empresas (BUSINESS ou Role TENANT_ADMIN + type COMPANY se houver)
            // Aqui vamos assumir que queremos ver quem tem plano BUSINESS
            const businessClients = res.data.filter((c: any) => c.plan === 'BUSINESS');
            setCompanies(businessClients);
        } catch (error) {
            console.error("Erro ao buscar empresas", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/users/register-client`, {
                ...newCompany,
                role: 'TENANT_ADMIN', // O primeiro usuário é o admin da empresa
                userType: 'COMPANY',
                status: 'active'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Empresa criada com sucesso!');
            setIsModalOpen(false);
            fetchCompanies();
        } catch (error: any) {
            alert('Erro ao criar empresa: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Empresas (B2B)</h1>
                    <p className="text-slate-500">Gerencie contas corporativas e acesso ao módulo Business.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-black transition-all flex items-center gap-2"
                >
                    <Plus size={18} /> Nova Empresa
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <p>Carregando...</p> : companies.map(company => (
                    <div key={company.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-purple-200 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-purple-100 p-3 rounded-lg text-purple-700">
                                <Building2 size={24} />
                            </div>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">Ativo</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">{company.name}</h3>
                        <p className="text-slate-500 text-sm mb-4">{company.email}</p>

                        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <UserCircle2 size={16} />
                                <span>Admin Master</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={16} />
                                <span className="truncate">{company.email}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Criação */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Cadastrar Nova Empresa</h2>
                        <form onSubmit={handleCreateCompany} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Razão Social / Nome da Empresa</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                    value={newCompany.name}
                                    onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Email do Gestor (Login RH)</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                    value={newCompany.email}
                                    onChange={e => setNewCompany({ ...newCompany, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">CNPJ (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                                        value={newCompany.cnpj}
                                        onChange={e => setNewCompany({ ...newCompany, cnpj: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Senha Inicial</label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                                        value={newCompany.password}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-black">Criar Acesso</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useState } from 'react';
import { Loader2, Plus, CreditCard, X, Edit, Check } from 'lucide-react';

interface Client {
    id: string;
    name: string | null;
    email: string;
    credits: number;
    createdAt: string;
    status?: 'active' | 'pending' | 'inactive';
    companyName?: string | null;
    userType?: 'INDIVIDUAL' | 'COMPANY';
}

export default function ClientsPage() {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creditsAmount, setCreditsAmount] = useState<number>(0);
    const [creditAmount, setCreditAmount] = useState('');
    const [creditOperation, setCreditOperation] = useState<'add' | 'remove'>('add');

    // Estados para cadastro
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

    // Estados para edição
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editData, setEditData] = useState({
        name: '',
        cpf: '',
        cnpj: '',
        companyName: '',
        phone: ''
    });

    // Listar Clientes
    const { data: clients, isLoading } = useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/users/clients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar clientes');
            return response.json();
        }
    });

    // Adicionar/Remover Créditos
    const addCreditsMutation = useMutation({
        mutationFn: async ({ userId, amount }: { userId: string, amount: number }) => {
            const response = await fetch(`http://localhost:3000/api/v1/users/${userId}/credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
            alert('Créditos atualizados com sucesso!');
        },
        onError: () => {
            alert('Erro ao atualizar créditos.');
        }
    });

    // Registrar novo cliente
    const registerClient = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/users/register-client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    userType: clientType
                })
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
            setRegisterData({
                email: '',
                password: '',
                name: '',
                cpf: '',
                cnpj: '',
                companyName: '',
                phone: ''
            });
            alert('Cliente cadastrado com sucesso!');
        },
        onError: (error: any) => {
            alert(error.message || 'Erro ao cadastrar cliente.');
        }
    });

    // Atualizar Cliente
    const updateClientMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const response = await fetch(`http://localhost:3000/api/v1/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
            alert('Cliente atualizado com sucesso!');
        },
        onError: (error: any) => {
            alert(error.message || 'Erro ao atualizar cliente.');
        }
    });

    const openAddCredits = (clientId: string) => {
        setSelectedClient(clientId);
        setIsModalOpen(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setEditData({
            name: client.name || '',
            cpf: (client as any).cpf || '',
            cnpj: (client as any).cnpj || '',
            companyName: (client as any).companyName || '',
            phone: (client as any).phone || ''
        });
        setIsEditModalOpen(true);
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

    // Estados para relatórios
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
    const [clientReports, setClientReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [reportClientName, setReportClientName] = useState('');

    const fetchClientReports = async (clientId: string, clientName: string) => {
        setReportClientName(clientName);
        setIsReportsModalOpen(true);
        setLoadingReports(true);
        try {
            const response = await fetch(`http://localhost:3000/api/v1/assessments/user/${clientId}/completed`, {
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
            const response = await fetch(`http://localhost:3000/api/v1/reports/download/${assignmentId}`, {
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
        <div className="space-y-8 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Meus Clientes</h1>
                    <p className="text-gray-500 mt-1">Gerencie usuários e atribua créditos para avaliações.</p>
                </div>
                <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    Novo Cliente
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-primary" />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome / Email</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Data Cadastro</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo de Créditos</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {clients?.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="font-medium text-gray-900">
                                            {client.name || (client as any).companyName || 'Sem nome'}
                                        </div>
                                        <div className="text-sm text-gray-500">{client.email}</div>
                                        {(client as any).companyName && (client as any).name && (
                                            <div className="text-xs text-gray-400">{(client as any).companyName}</div>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${(client as any).status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : (client as any).status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {(client as any).status === 'active' ? 'Ativo' : (client as any).status === 'pending' ? 'Pendente' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-500">
                                        {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                                            <CreditCard size={14} />
                                            {client.credits}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => fetchClientReports(client.id, client.name || (client as any).companyName || 'Cliente')}
                                                className="flex items-center gap-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-bold px-3 py-2 rounded-lg transition-colors text-sm"
                                                title="Ver Relatórios"
                                            >
                                                📄 Report
                                            </button>
                                            {(client as any).status === 'pending' && (
                                                <button
                                                    onClick={() => updateClientMutation.mutate({ id: client.id, data: { ...client, status: 'active' } })}
                                                    className="bg-green-100 hover:bg-green-200 text-green-700 font-bold px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-1"
                                                >
                                                    <Check size={14} /> Aprovar
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(client)}
                                                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-lg transition-colors text-sm"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => openAddCredits(client.id)}
                                                className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold px-4 py-2 rounded-lg transition-colors text-sm"
                                            >
                                                <CreditCard size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Relatórios */}
            {isReportsModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">Relatórios: {reportClientName}</h3>
                                <p className="text-gray-500 mt-1">Baixe os resultados em PDF</p>
                            </div>
                            <button onClick={() => setIsReportsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {loadingReports ? (
                            <div className="flex justify-center py-10">
                                <Loader2 size={30} className="animate-spin text-primary" />
                            </div>
                        ) : clientReports.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">Nenhuma avaliação completada encontrada.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {clientReports.map((report: any) => (
                                    <div key={report.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary/20 transition-all">
                                        <div>
                                            <p className="font-bold text-gray-900">{report.title}</p>
                                            <p className="text-xs text-gray-500">Concluído em: {new Date(report.completedAt).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadReport(report.id, report.title)}
                                            className="bg-white border border-gray-200 text-gray-700 hover:border-primary hover:text-primary px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                                        >
                                            ⬇ PDF Premium
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Cadastro de Cliente */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-2">Novo Cliente</h3>
                        <p className="text-gray-500 mb-6 text-sm">Cadastre um novo cliente pessoa física ou jurídica.</p>

                        {/* Toggle PF/PJ */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setClientType('INDIVIDUAL')}
                                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${clientType === 'INDIVIDUAL'
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                👤 Pessoa Física
                            </button>
                            <button
                                onClick={() => setClientType('COMPANY')}
                                className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${clientType === 'COMPANY'
                                    ? 'bg-primary text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                🏢 Pessoa Jurídica
                            </button>
                        </div>

                        {/* Formulário */}
                        <div className="space-y-4">
                            {clientType === 'INDIVIDUAL' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo *</label>
                                        <input
                                            type="text"
                                            value={registerData.name}
                                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">CPF *</label>
                                        <input
                                            type="text"
                                            value={registerData.cpf}
                                            onChange={(e) => setRegisterData({ ...registerData, cpf: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Razão Social *</label>
                                        <input
                                            type="text"
                                            value={registerData.companyName}
                                            onChange={(e) => setRegisterData({ ...registerData, companyName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="Ex: Empresa LTDA"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome Fantasia</label>
                                        <input
                                            type="text"
                                            value={registerData.name}
                                            onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="Ex: Minha Empresa"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">CNPJ *</label>
                                        <input
                                            type="text"
                                            value={registerData.cnpj}
                                            onChange={(e) => setRegisterData({ ...registerData, cnpj: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="00.000.000/0000-00"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Campos comuns */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="cliente@exemplo.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                                <input
                                    type="tel"
                                    value={registerData.phone}
                                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Senha Inicial *</label>
                                <input
                                    type="password"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                            <button
                                onClick={() => setIsRegisterModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => registerClient.mutate(registerData)}
                                disabled={registerClient.isPending || !registerData.email || !registerData.password}
                                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {registerClient.isPending && <Loader2 size={16} className="animate-spin" />}
                                Cadastrar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Créditos */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">Gerenciar Créditos</h3>
                                <p className="text-gray-500 mt-1">Adicione ou remova créditos do cliente</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Toggle Adicionar/Remover */}
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                <button
                                    onClick={() => setCreditOperation('add')}
                                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${creditOperation === 'add'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    ➕ Adicionar
                                </button>
                                <button
                                    onClick={() => setCreditOperation('remove')}
                                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${creditOperation === 'remove'
                                        ? 'bg-white text-red-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    ➖ Remover
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {creditOperation === 'add' ? 'Quantidade a adicionar' : 'Quantidade a remover'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={creditAmount}
                                    onChange={(e) => setCreditAmount(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Digite a quantidade"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddCredits}
                                disabled={addCreditsMutation.isPending || !creditAmount}
                                className={`px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${creditOperation === 'add'
                                    ? 'bg-primary text-white hover:bg-primary-hover'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                {addCreditsMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                                {creditOperation === 'add' ? 'Adicionar' : 'Remover'} Créditos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edição de Cliente */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">Editar Cliente</h3>
                                <p className="text-gray-500 mt-1">Atualize os dados do cliente</p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Nome{editData.cpf ? ' Completo' : ' da Empresa'} *
                                </label>
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {editData.cpf ? (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">CPF</label>
                                    <input
                                        type="text"
                                        value={editData.cpf}
                                        onChange={(e) => setEditData({ ...editData, cpf: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Empresa *</label>
                                        <input
                                            type="text"
                                            value={editData.companyName}
                                            onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">CNPJ</label>
                                        <input
                                            type="text"
                                            value={editData.cnpj}
                                            onChange={(e) => setEditData({ ...editData, cnpj: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                                <input
                                    type="tel"
                                    value={editData.phone}
                                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateClient}
                                disabled={updateClientMutation.isPending || !editData.name}
                                className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateClientMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

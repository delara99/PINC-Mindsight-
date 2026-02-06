"use client";
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
    Plus, Search, MoreHorizontal, CheckCircle, XCircle, Clock, UserCheck, Shield,
    Trash2, RefreshCw, Key, FileText, Coins, ArrowRight, Download, Upload,
    FileSpreadsheet, AlertCircle, Check
} from 'lucide-react';
import { API_URL } from '@/src/config/api';
import QRCode from 'qrcode';

export default function CandidatesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ credits: 0 });
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createTab, setCreateTab] = useState<'individual' | 'bulk'>('individual');

    // Individual Form State
    const [newName, setNewName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [initialCredits, setInitialCredits] = useState(0);
    const [createLoading, setCreateLoading] = useState(false);

    // Bulk Import State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkData, setBulkData] = useState<any[]>([]);
    const [bulkErrors, setBulkErrors] = useState<string[]>([]);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0); // 0-100

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
            setEmployees(res.data);

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
        if (isCreateModalOpen && !accessCode && createTab === 'individual') generateCode();
    }, [isCreateModalOpen, createTab]);

    // HANDLERS INDIVIDUAL

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

    // HANDLERS BULK IMPORT

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Nome,Creditos\nMaria Silva,0\nJoao Souza,1";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_importacao_pinc.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBulkFile(file);
        setBulkErrors([]);
        setBulkData([]);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) {
                setBulkErrors(['Arquivo vazio ou sem cabeçalho.']);
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const nameIndex = headers.indexOf('nome');
            const creditIndex = headers.indexOf('creditos');

            if (nameIndex === -1) {
                setBulkErrors(['Coluna "Nome" não encontrada no CSV. Baixe o modelo.']);
                return;
            }

            const parsed = [];
            const errors = [];

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                const name = cols[nameIndex];
                const credits = creditIndex !== -1 ? (parseInt(cols[creditIndex]) || 0) : 0;

                if (!name || name.length < 3) {
                    errors.push(`Linha ${i + 1}: Nome inválido.`);
                } else {
                    parsed.push({ name, credits });
                }
            }

            if (errors.length > 0) setBulkErrors(errors);
            setBulkData(parsed);
        };
        reader.readAsText(file);
    };

    const handleBulkSubmit = async () => {
        if (bulkData.length === 0) return;
        setBulkProcessing(true);
        setBulkProgress(10); // Start

        try {
            const token = localStorage.getItem('accessToken');

            // Simular progresso visual
            const interval = setInterval(() => {
                setBulkProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            await axios.post(`${API_URL}/api/v1/business/employees/bulk`, {
                employees: bulkData.map(d => ({
                    name: d.name,
                    initialCredits: d.credits
                }))
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            clearInterval(interval);
            setBulkProgress(100);

            await new Promise(r => setTimeout(r, 500)); // Show 100%

            setIsCreateModalOpen(false);
            setBulkData([]);
            setBulkFile(null);
            setBulkProgress(0);
            fetchEmployees();
            alert(`${bulkData.length} colaboradores importados com sucesso!`);

        } catch (error: any) {
            alert('Erro na importação em massa: ' + (error.response?.data?.message || error.message));
        } finally {
            setBulkProcessing(false);
        }
    };

    // ... (Existing Handlers: handleToggleStatus, openTransferModal, handleTransferCredits, handleReleaseTest, handleDelete, handleResetCode, downloadInvite) ...
    // REPLICATING EXISTING HANDLERS TO KEEP FILE INTEGRITY

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

    const handleReleaseTest = async (emp: any) => {
        /* ... Logic from previous version ... */
        const currentCredits = typeof emp.credits === 'number' ? emp.credits : 0;
        if (currentCredits < 1) {
            if (confirm(`⚠️ AÇÃO NECESSÁRIA\n\nO colaborador "${emp.name}" não possui créditos atribuídos. (Saldo: ${currentCredits})\n\nÉ necessário transferir créditos para ele antes de liberar o teste.\n\nDeseja abrir a tela de transferência agora?`)) {
                openTransferModal(emp);
            }
            return;
        }
        if (!confirm(`Confirmar liberação de teste para "${emp.name}"?\nIsso consumirá 1 crédito do saldo DO COLABORADOR.`)) return;
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/business/employees/${emp.id}/distribute-credit`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchEmployees();
            alert('Teste liberado com sucesso!');
        } catch (error: any) {
            if (error.response?.data?.message?.includes('SALDO_INSUFICIENTE') || error.response?.status === 400) {
                if (confirm(`O colaborador não tem saldo suficiente. Deseja transferir agora?`)) openTransferModal(emp);
            } else {
                alert(error.response?.data?.message || 'Erro ao liberar teste.');
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o colaborador "${name}"? Esta ação removerá todos os dados e não pode ser desfeita.`)) return;
        try {
            const token = localStorage.getItem('accessToken');
            await axios.delete(`${API_URL}/api/v1/business/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchEmployees();
            setOpenMenuId(null);
            alert('Colaborador excluído com sucesso.');
        } catch (error) { alert('Erro ao excluir colaborador.'); }
    };

    const handleResetCode = async (id: string, name: string) => {
        if (!confirm(`Deseja gerar um novo código de acesso para "${name}"? O código anterior deixará de funcionar.`)) return;
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/business/employees/${id}/reset-code`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchEmployees();
            setOpenMenuId(null);
            alert('Código resetado com sucesso!');
        } catch (error) { alert('Erro ao resetar código.'); }
    };

    const downloadInvite = async (employee: any) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1080; canvas.height = 1920;
            const ctx = canvas.getContext('2d'); if (!ctx) return;
            // ... (Keeping exact same canvas logic for safety) ...
            const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
            gradient.addColorStop(0, '#7c3aed'); gradient.addColorStop(1, '#5b21b6');
            ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
            ctx.fillStyle = '#ffffff'; ctx.roundRect(60, 120, 960, 1680, 32); ctx.fill();
            ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 72px Arial'; ctx.textAlign = 'center'; ctx.fillText('PINC', 540, 280);
            ctx.fillStyle = '#64748b'; ctx.font = '32px Arial'; ctx.fillText('Inventário de Personalidade', 540, 340);
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(140, 400); ctx.lineTo(940, 400); ctx.stroke();
            ctx.fillStyle = '#1e293b'; ctx.font = 'bold 48px Arial'; ctx.textAlign = 'center'; ctx.fillText('Olá, ' + employee.name + '!', 540, 500);
            ctx.fillStyle = '#475569'; ctx.font = '28px Arial'; ctx.textAlign = 'left';
            let yPos = 580;
            ['Você foi convidado(a) para responder', 'o Inventário de Personalidade PINC.', '', 'Para acessar, siga os passos:'].forEach(l => { ctx.fillText(l, 140, yPos); yPos += 45; });
            ctx.fillStyle = '#f8fafc'; ctx.roundRect(140, yPos + 20, 800, 420, 16); ctx.fill();
            ctx.fillStyle = '#1e293b'; ctx.font = 'bold 32px Arial'; yPos += 80;
            ['1. Acesse o link abaixo ou escaneie o QR Code', '2. Clique na aba "Candidato"', '3. Use seu código de acesso para entrar', '4. Responda todas as perguntas com sinceridade', '5. Ao finalizar, seu relatório será gerado'].forEach(s => { ctx.fillText(s, 180, yPos); yPos += 70; });
            ctx.fillStyle = '#7c3aed'; ctx.roundRect(140, yPos + 40, 800, 140, 16); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.font = '28px Arial'; ctx.textAlign = 'center'; ctx.fillText('SEU CÓDIGO DE ACESSO:', 540, yPos + 100);
            ctx.font = 'bold 56px monospace'; ctx.fillText(employee.companyName || 'N/A', 540, yPos + 160);

            const qrCodeDataUrl = await QRCode.toDataURL('https://www.pinc.app.br/business/login?tab=candidate', { width: 300, margin: 2, color: { dark: '#7c3aed', light: '#ffffff' } });
            const qrImage = new Image();
            await new Promise((resolve) => { qrImage.onload = resolve; qrImage.src = qrCodeDataUrl; });
            ctx.drawImage(qrImage, 390, yPos + 240, 300, 300);

            ctx.fillStyle = '#64748b'; ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText('Escaneie para acessar', 540, yPos + 580);
            ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 26px Arial'; ctx.fillText('www.pinc.app.br/business/login', 540, yPos + 640);
            ctx.fillStyle = '#94a3b8'; ctx.font = '22px Arial'; ctx.fillText('Dúvidas? Entre em contato com seu gestor.', 540, yPos + 720);

            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `convite-pinc-${employee.name.replace(/\s+/g, '-').toLowerCase()}.png`; a.click(); URL.revokeObjectURL(url);
            });
            setOpenMenuId(null);
        } catch (error) { alert('Erro ao gerar convite.'); }
    };

    return (
        <div>
            {/* HEADER */}
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

            {/* TABLE */}
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
                                                {openMenuId === emp.id && (
                                                    <div className="absolute right-8 top-8 z-20 w-56 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1">
                                                        <button onClick={() => openTransferModal(emp)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 rounded-md transition-colors"><Coins size={14} /> Transferir Créditos</button>
                                                        <button onClick={() => downloadInvite(emp)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 rounded-md transition-colors"><Download size={14} /> Baixar Convite</button>
                                                        <div className="h-px bg-slate-100 my-1"></div>
                                                        <button onClick={() => handleResetCode(emp.id, emp.name)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-md"><RefreshCw size={14} /> Resetar Código</button>
                                                        <button onClick={() => handleDelete(emp.id, emp.name)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-md"><Trash2 size={14} /> Excluir</button>
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

            {/* CREATE / BULK MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Novo Colaborador</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
                        </div>

                        {/* TABS */}
                        <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
                            <button
                                onClick={() => setCreateTab('individual')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${createTab === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Individual
                            </button>
                            <button
                                onClick={() => setCreateTab('bulk')}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${createTab === 'bulk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Importação em Massa
                            </button>
                        </div>

                        {createTab === 'individual' ? (
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
                        ) : (
                            <div className="space-y-6">
                                {/* BULK IMPORT UI */}

                                {/* 1. Template Download */}
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800">Modelo de Importação</h4>
                                        <p className="text-xs text-slate-500">Baixe a planilha padrão (.csv)</p>
                                    </div>
                                    <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition-colors">
                                        <FileSpreadsheet size={16} /> Baixar Modelo
                                    </button>
                                </div>

                                {/* 2. Upload Area */}
                                {!bulkFile ? (
                                    <div
                                        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer group"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                            <Upload className="text-slate-400 group-hover:text-purple-600" size={24} />
                                        </div>
                                        <h4 className="font-bold text-slate-700">Clique para selecionar</h4>
                                        <p className="text-xs text-slate-400 mt-1">Suporta arquivos .CSV (Max 100 linhas)</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{bulkFile.name}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase">{(bulkFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <button onClick={() => { setBulkFile(null); setBulkData([]); setBulkErrors([]); }} className="text-slate-400 hover:text-red-500 p-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* ERRORS */}
                                        {bulkErrors.length > 0 && (
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-100 max-h-32 overflow-y-auto">
                                                <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-2">
                                                    <AlertCircle size={14} /> Erros encontrados ({bulkErrors.length})
                                                </div>
                                                <ul className="list-disc list-inside text-[10px] text-red-600 space-y-1">
                                                    {bulkErrors.map((err, i) => <li key={i}>{err}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {/* PREVIEW */}
                                        {bulkData.length > 0 && bulkErrors.length === 0 && (
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                                <div className="flex items-center gap-2 text-green-700 font-bold text-sm mb-2">
                                                    <Check size={16} /> {bulkData.length} Colaboradores Válidos
                                                </div>
                                                <div className="max-h-40 overflow-y-auto border border-green-200 rounded bg-white">
                                                    <table className="w-full text-left text-[10px]">
                                                        <thead className="bg-slate-50 sticky top-0">
                                                            <tr>
                                                                <th className="px-2 py-1 text-slate-500">Nome</th>
                                                                <th className="px-2 py-1 text-slate-500 text-center">Créditos</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {bulkData.map((row, i) => (
                                                                <tr key={i}>
                                                                    <td className="px-2 py-1 text-slate-700 truncate max-w-[150px]">{row.name}</td>
                                                                    <td className="px-2 py-1 text-center font-mono text-slate-600">{row.credits}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* ACTION */}
                                        <button
                                            onClick={handleBulkSubmit}
                                            disabled={bulkProcessing || bulkData.length === 0 || bulkErrors.length > 0}
                                            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-purple-200"
                                        >
                                            {bulkProcessing ? (
                                                <>
                                                    <RefreshCw className="animate-spin" size={18} /> Processando ({bulkProgress}%)
                                                </>
                                            ) : (
                                                <>Importar {bulkData.length} Colaboradores</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
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
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600"><Coins size={32} /></div>
                            <p className="text-sm text-slate-500">Para: <span className="font-bold text-slate-900">{selectedEmployee.name}</span></p>
                            <p className="text-xs text-slate-400">Saldo atual dele: {selectedEmployee.credits || 0}</p>
                        </div>
                        <form onSubmit={handleTransferCredits} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade a Transferir</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" min="1" max={stats.credits} required className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none text-center font-bold text-lg" value={transferAmount} onChange={e => setTransferAmount(Number(e.target.value))} />
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

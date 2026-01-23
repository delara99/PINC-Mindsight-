'use client';
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { useAuthStore } from '@/src/store/auth-store';
import { Play, RotateCcw, Activity, FileText, BarChart3, BrainCircuit } from 'lucide-react';

export default function TalkingToSimulatorTab({ isActive }: { isActive: boolean }) {
    const token = useAuthStore((state) => state.token);
    const [inputs, setInputs] = useState({
        O: 50, C: 50, E: 50, A: 50, N: 50
    });
    const [result, setResult] = useState<any>(null);
    const [simulating, setSimulating] = useState(false);

    const handleSimulate = async () => {
        setSimulating(true);
        try {
            const res = await axios.post(`${API_URL}/api/v1/talking-to/admin/rules/simulate`, inputs, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert('Erro ao conectar com o Motor de Regras. Verifique se o servidor está online.');
        } finally {
            setSimulating(false);
        }
    };

    if (!isActive) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Input Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-3 text-slate-800 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold">Dados de Entrada</h3>
                        <p className="text-xs text-slate-500">Simule um score OCEAN</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {Object.keys(inputs).map((key) => (
                        <div key={key}>
                            <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                <span>{key === 'O' ? 'Abertura (O)' :
                                    key === 'C' ? 'Conscienciosidade (C)' :
                                        key === 'E' ? 'Extroversão (E)' :
                                            key === 'A' ? 'Amabilidade (A)' : 'Neuroticismo (N)'}</span>
                                <span className="bg-slate-100 px-2 rounded text-slate-600">{(inputs as any)[key]}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={(inputs as any)[key]}
                                onChange={(e) => setInputs({ ...inputs, [key]: parseInt(e.target.value) })}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={() => setInputs({ O: 50, C: 50, E: 50, A: 50, N: 50 })}
                        className="flex-1 px-4 py-3 text-slate-500 font-bold bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-sm"
                    >
                        <RotateCcw size={16} className="mx-auto" />
                    </button>
                    <button
                        onClick={handleSimulate}
                        disabled={simulating}
                        className="flex-[3] flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                    >
                        {simulating ? <Activity className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                        {simulating ? 'Processando...' : 'Simular Análise'}
                    </button>
                </div>
            </div>

            {/* Output Panel */}
            <div className="lg:col-span-2 space-y-6">
                {!result ? (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        <Activity size={48} className="mb-4 opacity-50" />
                        <p>Configure os inputs e clique em Simular</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase">Regras Ativadas</p>
                                <p className="text-2xl font-bold text-slate-800">{result.matchesCount}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm col-span-2 lg:col-span-3">
                                <p className="text-xs font-bold text-slate-400 uppercase">Status do Motor</p>
                                <p className="text-sm font-bold text-green-600 mt-1 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Online e Processando Lógica
                                </p>
                            </div>
                        </div>

                        {/* Result Content */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Resultado da Simulação</h3>
                                    <p className="text-sm text-slate-500">Regras que dispararam para este perfil de input.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {result.matches.length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">
                                        Nenhuma regra foi disparada para esta combinação. Tente ajustar os scores.
                                    </div>
                                ) : (
                                    result.matches.map((match: any) => (
                                        <div key={match.id}>
                                            <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                                                <BrainCircuit size={14} className="text-purple-500" />
                                                {match.name}
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">{match.domain}</span>
                                            </h4>
                                            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-slate-700 leading-relaxed text-sm whitespace-pre-line">
                                                {match.message || <em className="text-slate-400">Sem conteúdo definido na mensagem associada.</em>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

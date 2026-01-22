'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/src/config/api';
import { PlayCircle, CheckCircle, Clock } from 'lucide-react';

export default function InventoryList() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${API_URL}/api/v1/assessments/my-assignments-list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Carregando inventários...</div>;

    const pending = assignments.filter(a => a.assignmentStatus !== 'COMPLETED');
    const completed = assignments.filter(a => a.assignmentStatus === 'COMPLETED');

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Responder Inventário</h1>

            {pending.length === 0 && completed.length === 0 && (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                    <p className="text-slate-500">Nenhum inventário disponível no momento. Aguarde seu gestor liberar um novo teste.</p>
                </div>
            )}

            {pending.length > 0 && (
                <div className="space-y-4 mb-8">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Disponíveis para Responder
                    </h2>
                    {pending.map(a => (
                        <div key={a.assignmentId} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-purple-300 transition-colors">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{a.title}</h3>
                                <p className="text-slate-500 text-sm mb-2">{a.questions?.length || 50} questões • Aprox. 10 min</p>
                                <div className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 inline-flex items-center gap-1">
                                    <Clock size={12} /> {a.assignmentStatus === 'IN_PROGRESS' ? 'Em andamento' : 'Não iniciado'}
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(`/business/employee/inventory/${a.assignmentId}`)}
                                className="w-full md:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                            >
                                <PlayCircle size={18} />
                                {a.assignmentStatus === 'IN_PROGRESS' ? 'Continuar Teste' : 'Iniciar Teste'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {completed.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        Histórico
                    </h2>
                    {completed.map(a => (
                        <div key={a.assignmentId} className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-between items-center opacity-75 grayscale hover:grayscale-0 transition-all">
                            <div>
                                <h3 className="font-bold text-lg text-slate-700">{a.title}</h3>
                                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    <CheckCircle size={14} className="text-green-600" />
                                    <span className="text-green-700 font-bold">Concluído</span>
                                    <span className="text-slate-400">• {new Date(a.assignedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

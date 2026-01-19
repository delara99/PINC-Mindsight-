'use client';
import { useState } from 'react';
import { API_URL } from '../../src/config/api';

export default function TalkingToLab() {
    const [scores, setScores] = useState({
        O: 50, C: 50, E: 50, A: 50, N: 50
    });
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/talking-to/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scores)
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            alert('Erro ao simular');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2 text-purple-400">🧪 TalkingTo Lab</h1>
                <p className="mb-8 text-gray-400">Ambiente de teste do novo motor de interpretação.</p>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    {Object.keys(scores).map((key) => (
                        <div key={key} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                            <label className="block text-sm font-bold mb-2 text-center">{key} Score</label>
                            <input
                                type="number"
                                value={scores[key as keyof typeof scores]}
                                onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-center text-xl font-mono text-white placeholder-gray-500"
                                style={{ color: 'white', colorScheme: 'dark' }}
                            />
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSimulate}
                    disabled={loading}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all mb-8 shadow-lg shadow-purple-900/20"
                >
                    {loading ? 'Calculando...' : 'RODAR SIMULAÇÃO'}
                </button>

                {result && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Resumo */}
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-2xl">👤</span> {result.profile_summary?.archetype_name}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {result.profile_summary?.dominant_traits?.map((t: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Análise Detalhada */}
                        <div className="space-y-4">
                            {result.talkingto_analysis?.map((item: any, i: number) => (
                                <div key={i} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{item.dimension}</h3>
                                            <div className="flex gap-2 mt-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.classification === 'ALTO' ? 'bg-green-500/20 text-green-300' :
                                                    item.classification === 'BAIXO' ? 'bg-blue-500/20 text-blue-300' :
                                                        'bg-yellow-500/20 text-yellow-300'
                                                    }`}>
                                                    {item.classification}
                                                </span>
                                                {item.labels.map((l: string, idx: number) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-slate-700 rounded text-xs text-gray-300">{l}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/50 p-4 rounded-lg border-l-4 border-purple-500 mb-4">
                                        <p className="italic text-gray-300">"{item.text_interpretation}"</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 font-bold block mb-1">❤️ Necessidade</span>
                                            <span className="text-green-300">{item.needs.primary}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 font-bold block mb-1">⚠️ Risco</span>
                                            <span className="text-red-300">{item.needs.risk}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

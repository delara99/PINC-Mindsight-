'use client';
import { useEffect, useState } from 'react';
import { API_URL } from '../../../src/config/api';
import { useAuthStore } from '../../../src/store/auth-store';

// Dados de Mock para salvamento em caso de erro de API
const MOCK_DATA = {
    profile_summary: {
        archetype_name: "Arquétipo Exemplo (Modo Offline)",
        dominant_traits: ["Visionário", "Pragmático"]
    },
    talkingto_analysis: [
        {
            dimension: "Abertura (Exemplo)",
            classification: "ALTO",
            labels: ["Criativo", "Inovador"],
            text_interpretation: "Este é um texto de exemplo mostrado porque o servidor ainda está atualizando. Se você vê isso, o Frontend está perfeito.",
            needs: { primary: "Estímulo Intelectual", risk: "Tédio em rotinas" }
        },
        {
            dimension: "Conscienciosidade (Exemplo)",
            classification: "FLEX",
            labels: ["Organizado", "Adaptável"],
            text_interpretation: "Texto de exemplo para validar o layout.",
            needs: { primary: "Clareza de objetivos", risk: "Rigidez excessiva" }
        }
    ],
    executive_summary: "Este é um resumo executivo de exemplo carregado em modo de segurança para evitar que você seja deslogado enquanto o sistema atualiza."
};

// Função auxiliar para renderizar qualquer coisa com segurança (evita tela preta)
const SafeRender = ({ value }: { value: any }) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') {
        return <span className="text-xs font-mono text-red-300" title={JSON.stringify(value)}>[Objeto Complexo]</span>;
    }
    return <>{String(value)}</>;
};

export default function MyReportPage() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [usingMock, setUsingMock] = useState(false);

    // Declarar token no escopo do componente para uso no JSX
    const token = useAuthStore((state) => state.token);

    // Função robusta para pegar token (Zustand ou Raw Storage)
    const getToken = () => {
        // 1. Tentar do Store (memória)
        if (token) return token;

        let t = useAuthStore.getState().token;
        if (t) return t;

        // 2. Tentar do LocalStorage bruto (Zustand persist)
        if (typeof window !== 'undefined') {
            try {
                const storage = localStorage.getItem('auth-storage');
                if (storage) {
                    const parsed = JSON.parse(storage);
                    if (parsed.state?.token) return parsed.state.token;
                }
            } catch (e) {
                console.error("Erro lendo auth-storage", e);
            }
        }
        return null;
    }

    useEffect(() => {
        // Pequeno delay para garantir hidratação, ou busca bruta imediata
        const t = getToken();
        if (t) {
            fetchLatestReport(t);
        } else {
            // Se não achou de cara, espera 500ms e tenta de novo (hidratação lenta)
            setTimeout(() => {
                const t2 = getToken();
                if (t2) fetchLatestReport(t2);
                else {
                    console.warn("Token não encontrado nem após delay. Carregando Mock.");
                    useMock();
                }
            }, 500);
        }
    }, [token]);

    const fetchLatestReport = async (tokenOverride?: string) => {
        try {
            const token = tokenOverride || getToken();

            if (!token) {
                console.warn("Sem token detectado, carregando mock");
                useMock();
                return;
            }

            console.log("Tentando buscar relatório com token...");
            const res = await fetch(`${API_URL}/api/v1/talking-to/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                console.error('Erro API Real:', res.status);
                useMock();
                setError(res.status === 404 ? 'Servidor atualizando (404)' : `Erro ${res.status}`);
                return;
            }

            const data = await res.json();
            if (data.found !== false) {
                setReport(data.report || data);
            } else {
                useMock();
            }
        } catch (err) {
            console.error("Erro fetch:", err);
            useMock();
            setError("Erro de Rede");
        } finally {
            setLoading(false);
        }
    };

    const useMock = () => {
        setUsingMock(true);
        setReport({
            userId: 'mock',
            completedAt: new Date().toISOString(),
            talkingToAnalysis: MOCK_DATA
        });
        setLoading(false);
    }

    if (loading) return <div className="p-8 text-white">Carregando análise...</div>;

    // Garantia de não quebrar
    const talkingToAnalysis = report?.talkingToAnalysis || MOCK_DATA;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                {usingMock && (
                    <div className="bg-slate-800 border border-yellow-500/30 p-6 rounded-2xl mb-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-yellow-100 flex items-center gap-2">
                                    ⚠️ Modo Manual de Validação
                                </h3>
                                <p className="text-gray-400 text-sm mt-1 max-w-xl">
                                    O servidor ainda não disponibilizou seus dados automáticos (Erro 404).
                                    Mas o motor <strong>TalkingTo™</strong> está pronto! Insira scores (0-100) abaixo para gerar seu relatório agora mesmo.
                                </p>
                            </div>
                            <div className="text-right">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-xs text-yellow-500 hover:text-yellow-400 underline"
                                >
                                    Tentar reconectar automático
                                </button>
                            </div>
                        </div>

                        {/* Formulário de Simulação Manual */}
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                            <div className="grid grid-cols-5 gap-4 mb-6">
                                {['O', 'C', 'E', 'A', 'N'].map((trait) => (
                                    <div key={trait} className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-gray-500 text-center">{trait}</label>
                                        <input
                                            type="number"
                                            placeholder="50"
                                            className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-center text-white font-mono focus:border-purple-500 focus:outline-none"
                                            id={`input-${trait}`}
                                            defaultValue={50}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={async () => {
                                    setLoading(true);

                                    try {
                                        const scores = {
                                            O: Number((document.getElementById('input-O') as HTMLInputElement).value),
                                            C: Number((document.getElementById('input-C') as HTMLInputElement).value),
                                            E: Number((document.getElementById('input-E') as HTMLInputElement).value),
                                            A: Number((document.getElementById('input-A') as HTMLInputElement).value),
                                            N: Number((document.getElementById('input-N') as HTMLInputElement).value),
                                        };

                                        const res = await fetch(`${API_URL}/api/v1/talking-to/simulate`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(scores)
                                        });

                                        if (!res.ok) throw new Error(`Status ${res.status}`);

                                        const data = await res.json();
                                        console.log("Dados recebidos da simulação:", data);

                                        if (!data || !data.talkingto_analysis) {
                                            throw new Error("Formato de resposta inválido do servidor");
                                        }

                                        setReport({
                                            userId: 'manual',
                                            completedAt: new Date().toISOString(),
                                            talkingToAnalysis: data
                                        });
                                        setUsingMock(false);
                                    } catch (e) {
                                        console.error(e);
                                        // Usando alert aqui para não quebrar a renderização se o setError tiver problemas
                                        alert("Erro ao simular: " + String(e));
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg transition-all transform hover:scale-[1.01]"
                            >
                                ✨ GERAR RELATÓRIO AGORA
                            </button>
                        </div>
                    </div>
                )}

                {/* Cabeçalho */}
                <div className="text-center md:text-left border-b border-gray-700 pb-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Seu Perfil TalkingTo
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Análise profunda baseada na sua avaliação realizada em {new Date(report?.completedAt || Date.now()).toLocaleDateString()}.
                    </p>
                </div>

                {/* Resumo do Perfil */}
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 relative z-10">
                        <span className="text-4xl">🧬</span>
                        <SafeRender value={talkingToAnalysis.profile_summary?.archetype_name || 'Perfil Mapeado'} />
                    </h2>

                    <div className="flex flex-wrap gap-3 mb-6 relative z-10">
                        {Array.isArray(talkingToAnalysis.profile_summary?.dominant_traits) && talkingToAnalysis.profile_summary.dominant_traits.map((t: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm font-medium border border-purple-500/30">
                                <SafeRender value={t} />
                            </span>
                        ))}
                    </div>
                </div>

                {/* Grid de Dimensões */}
                <div className="grid gap-6">
                    {Array.isArray(talkingToAnalysis.talkingto_analysis) ? talkingToAnalysis.talkingto_analysis.map((item: any, i: number) => (
                        <div key={i} className="bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                                        <SafeRender value={item.dimension} />
                                        <div className={`w-3 h-3 rounded-full ${(typeof item.classification === 'string' && item.classification.toUpperCase() === 'ALTO') ? 'bg-green-500' :
                                                (typeof item.classification === 'string' && item.classification.toUpperCase() === 'BAIXO') ? 'bg-blue-500' :
                                                    'bg-yellow-500'
                                            }`}></div>
                                    </h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${(typeof item.classification === 'string' && item.classification.toUpperCase() === 'ALTO') ? 'bg-green-500/10 text-green-400' :
                                                (typeof item.classification === 'string' && item.classification.toUpperCase() === 'BAIXO') ? 'bg-blue-500/10 text-blue-400' :
                                                    'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            <SafeRender value={item.classification} />
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(item.labels) && item.labels.map((l: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-700 rounded-lg text-xs text-gray-300 font-mono">
                                            <SafeRender value={l} />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-lg border-l-4 border-purple-500 mb-6 italic text-gray-300 leading-relaxed">
                                "<SafeRender value={item.text_interpretation} />"
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">❤️</div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Necessidade Primária</span>
                                        <span className="text-gray-200"><SafeRender value={item.needs?.primary} /></span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">⚠️</div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Ponto de Atenção</span>
                                        <span className="text-gray-200"><SafeRender value={item.needs?.risk} /></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-4 bg-red-900/50 text-red-200 rounded">
                            Dados de análise indisponíveis ou inválidos.
                        </div>
                    )}
                </div>

                {/* Resumo Executivo */}
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold mb-4">Síntese Executiva</h3>
                    <p className="text-gray-300 leading-relaxed">
                        <SafeRender value={talkingToAnalysis.executive_summary} />
                    </p>
                </div>

            </div>
        </div>
    );
}

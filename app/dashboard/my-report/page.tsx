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
    }, []);

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
                // EM VEZ DE ERRO, USAR MOCK PARA VALIDAR TELA
                useMock();
                return;
            }

            const data = await res.json();
            if (data.found && data.report) {
                setReport(data.report);
            } else {
                useMock(); // Se não achou relatório, mostra mock
            }
        } catch (err) {
            console.error("Erro fetch:", err);
            useMock();
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
                    <div className="bg-yellow-600/20 border border-yellow-500 text-yellow-200 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span>⚠️ <strong>Modo de Visualização (Safe Mode)</strong></span>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded font-bold transition-colors"
                            >
                                Tentar Conectar Novamente
                            </button>
                        </div>
                        <p className="text-sm mb-2">
                            O sistema não conseguiu conectar ao backend atualizado ({error || 'Erro de conexão'}).
                            Exibindo dados de exemplo para validação visual.
                        </p>
                        <details className="text-xs text-yellow-500/70 mt-2 cursor-pointer">
                            <summary>Ver Detalhes Técnicos</summary>
                            <div className="mt-1 p-2 bg-black/30 rounded font-mono break-all text-left">
                                URL: {API_URL}/api/v1/talking-to/me<br />
                                Token: {token ? 'Presente (AuthStore)' : 'Ausente'}<br />
                                Status: Estável (Dados Mockados)<br />
                                Dica: Se o erro for 404, o servidor ainda está processando o deploy da nova rota.
                            </div>
                        </details>
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
                        {talkingToAnalysis.profile_summary?.archetype_name || 'Perfil Mapeado'}
                    </h2>

                    <div className="flex flex-wrap gap-3 mb-6 relative z-10">
                        {talkingToAnalysis.profile_summary?.dominant_traits?.map((t: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-purple-500/20 text-purple-200 rounded-full text-sm font-medium border border-purple-500/30">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Grid de Dimensões */}
                <div className="grid gap-6">
                    {talkingToAnalysis.talkingto_analysis?.map((item: any, i: number) => (
                        <div key={i} className="bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                                        {item.dimension}
                                        <div className={`w-3 h-3 rounded-full ${(item.classification || '').toUpperCase() === 'ALTO' ? 'bg-green-500' :
                                            (item.classification || '').toUpperCase() === 'BAIXO' ? 'bg-blue-500' :
                                                'bg-yellow-500'
                                            }`}></div>
                                    </h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${(item.classification || '').toUpperCase() === 'ALTO' ? 'bg-green-500/10 text-green-400' :
                                            (item.classification || '').toUpperCase() === 'BAIXO' ? 'bg-blue-500/10 text-blue-400' :
                                                'bg-yellow-500/10 text-yellow-400'
                                            }`}>
                                            {item.classification}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {item.labels?.map((l: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-700 rounded-lg text-xs text-gray-300 font-mono">
                                            {l}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-lg border-l-4 border-purple-500 mb-6 italic text-gray-300 leading-relaxed">
                                "{item.text_interpretation}"
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400">❤️</div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Necessidade Primária</span>
                                        <span className="text-gray-200">{item.needs?.primary}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">⚠️</div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Ponto de Atenção</span>
                                        <span className="text-gray-200">{item.needs?.risk}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resumo Executivo */}
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                    <h3 className="text-xl font-bold mb-4">Síntese Executiva</h3>
                    <p className="text-gray-300 leading-relaxed">
                        {talkingToAnalysis.executive_summary}
                    </p>
                </div>

            </div>
        </div>
    );
}

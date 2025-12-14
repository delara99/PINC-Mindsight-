
'use client';
import { API_URL } from '@/src/config/api';
import { useAuthStore } from '@/src/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Share2, Loader2, Info } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

export default function CrossProfileReportPage() {
    const { id } = useParams();
    const router = useRouter();
    const token = useAuthStore((state) => state.token);

    const { data: report, isLoading } = useQuery({
        queryKey: ['cross-profile-report', id],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/cross-profile/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao carregar relatório');
            return res.json();
        }
    });

    if (isLoading) {
        return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>;
    }

    if (!report) {
        return <div className="text-center py-20">Relatório não encontrado.</div>;
    }

    const { author, target, scoreGap, matchLevel } = report;

    // Preparar dados para o Radar Chart
    // Assumindo que scoreGap tem a estrutura: { TRAIT: { scoreA, scoreB, ... } }
    const traitsOrder = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'];
    const traitLabels = {
        OPENNESS: 'Abertura',
        CONSCIENTIOUSNESS: 'Conscienciosidade',
        EXTRAVERSION: 'Extroversão',
        AGREEABLENESS: 'Amabilidade',
        NEUROTICISM: 'Estabilidade' // Invertido ou ajustado conforme metodologia, aqui mantendo simples
    };

    const chartData = traitsOrder.map(key => ({
        subject: traitLabels[key],
        [author.name]: scoreGap[key].scoreA,
        [target.name]: scoreGap[key].scoreB,
        fullMark: 100 // Assumindo score 0-100 ou ajustado
    }));

    // Função de impressão
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 print:pb-0">
            {/* Header de Navegação (Escondido na impressão) */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={20} /> Voltar
                </button>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-hover shadow-lg transition-transform hover:scale-105"
                >
                    <Printer size={20} /> Salvar PDF
                </button>
            </div>

            {/* RELATÓRIO "FOLHA DE PAPEL" */}
            <div className="bg-white shadow-2xl rounded-2xl p-10 print:shadow-none print:p-0 print:rounded-none min-h-[1123px] relative overflow-hidden">
                
                {/* Capa / Cabeçalho */}
                <div className="border-b-2 border-primary pb-6 mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Relatório Relacional</h1>
                        <p className="text-lg text-primary font-medium mt-1">Análise de Pareamento Comportamental</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-400 font-bold mb-1">GERADO EM</div>
                        <div className="text-gray-700">{new Date(report.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                </div>

                {/* Perfil dos Envolvidos */}
                <div className="grid grid-cols-2 gap-10 mb-12">
                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">Perfil A (Você)</h3>
                        <div className="text-2xl font-bold text-gray-900">{author.name}</div>
                        <div className="text-gray-500 text-sm">{author.email}</div>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                        <h3 className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-2">Perfil B (Conexão)</h3>
                        <div className="text-2xl font-bold text-gray-900">{target.name}</div>
                        <div className="text-gray-500 text-sm">{target.email}</div>
                    </div>
                </div>

                {/* Match Level */}
                <div className="mb-12 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Sinergia Geral</h2>
                    <div className="inline-block px-8 py-3 bg-gray-900 text-white rounded-full text-xl font-bold tracking-widest shadow-lg">
                        {matchLevel === 'HIGH_SYNCHRONY' && 'ALTA SINERGIA ✨'}
                        {matchLevel === 'BALANCED' && 'EQUILÍBRIO ⚖️'}
                        {matchLevel === 'CHALLENGING' && 'DESAFIADOR 🔥'}
                        {!matchLevel && 'EM ANÁLISE'}
                    </div>
                    <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                        Esta classificação indica o nível geral de alinhamento natural entre os dois perfis. 
                        Relações desafiadoras podem ser extremamente produtivas se houver comunicação clara.
                    </p>
                </div>

                {/* Gráfico Radar */}
                <div className="h-[400px] w-full mb-16 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar name={author.name} dataKey={author.name} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                            <Radar name={target.name} dataKey={target.name} stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                            <Legend />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Quebra de Página para Impressão */}
                <div className="print:break-after-page"></div>

                {/* Análise Detalhada Traço a Traço */}
                <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-primary pl-4">Análise Detalhada</h2>

                <div className="space-y-8">
                    {traitsOrder.map((traitKey) => {
                        const gapData = scoreGap[traitKey];
                        const gapSize = gapData.diff.toFixed(1);
                        const label = traitLabels[traitKey];

                        // Texto Dinâmico Simplificado (MVP) - Idealmente viria do Backend
                        let insights = "";
                        if (gapData.classification === 'HIGH_SIMILARITY') {
                            insights = `${author.name} e ${target.name} possuem níveis quase idênticos de ${label}. Isso facilita a empatia e o entendimento mútuo, pois ambos tendem a reagir de forma similar a estímulos relacionados a este traço.`;
                        } else if (gapData.classification === 'COMPLEMENTARY') {
                            insights = `Existem diferenças notáveis na forma como vocês lidam com ${label}. Enquanto um pode ser mais intenso, o outro é mais moderado. Isso gera uma excelente oportunidade de complementaridade, onde um cobre os pontos cegos do outro.`;
                        } else {
                            insights = `A diferença em ${label} é significativa. Podem surgir atritos se não houver compreensão. É crucial que ${author.name} entenda que a abordagem de ${target.name} não é errada, apenas diferente.`;
                        }

                        return (
                            <div key={traitKey} className="bg-gray-50 rounded-xl p-6 border border-gray-100 break-inside-avoid">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">{label}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                        ${gapData.classification.includes('SIMILAR') ? 'bg-green-100 text-green-700' : 
                                          gapData.classification.includes('COMPLEMENTARY') ? 'bg-blue-100 text-blue-700' : 
                                          'bg-orange-100 text-orange-700'
                                        }`}
                                    >
                                        {gapData.classification.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mb-4 text-sm font-medium text-gray-500">
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> {author.name}: {gapData.scoreA.toFixed(1)}</div>
                                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded-full"></div> {target.name}: {gapData.scoreB.toFixed(1)}</div>
                                </div>
                                <p className="text-gray-700 leading-relaxed text-justify">
                                    {insights}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm print:fixed print:bottom-0 print:w-full print:bg-white">
                    <p>PINC Mindsight &copy; {new Date().getFullYear()} - Relatório Gerado Automaticamente</p>
                    <p className="text-xs mt-1">Metodologia Big Five - Uso para desenvolvimento pessoal e profissional.</p>
                </div>
            </div>
        </div>
    );
}

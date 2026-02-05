'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Info, CheckCircle, BrainCircuit } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { API_URL } from '@/src/config/api';
import axios from 'axios';

const FACET_MAP = {
    E: [
        { key: 'E_F1', label: 'Cordialidade', desc: 'Afeto e empatia' },
        { key: 'E_F2', label: 'Gregariedade', desc: 'Sociabilidade' },
        { key: 'E_F3', label: 'Assertividade', desc: 'Liderança e dominância' },
        { key: 'E_F4', label: 'Atividade', desc: 'Energia e ritmo' },
        { key: 'E_F5', label: 'Busca de Sensações', desc: 'Ousadia e estímulo' },
        { key: 'E_F6', label: 'Emoções Positivas', desc: 'Alegria e otimismo' }
    ],
    A: [
        { key: 'A_F1', label: 'Confiança', desc: 'Fé nos outros' },
        { key: 'A_F2', label: 'Franqueza', desc: 'Sinceridade' },
        { key: 'A_F3', label: 'Altruísmo', desc: 'Generosidade' },
        { key: 'A_F4', label: 'Complacência', desc: 'Conciliação' },
        { key: 'A_F5', label: 'Modéstia', desc: 'Humildade' },
        { key: 'A_F6', label: 'Sensibilidade', desc: 'Compaixão' }
    ],
    C: [
        { key: 'C_F1', label: 'Competência', desc: 'Eficácia' },
        { key: 'C_F2', label: 'Ordem', desc: 'Organização' },
        { key: 'C_F3', label: 'Senso de Dever', desc: 'Responsabilidade' },
        { key: 'C_F4', label: 'Esforço', desc: 'Ambição' },
        { key: 'C_F5', label: 'Autodisciplina', desc: 'Persistência' },
        { key: 'C_F6', label: 'Ponderação', desc: 'Prudência' }
    ],
    N: [
        { key: 'N_F1', label: 'Ansiedade', desc: 'Nível de tensão' },
        { key: 'N_F2', label: 'Hostilidade', desc: 'Gestão da raiva' },
        { key: 'N_F3', label: 'Depressão', desc: 'Tristeza' },
        { key: 'N_F4', label: 'Embaraço', desc: 'Timidez social' },
        { key: 'N_F5', label: 'Impulsividade', desc: 'Autocontrole' },
        { key: 'N_F6', label: 'Vulnerabilidade', desc: 'Resistência ao stress' }
    ],
    O: [
        { key: 'O_F1', label: 'Fantasia', desc: 'Imaginação' },
        { key: 'O_F2', label: 'Estética', desc: 'Arte e beleza' },
        { key: 'O_F3', label: 'Sentimentos', desc: 'Profundidade emocional' },
        { key: 'O_F4', label: 'Ações', desc: 'Novas experiências' },
        { key: 'O_F5', label: 'Ideias', desc: 'Curiosidade intelectual' },
        { key: 'O_F6', label: 'Valores', desc: 'Flexibilidade de crenças' }
    ]
};

interface JobProfileEditorProps {
    tenantId?: string;
    onSuccess?: () => void;
}

export default function JobProfileEditor({ tenantId, onSuccess }: JobProfileEditorProps) {
    // Estado do Perfil
    const [profileName, setProfileName] = useState('');
    const [description, setDescription] = useState('');

    // Scores Ideais (50 = Neutro)
    const [scores, setScores] = useState<Record<string, number>>({
        O: 50, C: 50, E: 50, A: 50, N: 50,
        // Inicializar todas as facetas com 50
        ...Object.values(FACET_MAP).flat().reduce((acc, f) => ({ ...acc, [f.key]: 50 }), {})
    });

    const [weights, setWeights] = useState({
        O: 1, C: 1, E: 1, A: 1, N: 1
    });

    const [saving, setSaving] = useState(false);

    // Dados preparados para o gráfico
    const chartData = [
        { subject: 'Abertura', A: scores.O, fullMark: 100 },
        { subject: 'Estrutura', A: scores.C, fullMark: 100 },
        { subject: 'Extroversão', A: scores.E, fullMark: 100 },
        { subject: 'Amabilidade', A: scores.A, fullMark: 100 },
        { subject: 'Estabilidade', A: scores.N, fullMark: 100 },
    ];

    const handleSave = async () => {
        if (!profileName) return alert('Dê um nome ao perfil de cargo.');

        setSaving(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/api/v1/business/job-profiles`, {
                name: profileName,
                description,
                idealScores: scores,
                weights: weights
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Perfil criado com sucesso!');
            if (onSuccess) onSuccess();

            // Reset
            setProfileName('');
            setDescription('');
            setScores({ O: 50, C: 50, E: 50, A: 50, N: 50 });

        } catch (error) {
            console.error(error);
            alert('Erro ao salvar perfil.');
        } finally {
            setSaving(false);
        }
    };

    const updateScore = (dim: string, val: number) => {
        setScores(prev => ({ ...prev, [dim]: val }));
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* Coluna da Esquerda: Controles */}
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BrainCircuit className="text-purple-600" />
                        Definição do Cargo
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Cargo</label>
                            <input
                                type="text"
                                value={profileName}
                                onChange={e => setProfileName(e.target.value)}
                                placeholder="Ex: Analista de Vendas Hunter"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição (Opcional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Descreva brevemente as responsabilidades..."
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Calibragem de Perfil</h3>

                    <div className="space-y-6">
                        {/* Extroversão */}
                        <SliderControl
                            label="Extroversão"
                            description="Nível de energia social e comunicação"
                            value={scores.E}
                            onChange={v => updateScore('E', v)}
                            color="text-orange-500"
                            bg="bg-orange-500"
                            facets={FACET_MAP.E}
                            scores={scores}
                            onFacetChange={updateScore}
                        />

                        {/* Agradabilidade */}
                        <SliderControl
                            label="Amabilidade"
                            description="Tendência a cooperar e harmonizar"
                            value={scores.A}
                            onChange={v => updateScore('A', v)}
                            color="text-green-500"
                            bg="bg-green-500"
                            facets={FACET_MAP.A}
                            scores={scores}
                            onFacetChange={updateScore}
                        />

                        {/* Conscienciosidade */}
                        <SliderControl
                            label="Estrutura (Conscienciosidade)"
                            description="Organização, disciplina e foco"
                            value={scores.C}
                            onChange={v => updateScore('C', v)}
                            color="text-blue-500"
                            bg="bg-blue-500"
                            facets={FACET_MAP.C}
                            scores={scores}
                            onFacetChange={updateScore}
                        />

                        {/* Estabilidade */}
                        <SliderControl
                            label="Estabilidade Emocional"
                            description="Resiliência e controle sob pressão"
                            value={scores.N}
                            onChange={v => updateScore('N', v)}
                            color="text-purple-500"
                            bg="bg-purple-500"
                            facets={FACET_MAP.N}
                            scores={scores}
                            onFacetChange={updateScore}
                        />

                        {/* Abertura */}
                        <SliderControl
                            label="Abertura (Mentalidade)"
                            description="Criatividade e abertura ao novo"
                            value={scores.O}
                            onChange={v => updateScore('O', v)}
                            color="text-yellow-500"
                            bg="bg-yellow-500"
                            facets={FACET_MAP.O}
                            scores={scores}
                            onFacetChange={updateScore}
                        />
                    </div>
                </div>
            </div>

            {/* Coluna da Direita: Visualização */}
            <div className="flex flex-col gap-6">
                <div className="bg-slate-900 p-8 rounded-2xl shadow-xl flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>

                    <h4 className="text-white font-bold mb-8 z-10 text-xl">Radar do Perfil Ideal</h4>

                    <div className="w-full h-[400px] z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Perfil Ideal"
                                    dataKey="A"
                                    stroke="#c084fc"
                                    strokeWidth={3}
                                    fill="#a855f7"
                                    fillOpacity={0.5}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <p className="text-slate-400 text-sm text-center mt-4 max-w-md">
                        Este gráfico representa o "molde" que será usado para calcular a compatibilidade dos candidatos. Ajuste os sliders para moldar o perfil.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg"
                >
                    {saving ? <RefreshCw className="animate-spin" /> : <Save />}
                    Salvar Perfil de Cargo
                </button>
            </div>
        </div>
    );
}

interface SliderControlProps {
    label: string;
    description: string;
    value: number;
    onChange: (val: number) => void;
    color: string;
    bg: string;
    facets?: any[];
    scores?: any;
    onFacetChange?: (key: string, val: number) => void;
}

function SliderControl({ label, description, value, onChange, color, bg, facets, scores, onFacetChange }: SliderControlProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <span className={`font-bold text-base ${color}`}>{label}</span>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-white font-bold min-w-[3rem] text-center ${bg}`}>
                    {value}
                </div>
            </div>

            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />

            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">
                <span>Baixo</span>
                <span>Médio</span>
                <span>Alto</span>
            </div>

            {facets && (
                <div className="mt-4 border-t border-slate-200 pt-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-purple-600 transition-colors w-full justify-center py-1"
                    >
                        {expanded ? '▲ Ocultar Detalhes' : '▼ Calibrar Facetas Específicas'}
                    </button>

                    {expanded && (
                        <div className="mt-3 space-y-4 pl-4 border-l-2 border-slate-200 ml-1 bg-white p-3 rounded-r-lg shadow-sm">
                            {facets.map((facet: any) => (
                                <div key={facet.key}>
                                    <div className="flex justify-between items-center mb-1">
                                        <div>
                                            <span className="text-sm font-semibold text-slate-700">{facet.label}</span>
                                            <span className="text-[10px] text-slate-400 ml-2 italic">{facet.desc}</span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 rounded">
                                            {scores[facet.key]}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={scores[facet.key]}
                                        onChange={(e) => onFacetChange && onFacetChange(facet.key, parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-400 hover:accent-purple-500"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

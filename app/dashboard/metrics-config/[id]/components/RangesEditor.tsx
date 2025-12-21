'use client';
import { API_URL } from '../../../../../src/config/api';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../../../src/store/auth-store';
import { Save } from 'lucide-react';

interface RangesEditorProps {
    config: any;
    configId: string;
}

export default function RangesEditor({ config, configId }: RangesEditorProps) {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    const [ranges, setRanges] = useState({
        veryLowMax: 20, veryLowLabel: 'Muito Baixo',
        lowMax: 40, lowLabel: 'Baixo',
        averageMax: 60, averageLabel: 'Médio',
        highMax: 80, highLabel: 'Alto',
        veryHighLabel: 'Muito Alto'
    });

    useEffect(() => {
        if (config) {
            setRanges({
                veryLowMax: config.veryLowMax || 20,
                veryLowLabel: config.veryLowLabel || 'Muito Baixo',
                lowMax: config.lowMax || 40,
                lowLabel: config.lowLabel || 'Baixo',
                averageMax: config.averageMax || 60,
                averageLabel: config.averageLabel || 'Médio',
                highMax: config.highMax || 80,
                highLabel: config.highLabel || 'Alto',
                veryHighLabel: config.veryHighLabel || 'Muito Alto'
            });
        }
    }, [config]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${API_URL}/api/v1/big-five-config/${configId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Erro ao atualizar');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['big-five-config', configId] });
            alert('Faixas atualizadas com sucesso!');
        }
    });

    const handleSave = () => {
        if (ranges.veryLowMax >= ranges.lowMax ||
            ranges.lowMax >= ranges.averageMax ||
            ranges.averageMax >= ranges.highMax) {
            alert('As faixas devem estar em ordem crescente!');
            return;
        }
        updateMutation.mutate(ranges);
    };

    const renderRangeInput = (
        label: string,
        min: number,
        valKey: 'veryLowMax' | 'lowMax' | 'averageMax' | 'highMax',
        labelKey: 'veryLowLabel' | 'lowLabel' | 'averageLabel' | 'highLabel',
        maxLimit: number,
        desc: string,
        bgClass: string
    ) => (
        <div className={`border border-gray-200 rounded-lg p-6 ${bgClass}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limite Superior ({label})</label>
                    <input
                        type="number"
                        value={ranges[valKey]}
                        onChange={(e) => setRanges({ ...ranges, [valKey]: parseInt(e.target.value) })}
                        min={min}
                        max={maxLimit}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <p className="text-sm text-gray-600 mt-2">{desc}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rótulo da Faixa</label>
                    <input
                        type="text"
                        value={ranges[labelKey]}
                        onChange={(e) => setRanges({ ...ranges, [labelKey]: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Faixas de Interpretação</h3>
                <p className="text-gray-600">Defina os limites e os nomes de cada faixa.</p>
            </div>

            <div className="space-y-6">
                {renderRangeInput('Muito Baixo', 1, 'veryLowMax', 'veryLowLabel', 100, `0 até ${ranges.veryLowMax}`, 'bg-blue-50/50')}
                {renderRangeInput('Baixo', ranges.veryLowMax + 1, 'lowMax', 'lowLabel', 100, `${ranges.veryLowMax + 1} até ${ranges.lowMax}`, 'bg-blue-50/30')}
                {renderRangeInput('Médio', ranges.lowMax + 1, 'averageMax', 'averageLabel', 100, `${ranges.lowMax + 1} até ${ranges.averageMax}`, 'bg-yellow-50/50')}
                {renderRangeInput('Alto', ranges.averageMax + 1, 'highMax', 'highLabel', 99, `${ranges.averageMax + 1} até ${ranges.highMax}`, 'bg-green-50/50')}

                {/* Very High */}
                <div className="border border-gray-200 rounded-lg p-6 bg-green-50/80">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Muito Alto (Automático)</label>
                            <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-700 font-medium">
                                {ranges.highMax + 1} até 100
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rótulo da Faixa</label>
                            <input
                                type="text"
                                value={ranges.veryHighLabel}
                                onChange={(e) => setRanges({ ...ranges, veryHighLabel: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                >
                    <Save size={20} />
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Faixas'}
                </button>
            </div>
        </div>
    );
}

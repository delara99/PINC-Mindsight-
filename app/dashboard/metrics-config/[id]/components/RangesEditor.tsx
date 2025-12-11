'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { Save } from 'lucide-react';

interface RangesEditorProps {
    config: any;
    configId: string;
}

export default function RangesEditor({ config, configId }: RangesEditorProps) {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    const [ranges, setRanges] = useState({
        veryLowMax: config?.veryLowMax || 20,
        lowMax: config?.lowMax || 40,
        averageMax: config?.averageMax || 60,
        highMax: config?.highMax || 80
    });

    useEffect(() => {
        if (config) {
            setRanges({
                veryLowMax: config.veryLowMax,
                lowMax: config.lowMax,
                averageMax: config.averageMax,
                highMax: config.highMax
            });
        }
    }, [config]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`http://localhost:3000/api/v1/big-five-config/${configId}`, {
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
        // Validação
        if (ranges.veryLowMax >= ranges.lowMax ||
            ranges.lowMax >= ranges.averageMax ||
            ranges.averageMax >= ranges.highMax) {
            alert('As faixas devem estar em ordem crescente!');
            return;
        }

        updateMutation.mutate(ranges);
    };

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Faixas de Interpretação de Scores</h3>
                <p className="text-gray-600">
                    Defina os limites de cada faixa de interpretação. Scores de 0 até o valor máximo de "Muito Baixo", e assim sucessivamente.
                </p>
            </div>

            <div className="space-y-6">
                {/* Very Low */}
                <div className="border border-gray-200 rounded-lg p-6 bg-blue-50/50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Muito Baixo (0 até)
                    </label>
                    <input
                        type="number"
                        value={ranges.veryLowMax}
                        onChange={(e) => setRanges({ ...ranges, veryLowMax: parseInt(e.target.value) })}
                        min="1"
                        max="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                        Exemplo: Se definir 20, a faixa "Muito Baixo" será de 0 a 20
                    </p>
                </div>

                {/* Low */}
                <div className="border border-gray-200 rounded-lg p-6 bg-blue-50/30">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Baixo ({ranges.veryLowMax + 1} até)
                    </label>
                    <input
                        type="number"
                        value={ranges.lowMax}
                        onChange={(e) => setRanges({ ...ranges, lowMax: parseInt(e.target.value) })}
                        min={ranges.veryLowMax + 1}
                        max="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                        Exemplo: Se definir 40, a faixa "Baixo" será de {ranges.veryLowMax + 1} a 40
                    </p>
                </div>

                {/* Average */}
                <div className="border border-gray-200 rounded-lg p-6 bg-yellow-50/50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Médio ({ranges.lowMax + 1} até)
                    </label>
                    <input
                        type="number"
                        value={ranges.averageMax}
                        onChange={(e) => setRanges({ ...ranges, averageMax: parseInt(e.target.value) })}
                        min={ranges.lowMax + 1}
                        max="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                        Exemplo: Se definir 60, a faixa "Médio" será de {ranges.lowMax + 1} a 60
                    </p>
                </div>

                {/* High */}
                <div className="border border-gray-200 rounded-lg p-6 bg-green-50/50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alto ({ranges.averageMax + 1} até)
                    </label>
                    <input
                        type="number"
                        value={ranges.highMax}
                        onChange={(e) => setRanges({ ...ranges, highMax: parseInt(e.target.value) })}
                        min={ranges.averageMax + 1}
                        max="99"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                        Exemplo: Se definir 80, a faixa "Alto" será de {ranges.averageMax + 1} a 80
                    </p>
                </div>

                {/* Very High - Automatic */}
                <div className="border border-gray-200 rounded-lg p-6 bg-green-50/80">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Muito Alto (automático)
                    </label>
                    <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-700 font-medium">
                        {ranges.highMax + 1} até 100
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Esta faixa é calculada automaticamente a partir do limite superior da faixa "Alto"
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={20} />
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Faixas'}
                </button>
            </div>
        </div>
    );
}

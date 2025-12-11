'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { Save, Upload } from 'lucide-react';

interface BrandingEditorProps {
    config: any;
    configId: string;
}

export default function BrandingEditor({ config, configId }: BrandingEditorProps) {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    const [branding, setBranding] = useState({
        primaryColor: config?.primaryColor || '#d11c9e',
        reportHeader: config?.reportHeader || '',
        reportFooter: config?.reportFooter || '',
        companyLogo: config?.companyLogo || ''
    });

    useEffect(() => {
        if (config) {
            setBranding({
                primaryColor: config.primaryColor,
                reportHeader: config.reportHeader || '',
                reportFooter: config.reportFooter || '',
                companyLogo: config.companyLogo || ''
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
            alert('Branding atualizado com sucesso!');
        }
    });

    const handleSave = () => {
        updateMutation.mutate(branding);
    };

    return (
        <div>
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Branding do Relatório</h3>
                <p className="text-gray-600">
                    Personalize a aparência dos relatórios Big Five com logo e cores da sua empresa
                </p>
            </div>

            <div className="space-y-6">
                {/* Primary Color */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Cor Primária</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={branding.primaryColor}
                            onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                            className="h-12 w-24 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={branding.primaryColor}
                            onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                            placeholder="#d11c9e"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                        <div
                            className="h-12 w-12 rounded-lg border border-gray-300"
                            style={{ backgroundColor: branding.primaryColor }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Esta cor será usada nos títulos, botões e elementos destaque dos relatórios
                    </p>
                </div>

                {/* Company Logo */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Logo da Empresa</label>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={branding.companyLogo}
                            onChange={(e) => setBranding({ ...branding, companyLogo: e.target.value })}
                            placeholder="URL da logo ou base64..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                        {branding.companyLogo && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                                <img
                                    src={branding.companyLogo}
                                    alt="Logo preview"
                                    className="max-h-24 object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Cole a URL de uma imagem ou dados base64. A logo aparecerá no cabeçalho dos relatórios PDF
                    </p>
                </div>

                {/* Report Header */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Cabeçalho do Relatório</label>
                    <textarea
                        value={branding.reportHeader}
                        onChange={(e) => setBranding({ ...branding, reportHeader: e.target.value })}
                        rows={3}
                        placeholder="Ex: Relatório de Personalidade Big Five - Sua Empresa"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                        Texto que aparecerá no topo de cada relatório
                    </p>
                </div>

                {/* Report Footer */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Rodapé do Relatório</label>
                    <textarea
                        value={branding.reportFooter}
                        onChange={(e) => setBranding({ ...branding, reportFooter: e.target.value })}
                        rows={2}
                        placeholder="Ex: Este relatório é confidencial e destinado apenas ao uso profissional."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                        Texto que aparecerá no final de cada relatório
                    </p>
                </div>

                {/* Preview */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <h4 className="font-bold text-gray-900 mb-4">Preview do Relatório</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                        {branding.companyLogo && (
                            <img
                                src={branding.companyLogo}
                                alt="Logo"
                                className="max-h-16 object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        )}
                        {branding.reportHeader && (
                            <h3 className="text-lg font-bold" style={{ color: branding.primaryColor }}>
                                {branding.reportHeader}
                            </h3>
                        )}
                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-gray-600 text-sm">Conteúdo do relatório apareceria aqui...</p>
                        </div>
                        {branding.reportFooter && (
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-xs text-gray-500">{branding.reportFooter}</p>
                            </div>
                        )}
                    </div>
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
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Branding'}
                </button>
            </div>
        </div>
    );
}

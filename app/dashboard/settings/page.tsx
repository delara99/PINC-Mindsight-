'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { Save, RotateCcw, Palette, FileText, DollarSign, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'pricing' | 'theme'>('hero');

    // Fetch settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings-admin'],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/site-settings/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        }
    });

    // Update settings mutation
    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/site-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Erro ao salvar');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
            alert('✅ Configurações salvas com sucesso!');
        }
    });

    // Reset mutation
    const resetMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/site-settings/reset`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
            alert('🔄 Configurações restauradas para o padrão!');
        }
    });

    const [formData, setFormData] = useState<any>(settings || {});

    // Update formData when settings loads
    if (settings && !formData.id) {
        setFormData(settings);
    }

    const handleSave = () => {
        saveMutation.mutate(formData);
    };

    const handleReset = () => {
        if (confirm('Tem certeza que deseja restaurar as configurações padrão? Esta ação não pode ser desfeita.')) {
            resetMutation.mutate();
        }
    };

    const addFeature = () => {
        setFormData({
            ...formData,
            features: [...(formData.features || []), { id: Date.now().toString(), icon: 'star', title: '', description: '' }]
        });
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...formData.features];
        newFeatures.splice(index, 1);
        setFormData({ ...formData, features: newFeatures });
    };

    const updateFeature = (index: number, field: string, value: string) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        setFormData({ ...formData, features: newFeatures });
    };

    const addPlan = () => {
        setFormData({
            ...formData,
            pricingPlans: [...(formData.pricingPlans || []), {
                id: Date.now().toString(),
                name: '',
                price: 0,
                currency: 'R$',
                period: 'mês',
                features: [],
                highlighted: false,
                buttonText: 'Contratar'
            }]
        });
    };

    const removePlan = (index: number) => {
        const newPlans = [...formData.pricingPlans];
        newPlans.splice(index, 1);
        setFormData({ ...formData, pricingPlans: newPlans });
    };

    const updatePlan = (index: number, field: string, value: any) => {
        const newPlans = [...formData.pricingPlans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setFormData({ ...formData, pricingPlans: newPlans });
    };

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
                    <p className="text-gray-500">Gerencie as preferências da empresa e personalize a landing page</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        disabled={resetMutation.isPending}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                    >
                        <RotateCcw size={16} /> Restaurar Padrão
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-2 disabled:opacity-50"
                    >
                        {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Alterações
                    </button>
                </div>
            </div>

            {/* Company Profile (existing) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Perfil da Empresa</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                            <input type="text" disabled value="Empresa Demo" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
                            <input type="email" disabled value="admin@empresa.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* CMS Landing Page Customization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="text-primary" size={20} />
                        Customização da Landing Page
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Edite textos, cores e conteúdo sem mexer no código</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('hero')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'hero' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Sparkles size={16} /> Hero Section
                    </button>
                    <button
                        onClick={() => setActiveTab('features')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'features' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <FileText size={16} /> Features
                    </button>
                    <button
                        onClick={() => setActiveTab('pricing')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'pricing' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <DollarSign size={16} /> Pricing
                    </button>
                    <button
                        onClick={() => setActiveTab('theme')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'theme' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Palette size={16} /> Tema
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Hero Tab */}
                    {activeTab === 'hero' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal</label>
                                    <input
                                        type="text"
                                        value={formData.heroTitle || ''}
                                        onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                                    <input
                                        type="text"
                                        value={formData.heroSubtitle || ''}
                                        onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    value={formData.heroDescription || ''}
                                    onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                                    <input
                                        type="text"
                                        value={formData.heroBadge || ''}
                                        onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Fundo</label>
                                    <input
                                        type="color"
                                        value={formData.heroBgColor || '#EC1B8E'}
                                        onChange={(e) => setFormData({ ...formData, heroBgColor: e.target.value })}
                                        className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Texto</label>
                                    <input
                                        type="color"
                                        value={formData.heroTextColor || '#FFFFFF'}
                                        onChange={(e) => setFormData({ ...formData, heroTextColor: e.target.value })}
                                        className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Botão Primário (Texto)</label>
                                    <input
                                        type="text"
                                        value={formData.primaryButtonText || ''}
                                        onChange={(e) => setFormData({ ...formData, primaryButtonText: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Botão Primário (Link)</label>
                                    <input
                                        type="text"
                                        value={formData.primaryButtonLink || ''}
                                        onChange={(e) => setFormData({ ...formData, primaryButtonLink: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.showFeatures !== false}
                                        onChange={(e) => setFormData({ ...formData, showFeatures: e.target.checked })}
                                        className="rounded text-primary"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Exibir seção de features</span>
                                </label>
                                <button onClick={addFeature} className="px-3 py-1.5 bg-primary text-white rounded text-sm flex items-center gap-1">
                                    <Plus size={14} /> Adicionar Feature
                                </button>
                            </div>
                            {formData.features?.map((feat: any, index: number) => (
                                <div key={feat.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">Feature #{index + 1}</span>
                                        <button onClick={() => removeFeature(index)} className="text-red-600 hover:text-red-700">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Ícone</label>
                                            <select
                                                value={feat.icon}
                                                onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                                            >
                                                <option value="target">Target</option>
                                                <option value="grid">Grid</option>
                                                <option value="users">Users</option>
                                                <option value="shield">Shield</option>
                                                <option value="file-text">File Text</option>
                                                <option value="star">Star</option>
                                                <option value="check">Check</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Título</label>
                                            <input
                                                type="text"
                                                value={feat.title}
                                                onChange={(e) => updateFeature(index, 'title', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                                        <textarea
                                            value={feat.description}
                                            onChange={(e) => updateFeature(index, 'description', e.target.value)}
                                            rows={2}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.showPricing !== false}
                                        onChange={(e) => setFormData({ ...formData, showPricing: e.target.checked })}
                                        className="rounded text-primary"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Exibir seção de preços</span>
                                </label>
                                <button onClick={addPlan} className="px-3 py-1.5 bg-primary text-white rounded text-sm flex items-center gap-1">
                                    <Plus size={14} /> Adicionar Plano
                                </button>
                            </div>
                            {formData.pricingPlans?.map((plan: any, index: number) => (
                                <div key={plan.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">Plano #{index + 1}</span>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1 text-xs">
                                                <input
                                                    type="checkbox"
                                                    checked={plan.highlighted}
                                                    onChange={(e) => updatePlan(index, 'highlighted', e.target.checked)}
                                                    className="rounded text-primary"
                                                />
                                                Destaque
                                            </label>
                                            <button onClick={() => removePlan(index)} className="text-red-600 hover:text-red-700">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                                            <input
                                                type="text"
                                                value={plan.name}
                                                onChange={(e) => updatePlan(index, 'name', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Preço</label>
                                            <input
                                                type="number"
                                                value={plan.price}
                                                onChange={(e) => updatePlan(index, 'price', parseFloat(e.target.value))}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Moeda</label>
                                            <input
                                                type="text"
                                                value={plan.currency}
                                                onChange={(e) => updatePlan(index, 'currency', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Período</label>
                                            <input
                                                type="text"
                                                value={plan.period}
                                                onChange={(e) => updatePlan(index, 'period', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Recursos (um por linha)</label>
                                        <textarea
                                            value={plan.features?.join('\n') || ''}
                                            onChange={(e) => updatePlan(index, 'features', e.target.value.split('\n').filter((f: string) => f.trim()))}
                                            rows={3}
                                            placeholder="Exemplo:&#10;Até 10 usuários&#10;Suporte por email"
                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Texto do Botão</label>
                                        <input
                                            type="text"
                                            value={plan.buttonText}
                                            onChange={(e) => updatePlan(index, 'buttonText', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Theme Tab */}
                    {activeTab === 'theme' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="text-center">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
                                    <input
                                        type="color"
                                        value={formData.primaryColor || '#EC1B8E'}
                                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                        className="w-full h-24 border border-gray-200 rounded-lg cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">{formData.primaryColor}</p>
                                </div>
                                <div className="text-center">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
                                    <input
                                        type="color"
                                        value={formData.secondaryColor || '#F7F7F7'}
                                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                        className="w-full h-24 border border-gray-200 rounded-lg cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">{formData.secondaryColor}</p>
                                </div>
                                <div className="text-center">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Acento</label>
                                    <input
                                        type="color"
                                        value={formData.accentColor || '#FFC107'}
                                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                        className="w-full h-24 border border-gray-200 rounded-lg cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">{formData.accentColor}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-600">💡 <strong>Dica:</strong> As cores do tema afetam botões, links e elementos de destaque em toda a aplicação.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

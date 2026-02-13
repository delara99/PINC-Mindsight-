'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/store/auth-store';
import { Save, RotateCcw, Palette, FileText, DollarSign, Sparkles, Plus, Trash2, Loader2, Star, Info, Building, Upload, Rocket, UserPlus, Mail, Calendar } from 'lucide-react';
import { API_URL } from '../../../src/config/api';

export default function SettingsPage() {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'pricing' | 'theme' | 'about' | 'business' | 'early-access'>('hero');

    // Fetch settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings-admin'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        }
    });

    // Update settings mutation
    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_URL}/api/v1/site-settings`, {
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

    const resetMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings/reset`, {
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

    // Fetch Leads
    const { data: leads, refetch: refetchLeads, isLoading: isLoadingLeads } = useQuery({
        queryKey: ['early-access-leads'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao carregar leads');
            return res.json();
        },
        enabled: activeTab === 'early-access'
    });

    // Convert Lead Mutation
    const convertLeadMutation = useMutation({
        mutationFn: async (lead: any) => {
            const res = await fetch(`${API_URL}/api/v1/users/register-client`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: lead.name,
                    email: lead.email,
                    password: 'PincUser2025!',
                    role: 'MEMBER',
                    userType: 'INDIVIDUAL',
                    status: 'active'
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Erro ao criar usuário');
            }
            return res.json();
        },
        onSuccess: () => {
            alert('✅ Cliente cadastrado com sucesso!\nSenha inicial: PincUser2025!');
        },
        onError: (err: any) => {
            alert(`Erro ao cadastrar: ${err.message}`);
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

    const updateFeature = (index: number, field: string, value: any) => {
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
                    <p className="text-gray-500">Gerencie as preferências da empresa e personalize a landing page</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleReset}
                        disabled={resetMutation.isPending}
                        className="flex-1 md:flex-none justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                    >
                        <RotateCcw size={16} /> Restaurar Padrão
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-2 disabled:opacity-50"
                    >
                        {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Alterações
                    </button>
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

                <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                    {['hero', 'features', 'pricing', 'about', 'theme', 'business', 'early-access'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 min-w-[100px] py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab === 'hero' && <><Sparkles size={16} /> Hero Section</>}
                            {tab === 'features' && <><FileText size={16} /> Features</>}
                            {tab === 'pricing' && <><DollarSign size={16} /> Pricing</>}
                            {tab === 'theme' && <><Palette size={16} /> Tema</>}
                            {tab === 'about' && <><Info size={16} /> Sobre</>}
                            {tab === 'business' && <><Building size={16} /> Empresas (B2B)</>}
                            {tab === 'early-access' && <><Rocket size={16} /> Amostra (Beta)</>}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Hero Tab */}
                    {activeTab === 'hero' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={!!feat.highlighted}
                                                    onChange={(e) => updateFeature(index, 'highlighted', String(e.target.checked))} // O backend salva como JSON, o frontend casta na leitura se necessario, mas aqui o state é any.
                                                // Melhor: updateFeature espera value: string. O ideal seria value: any.
                                                // Checando updateFeature: const updateFeature = (index: number, field: string, value: string) => { ... }
                                                // OPA! O updateFeature original está tipado como string value. Preciso ajustar o updateFeature OU passar string 'true'/'false'.
                                                // Vou ajustar o updateFeature na próxima call se precisar, mas aqui vou assumir que posso passar any no JS ou ajustar a assinatura.
                                                // Espera, vi o codigo: updateFeature = (index: number, field: string, value: string) .
                                                // Vou MUDAR a assinatura do updateFeature para `value: any` primeiro, ou hackear aqui.
                                                // Melhor change: vou alterar o `updateFeature` signature na linha 89 para aceitar any.
                                                />
                                                <Star size={12} className={feat.highlighted ? "text-yellow-500 fill-yellow-500" : "text-gray-400"} />
                                                Destaque
                                            </label>
                                            <button onClick={() => removeFeature(index)} className="text-red-600 hover:text-red-700 ml-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                        <div className="md:col-span-2">
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
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

                    {/* About Tab */}
                    {activeTab === 'about' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.showAbout !== false}
                                    onChange={(e) => setFormData({ ...formData, showAbout: e.target.checked })}
                                    className="rounded text-primary"
                                />
                                <span className="text-sm font-medium text-gray-700">Exibir página Sobre</span>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Página</label>
                                <input
                                    type="text"
                                    value={formData.aboutTitle || ''}
                                    onChange={(e) => setFormData({ ...formData, aboutTitle: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo (HTML/Texto)</label>
                                <textarea
                                    value={formData.aboutContent || ''}
                                    onChange={(e) => setFormData({ ...formData, aboutContent: e.target.value })}
                                    rows={10}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-gray-500 mt-1">Dica: Você pode usar quebras de linha para separar parágrafos.</p>
                            </div>
                        </div>
                    )}

                    {/* Business B2B Tab */}
                    {activeTab === 'business' && (
                        <div className="space-y-8">
                            {/* Logo Upload */}
                            <div className="space-y-4 border-b border-gray-100 pb-6">
                                <h4 className="font-semibold text-gray-800">Identidade Visual da Página</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Logo para Página de Empresas</label>
                                        <div className="flex gap-4 items-center">
                                            {formData.businessLogo && (
                                                <div className="h-16 w-16 relative border rounded-lg p-2 bg-gray-50 flex items-center justify-center">
                                                    <img src={formData.businessLogo} alt="Logo B2B" className="max-h-full max-w-full object-contain" />
                                                    <button
                                                        onClick={() => setFormData({ ...formData, businessLogo: null })}
                                                        className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow border border-gray-200 hover:bg-gray-50"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            )}
                                            <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                                                <Upload size={16} />
                                                Upload Logo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setFormData({ ...formData, businessLogo: reader.result as string });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Recomendado: PNG transparente, max 2MB.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Fundo (Hero)</label>
                                            <input
                                                type="color"
                                                value={formData.businessHeroBgColor || '#F0F9FF'}
                                                onChange={(e) => setFormData({ ...formData, businessHeroBgColor: e.target.value })}
                                                className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Texto (Hero)</label>
                                            <input
                                                type="color"
                                                value={formData.businessHeroTextColor || '#111827'}
                                                onChange={(e) => setFormData({ ...formData, businessHeroTextColor: e.target.value })}
                                                className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Texts */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-800">Conteúdo do Hero</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Badge / Tag</label>
                                        <input
                                            type="text"
                                            value={formData.businessHeroBadge || ''}
                                            onChange={(e) => setFormData({ ...formData, businessHeroBadge: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                            placeholder="Ex: Solução Corporativa"
                                        />
                                    </div>
                                    <div></div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título Principal</label>
                                        <input
                                            type="text"
                                            value={formData.businessHeroTitle || ''}
                                            onChange={(e) => setFormData({ ...formData, businessHeroTitle: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                            placeholder="Ex: Impulsione seu Capital Humano"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo (Gradiente)</label>
                                        <input
                                            type="text"
                                            value={formData.businessHeroSubtitle || ''}
                                            onChange={(e) => setFormData({ ...formData, businessHeroSubtitle: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                            placeholder="Ex: com Inteligência Comportamental"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <textarea
                                        value={formData.businessHeroDescription || ''}
                                        onChange={(e) => setFormData({ ...formData, businessHeroDescription: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="A plataforma definitiva para..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Theme Tab */}
                    {activeTab === 'theme' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                    {/* Early Access Tab */}
                    {activeTab === 'early-access' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                <div>
                                    <h4 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                                        <Rocket size={20} /> Página de Coleta de Amostras (Beta)
                                    </h4>
                                    <p className="text-sm text-indigo-700 mt-1 max-w-lg">
                                        Ative esta landing page especial para coletar leads qualificados e validar o método antes do lançamento oficial.
                                        A página estará acessível em <strong>/early-access</strong>.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer ml-4">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.enableEarlyAccess || false}
                                        onChange={(e) => setFormData({ ...formData, enableEarlyAccess: e.target.checked })}
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <h4 className="font-bold text-gray-800 mb-2">Visualizar Página</h4>
                                    <p className="text-sm text-gray-500 mb-4">Veja como a página está ficando em tempo real.</p>
                                    <a
                                        href="/early-access"
                                        target="_blank"
                                        className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                                    >
                                        Acessar /early-access ↗
                                    </a>
                                </div>
                                <div className="p-5 border border-gray-100 rounded-xl bg-white shadow-sm col-span-1 md:col-span-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h4 className="font-bold text-gray-800">Leads Capturados</h4>
                                            <p className="text-sm text-gray-500">Lista de interessados cadastrados na landing page.</p>
                                        </div>
                                        <button
                                            onClick={() => refetchLeads()}
                                            className="text-primary text-sm hover:underline"
                                        >
                                            Atualizar
                                        </button>
                                    </div>

                                    {isLoadingLeads ? (
                                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
                                    ) : leads && leads.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3">Data</th>
                                                        <th className="px-4 py-3">Nome / Email</th>
                                                        <th className="px-4 py-3">Interesse</th>
                                                        <th className="px-4 py-3 text-right">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {leads.map((lead: any) => (
                                                        <tr key={lead.id} className="hover:bg-gray-50/50">
                                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {new Date(lead.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-medium text-gray-900">{lead.name}</div>
                                                                <div className="text-gray-500 text-xs flex items-center gap-1">
                                                                    <Mail size={10} /> {lead.email}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                                                    {lead.interest || 'Geral'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(`Deseja cadastrar ${lead.name} como cliente?\nUma conta será criada com a senha padrão 'PincUser2025!'.`)) {
                                                                            convertLeadMutation.mutate(lead);
                                                                        }
                                                                    }}
                                                                    disabled={convertLeadMutation.isPending}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors border border-green-200"
                                                                >
                                                                    <UserPlus size={14} /> Cadastrar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                            <p>Nenhum lead capturado ainda.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
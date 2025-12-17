'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { Save, RotateCcw, Palette, FileText, DollarSign, Sparkles, Plus, Trash2, Loader2, Star, Info, Grid3x3 } from 'lucide-react';
import { API_URL } from '@/src/config/api';

export default function SettingsPage() {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'branding' | 'menu' | 'hero' | 'content' | 'pricing' | 'theme' | 'about'>('branding');

    // ... (keep query/mutation logic) ...

    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings-admin'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings/admin`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            // Ensure array fields are initialized if null
            if (!data.menuItems) data.menuItems = [];
            if (!data.featuresSection) data.featuresSection = [];
            return data;
        }
    });

    const [formData, setFormData] = useState<any>(settings || {});

    // Update formData when settings loads
    if (settings && !formData.id) {
        setFormData(settings);
    }

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
            if (!res.ok) throw new Error('Falha ao salvar');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
            // Show toast or alert (using simple alert for now to avoid extra deps)
            alert('Configurações salvas com sucesso!');
        },
        onError: () => {
            alert('Erro ao salvar configurações. Tente novamente.');
        }
    });

    const resetMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings/reset`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Falha ao resetar');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            queryClient.invalidateQueries({ queryKey: ['site-settings-admin'] });
            setFormData({}); // Will be refilled by query
            alert('Configurações restauradas para o padrão!');
        },
        onError: () => {
            alert('Erro ao resetar configurações.');
        }
    });

    const handleSave = () => {
        saveMutation.mutate(formData);
    };

    const handleReset = () => {
        if (confirm('Tem certeza? Isso apagará todas as customizações.')) {
            resetMutation.mutate();
        }
    };

    // Menu Helpers
    const addMenuItem = () => {
        setFormData({
            ...formData,
            menuItems: [...(formData.menuItems || []), { label: 'Novo Link', href: '#' }]
        });
    };

    const removeMenuItem = (index: number) => {
        const newItems = [...(formData.menuItems || [])];
        newItems.splice(index, 1);
        setFormData({ ...formData, menuItems: newItems });
    };

    const updateMenuItem = (index: number, field: string, value: string) => {
        const newItems = [...(formData.menuItems || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, menuItems: newItems });
    };

    // Block Helpers (Home Content)
    const addBlock = () => {
        setFormData({
            ...formData,
            featuresSection: [...(formData.featuresSection || []), { 
                id: Date.now().toString(), 
                title: 'Nova Seção', 
                description: 'Descrição aqui...', 
                image: '/placeholder.png',
                orientation: 'left', // or 'right'
                items: ['Item 1', 'Item 2']
            }]
        });
    };

    const removeBlock = (index: number) => {
        const newBlocks = [...(formData.featuresSection || [])];
        newBlocks.splice(index, 1);
        setFormData({ ...formData, featuresSection: newBlocks });
    };

    const updateBlock = (index: number, field: string, value: any) => {
        const newBlocks = [...(formData.featuresSection || [])];
        newBlocks[index] = { ...newBlocks[index], [field]: value };
        setFormData({ ...formData, featuresSection: newBlocks });
    };

    const updateBlockItemArray = (blockIndex: number, newItems: string[]) => {
        const newBlocks = [...(formData.featuresSection || [])];
        newBlocks[blockIndex] = { ...newBlocks[blockIndex], items: newItems };
        setFormData({ ...formData, featuresSection: newBlocks });
    };

    // ... (keep pricing helpers) ...

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Customização Total</h1>
                    <p className="text-gray-500">Controle cada detalhe da sua Landing Page</p>
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
                        Salvar Tudo
                    </button>
                </div>
            </div>

            {/* Main Config Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Scrollable Tabs */}
                <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
                    <div className="flex min-w-max">
                        {[
                            { id: 'branding', icon: Star, label: 'Marca & Logo' },
                            { id: 'menu', icon: Grid3x3, label: 'Menu' },
                            { id: 'hero', icon: Sparkles, label: 'Topo (Hero)' },
                            { id: 'content', icon: FileText, label: 'Conteúdo Home' },
                            { id: 'pricing', icon: DollarSign, label: 'Preços' },
                            { id: 'theme', icon: Palette, label: 'Cores' },
                            { id: 'about', icon: Info, label: 'Sobre' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                                    activeTab === tab.id 
                                    ? 'border-primary text-primary bg-primary/5' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content Area */}
                <div className="p-8">
                    
                    {/* BRANDING TAB */}
                    {activeTab === 'branding' && (
                        <div className="space-y-8 max-w-2xl">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Identidade Visual</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">URL da Logo (Cabeçalho)</label>
                                        <input
                                            type="text"
                                            value={formData.logoUrl || ''}
                                            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                            placeholder="https://exemplo.com/logo.png"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Recomendado: PNG transparente, altura 40px.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Rodapé</label>
                                        <input
                                            type="text"
                                            value={formData.footerText || ''}
                                            onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MENU TAB */}
                    {activeTab === 'menu' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Itens de Navegação</h3>
                                <button onClick={addMenuItem} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium flex items-center gap-1">
                                    <Plus size={14} /> Adicionar Link
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.menuItems?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-gray-500">Rótulo</label>
                                            <input 
                                                type="text" 
                                                value={item.label} 
                                                onChange={(e) => updateMenuItem(idx, 'label', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-gray-500">Link / Âncora</label>
                                            <input 
                                                type="text" 
                                                value={item.href} 
                                                onChange={(e) => updateMenuItem(idx, 'href', e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm"
                                            />
                                        </div>
                                        <button onClick={() => removeMenuItem(idx)} className="mt-5 text-gray-400 hover:text-red-500">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {(!formData.menuItems || formData.menuItems.length === 0) && (
                                    <p className="text-gray-400 text-sm italic">Nenhum item de menu configurado.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* HERO TAB (Existing) */}
                    {activeTab === 'hero' && (
                        <div className="space-y-6 max-w-4xl">
                            {/* ... Reuse existing Hero form logic ... */}
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
                            {/* Colors and Badges */}
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                                    <input
                                        type="text"
                                        value={formData.heroBadge || ''}
                                        onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Fundo (Start)</label>
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
                        </div>
                    )}

                    {/* HOME CONTENT TAB (Dynamic Blocks) */}
                    {activeTab === 'content' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-900">Seções de Conteúdo</h3>
                                    <p className="text-sm text-blue-700">Adicione blocos alternados (Texto + Imagem) para explicar seu produto.</p>
                                </div>
                                <button onClick={addBlock} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                                    <Plus size={16} /> Nova Seção
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.featuresSection?.map((block: any, idx: number) => (
                                    <div key={block.id || idx} className="border border-gray-200 rounded-xl p-6 bg-gray-50/50 hover:bg-white transition-colors shadow-sm">
                                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                                            <span className="font-bold text-gray-400 uppercase text-xs tracking-wider">Seção #{idx + 1}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => removeBlock(idx)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {/* Left Column: Text Content */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Título</label>
                                                    <input 
                                                        type="text" 
                                                        value={block.title} 
                                                        onChange={(e) => updateBlock(idx, 'title', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg font-semibold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Texto Descritivo</label>
                                                    <textarea 
                                                        value={block.description} 
                                                        onChange={(e) => updateBlock(idx, 'description', e.target.value)}
                                                        rows={4}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Lista de Benefícios (um por linha)</label>
                                                    <textarea 
                                                        value={block.items?.join('\n') || ''}
                                                        onChange={(e) => updateBlockItemArray(idx, e.target.value.split('\n').filter(s => s.trim()))}
                                                        rows={4}
                                                        placeholder="Vantagem 1&#10;Vantagem 2"
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm bg-gray-50"
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column: Visuals & Config */}
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">URL da Imagem</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={block.image} 
                                                            onChange={(e) => updateBlock(idx, 'image', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                            placeholder="/imagem.png"
                                                        />
                                                    </div>
                                                    {block.image && (
                                                        <div className="mt-2 h-32 w-full bg-gray-200 rounded-lg overflow-hidden relative border border-gray-300">
                                                            <img src={block.image} alt="Preview" className="w-full h-full object-cover opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                            <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">Preview</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Orientação</label>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input 
                                                                type="radio" 
                                                                name={`orient-${idx}`} 
                                                                value="left" 
                                                                checked={block.orientation !== 'right'} 
                                                                onChange={() => updateBlock(idx, 'orientation', 'left')}
                                                            />
                                                            <span className="text-sm">Texto à Esquerda</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input 
                                                                type="radio" 
                                                                name={`orient-${idx}`} 
                                                                value="right" 
                                                                checked={block.orientation === 'right'} 
                                                                onChange={() => updateBlock(idx, 'orientation', 'right')}
                                                            />
                                                            <span className="text-sm">Texto à Direita</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">ID da Seção (Âncora)</label>
                                                    <input 
                                                        type="text" 
                                                        value={block.id || ''} 
                                                        onChange={(e) => updateBlock(idx, 'id', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-500"
                                                        placeholder="ex: relatorios"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PRICING TAB (Reuse existing logic) */}
                    {activeTab === 'pricing' && (
                        <div className="space-y-4">
                            {/* ... reuse existing pricing UI ... */}
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
                                    {/* ... plan fields ... */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">Plano #{index + 1}</span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => removePlan(index)} className="text-red-600 hover:text-red-700">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                                            <input type="text" value={plan.name} onChange={(e) => updatePlan(index, 'name', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Preço</label>
                                            <input type="number" value={plan.price} onChange={(e) => updatePlan(index, 'price', parseFloat(e.target.value))} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded" />
                                        </div>
                                         <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Moeda</label>
                                            <input type="text" value={plan.currency} onChange={(e) => updatePlan(index, 'currency', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Período</label>
                                            <input type="text" value={plan.period} onChange={(e) => updatePlan(index, 'period', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Recursos (um por linha)</label>
                                        <textarea value={plan.features?.join('\n') || ''} onChange={(e) => updatePlan(index, 'features', e.target.value.split('\n').filter((f: string) => f.trim()))} rows={3} className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded font-mono" />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input type="checkbox" checked={plan.highlighted} onChange={(e) => updatePlan(index, 'highlighted', e.target.checked)} />
                                        <span className="text-sm">Destaque</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* THEME TAB (Existing) */}
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
                                </div>
                                <div className="text-center">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
                                    <input
                                        type="color"
                                        value={formData.secondaryColor || '#F7F7F7'}
                                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                        className="w-full h-24 border border-gray-200 rounded-lg cursor-pointer"
                                    />
                                </div>
                                <div className="text-center">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Acento</label>
                                    <input
                                        type="color"
                                        value={formData.accentColor || '#FFC107'}
                                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                                        className="w-full h-24 border border-gray-200 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* ABOUT TAB (Existing) */}
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
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
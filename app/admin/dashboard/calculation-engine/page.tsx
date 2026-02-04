'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/src/store/auth-store';

const getApiUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const hasProtocol = baseUrl.startsWith('http://') || baseUrl.startsWith('https://');
    const url = hasProtocol ? baseUrl : `https://${baseUrl}`;
    if (url.endsWith('/')) return `${url.slice(0, -1)}/api/v1`;
    return `${url}/api/v1`;
};

const API_URL = getApiUrl();

// Helper function to create axios config with auth
const getAxiosConfig = (token: string | null) => ({
    headers: token ? { Authorization: `Bearer ${token}` } : {}
});

export default function CalculationEnginePage() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: '📊 Visão Geral', icon: 'dashboard' },
        { id: 'mappings', label: '📋 Questões', icon: 'list' },
        { id: 'formulas', label: '📐 Fórmulas', icon: 'functions' },
        { id: 'classifications', label: '📈 Classificações', icon: 'bar_chart' },
        { id: 'simulator', label: '🧪 Simulador', icon: 'science' },
        { id: 'audit', label: '📜 Auditoria', icon: 'history' },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">Motor de Cálculo</h1>
                    <p className="text-xs text-gray-500 mt-1">TalkingTo Psychometrics</p>
                </div>
                <nav className="p-4 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span>{tab.label.split(' ')[0]}</span>
                            <span>{tab.label.split(' ').slice(1).join(' ')}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'mappings' && <QuestionMappingsTab />}
                    {activeTab === 'formulas' && <FormulasTab />}
                    {activeTab === 'classifications' && <ClassificationsTab />}
                    {activeTab === 'simulator' && <SimulatorTab />}
                    {activeTab === 'audit' && <AuditTab />}
                </div>
            </div>
        </div>
    );
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab() {
    const token = useAuthStore((state) => state.token);
    const [documentation, setDocumentation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);

    const handleSeed = async () => {
        if (!confirm('Isso irá popular o banco de dados com os mapeamentos, fórmulas e classificações padrão. Continuar?')) {
            return;
        }

        setSeeding(true);
        try {
            const response = await axios.post(
                `${API_URL}/admin/seed/calculation-engine`,
                {},
                getAxiosConfig(token)
            );
            alert(`✅ ${response.data.message}\n\nMapeamentos: ${response.data.results.mappings}\nFórmulas: ${response.data.results.formulas}\nClassificações: ${response.data.results.classifications}`);
            window.location.reload();
        } catch (error: any) {
            console.error('Erro ao popular dados:', error);
            alert('❌ Erro ao popular dados: ' + (error.response?.data?.message || error.message));
        } finally {
            setSeeding(false);
        }
    };

    useEffect(() => {
        const fetchDocumentation = async () => {
            if (!token) {
                setError('Token de autenticação não encontrado');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(
                    `${API_URL}/calculation-engine/documentation`,
                    getAxiosConfig(token)
                );
                setDocumentation(response.data);
                setError(null);
            } catch (error: any) {
                console.error('Erro ao buscar documentação:', error);
                setError(error.response?.data?.message || 'Erro ao carregar documentação');
            } finally {
                setLoading(false);
            }
        };
        fetchDocumentation();
    }, [token]);

    if (loading) return <div className="text-center py-8">⏳ Carregando documentação...</div>;
    if (error) return <div className="text-center py-8 text-red-600">❌ {error}</div>;
    if (!documentation) return <div className="text-center py-8">Nenhuma documentação disponível.</div>;

    return (
        <div className="space-y-6">
            {/* Seed Button */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-yellow-900 mb-2">🌱 Popular Banco de Dados</h3>
                        <p className="text-yellow-800 text-sm mb-4">
                            Se o Mapeamento de Questões estiver vazio, clique aqui para popular o banco com os dados padrão do Motor de Cálculo.
                        </p>
                        <ul className="text-xs text-yellow-700 space-y-1 mb-4">
                            <li>• 126 mapeamentos de questões (Big Five)</li>
                            <li>• 4 fórmulas de cálculo</li>
                            <li>• 25 classificações de níveis</li>
                        </ul>
                    </div>
                    <button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-all disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {seeding ? '⏳ Populando...' : '🌱 Popular Dados'}
                    </button>
                </div>
            </div>

            {/* Pipeline de Cálculo */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Pipeline de Cálculo</h2>
                <p className="text-gray-600 mb-6">
                    Fluxo completo de processamento desde as respostas até os scores finais
                </p>

                <div className="space-y-4">
                    {documentation.pipeline.map((step: any, index: number) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        {step.step}
                                    </div>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {step.name}
                                    </h3>
                                    <p className="text-gray-700 mb-3">
                                        {step.description}
                                    </p>
                                    {step.formula && (
                                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                                            <p className="text-sm font-mono text-gray-800">
                                                {JSON.stringify(step.formula.formula, null, 2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dimensões */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Dimensões do Big Five</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documentation.dimensions.map((dim: any) => (
                        <div key={dim.key} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-2">
                                <span className="text-2xl font-bold text-blue-600 mr-2">{dim.key}</span>
                                <h3 className="text-lg font-semibold text-gray-900">{dim.name}</h3>
                            </div>
                            <p className="text-sm text-gray-600">{dim.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// QUESTION MAPPINGS TAB
// ============================================
function QuestionMappingsTab() {
    const [mappings, setMappings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDimension, setSelectedDimension] = useState<string>('E');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [saveReason, setSaveReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const dimensionNames: Record<string, string> = {
        'E': 'Extroversão',
        'A': 'Amabilidade',
        'C': 'Conscienciosidade',
        'O': 'Abertura',
        'N': 'Estabilidade Emocional'
    };

    const fetchMappings = async () => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                setError('Token de autenticação não encontrado');
                setLoading(false);
                return;
            }

            const response = await axios.get(
                `${API_URL}/calculation-engine/question-mappings`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Mapeamentos carregados:', response.data.length);
            setMappings(response.data);
            setError(null);
            setLoading(false);
        } catch (error: any) {
            console.error('Erro ao buscar mapeamentos:', error);
            setError(error.response?.data?.message || 'Erro ao carregar mapeamentos');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMappings();
    }, []);

    const handleEdit = (mapping: any) => {
        setEditingId(mapping.id);
        setEditForm({ ...mapping });
        setSaveReason('');
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm(null);
        setSaveReason('');
    };

    const handleSave = async () => {
        if (!saveReason.trim()) {
            alert('Por favor, informe o motivo da alteração');
            return;
        }

        setIsSaving(true);
        try {
            const token = useAuthStore.getState().token;
            await axios.put(
                `${API_URL}/calculation-engine/question-mappings/${editForm.id}`,
                { ...editForm, reason: saveReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('✅ Mapeamento atualizado com sucesso!');
            setEditingId(null);
            setEditForm(null);
            fetchMappings();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar mapeamento');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredMappings = mappings
        .filter(m => m.dimension === selectedDimension)
        .sort((a, b) => a.questionId - b.questionId);

    if (loading) return <div className="text-center py-12">⏳ Carregando mapeamentos...</div>;
    if (error) return <div className="text-center py-12 text-red-600">❌ {error}</div>;
    if (mappings.length === 0) return <div className="text-center py-12 text-gray-500">Nenhum mapeamento encontrado. Execute o seed do banco de dados.</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Mapeamento de Questões</h2>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {['E', 'A', 'C', 'O', 'N'].map((dim) => (
                    <button
                        key={dim}
                        onClick={() => setSelectedDimension(dim)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedDimension === dim
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {dimensionNames[dim]}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questão / Faceta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Peso</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Reversa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMappings.map((mapping) => (
                            <tr key={mapping.id} className={editingId === mapping.id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    Q{mapping.questionId}
                                </td>
                                <td className="px-6 py-4">
                                    {editingId === mapping.id ? (
                                        <div className="space-y-2">
                                            <div className="text-xs text-gray-500 mb-1">Faceta:</div>
                                            <input
                                                type="text"
                                                value={editForm.facet || ''}
                                                onChange={(e) => setEditForm({ ...editForm, facet: e.target.value })}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />

                                            {/* TalkingTo Fields (Novos) */}
                                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 bg-slate-50 p-2 rounded">
                                                <div className="col-span-2 text-[10px] font-bold text-purple-600 border-b border-purple-100 mb-1">PARÂMETROS TALKING-TO</div>

                                                <div>
                                                    <label className="text-[9px] text-gray-500 block">Dicotomia</label>
                                                    <input
                                                        value={editForm.dichotomy || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, dichotomy: e.target.value })}
                                                        placeholder="Ex: Introversão-Extroversão"
                                                        className="w-full text-xs border border-purple-200 rounded px-1 py-0.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-gray-500 block">Traço Questão</label>
                                                    <input
                                                        value={editForm.questionTrait || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, questionTrait: e.target.value })}
                                                        placeholder="Ex: EXTROVERTIDO"
                                                        className="w-full text-xs border border-purple-200 rounded px-1 py-0.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-gray-500 block">Subtraço</label>
                                                    <input
                                                        value={editForm.subtrait || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, subtrait: e.target.value })}
                                                        placeholder="Ex: falante"
                                                        className="w-full text-xs border border-purple-200 rounded px-1 py-0.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[9px] text-gray-500 block">Conceito</label>
                                                    <input
                                                        value={editForm.concept || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, concept: e.target.value })}
                                                        placeholder="Ex: comunicação"
                                                        className="w-full text-xs border border-purple-200 rounded px-1 py-0.5"
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-500 mt-2 mb-1">Motivo da Alteração:</div>
                                            <input
                                                type="text"
                                                value={saveReason}
                                                onChange={(e) => setSaveReason(e.target.value)}
                                                placeholder="Obrigatório..."
                                                className="w-full px-2 py-1 border border-red-300 rounded text-sm focus:ring-red-500"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-sm font-medium text-blue-800 bg-blue-100 inline-block px-2 py-0.5 rounded">
                                                {mapping.facet}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{mapping.description}</div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === mapping.id ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="10"
                                            value={editForm.weight}
                                            onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) })}
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-900">{mapping.weight}x</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {editingId === mapping.id ? (
                                        <input
                                            type="checkbox"
                                            checked={editForm.isReversed}
                                            onChange={(e) => setEditForm({ ...editForm, isReversed: e.target.checked })}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    ) : (
                                        mapping.isReversed ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                Sim
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${mapping.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {mapping.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {editingId === mapping.id ? (
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={handleSave}
                                                disabled={!saveReason.trim() || isSaving}
                                                className={`text-green-600 hover:text-green-900 ${(!saveReason.trim() || isSaving) ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                            >
                                                💾
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(mapping)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            ✏️ Editar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ============================================
// FORMULAS TAB
// ============================================
function FormulasTab() {
    const [formulas, setFormulas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFormula, setSelectedFormula] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedFormula, setEditedFormula] = useState<any>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [previewResults, setPreviewResults] = useState<any>(null);
    const [saveReason, setSaveReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchFormulas = async () => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.get(
                `${API_URL}/calculation-engine/formulas`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFormulas(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar fórmulas:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFormulas();
    }, []);

    useEffect(() => {
        if (selectedFormula && isEditing) {
            setEditedFormula({ ...selectedFormula });
            validateFormula(selectedFormula);
            generatePreview(selectedFormula);
        }
    }, [selectedFormula, isEditing]);

    const validateFormula = (formula: any) => {
        const errors: string[] = [];
        if (!formula.formula) errors.push('Fórmula não pode estar vazia');
        if (formula.minValue !== undefined && formula.maxValue !== undefined) {
            if (formula.minValue >= formula.maxValue) errors.push('Valor mínimo deve ser menor que o máximo');
        }
        if (formula.precision < 0 || formula.precision > 10) errors.push('Precisão deve estar entre 0 e 10');
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleFormulaChange = (field: string, value: any) => {
        const updated = { ...editedFormula, [field]: value };
        setEditedFormula(updated);
        validateFormula(updated);
        if (field === 'formula' || field === 'minValue' || field === 'maxValue') {
            generatePreview(updated);
        }
    };

    const generatePreview = (formula: any) => {
        try {
            const testValues = [1, 2, 3, 4, 5, 6];
            const expression = formula.formula?.expression || '';

            if (!expression) {
                setPreviewResults(null);
                return;
            }

            const results = testValues.map(val => {
                try {
                    // Evaluate expression safely (replace x with actual value)
                    const expr = expression.replace(/x/g, val.toString());
                    // Use Function constructor for safe evaluation (better than eval)
                    const result = new Function(`return ${expr}`)();
                    const rounded = formula.precision !== undefined
                        ? parseFloat(result.toFixed(formula.precision))
                        : result;
                    return { input: val, output: rounded };
                } catch (e) {
                    return { input: val, output: 'Erro' };
                }
            });
            setPreviewResults(results);
        } catch (error) {
            setPreviewResults(null);
        }
    };

    const handleSave = async () => {
        if (!validateFormula(editedFormula)) {
            alert('Por favor, corrija os erros antes de salvar');
            return;
        }
        if (!saveReason.trim()) {
            alert('Por favor, informe o motivo da alteração');
            return;
        }

        setIsSaving(true);
        try {
            const token = useAuthStore.getState().token;
            await axios.put(
                `${API_URL}/calculation-engine/formulas/${editedFormula.id}`,
                { ...editedFormula, reason: saveReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('✅ Fórmula atualizada com sucesso!');
            setIsEditing(false);
            setSaveReason('');
            fetchFormulas();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar fórmula');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>⏳ Carregando fórmulas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Fórmulas de Cálculo</h2>
                <span className="text-sm text-gray-500">{formulas.length} fórmulas ativas</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {formulas.map((formula) => (
                        <div
                            key={formula.id}
                            onClick={() => {
                                setSelectedFormula(formula);
                                setIsEditing(false);
                            }}
                            className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all ${selectedFormula?.id === formula.id ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">{formula.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">Tipo: {formula.type}</p>
                                    <div className="bg-gray-50 rounded p-2">
                                        <code className="text-xs text-gray-700">{formula.formula.formula || JSON.stringify(formula.formula)}</code>
                                    </div>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">v{formula.version}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedFormula && (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{isEditing ? '✏️ Editando' : '📋 Visualizando'}: {selectedFormula.name}</h3>
                            <button onClick={() => setIsEditing(!isEditing)} className={`px-3 py-1 text-white text-sm rounded transition-colors ${isEditing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {isEditing ? '❌ Cancelar' : '✏️ Editar'}
                            </button>
                        </div>
                        {!isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{selectedFormula.description}</div>
                                </div>
                                {selectedFormula.example && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Exemplo</label>
                                        <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap border border-green-200">{selectedFormula.example}</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {validationErrors.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Erros:</h4>
                                        <ul className="list-disc list-inside text-sm text-red-700">{validationErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                                    <textarea value={editedFormula?.description || ''} onChange={(e) => handleFormulaChange('description', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} />
                                </div>

                                {/* Formula Expression Editor */}
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                    <label className="block text-sm font-bold text-blue-900 mb-3">📐 Expressão da Fórmula</label>

                                    {/* Expression Field */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-blue-700 mb-1">Expression (fórmula matemática)</label>
                                        <input
                                            type="text"
                                            value={editedFormula?.formula?.expression || ''}
                                            onChange={(e) => {
                                                const updated = {
                                                    ...editedFormula,
                                                    formula: {
                                                        ...editedFormula.formula,
                                                        expression: e.target.value
                                                    }
                                                };
                                                setEditedFormula(updated);
                                                validateFormula(updated);
                                            }}
                                            placeholder="Ex: 7 - x  ou  ((x - 1) / 5) * 100"
                                            className="w-full px-3 py-2 border border-blue-300 rounded-lg font-mono text-sm bg-white"
                                        />
                                        <p className="text-xs text-blue-600 mt-1">💡 Use 'x' como variável de entrada</p>
                                    </div>

                                    {/* Description Field */}
                                    <div>
                                        <label className="block text-xs font-medium text-blue-700 mb-1">Description (descrição curta)</label>
                                        <input
                                            type="text"
                                            value={editedFormula?.formula?.description || ''}
                                            onChange={(e) => {
                                                const updated = {
                                                    ...editedFormula,
                                                    formula: {
                                                        ...editedFormula.formula,
                                                        description: e.target.value
                                                    }
                                                };
                                                setEditedFormula(updated);
                                            }}
                                            placeholder="Ex: Inverte escala 1-6"
                                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white"
                                        />
                                    </div>

                                    {/* Preview */}
                                    {previewResults && (
                                        <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200">
                                            <div className="text-xs font-semibold text-blue-800 mb-2">🔍 Preview (teste com valores 1-6):</div>
                                            <div className="grid grid-cols-6 gap-2 text-xs">
                                                {previewResults.map((r: any, i: number) => (
                                                    <div key={i} className="text-center bg-blue-50 rounded p-1">
                                                        <div className="text-gray-600">{r.input}</div>
                                                        <div className="text-blue-700 font-bold">→ {r.output}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mín</label>
                                        <input type="number" value={editedFormula?.minValue || 0} onChange={(e) => handleFormulaChange('minValue', parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Máx</label>
                                        <input type="number" value={editedFormula?.maxValue || 100} onChange={(e) => handleFormulaChange('maxValue', parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Precisão</label>
                                        <input type="number" value={editedFormula?.precision || 0} onChange={(e) => handleFormulaChange('precision', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da Alteração *</label>
                                    <textarea value={saveReason} onChange={(e) => setSaveReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleSave} disabled={validationErrors.length > 0 || !saveReason.trim() || isSaving} className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300">
                                        {isSaving ? '⏳ Salvando...' : '💾 Salvar'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// CLASSIFICATIONS TAB
// ============================================
function ClassificationsTab() {
    const [classifications, setClassifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDimension, setSelectedDimension] = useState<string>('EXTRAVERSION');
    const [editingClassification, setEditingClassification] = useState<any>(null);
    const [editedValues, setEditedValues] = useState<any>(null);
    const [saveReason, setSaveReason] = useState('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const dimensionNames: Record<string, string> = {
        'EXTRAVERSION': 'Extroversão',
        'AGREEABLENESS': 'Amabilidade',
        'CONSCIENTIOUSNESS': 'Conscienciosidade',
        'OPENNESS': 'Abertura',
        'NEUROTICISM': 'Estabilidade Emocional'
    };

    const fetchClassifications = async () => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.get(
                `${API_URL}/calculation-engine/classifications`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setClassifications(response.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassifications();
    }, []);

    const validateClassification = (classif: any) => {
        const errors: string[] = [];
        if (classif.minScore < 0 || classif.minScore > 100) errors.push('Score mínimo deve estar entre 0 e 100');
        if (classif.maxScore < 0 || classif.maxScore > 100) errors.push('Score máximo deve estar entre 0 e 100');
        if (classif.minScore >= classif.maxScore) errors.push('Score mínimo deve ser menor que o máximo');
        if (!classif.label || classif.label.trim() === '') errors.push('Label não pode estar vazia');
        if (!classif.color || !classif.color.match(/^#[0-9A-F]{6}$/i)) errors.push('Cor deve estar no formato hexadecimal (#RRGGBB)');
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleEdit = (classif: any) => {
        setEditingClassification(classif);
        setEditedValues({ ...classif });
        validateClassification(classif);
    };

    const handleChange = (field: string, value: any) => {
        const updated = { ...editedValues, [field]: value };
        setEditedValues(updated);
        validateClassification(updated);
    };

    const handleSave = async () => {
        if (!validateClassification(editedValues)) {
            alert('Por favor, corrija os erros antes de salvar');
            return;
        }
        if (!saveReason.trim()) {
            alert('Por favor, informe o motivo da alteração');
            return;
        }

        setIsSaving(true);
        try {
            const token = useAuthStore.getState().token;
            await axios.put(
                `${API_URL}/calculation-engine/classifications/${editedValues.id}`,
                { ...editedValues, reason: saveReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('✅ Classificação atualizada com sucesso!');
            setEditingClassification(null);
            setSaveReason('');
            fetchClassifications();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar classificação');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>⏳ Carregando classificações...</div>;

    const dimClassifications = classifications
        .filter(c => c.dimension === selectedDimension)
        .sort((a, b) => a.priority - b.priority);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Classificações de Níveis</h2>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {Object.keys(dimensionNames).map((dim) => (
                    <button
                        key={dim}
                        onClick={() => setSelectedDimension(dim)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedDimension === dim ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {dimensionNames[dim]}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{dimensionNames[selectedDimension]}</h3>

                {/* VisualBar */}
                <div className="mb-6">
                    <div className="h-8 rounded-lg overflow-hidden flex">
                        {dimClassifications.map((classif) => {
                            const width = classif.maxScore - classif.minScore;
                            return (
                                <div
                                    key={classif.id}
                                    style={{ backgroundColor: classif.color, width: `${width}%` }}
                                    className="flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-80"
                                    onClick={() => handleEdit(classif)}
                                    title={`${classif.label}: ${classif.minScore}% - ${classif.maxScore}%`}
                                >
                                    {width > 10 && classif.label}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    {dimClassifications.map((classif) => (
                        <div key={classif.id} className={`p-4 rounded-lg border-2 transition-all ${editingClassification?.id === classif.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            {editingClassification?.id === classif.id ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                                            <input type="text" value={editedValues?.label || ''} onChange={(e) => handleChange('label', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                                            <div className="flex gap-2">
                                                <input type="color" value={editedValues?.color || '#000000'} onChange={(e) => handleChange('color', e.target.value)} className="h-10 w-16 rounded cursor-pointer" />
                                                <input type="text" value={editedValues?.color || ''} onChange={(e) => handleChange('color', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Score Mín (%)</label>
                                            <input type="number" min="0" max="100" value={editedValues?.minScore || 0} onChange={(e) => handleChange('minScore', parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Score Máx (%)</label>
                                            <input type="number" min="0" max="100" value={editedValues?.maxScore || 100} onChange={(e) => handleChange('maxScore', parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
                                        <textarea value={saveReason} onChange={(e) => setSaveReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} disabled={validationErrors.length > 0 || !saveReason.trim() || isSaving} className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300">
                                            {isSaving ? '⏳ Salvando...' : '💾 Salvar'}
                                        </button>
                                        <button onClick={() => { setEditingClassification(null); setSaveReason(''); setValidationErrors([]); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: classif.color }} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-gray-900">{classif.label}</span>
                                            <span className="text-sm text-gray-600">{classif.minScore}% - {classif.maxScore}%</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleEdit(classif)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">✏️ Editar</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// SIMULATOR TAB
// ============================================
function SimulatorTab() {
    const [simulationName, setSimulationName] = useState('');
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [activeStep, setActiveStep] = useState(0);
    const [inputMode, setInputMode] = useState<'manual' | 'random' | 'assessment'>('manual');
    const [assessmentId, setAssessmentId] = useState('');
    const [viewMode, setViewMode] = useState<'steps' | 'report'>('steps');

    const generateRandomResponses = () => {
        const random: Record<string, number> = {};
        for (let i = 1; i <= 126; i++) {
            random[i.toString()] = Math.floor(Math.random() * 6) + 1;
        }
        setResponses(random);
    };

    const loadFromAssessment = async () => {
        if (!assessmentId.trim()) {
            alert('Por favor, informe o ID do assessment');
            return;
        }
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.get(
                `${API_URL}/assessment/${assessmentId}/responses`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const loadedResponses: Record<string, number> = {};
            response.data.forEach((r: any, index: number) => {
                loadedResponses[(index + 1).toString()] = r.value;
            });
            setResponses(loadedResponses);
            alert(`✅ ${Object.keys(loadedResponses).length} respostas carregadas!`);
        } catch (error) {
            console.error('Erro ao carregar assessment:', error);
            alert('❌ Erro ao carregar assessment. Verifique o ID.');
        }
    };

    const runSimulation = async () => {
        if (!simulationName.trim()) {
            alert('Por favor, informe um nome para a simulação');
            return;
        }
        setIsRunning(true);
        setResults(null);
        setActiveStep(0);
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.post(
                `${API_URL}/calculation-engine/simulate`,
                { name: simulationName, inputs: responses },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResults(response.data);
            setViewMode('report'); // Automatically show report after simulation
            alert('✅ Simulação concluída com sucesso!');
        } catch (error) {
            console.error('Erro na simulação:', error);
            alert('❌ Erro ao executar simulação');
        } finally {
            setIsRunning(false);
        }
    };

    const resetSimulation = () => {
        setSimulationName('');
        setResponses({});
        setResults(null);
        setActiveStep(0);
        setViewMode('steps');
    };

    // Transform simulation results to report format
    const getReportData = () => {
        if (!results) return null;

        const scores = Object.entries(results.results.dimensions).map(([key, score]) => {
            const classification = results.results.classifications[key];
            return {
                key,
                name: getDimensionName(key),
                score: score as number,
                level: classification?.level || 'AVERAGE',
                interpretation: classification?.label || '',
                facets: [] // Simulator doesn't calculate facets yet
            };
        });

        return {
            calculatedScores: { scores }
        };
    };

    const getDimensionName = (key: string) => {
        const names: Record<string, string> = {
            'O': 'Abertura à Experiência',
            'C': 'Conscienciosidade',
            'E': 'Extroversão',
            'A': 'Amabilidade',
            'N': 'Estabilidade Emocional'
        };
        return names[key] || key;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">🧪 Simulador de Cálculo</h2>
                {results && (
                    <button onClick={resetSimulation} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">🔄 Nova Simulação</button>
                )}
            </div>

            {!results ? (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Simulação *</label>
                        <input type="text" value={simulationName} onChange={(e) => setSimulationName(e.target.value)} placeholder="Ex: Teste de Validação" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>

                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modo de Input de Respostas</h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <button onClick={() => setInputMode('manual')} className={`p-4 rounded-lg border-2 ${inputMode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>✍️ Manual</button>
                            <button onClick={() => { setInputMode('random'); generateRandomResponses(); }} className={`p-4 rounded-lg border-2 ${inputMode === 'random' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>🎲 Aleatório</button>
                            <button onClick={() => setInputMode('assessment')} className={`p-4 rounded-lg border-2 ${inputMode === 'assessment' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>📋 Assessment</button>
                        </div>
                        {inputMode === 'assessment' && (
                            <div className="flex gap-2">
                                <input type="text" value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} placeholder="ID do Assessment" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg" />
                                <button onClick={loadFromAssessment} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Carregar</button>
                            </div>
                        )}
                    </div>

                    {inputMode === 'manual' && (
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Respostas ({Object.keys(responses).length}/126)</h3>
                                <button onClick={generateRandomResponses} className="text-sm text-blue-600">Preencher Aleatório</button>
                            </div>
                            <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                                {Array.from({ length: 126 }, (_, i) => i + 1).map((qNum) => (
                                    <div key={qNum} className="flex flex-col items-center">
                                        <label className="text-xs text-gray-600 mb-1">Q{qNum}</label>
                                        <input type="number" min="1" max="6" value={responses[qNum.toString()] || ''} onChange={(e) => { const val = parseInt(e.target.value); if (val >= 1 && val <= 6) setResponses({ ...responses, [qNum.toString()]: val }); }} className="w-12 h-10 text-center border border-gray-300 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button onClick={runSimulation} disabled={isRunning || !simulationName.trim()} className="w-full px-6 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300">
                        {isRunning ? '⏳ Calculando...' : '🚀 Executar Simulação'}
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* View Mode Toggle */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 flex gap-2">
                        <button
                            onClick={() => setViewMode('report')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${viewMode === 'report' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            📊 Visualização do Relatório (Cliente)
                        </button>
                        <button
                            onClick={() => setViewMode('steps')}
                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${viewMode === 'steps' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            🔬 Passos do Cálculo (Debug)
                        </button>
                    </div>

                    {viewMode === 'report' ? (
                        <SimulatorReportView reportData={getReportData()} simulationName={simulationName} />
                    ) : (
                        <>
                            {/* Summary Header */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-3xl font-black mb-2">{results.name}</h3>
                                        <p className="text-slate-300">Análise Detalhada do Processo de Cálculo</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-slate-400 mb-1">ID da Simulação</div>
                                        <div className="text-xs font-mono bg-slate-700 px-3 py-1 rounded">{results.id}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mt-6">
                                    <div className="bg-slate-700/50 rounded-xl p-4 backdrop-blur">
                                        <div className="text-3xl font-black mb-1">{results.summary.totalQuestions}</div>
                                        <div className="text-xs text-slate-300">Questões Processadas</div>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-4 backdrop-blur">
                                        <div className="text-3xl font-black mb-1">{results.summary.reversedQuestions}</div>
                                        <div className="text-xs text-slate-300">Questões Reversas</div>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-4 backdrop-blur">
                                        <div className="text-3xl font-black mb-1">{results.summary.facetsCalculated}</div>
                                        <div className="text-xs text-slate-300">Facetas Calculadas</div>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-xl p-4 backdrop-blur">
                                        <div className="text-3xl font-black mb-1">{results.summary.dimensionsCalculated}</div>
                                        <div className="text-xs text-slate-300">Dimensões Finais</div>
                                    </div>
                                </div>
                            </div>

                            {/* Steps Navigation */}
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {results.steps.map((step: any, index: number) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveStep(index)}
                                            className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${activeStep === index
                                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === index ? 'bg-white text-blue-600' : 'bg-gray-300 text-gray-600'
                                                    }`}>
                                                    {step.step}
                                                </span>
                                                {step.name}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step Details - Modern View */}
                            <DebugStepView step={results.steps[activeStep]} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// DEBUG STEP VIEW (Modern Structured Display)
// ============================================
function DebugStepView({ step }: { step: any }) {
    const renderValue = (value: any, depth = 0): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">null</span>;
        }

        if (typeof value === 'boolean') {
            return <span className={value ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{value.toString()}</span>;
        }

        if (typeof value === 'number') {
            return <span className="text-blue-600 font-semibold">{value}</span>;
        }

        if (typeof value === 'string') {
            return <span className="text-gray-800">{value}</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-gray-400 italic">[]</span>;

            return (
                <div className="space-y-2 mt-2">
                    {value.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-500 font-semibold mb-2">Item {index + 1}</div>
                            {renderValue(item, depth + 1)}
                        </div>
                    ))}
                </div>
            );
        }

        if (typeof value === 'object') {
            return (
                <div className={`space-y-2 ${depth > 0 ? 'ml-4 mt-2' : ''}`}>
                    {Object.entries(value).map(([key, val]) => (
                        <div key={key} className={`${depth === 0 ? 'bg-white border border-gray-200 rounded-lg p-4' : 'bg-gray-50 rounded p-2'}`}>
                            <div className="flex items-start gap-3">
                                <span className="text-sm font-bold text-gray-700 min-w-[120px]">{key}:</span>
                                <div className="flex-1">{renderValue(val, depth + 1)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return <span className="text-gray-600">{String(value)}</span>;
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            {/* Step Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-black text-lg">
                        {step.step}
                    </div>
                    <h3 className="text-2xl font-black">{step.name}</h3>
                </div>
                {step.description && (
                    <p className="text-blue-100 mt-2 leading-relaxed">{step.description}</p>
                )}
                {step.formula && (
                    <div className="mt-4 bg-blue-700/30 rounded-lg p-4 backdrop-blur">
                        <div className="text-xs text-blue-200 font-semibold mb-2">📐 Fórmula Utilizada</div>
                        <div className="text-sm font-mono text-white">{step.formula.name}</div>
                        {step.formula.description && (
                            <div className="text-xs text-blue-100 mt-1">{step.formula.description}</div>
                        )}
                    </div>
                )}
            </div>

            {/* Step Content */}
            <div className="p-6">
                {/* Details */}
                {step.details && (
                    <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">📋</span>
                            Detalhes do Processamento
                        </h4>
                        {renderValue(step.details)}
                    </div>
                )}

                {/* Facets */}
                {step.facets && Object.keys(step.facets).length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">🎯</span>
                            Facetas Calculadas
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            {Object.entries(step.facets).map(([facetKey, facetData]: [string, any]) => (
                                <div key={facetKey} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                                    <div className="font-bold text-green-900 mb-2">{facetKey}</div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Score Final:</span>
                                            <span className="font-bold text-green-700">{facetData.finalScore}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Peso Total:</span>
                                            <span className="font-semibold">{facetData.totalWeight}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Questões:</span>
                                            <span className="font-semibold">{facetData.questions?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dimensions */}
                {step.dimensions && Object.keys(step.dimensions).length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">📊</span>
                            Dimensões Finais
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            {Object.entries(step.dimensions).map(([dimKey, dimData]: [string, any]) => (
                                <div key={dimKey} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                                    <div className="font-bold text-purple-900 mb-3">{dimKey}</div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600 text-sm">Score Médio:</span>
                                            <span className="text-2xl font-black text-purple-700">{dimData.average}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {dimData.count} faceta(s) • Soma: {dimData.sum}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Classifications */}
                {step.classifications && Object.keys(step.classifications).length > 0 && (
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">🏆</span>
                            Classificações Aplicadas
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            {Object.entries(step.classifications).map(([dimKey, classData]: [string, any]) => (
                                <div key={dimKey} className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-bold text-gray-900">{dimKey}</div>
                                        <div className="text-2xl font-black text-orange-600">{classData.score}</div>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-3 mb-3">
                                        <div className="text-xs text-orange-700 font-semibold mb-1">Classificação Selecionada:</div>
                                        <div className="font-bold text-orange-900">{classData.selected?.label}</div>
                                        <div className="text-xs text-orange-600 mt-1">{classData.selected?.level}</div>
                                    </div>
                                    {classData.ranges && (
                                        <div className="space-y-1">
                                            <div className="text-xs text-gray-500 font-semibold mb-2">Ranges Disponíveis:</div>
                                            {classData.ranges.map((range: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`text-xs p-2 rounded ${range.isMatch
                                                        ? 'bg-orange-100 border border-orange-300 font-semibold'
                                                        : 'bg-gray-50 text-gray-600'
                                                        }`}
                                                >
                                                    {range.label}: {range.min}-{range.max} {range.isMatch && '✓'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// SIMULATOR REPORT VIEW (Client Experience)
// ============================================
function SimulatorReportView({ reportData, simulationName }: { reportData: any; simulationName: string }) {
    if (!reportData) return <div>Nenhum dado disponível</div>;

    const scores = reportData.calculatedScores.scores;

    const getLevelLabel = (level: string) => {
        const map: Record<string, string> = {
            'VERY_HIGH': 'Muito Alto',
            'HIGH': 'Alto',
            'AVERAGE': 'Médio',
            'LOW': 'Baixo',
            'VERY_LOW': 'Muito Baixo'
        };
        return map[level] || level;
    };

    const getLevelColor = (level: string) => {
        const map: Record<string, string> = {
            'VERY_HIGH': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'HIGH': 'bg-blue-100 text-blue-700 border-blue-200',
            'AVERAGE': 'bg-gray-100 text-gray-700 border-gray-200',
            'LOW': 'bg-orange-100 text-orange-700 border-orange-200',
            'VERY_LOW': 'bg-red-100 text-red-700 border-red-200'
        };
        return map[level] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const getTraitColor = (key: string) => {
        const colors: Record<string, string> = {
            'O': 'from-yellow-500 to-amber-600',
            'C': 'from-blue-500 to-indigo-600',
            'E': 'from-orange-500 to-red-600',
            'A': 'from-green-500 to-emerald-600',
            'N': 'from-purple-500 to-pink-600'
        };
        return colors[key] || 'from-gray-500 to-gray-600';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header - Client View */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-2xl text-white p-8 md:p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black opacity-10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-sm font-bold uppercase tracking-wider mb-6">
                        🧪 Simulação de Teste
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Relatório PINC</h1>
                    <p className="text-blue-100 text-xl opacity-90">Análise de Perfil Comportamental • {simulationName}</p>
                </div>
            </div>

            {/* Scores Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scores.map((trait: any) => (
                    <div key={trait.key} className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                        {/* Gradient Header */}
                        <div className={`h-2 bg-gradient-to-r ${getTraitColor(trait.key)}`}></div>

                        <div className="p-6">
                            {/* Score Display */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{trait.name}</h3>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getLevelColor(trait.level)}`}>
                                        {getLevelLabel(trait.level)}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-gray-900">{trait.score}</div>
                                    <div className="text-xs text-gray-500">de 100</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                                <div
                                    className={`h-full bg-gradient-to-r ${getTraitColor(trait.key)} transition-all duration-1000 ease-out`}
                                    style={{ width: `${trait.score}%` }}
                                ></div>
                            </div>

                            {/* Interpretation */}
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {trait.interpretation || 'Interpretação detalhada será exibida aqui baseada no nível calculado.'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                        ✨
                    </span>
                    Resumo da Simulação
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="text-3xl font-black text-blue-600 mb-2">{scores.length}</div>
                        <div className="text-sm text-gray-600">Dimensões Avaliadas</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="text-3xl font-black text-green-600 mb-2">
                            {scores.filter((s: any) => s.level === 'HIGH' || s.level === 'VERY_HIGH').length}
                        </div>
                        <div className="text-sm text-gray-600">Pontos Fortes</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="text-3xl font-black text-orange-600 mb-2">
                            {scores.filter((s: any) => s.level === 'LOW' || s.level === 'VERY_LOW').length}
                        </div>
                        <div className="text-sm text-gray-600">Áreas de Desenvolvimento</div>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <div className="text-3xl">ℹ️</div>
                    <div>
                        <h3 className="font-bold text-blue-900 mb-2">Visualização de Cliente</h3>
                        <p className="text-blue-800 text-sm leading-relaxed">
                            Esta é a visualização que seus clientes verão ao acessar o relatório.
                            Use esta tela para validar a apresentação dos dados, cores, textos e layout geral do relatório.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// AUDIT TAB
// ============================================
function AuditTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = useAuthStore.getState().token;
                const response = await axios.get(
                    `${API_URL}/calculation-engine/audit`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setLogs(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <div>⏳ Carregando auditoria...</div>;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Histórico de Mudanças</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.entityType}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' : log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{log.action}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.user?.name || 'Sistema'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

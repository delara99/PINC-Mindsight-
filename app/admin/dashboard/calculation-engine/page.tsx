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
    const [selectedDimension, setSelectedDimension] = useState<string>('EXTRAVERSION');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [saveReason, setSaveReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const dimensionNames: Record<string, string> = {
        'EXTRAVERSION': 'Extroversão',
        'AGREEABLENESS': 'Amabilidade',
        'CONSCIENTIOUSNESS': 'Conscienciosidade',
        'OPENNESS': 'Abertura',
        'NEUROTICISM': 'Neuroticismo'
    };

    const fetchMappings = async () => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.get(
                `${API_URL}/calculation-engine/question-mappings`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMappings(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar mapeamentos:', error);
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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Mapeamento de Questões</h2>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {['EXTRAVERSION', 'AGREEABLENESS', 'CONSCIENTIOUSNESS', 'OPENNESS', 'NEUROTICISM'].map((dim) => (
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
            const results = testValues.map(val => {
                let result = val;
                if (formula.name.includes('NORMALIZATION')) {
                    result = Math.round(((val - 1) / 5) * 100);
                } else if (formula.name.includes('REVERSE')) {
                    result = 7 - val;
                }
                return { input: val, output: result };
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
        'NEUROTICISM': 'Neuroticismo'
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
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{results.name}</h3>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            <div className="bg-gray-50 p-4 rounded text-center"><div className="text-xl font-bold">{results.summary.totalQuestions}</div><div className="text-xs">Questões</div></div>
                            <div className="bg-gray-50 p-4 rounded text-center"><div className="text-xl font-bold">{results.summary.facetsCalculated}</div><div className="text-xs">Facetas</div></div>
                            <div className="bg-gray-50 p-4 rounded text-center"><div className="text-xl font-bold">{results.summary.dimensionsCalculated}</div><div className="text-xs">Dimensões</div></div>
                        </div>
                    </div>
                    {/* Steps Navigation */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 flex gap-2 overflow-x-auto">
                        {results.steps.map((step: any, index: number) => (
                            <button key={index} onClick={() => setActiveStep(index)} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeStep === index ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                {step.step}. {step.name}
                            </button>
                        ))}
                    </div>
                    {/* Step Details */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-xl font-bold mb-2">{results.steps[activeStep].name}</h3>
                        <p className="text-gray-600 mb-4">{results.steps[activeStep].description}</p>
                        <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">{JSON.stringify(results.steps[activeStep], null, 2)}</pre>
                    </div>
                </div>
            )}
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

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function CalculationEnginePage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [documentation, setDocumentation] = useState<any>(null);
    const [formulas, setFormulas] = useState<any[]>([]);
    const [classifications, setClassifications] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [docRes, formulasRes, classifRes, auditRes] = await Promise.all([
                axios.get(`${API_URL}/calculation-engine/documentation`, { headers }),
                axios.get(`${API_URL}/calculation-engine/formulas`, { headers }),
                axios.get(`${API_URL}/calculation-engine/classifications`, { headers }),
                axios.get(`${API_URL}/calculation-engine/audit`, { headers })
            ]);

            setDocumentation(docRes.data);
            setFormulas(formulasRes.data);
            setClassifications(classifRes.data);
            setAuditLogs(auditRes.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando Motor de Cálculo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                ⚙️ Motor de Cálculo PINC
                            </h1>
                            <p className="text-gray-600">
                                Sistema de cálculo de scores psicométricos baseado no Big Five (OCEAN)
                            </p>
                            {documentation && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Versão {documentation.overview.version}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => window.location.href = `${API_URL}/calculation-engine/export`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            📥 Exportar Configuração
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {[
                                { id: 'overview', label: '📊 Visão Geral', icon: '📊' },
                                { id: 'formulas', label: '📐 Fórmulas', icon: '📐' },
                                { id: 'classifications', label: '📈 Classificações', icon: '📈' },
                                { id: 'simulator', label: '🧪 Simulador', icon: '🧪' },
                                { id: 'audit', label: '📝 Auditoria', icon: '📝' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <OverviewTab documentation={documentation} />
                        )}
                        {activeTab === 'formulas' && (
                            <FormulasTab formulas={formulas} onUpdate={loadData} />
                        )}
                        {activeTab === 'classifications' && (
                            <ClassificationsTab classifications={classifications} onUpdate={loadData} />
                        )}
                        {activeTab === 'simulator' && (
                            <SimulatorTab />
                        )}
                        {activeTab === 'audit' && (
                            <AuditTab logs={auditLogs} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// OVERVIEW TAB
// ============================================
function OverviewTab({ documentation }: { documentation: any }) {
    if (!documentation) return <div>Carregando...</div>;

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
// FORMULAS TAB
// ============================================
function FormulasTab({ formulas, onUpdate }: { formulas: any[], onUpdate: () => void }) {
    const [selectedFormula, setSelectedFormula] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedFormula, setEditedFormula] = useState<any>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [previewResults, setPreviewResults] = useState<any>(null);
    const [saveReason, setSaveReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (selectedFormula && isEditing) {
            setEditedFormula({ ...selectedFormula });
            validateFormula(selectedFormula);
        }
    }, [selectedFormula, isEditing]);

    const validateFormula = (formula: any) => {
        const errors: string[] = [];

        // Validação básica
        if (!formula.formula) {
            errors.push('Fórmula não pode estar vazia');
        }

        if (formula.minValue !== undefined && formula.maxValue !== undefined) {
            if (formula.minValue >= formula.maxValue) {
                errors.push('Valor mínimo deve ser menor que o máximo');
            }
        }

        if (formula.precision < 0 || formula.precision > 10) {
            errors.push('Precisão deve estar entre 0 e 10');
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleFormulaChange = (field: string, value: any) => {
        const updated = { ...editedFormula, [field]: value };
        setEditedFormula(updated);
        validateFormula(updated);

        // Preview em tempo real
        if (field === 'formula' || field === 'minValue' || field === 'maxValue') {
            generatePreview(updated);
        }
    };

    const generatePreview = (formula: any) => {
        try {
            // Simular alguns valores de teste
            const testValues = [1, 2, 3, 4, 5, 6];
            const results = testValues.map(val => {
                let result = val;

                // Aplicar fórmula baseada no tipo
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
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/calculation-engine/formulas/${editedFormula.id}`,
                { ...editedFormula, reason: saveReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('✅ Fórmula atualizada com sucesso!');
            setIsEditing(false);
            setSaveReason('');
            onUpdate();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar fórmula');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Fórmulas de Cálculo</h2>
                <span className="text-sm text-gray-500">{formulas.length} fórmulas ativas</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de Fórmulas */}
                <div className="space-y-4">
                    {formulas.map((formula) => (
                        <div
                            key={formula.id}
                            onClick={() => {
                                setSelectedFormula(formula);
                                setIsEditing(false);
                            }}
                            className={`
                                bg-white rounded-lg p-4 border-2 cursor-pointer transition-all
                                ${selectedFormula?.id === formula.id
                                    ? 'border-blue-500 shadow-md'
                                    : 'border-gray-200 hover:border-blue-300'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        {formula.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Tipo: {formula.type}
                                    </p>
                                    <div className="bg-gray-50 rounded p-2">
                                        <code className="text-xs text-gray-700">
                                            {formula.formula.formula || JSON.stringify(formula.formula)}
                                        </code>
                                    </div>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    v{formula.version}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Editor/Detalhes da Fórmula */}
                {selectedFormula && (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {isEditing ? '✏️ Editando' : '📋 Visualizando'}: {selectedFormula.name}
                            </h3>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-3 py-1 text-white text-sm rounded transition-colors ${isEditing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isEditing ? '❌ Cancelar' : '✏️ Editar'}
                            </button>
                        </div>

                        {!isEditing ? (
                            // Modo Visualização
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descrição
                                    </label>
                                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                                        {selectedFormula.description}
                                    </div>
                                </div>

                                {selectedFormula.example && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Exemplo
                                        </label>
                                        <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap border border-green-200">
                                            {selectedFormula.example}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mín
                                        </label>
                                        <div className="bg-gray-50 rounded p-2 text-center font-mono">
                                            {selectedFormula.minValue}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Máx
                                        </label>
                                        <div className="bg-gray-50 rounded p-2 text-center font-mono">
                                            {selectedFormula.maxValue}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Precisão
                                        </label>
                                        <div className="bg-gray-50 rounded p-2 text-center font-mono">
                                            {selectedFormula.precision} casas
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Modo Edição
                            <div className="space-y-6">
                                {/* Validação em tempo real */}
                                {validationErrors.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-red-800 mb-2">
                                            ⚠️ Erros de Validação:
                                        </h4>
                                        <ul className="list-disc list-inside text-sm text-red-700">
                                            {validationErrors.map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Descrição */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={editedFormula?.description || ''}
                                        onChange={(e) => handleFormulaChange('description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                    />
                                </div>

                                {/* Exemplo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Exemplo
                                    </label>
                                    <textarea
                                        value={editedFormula?.example || ''}
                                        onChange={(e) => handleFormulaChange('example', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>

                                {/* Valores Min/Max/Precisão */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Valor Mínimo
                                        </label>
                                        <input
                                            type="number"
                                            value={editedFormula?.minValue || 0}
                                            onChange={(e) => handleFormulaChange('minValue', parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Valor Máximo
                                        </label>
                                        <input
                                            type="number"
                                            value={editedFormula?.maxValue || 100}
                                            onChange={(e) => handleFormulaChange('maxValue', parseFloat(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Precisão (casas)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={editedFormula?.precision || 0}
                                            onChange={(e) => handleFormulaChange('precision', parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Preview de Resultados */}
                                {previewResults && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-blue-900 mb-3">
                                            🔍 Preview de Resultados
                                        </h4>
                                        <div className="grid grid-cols-6 gap-2">
                                            {previewResults.map((result: any, idx: number) => (
                                                <div key={idx} className="bg-white rounded p-2 text-center">
                                                    <div className="text-xs text-gray-600">Input</div>
                                                    <div className="font-bold text-gray-900">{result.input}</div>
                                                    <div className="text-xs text-blue-600 mt-1">↓</div>
                                                    <div className="font-bold text-blue-600">{result.output}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Motivo da Alteração */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Motivo da Alteração *
                                    </label>
                                    <textarea
                                        value={saveReason}
                                        onChange={(e) => setSaveReason(e.target.value)}
                                        placeholder="Descreva o motivo desta alteração para auditoria..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={2}
                                    />
                                </div>

                                {/* Botões de Ação */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={validationErrors.length > 0 || !saveReason.trim() || isSaving}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${validationErrors.length > 0 || !saveReason.trim() || isSaving
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {isSaving ? '⏳ Salvando...' : '💾 Salvar Alterações'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setSaveReason('');
                                            setValidationErrors([]);
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancelar
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
function ClassificationsTab({ classifications, onUpdate }: { classifications: any[], onUpdate: () => void }) {
    const dimensions = ['EXTRAVERSION', 'AGREEABLENESS', 'CONSCIENTIOUSNESS', 'OPENNESS', 'NEUROTICISM'];
    const dimensionNames: Record<string, string> = {
        'EXTRAVERSION': 'Extroversão',
        'AGREEABLENESS': 'Amabilidade',
        'CONSCIENTIOUSNESS': 'Conscienciosidade',
        'OPENNESS': 'Abertura',
        'NEUROTICISM': 'Neuroticismo'
    };

    const [selectedDimension, setSelectedDimension] = useState<string>('EXTRAVERSION');
    const [editingClassification, setEditingClassification] = useState<any>(null);
    const [editedValues, setEditedValues] = useState<any>(null);
    const [saveReason, setSaveReason] = useState('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const validateClassification = (classif: any) => {
        const errors: string[] = [];

        if (classif.minScore < 0 || classif.minScore > 100) {
            errors.push('Score mínimo deve estar entre 0 e 100');
        }

        if (classif.maxScore < 0 || classif.maxScore > 100) {
            errors.push('Score máximo deve estar entre 0 e 100');
        }

        if (classif.minScore >= classif.maxScore) {
            errors.push('Score mínimo deve ser menor que o máximo');
        }

        if (!classif.label || classif.label.trim() === '') {
            errors.push('Label não pode estar vazia');
        }

        if (!classif.color || !classif.color.match(/^#[0-9A-F]{6}$/i)) {
            errors.push('Cor deve estar no formato hexadecimal (#RRGGBB)');
        }

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
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/calculation-engine/classifications/${editedValues.id}`,
                { ...editedValues, reason: saveReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('✅ Classificação atualizada com sucesso!');
            setEditingClassification(null);
            setSaveReason('');
            onUpdate();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar classificação');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Classificações de Níveis</h2>

            {/* Seletor de Dimensão */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {dimensions.map((dim) => (
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

            {/* Classificações da Dimensão Selecionada */}
            {(() => {
                const dimClassifications = classifications
                    .filter(c => c.dimension === selectedDimension)
                    .sort((a, b) => a.priority - b.priority);

                return (
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {dimensionNames[selectedDimension]}
                        </h3>

                        {/* Visualização Geral */}
                        <div className="mb-6">
                            <div className="h-8 rounded-lg overflow-hidden flex">
                                {dimClassifications.map((classif) => {
                                    const width = classif.maxScore - classif.minScore;
                                    return (
                                        <div
                                            key={classif.id}
                                            style={{
                                                backgroundColor: classif.color,
                                                width: `${width}%`
                                            }}
                                            className="flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => handleEdit(classif)}
                                            title={`${classif.label}: ${classif.minScore}% - ${classif.maxScore}%`}
                                        >
                                            {width > 10 && classif.label}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        {/* Lista Detalhada */}
                        <div className="space-y-3">
                            {dimClassifications.map((classif) => (
                                <div
                                    key={classif.id}
                                    className={`p-4 rounded-lg border-2 transition-all ${editingClassification?.id === classif.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {editingClassification?.id === classif.id ? (
                                        // Modo Edição
                                        <div className="space-y-4">
                                            {/* Erros de Validação */}
                                            {validationErrors.length > 0 && (
                                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                                    <h4 className="text-sm font-semibold text-red-800 mb-1">
                                                        ⚠️ Erros:
                                                    </h4>
                                                    <ul className="list-disc list-inside text-xs text-red-700">
                                                        {validationErrors.map((error, idx) => (
                                                            <li key={idx}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Label */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Label
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editedValues?.label || ''}
                                                        onChange={(e) => handleChange('label', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                {/* Cor */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Cor
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={editedValues?.color || '#000000'}
                                                            onChange={(e) => handleChange('color', e.target.value)}
                                                            className="h-10 w-16 rounded cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editedValues?.color || ''}
                                                            onChange={(e) => handleChange('color', e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                                            placeholder="#000000"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Score Mínimo */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Score Mínimo (%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={editedValues?.minScore || 0}
                                                        onChange={(e) => handleChange('minScore', parseFloat(e.target.value))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                {/* Score Máximo */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Score Máximo (%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={editedValues?.maxScore || 100}
                                                        onChange={(e) => handleChange('maxScore', parseFloat(e.target.value))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Descrição */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Descrição
                                                </label>
                                                <textarea
                                                    value={editedValues?.description || ''}
                                                    onChange={(e) => handleChange('description', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    rows={2}
                                                />
                                            </div>

                                            {/* Preview */}
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="text-xs text-gray-600 mb-2">Preview:</div>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-6 h-6 rounded"
                                                        style={{ backgroundColor: editedValues?.color }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {editedValues?.label}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {editedValues?.minScore}% - {editedValues?.maxScore}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Motivo */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Motivo da Alteração *
                                                </label>
                                                <textarea
                                                    value={saveReason}
                                                    onChange={(e) => setSaveReason(e.target.value)}
                                                    placeholder="Descreva o motivo desta alteração..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    rows={2}
                                                />
                                            </div>

                                            {/* Botões */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={validationErrors.length > 0 || !saveReason.trim() || isSaving}
                                                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${validationErrors.length > 0 || !saveReason.trim() || isSaving
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-green-600 text-white hover:bg-green-700'
                                                        }`}
                                                >
                                                    {isSaving ? '⏳ Salvando...' : '💾 Salvar'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingClassification(null);
                                                        setSaveReason('');
                                                        setValidationErrors([]);
                                                    }}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Modo Visualização
                                        <div className="flex items-center space-x-4">
                                            <div
                                                className="w-4 h-4 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: classif.color }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-900">
                                                        {classif.label}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {classif.minScore}% - {classif.maxScore}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            backgroundColor: classif.color,
                                                            width: `${classif.maxScore - classif.minScore}%`,
                                                            marginLeft: `${classif.minScore}%`
                                                        }}
                                                    />
                                                </div>
                                                {classif.description && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {classif.description}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleEdit(classif)}
                                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                                ✏️ Editar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}
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

    // Gerar respostas aleatórias
    const generateRandomResponses = () => {
        const random: Record<string, number> = {};
        for (let i = 1; i <= 126; i++) {
            random[i.toString()] = Math.floor(Math.random() * 6) + 1;
        }
        setResponses(random);
    };

    // Carregar de um assessment existente
    const loadFromAssessment = async () => {
        if (!assessmentId.trim()) {
            alert('Por favor, informe o ID do assessment');
            return;
        }

        try {
            const token = localStorage.getItem('token');
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

    // Executar simulação
    const runSimulation = async () => {
        if (!simulationName.trim()) {
            alert('Por favor, informe um nome para a simulação');
            return;
        }

        const responseCount = Object.keys(responses).length;
        if (responseCount < 126) {
            const confirm = window.confirm(
                `Você preencheu apenas ${responseCount}/126 questões. Deseja continuar mesmo assim?`
            );
            if (!confirm) return;
        }

        setIsRunning(true);
        setResults(null);
        setActiveStep(0);

        try {
            const token = localStorage.getItem('token');
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

    // Resetar simulação
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
                    <button
                        onClick={resetSimulation}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        🔄 Nova Simulação
                    </button>
                )}
            </div>

            {!results ? (
                // CONFIGURAÇÃO DA SIMULAÇÃO
                <div className="space-y-6">
                    {/* Nome da Simulação */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome da Simulação *
                        </label>
                        <input
                            type="text"
                            value={simulationName}
                            onChange={(e) => setSimulationName(e.target.value)}
                            placeholder="Ex: Teste de Validação - 23/01/2026"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Modo de Input */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Modo de Input de Respostas
                        </h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <button
                                onClick={() => setInputMode('manual')}
                                className={`p-4 rounded-lg border-2 transition-all ${inputMode === 'manual'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-3xl mb-2">✍️</div>
                                <div className="font-semibold">Manual</div>
                                <div className="text-xs text-gray-600">Preencher manualmente</div>
                            </button>
                            <button
                                onClick={() => {
                                    setInputMode('random');
                                    generateRandomResponses();
                                }}
                                className={`p-4 rounded-lg border-2 transition-all ${inputMode === 'random'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-3xl mb-2">🎲</div>
                                <div className="font-semibold">Aleatório</div>
                                <div className="text-xs text-gray-600">Gerar automaticamente</div>
                            </button>
                            <button
                                onClick={() => setInputMode('assessment')}
                                className={`p-4 rounded-lg border-2 transition-all ${inputMode === 'assessment'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-3xl mb-2">📋</div>
                                <div className="font-semibold">Assessment</div>
                                <div className="text-xs text-gray-600">Carregar existente</div>
                            </button>
                        </div>

                        {inputMode === 'assessment' && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={assessmentId}
                                    onChange={(e) => setAssessmentId(e.target.value)}
                                    placeholder="ID do Assessment"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                />
                                <button
                                    onClick={loadFromAssessment}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Carregar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Grid de Respostas */}
                    {inputMode === 'manual' && (
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Respostas ({Object.keys(responses).length}/126)
                                </h3>
                                <button
                                    onClick={generateRandomResponses}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Preencher com valores aleatórios
                                </button>
                            </div>
                            <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                                {Array.from({ length: 126 }, (_, i) => i + 1).map((qNum) => (
                                    <div key={qNum} className="flex flex-col items-center">
                                        <label className="text-xs text-gray-600 mb-1">Q{qNum}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="6"
                                            value={responses[qNum.toString()] || ''}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val >= 1 && val <= 6) {
                                                    setResponses({ ...responses, [qNum.toString()]: val });
                                                }
                                            }}
                                            className="w-12 h-10 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resumo e Botão de Execução */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Pronto para Simular?
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {Object.keys(responses).length} questões preenchidas
                                    {Object.keys(responses).length < 126 && (
                                        <span className="text-orange-600 ml-2">
                                            ⚠️ Faltam {126 - Object.keys(responses).length} questões
                                        </span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={runSimulation}
                                disabled={isRunning || !simulationName.trim()}
                                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${isRunning || !simulationName.trim()
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {isRunning ? '⏳ Calculando...' : '🚀 Executar Simulação'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // RESULTADOS DA SIMULAÇÃO
                <div className="space-y-6">
                    {/* Header dos Resultados */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{results.name}</h3>
                                <p className="text-sm text-gray-600">
                                    Simulação ID: {results.id} | {new Date(results.createdAt).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-4">
                                <div className="text-2xl font-bold text-blue-600">
                                    {results.summary.totalQuestions}
                                </div>
                                <div className="text-sm text-gray-600">Questões</div>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <div className="text-2xl font-bold text-purple-600">
                                    {results.summary.reversedQuestions}
                                </div>
                                <div className="text-sm text-gray-600">Reversas</div>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <div className="text-2xl font-bold text-orange-600">
                                    {results.summary.facetsCalculated}
                                </div>
                                <div className="text-sm text-gray-600">Facetas</div>
                            </div>
                            <div className="bg-white rounded-lg p-4">
                                <div className="text-2xl font-bold text-green-600">
                                    {results.summary.dimensionsCalculated}
                                </div>
                                <div className="text-sm text-gray-600">Dimensões</div>
                            </div>
                        </div>
                    </div>

                    {/* Navegação de Passos */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex gap-2 overflow-x-auto">
                            {results.steps.map((step: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveStep(index)}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeStep === index
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {step.step}. {step.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detalhes do Passo Ativo */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        {(() => {
                            const step = results.steps[activeStep];
                            return (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Passo {step.step}: {step.name}
                                    </h3>
                                    <p className="text-gray-600 mb-4">{step.description}</p>

                                    {step.formula && (
                                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                                            <div className="text-sm font-semibold text-blue-900 mb-2">
                                                📐 Fórmula Utilizada:
                                            </div>
                                            <div className="font-mono text-sm text-gray-700">
                                                {step.formula.name}
                                            </div>
                                        </div>
                                    )}

                                    {/* Renderizar detalhes específicos de cada passo */}
                                    {step.details && (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {step.details.slice(0, 20).map((detail: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                                                    <span className="text-sm font-mono text-gray-600">
                                                        Q{detail.questionId}
                                                    </span>
                                                    {detail.isReversed ? (
                                                        <>
                                                            <span className="text-sm">{detail.original}</span>
                                                            <span className="text-blue-600">→</span>
                                                            <span className="text-sm font-bold text-blue-600">
                                                                {detail.reversed}
                                                            </span>
                                                            <span className="text-xs text-gray-500">(reversa)</span>
                                                        </>
                                                    ) : detail.normalized !== undefined ? (
                                                        <>
                                                            <span className="text-sm">{detail.input}</span>
                                                            <span className="text-green-600">→</span>
                                                            <span className="text-sm font-bold text-green-600">
                                                                {detail.normalized}%
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm">{detail.value}</span>
                                                    )}
                                                </div>
                                            ))}
                                            {step.details.length > 20 && (
                                                <div className="text-center text-sm text-gray-500 py-2">
                                                    ... e mais {step.details.length - 20} questões
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {step.facets && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(step.facets).map(([key, data]: [string, any]) => (
                                                <div key={key} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="font-semibold text-gray-900 mb-2">{key}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {data.questions.length} questões | Peso total: {data.totalWeight}
                                                    </div>
                                                    <div className="text-2xl font-bold text-blue-600 mt-2">
                                                        {data.finalScore}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {step.dimensions && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(step.dimensions).map(([key, data]: [string, any]) => (
                                                <div key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                                    <div className="text-lg font-bold text-gray-900 mb-2">{key}</div>
                                                    <div className="text-sm text-gray-600 mb-2">
                                                        {data.count} facetas | Soma: {data.sum}
                                                    </div>
                                                    <div className="text-3xl font-bold text-blue-600">
                                                        {data.average}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {step.classifications && (
                                        <div className="space-y-4">
                                            {Object.entries(step.classifications).map(([key, data]: [string, any]) => (
                                                <div key={key} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="text-lg font-bold text-gray-900">{key}</div>
                                                        <div className="text-2xl font-bold" style={{ color: data.selected.color }}>
                                                            {data.score}%
                                                        </div>
                                                    </div>
                                                    <div className="h-8 rounded-lg overflow-hidden flex mb-2">
                                                        {data.ranges.map((range: any, idx: number) => {
                                                            const width = range.max - range.min;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    style={{
                                                                        width: `${width}%`,
                                                                        backgroundColor: range.isMatch ? data.selected.color : '#e5e7eb',
                                                                        opacity: range.isMatch ? 1 : 0.3
                                                                    }}
                                                                    className="flex items-center justify-center text-xs font-semibold text-white"
                                                                >
                                                                    {range.isMatch && range.label}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div
                                                        className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white"
                                                        style={{ backgroundColor: data.selected.color }}
                                                    >
                                                        {data.selected.label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Resultados Finais */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Resultados Finais</h3>
                        <div className="grid grid-cols-5 gap-4">
                            {Object.entries(results.results.dimensions).map(([dim, score]: [string, any]) => {
                                const classif = results.results.classifications[dim];
                                return (
                                    <div key={dim} className="bg-white rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold mb-1">{dim}</div>
                                        <div className="text-3xl font-bold mb-2" style={{ color: classif?.color }}>
                                            {score}%
                                        </div>
                                        <div
                                            className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                                            style={{ backgroundColor: classif?.color }}
                                        >
                                            {classif?.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// AUDIT TAB
// ============================================
function AuditTab({ logs }: { logs: any[] }) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Histórico de Mudanças</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Data
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Ação
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Usuário
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {log.entityType}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {log.user?.name || 'Sistema'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

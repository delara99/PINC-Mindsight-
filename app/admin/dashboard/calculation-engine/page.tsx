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
                            onClick={() => setSelectedFormula(formula)}
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

                {/* Detalhes da Fórmula */}
                {selectedFormula && (
                    <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                {selectedFormula.name}
                            </h3>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                                {isEditing ? '❌ Cancelar' : '✏️ Editar'}
                            </button>
                        </div>

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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Classificações de Níveis</h2>

            {dimensions.map((dim) => {
                const dimClassifications = classifications.filter(c => c.dimension === dim);
                return (
                    <div key={dim} className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {dimensionNames[dim]}
                        </h3>
                        <div className="space-y-3">
                            {dimClassifications.map((classif) => (
                                <div key={classif.id} className="flex items-center space-x-4">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: classif.color }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900">
                                                {classif.label}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {classif.minScore}% - {classif.maxScore}%
                                            </span>
                                        </div>
                                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    backgroundColor: classif.color,
                                                    width: `${classif.maxScore - classif.minScore}%`,
                                                    marginLeft: `${classif.minScore}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// SIMULATOR TAB
// ============================================
function SimulatorTab() {
    return (
        <div className="text-center py-12">
            <div className="text-6xl mb-4">🧪</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Simulador de Cálculo</h2>
            <p className="text-gray-600 mb-6">
                Em desenvolvimento - Permite testar cálculos com diferentes inputs
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Criar Nova Simulação
            </button>
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

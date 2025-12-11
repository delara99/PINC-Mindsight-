'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useState } from 'react';
import { Brain, Copy, Eye, Loader2, CheckCircle, Sparkles, FileText, AlertCircle } from 'lucide-react';

interface Template {
    id: string;
    title: string;
    description: string;
    type: string;
    questionCount: number;
    isTemplate: boolean;
}

export default function AssessmentTemplatesPage() {
    const token = useAuthStore((state) => state.token);
    const queryClient = useQueryClient();
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [customTitle, setCustomTitle] = useState('');

    // Buscar templates
    const { data: templates, isLoading } = useQuery<Template[]>({
        queryKey: ['assessment-templates'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/assessments/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao carregar templates');
            return response.json();
        }
    });

    // Mutation para clonar template
    const cloneMutation = useMutation({
        mutationFn: async (data: { templateId: string; title?: string }) => {
            const response = await fetch(`http://localhost:3000/api/v1/assessments/templates/${data.templateId}/clone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title: data.title })
            });
            if (!response.ok) throw new Error('Erro ao clonar template');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assessments'] });
            setSelectedTemplate(null);
            setCustomTitle('');
            alert('Inventário clonado com sucesso! Agora você pode atribuí-lo a clientes.');
        }
    });

    const handleClone = (templateId: string) => {
        if (customTitle && customTitle.trim() === '') {
            alert('Digite um título para o inventário');
            return;
        }
        cloneMutation.mutate({ templateId, title: customTitle || undefined });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Templates de Inventários</h1>
                <p className="text-gray-500 mt-1">
                    Clone inventários pré-configurados para usar com seus clientes
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-primary" />
                </div>
            ) : templates?.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
                    <Brain className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Nenhum template disponível
                    </h3>
                    <p className="text-gray-500">
                        Templates serão adicionados em breve.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates?.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-pink-600 rounded-xl flex items-center justify-center">
                                        {template.type === 'BIG_FIVE' ? (
                                            <Sparkles className="text-white" size={24} />
                                        ) : (
                                            <Brain className="text-white" size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase">
                                            {template.type === 'BIG_FIVE' ? 'Big Five' : template.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                    Template
                                </div>
                            </div>

                            {/* Título */}
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                {template.title}
                            </h3>

                            {/* Descrição */}
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[60px]">
                                {template.description}
                            </p>

                            {/* Info */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                <FileText size={14} />
                                <span>{template.questionCount} perguntas</span>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.open(`/dashboard/assessments/templates/${template.id}`, '_blank')}
                                    className="flex-1 py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-semibold text-gray-700"
                                >
                                    <Eye size={16} />
                                    Visualizar
                                </button>
                                <button
                                    onClick={() => setSelectedTemplate(template.id)}
                                    className="flex-1 py-2 px-3 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/20"
                                >
                                    <Copy size={16} />
                                    Clonar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Clonagem */}
            {selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="bg-primary p-6 rounded-t-2xl">
                            <h2 className="text-2xl font-bold text-white">Clonar Inventário</h2>
                            <p className="text-white/80 text-sm mt-1">
                                Personalize o título (opcional)
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Título do Inventário
                                </label>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder="Deixe vazio para usar título original"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Se deixar vazio, será usado o título original do template
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                                <p className="text-sm text-blue-800">
                                    O inventário será copiado para seu tenant. Você poderá atribuí-lo a clientes normalmente.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setSelectedTemplate(null);
                                        setCustomTitle('');
                                    }}
                                    disabled={cloneMutation.isPending}
                                    className="flex-1 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleClone(selectedTemplate)}
                                    disabled={cloneMutation.isPending}
                                    className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {cloneMutation.isPending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Clonando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={18} />
                                            Confirmar Clonagem
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';
import { useState } from 'react';
import { Plus, Save, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/auth-store';

const TRAIT_MAPPING: Record<string, string> = {
    'Extroversão': 'EXTRAVERSION',
    'Amabilidade': 'AGREEABLENESS',
    'Conscienciosidade': 'CONSCIENTIOUSNESS',
    'Neuroticismo': 'NEUROTICISM',
    'Abertura': 'OPENNESS',
};

export default function CreateAssessmentPage() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const [isLoading, setIsLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState([
        { id: 1, text: 'Eu me sinto confortável perto das pessoas.', trait: 'Extroversão', invert: false },
        { id: 2, text: 'Tenho pouca preocupação com os outros.', trait: 'Amabilidade', invert: true },
    ]);

    const addQuestion = () => {
        setQuestions([...questions, { id: Date.now(), text: '', trait: 'Extroversão', invert: false }]);
    };

    const removeQuestion = (id: number) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQ = [...questions];
        newQ[index] = { ...newQ[index], [field]: value };
        setQuestions(newQ);
    };

    const handleSave = async () => {
        if (!title) {
            alert('Por favor, dê um título para a avaliação.');
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                title,
                description,
                type: 'BIG_FIVE',
                questions: {
                    create: questions.map(q => ({
                        text: q.text,
                        traitKey: TRAIT_MAPPING[q.trait] || 'CUSTOM',
                        weight: q.invert ? -1.0 : 1.0
                    }))
                }
            };

            const response = await fetch('http://localhost:3000/api/v1/assessments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Falha ao salvar');

            alert('Avaliação criada com sucesso!');
            router.push('/dashboard');

        } catch (error) {
            console.error(error);
            alert('Erro ao salvar avaliação. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 py-4 z-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Novo Questionário</h1>
                    <p className="text-gray-500">Configure os parâmetros da avaliação comportamental.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isLoading ? 'Salvando...' : 'Salvar Avaliação'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Título da Avaliação</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                            placeholder="Ex: Avaliação de Liderança 2024"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent transition-all h-32 text-gray-900 placeholder:text-gray-400"
                            placeholder="Descreva o objetivo desta avaliação..."
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-xl font-bold text-gray-800">Perguntas Configuradas</h2>
                    <button
                        onClick={addQuestion}
                        className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                    >
                        <Plus size={16} /> Adicionar Pergunta
                    </button>
                </div>

                {questions.map((q, index) => (
                    <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 group hover:border-primary/30 transition-colors">
                        <div className="mt-3 text-gray-300 cursor-move">
                            <GripVertical size={20} />
                        </div>
                        <div className="flex-1 space-y-3">
                            <input
                                value={q.text}
                                onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded focus:border-primary outline-none font-medium text-gray-900 placeholder:text-gray-400"
                                placeholder="Digite a pergunta aqui..."
                            />
                            <div className="flex gap-4 items-center flex-wrap">
                                <select
                                    value={q.trait}
                                    onChange={(e) => updateQuestion(index, 'trait', e.target.value)}
                                    className="text-sm border border-gray-200 rounded px-2 py-1.5 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                                >
                                    {Object.keys(TRAIT_MAPPING).map(trait => (
                                        <option key={trait} value={trait}>{trait}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => updateQuestion(index, 'invert', !q.invert)}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${q.invert ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                        {q.invert && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-xs text-gray-500 select-none">Inverter Pontuação (Peso Negativo)</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => removeQuestion(q.id)}
                            className="mt-2 text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

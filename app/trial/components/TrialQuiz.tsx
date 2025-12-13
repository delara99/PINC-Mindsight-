'use client';

import { useState } from 'react';
import { useTrialStore } from '@/src/store/trial-store';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const QUESTIONS = [
    { id: 1, text: "Sinto-me confortável perto de pessoas.", trait: "Extroversão" },
    { id: 2, text: "Frequentemente sou o centro das atenções.", trait: "Extroversão" },
    { id: 3, text: "Sinto empatia pelos sentimentos dos outros.", trait: "Amabilidade" },
    { id: 4, text: "Tenho interesse pelas pessoas.", trait: "Amabilidade" },
    { id: 5, text: "Estou sempre preparado.", trait: "Conscienciosidade" },
    { id: 6, text: "Presto atenção aos detalhes.", trait: "Conscienciosidade" },
    { id: 7, text: "Fico estressado facilmente.", trait: "Neuroticismo" },
    { id: 8, text: "Mudo de humor com frequência.", trait: "Neuroticismo" },
    { id: 9, text: "Tenho uma imaginação fértil.", trait: "Abertura" },
    { id: 10, text: "Gosto de ideias complexas.", trait: "Abertura" }
];

export function TrialQuiz() {
    const { currentQuestionIndex, setAnswer, nextQuestion, setStep } = useTrialStore();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const question = QUESTIONS[currentQuestionIndex];

    // Guard clause para evitar crash se índice inválido (persistência antiga)
    if (!question) {
        if (currentQuestionIndex >= QUESTIONS.length) {
             // Se já passou do fim, vai para calculando
             setStep('calculating');
        } else {
             // Se índice negativo ou louco, reseta
             setStep('intro');
        }
        return null; 
    }

    const progress = ((currentQuestionIndex) / QUESTIONS.length) * 100;

    const handleSelect = (score: number) => {
        setSelectedOption(score);
        // Small delay to show selection before moving
        setTimeout(() => {
            setAnswer(question.id, score);
            setSelectedOption(null);
            
            if (currentQuestionIndex < QUESTIONS.length - 1) {
                nextQuestion();
            } else {
                setStep('calculating');
            }
        }, 400);
    };

    const OPTIONS = [
        { score: 1, label: "Discordo totalmente" },
        { score: 2, label: "Discordo parcialmente" },
        { score: 3, label: "Neutro" },
        { score: 4, label: "Concordo parcialmente" },
        { score: 5, label: "Concordo totalmente" }
    ];

    return (
        <div className="max-w-2xl mx-auto w-full">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>Questão {currentQuestionIndex + 1} de {QUESTIONS.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 min-h-[400px] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                    {question.text}
                </h2>

                <div className="space-y-3">
                    {OPTIONS.map((option) => (
                        <button
                            key={option.score}
                            onClick={() => handleSelect(option.score)}
                            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                                ${selectedOption === option.score 
                                    ? 'border-primary bg-primary/5 text-primary font-bold' 
                                    : 'border-gray-100 hover:border-primary/50 hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <span>{option.label}</span>
                            {selectedOption === option.score && (
                                <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in spin-in-90" />
                            )}
                            {selectedOption !== option.score && (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-200 group-hover:border-primary/50" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

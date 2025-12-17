'use client';

import { useTrialStore } from '@/src/store/trial-store';
import { TrialForm } from './components/TrialForm';
import { TrialQuiz } from './components/TrialQuiz';
import { TrialResult } from './components/TrialResult';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';

export default function TrialPage() {
    const { step, setStep } = useTrialStore();
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch for zustand persist
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Simular cálculo
    useEffect(() => {
        if (step === 'calculating') {
            const timer = setTimeout(() => {
                setStep('result');
            }, 3000); // 3 seconds fake calculation
            return () => clearTimeout(timer);
        }
    }, [step, setStep]);

    if (!isMounted) return null;

    return (
        <main className="min-h-screen bg-slate-50 font-sans">
             {/* Simple Header */}
             <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 py-4 mb-8 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <BrainCircuit className="text-secondary w-8 h-8" />
                        <span className="text-xl font-bold text-gray-900">SaaS <span className="text-primary">Avaliação</span></span>
                    </Link>
                    {step !== 'result' && (
                        <div className="text-sm font-medium text-gray-500">
                             Modo Degustação
                        </div>
                    )}
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
                
                {step === 'intro' && <TrialForm />}
                
                {step === 'form' && <TrialForm />} {/* Fallback if needed, but intro moves to form/quiz */}
                
                {step === 'quiz' && <TrialQuiz />}
                
                {step === 'calculating' && (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
                            <div className="absolute inset-4 border-t-4 border-secondary rounded-full animate-spin reverse-spin"></div>
                            <BrainCircuit className="absolute inset-0 m-auto text-gray-300 w-12 h-12 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analisando seu Perfil...</h2>
                        <p className="text-gray-500">Cruzando dados com métricas de liderança.</p>
                    </div>
                )}
                
                {step === 'result' && <TrialResult />}
                
            </div>
        </main>
    );
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TrialStep = 'intro' | 'form' | 'quiz' | 'calculating' | 'result';

interface UserInfo {
    name: string;
    email: string; // Optional for now
    role: string;
}

interface TrialState {
    step: TrialStep;
    currentQuestionIndex: number;
    userInfo: UserInfo;
    answers: Record<number, number>; // questionId -> score (1-5)
    
    // Actions
    setStep: (step: TrialStep) => void;
    setUserInfo: (info: UserInfo) => void;
    setAnswer: (questionId: number, score: number) => void;
    nextQuestion: () => void;
    resetTrial: () => void;
}

export const useTrialStore = create<TrialState>()(
    persist(
        (set) => ({
            step: 'intro',
            currentQuestionIndex: 0,
            userInfo: { name: '', email: '', role: '' },
            answers: {},

            setStep: (step) => set({ step }),
            setUserInfo: (info) => set({ userInfo: info }),
            setAnswer: (qId, score) => set((state) => ({
                answers: { ...state.answers, [qId]: score }
            })),
            nextQuestion: () => set((state) => ({
                currentQuestionIndex: state.currentQuestionIndex + 1
            })),
            resetTrial: () => set({
                step: 'intro',
                currentQuestionIndex: 0,
                userInfo: { name: '', email: '', role: '' },
                answers: {}
            })
        }),
        {
            name: 'trial-storage'
        }
    )
);

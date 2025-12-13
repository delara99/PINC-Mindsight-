'use client';

import { useTrialStore } from '@/src/store/trial-store';
import { useForm } from 'react-hook-form'; // Assuming react-hook-form is installed? Usually standard. If not, simple state.
// Checking package.json... No react-hook-form. Will use simple state.
import { useState } from 'react';
import { ArrowRight, User, Mail, Target } from 'lucide-react';

export function TrialForm() {
    const { setUserInfo, setStep } = useTrialStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        goal: 'autoconhecimento'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUserInfo({
            name: formData.name,
            email: formData.email,
            role: formData.goal
        });
        setStep('quiz');
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🚀</div>
                <h2 className="text-2xl font-bold text-gray-900">Comece sua Jornada</h2>
                <p className="text-gray-500 mt-2">Descubra seus pontos fortes em menos de 2 minutos.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            required
                            type="text"
                            placeholder="Como você gostaria de ser chamado?"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seu E-mail (Opcional)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            placeholder="Para receber novidades"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qual seu principal objetivo?</label>
                    <div className="relative">
                        <Target className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <select
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                            value={formData.goal}
                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                        >
                            <option value="autoconhecimento">Autoconhecimento</option>
                            <option value="carreira">Desenvolvimento de Carreira</option>
                            <option value="lideranca">Liderança de Equipes</option>
                            <option value="recrutamento">Recrutamento e Seleção</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] mt-6"
                >
                    Iniciar Teste Grátis <ArrowRight className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}

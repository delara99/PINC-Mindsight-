'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, User, Building2 } from 'lucide-react';
import { API_URL } from '@/src/config/api';

import { useTrialStore } from '@/src/store/trial-store';

// ...



// Fallback Planos (apenas se API falhar totalmente)
const DEFAULT_PLANS = [
    { id: 'starter', credits: 1, price: 'R$ 29,90', name: 'Starter' },
    { id: 'pro', credits: 10, price: 'R$ 249,00', name: 'Pro' },
    { id: 'business', credits: 50, price: 'R$ 990,00', name: 'Business' },
];

function RegisterContent() {
    // Fetch Site Settings for Plans
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings`);
            if (!res.ok) throw new Error('Falha ao carregar configurações');
            return res.json();
        },
        staleTime: 1000 * 60 * 5 // 5 minutes cache
    });


    const activePlans = settings?.pricingPlans || DEFAULT_PLANS;

    const { answers } = useTrialStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    // Set default plan once loaded
    useEffect(() => {
        if (activePlans.length > 0 && !selectedPlan) {
            setSelectedPlan(activePlans[0]);
        }
    }, [activePlans, selectedPlan]);
    
    const [formData, setFormData] = useState({
        name: searchParams.get('name') || '',
        email: searchParams.get('email') || '',
        password: '',
        confirmPassword: '',
        cpf: '',
        cnpj: '',
        companyName: '',
        phone: ''
    });

    // Auto-advance to step 2 if data is provided
    useEffect(() => {
        if (searchParams.get('name') || searchParams.get('email')) {
            setStep(2);
        }
    }, [searchParams]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    initialCredits: selectedPlan.credits,
                    planId: selectedPlan.id,
                    origin: searchParams.get('name') ? 'trial' : 'website'
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erro ao realizar cadastro');
            }

            // Sucesso
            router.push('/auth/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

                {/* Stepper (Simplificado) */}
                <div className="flex justify-center mb-8 gap-4">
                    <button
                        onClick={() => setStep(1)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${step === 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                        1. Escolha o Plano
                    </button>
                    <button
                        onClick={() => step > 1 && setStep(2)}
                        disabled={step === 1}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${step === 2 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                        2. Seus Dados
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 text-center">Quantos créditos você precisa agora?</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {isLoading ? (
                                <div className="col-span-3 text-center py-8 text-gray-500">Carregando planos...</div>
                            ) : (
                                activePlans.map((plan: any) => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan)}
                                        className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all hover:scale-105 ${selectedPlan?.id === plan.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`}
                                    >
                                        <div className="text-sm font-medium text-gray-500 mb-1">{plan.name}</div>
                                        <div className="text-3xl font-bold text-gray-900 mb-2">{plan.credits}</div>
                                        <div className="text-xs text-gray-500 mb-4">Créditos</div>
                                        <div className="text-lg font-bold text-primary">
                                            {plan.currency || 'R$'} {plan.price}
                                        </div>
                                        {selectedPlan?.id === plan.id && (
                                            <div className="mt-2 bg-primary text-white rounded-full p-1">
                                                <Check size={12} />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!selectedPlan}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg mt-6 shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continuar com {selectedPlan?.name || 'Plano Selecionado'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Type Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                            <button
                                type="button"
                                onClick={() => setUserType('INDIVIDUAL')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${userType === 'INDIVIDUAL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                            >
                                <User size={16} /> Pessoa Física
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType('COMPANY')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${userType === 'COMPANY' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                            >
                                <Building2 size={16} /> Pessoa Jurídica (Empresa)
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Email Corporativo</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Senha</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    minLength={6}
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>

                            {userType === 'INDIVIDUAL' ? (
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                                    <input
                                        type="text"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleInputChange}
                                        placeholder="000.000.000-00"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="sm:col-span-6">
                                        <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            required
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div className="sm:col-span-6">
                                        <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                                        <input
                                            type="text"
                                            name="cnpj"
                                            value={formData.cnpj}
                                            onChange={handleInputChange}
                                            placeholder="00.000.000/0000-00"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Telefone / WhatsApp</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Criando conta...' : 'Finalizar Cadastro'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link href="/" className="flex items-center justify-center gap-2 text-primary mb-6">
                    <ArrowLeft size={20} /> Voltar
                </Link>
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Crie sua conta
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Comece a avaliar hoje mesmo
                </p>
            </div>
            
            <Suspense fallback={<div className="text-center p-8 text-gray-500">Carregando formulário...</div>}>
                <RegisterContent />
            </Suspense>
        </div>
    );
}
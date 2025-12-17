'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, User, Building2, Star, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { API_URL } from '@/src/config/api';
import { useTrialStore } from '@/src/store/trial-store';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ExitIntentModal } from '@/src/components/auth/ExitIntentModal';

// Fallback Planos
const DEFAULT_PLANS = [
    { id: 'starter', credits: 1, price: '29.90', currency: 'R$', name: 'Starter', features: ['1 Avaliação completa', 'Relatório básico'] },
    { id: 'pro', credits: 10, price: '249.00', currency: 'R$', name: 'Pro', features: ['10 Avaliações', 'Relatórios avançados', 'Suporte prioritário'], highlighted: true },
    { id: 'business', credits: 50, price: '990.00', currency: 'R$', name: 'Business', features: ['50 Avaliações', 'API de integração', 'Gerente de conta'] },
];

function RegisterContent() {
    // Fetch Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings`);
            if (!res.ok) throw new Error('Falha ao carregar configurações');
            return res.json();
        },
        staleTime: 1000 * 60 * 5 
    });

    const activePlans = settings?.pricingPlans || DEFAULT_PLANS;
    const { answers } = useTrialStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [step, setStep] = useState(1);
    const [userType, setUserType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    // Initial Plan Selection
    useEffect(() => {
        if (activePlans.length > 0 && !selectedPlan) {
            // Default to highlighted plan or first one
            const defaultPlan = activePlans.find((p: any) => p.highlighted) || activePlans[0];
            setSelectedPlan(defaultPlan);
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

    // Auto-advance
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

            router.push('/auth/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white overflow-hidden">
            <ExitIntentModal />

            {/* Left Side - Marketing & Value Prop (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 relative items-center justify-center p-12 text-white overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-purple-900/80 z-10" />
                
                <div className="relative z-20 max-w-lg space-y-8">
                    
                    <h1 className="text-5xl font-extrabold leading-tight">
                        Descubra o potencial <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                            oculto da sua equipe
                        </span>
                    </h1>
                    
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Junte-se a mais de 10.000 líderes que usam nossa inteligência comportamental para tomar decisões melhores.
                    </p>
                    
                    <div className="space-y-4 pt-4">
                         {[
                            "Mapeamento Big Five validado cientificamente",
                            "Relatórios detalhados com insights de liderança",
                            "Dashboard intuitivo para gestão de times"
                         ].map((item, idx) => (
                             <div key={idx} className="flex items-center gap-3">
                                 <div className="bg-white/20 p-1.5 rounded-full">
                                    <Check size={16} className="text-white" />
                                 </div>
                                 <span className="font-medium">{item}</span>
                             </div>
                         ))}
                    </div>

                    <div className="pt-8">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-700 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm">
                                <div className="flex text-yellow-500">
                                    {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                                <span className="text-gray-400">Avaliado por 500+ empresas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 xl:px-24 bg-gray-50/50">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors">
                                <ArrowLeft size={16} /> Voltar
                            </Link>
                            <img src={settings?.logoUrl || "/logo-pinc.png"} alt="Logo" className="h-8 w-auto object-contain" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {step === 1 ? 'Escolha seu plano ideal' : 'Finalize seu cadastro'}
                        </h2>
                        <p className="mt-2 text-gray-600">
                             {step === 1 ? 'Comece pequeno ou escale com sua empresa.' : 'Em poucos segundos seu painel estará pronto.'}
                        </p>
                    </div>

                     {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mb-8">
                         <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
                         <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="grid gap-4">
                                    {isLoading ? (
                                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                                    ) : (
                                        activePlans.map((plan: any) => (
                                            <div
                                                key={plan.id}
                                                onClick={() => setSelectedPlan(plan)}
                                                className={`relative cursor-pointer border rounded-2xl p-5 transition-all duration-200 ${
                                                    selectedPlan?.id === plan.id 
                                                    ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary' 
                                                    : 'border-gray-200 hover:border-primary/50 bg-white hover:shadow-sm'
                                                }`}
                                            >
                                                {plan.highlighted && (
                                                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-tr-xl rounded-bl-xl uppercase tracking-wider">
                                                        Mais Popular
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className={`font-bold ${selectedPlan?.id === plan.id ? 'text-primary' : 'text-gray-900'}`}>
                                                            {plan.name}
                                                        </h3>
                                                        <div className="flex items-baseline gap-1 mt-1">
                                                            <span className="text-2xl font-bold text-gray-900">
                                                                {plan.currency || 'R$'} {Number(String(plan.price).replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-xs text-gray-500">/{plan.period || 'único'}</span>
                                                        </div>
                                                        <ul className="mt-3 space-y-1">
                                                            <li className="flex items-center gap-2 text-xs text-gray-600">
                                                                <Check size={14} className="text-primary" />
                                                                <span>{plan.credits} avaliações inclusas</span>
                                                            </li>
                                                            {plan.features?.map((feat: string, idx: number) => (
                                                                <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                                                                    <Check size={14} className="text-primary" />
                                                                    <span>{feat}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                        selectedPlan?.id === plan.id ? 'border-primary bg-primary' : 'border-gray-300'
                                                    }`}>
                                                        {selectedPlan?.id === plan.id && <Check size={14} className="text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedPlan}
                                    className="w-full mt-6 bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 group"
                                >
                                    Continuar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                
                                <p className="text-center text-xs text-gray-400 mt-4">
                                     Pagamento seguro e ativado instantaneamente.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                            <ShieldCheck size={16} /> {error}
                                        </div>
                                    )}

                                     {/* User Type Selector */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setUserType('INDIVIDUAL')}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                                                userType === 'INDIVIDUAL' 
                                                ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' 
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <User size={18} /> Pessoa Física
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUserType('COMPANY')}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                                                userType === 'COMPANY' 
                                                ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' 
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Building2 size={18} /> Empresa
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Inputs with floating-like refined style */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nome Completo</label>
                                            <input
                                                type="text"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-white border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                placeholder="Seu nome"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Email Corporativo</label>
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-white border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                placeholder="voce@empresa.com"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                             <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Senha</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    required
                                                    minLength={6}
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-white border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                    placeholder="******"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Confirmar</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    required
                                                    minLength={6}
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-white border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                    placeholder="******"
                                                />
                                            </div>
                                        </div>

                                        {userType === 'COMPANY' && (
                                             <div className="grid grid-cols-2 gap-4">
                                                 <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nome da Empresa</label>
                                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-white border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
                                                 </div>
                                                 <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">CNPJ</label>
                                                    <input type="text" name="cnpj" value={formData.cnpj} onChange={handleInputChange} className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-white border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" />
                                                 </div>
                                             </div>
                                        )}
                                         
                                         <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Telefone</label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="block w-full px-4 py-3 rounded-lg border-gray-300 bg-white border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none" placeholder="(00) 00000-0000" />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-800 font-medium py-2"
                                        >
                                            Voltar e Trocar de Plano
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>}>
            <RegisterContent />
        </Suspense>
    );
}
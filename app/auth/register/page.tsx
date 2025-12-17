'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, User, Building2, Star, ShieldCheck, ArrowRight, Loader2, Ticket, Percent } from 'lucide-react';
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

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [validatedCoupon, setValidatedCoupon] = useState<any>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleValidateCoupon = async () => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        setCouponMessage(null);
        try {
            const res = await fetch(`${API_URL}/api/v1/coupons/validate?code=${couponCode}`);
            const data = await res.json();
            if (res.ok) {
                // Client-side Plan Validation
                const planMap: any = { starter: 'START', pro: 'PRO', business: 'BUSINESS' };
                const currentPlanEnum = planMap[selectedPlan?.id] || 'START';

                if (data.allowedPlans && Array.isArray(data.allowedPlans) && data.allowedPlans.length > 0) {
                    if (!data.allowedPlans.includes(currentPlanEnum)) {
                        setValidatedCoupon(null);
                        setCouponMessage({ type: 'error', text: `Cupom válido apenas para o plano: ${data.allowedPlans.join(', ')}` });
                        return;
                    }
                }

                setValidatedCoupon(data);
                setCouponMessage({ type: 'success', text: `Cupom ${data.code} aplicado: ${data.discountPercent}% de desconto!` });
            } else {
                setValidatedCoupon(null);
                setCouponMessage({ type: 'error', text: data.message || 'Cupom inválido.' });
            }
        } catch (error) {
            setValidatedCoupon(null);
            setCouponMessage({ type: 'error', text: 'Erro ao validar cupom.' });
        } finally {
            setValidatingCoupon(false);
        }
    };

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
                    planName: selectedPlan.name, // Send Name for robust fallback
                    origin: searchParams.get('name') ? 'trial' : 'website',
                    couponCode: validatedCoupon?.code
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
                                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm">
                                <div className="flex text-yellow-500">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
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
                    <div className="mb-10 text-center lg:text-left">
                        <div className="flex lg:justify-start justify-center mb-6">
                            <img src="/logo.png" alt="PINC" className="h-12 w-auto object-contain" />
                        </div>
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors mb-6">
                            <ArrowLeft size={16} /> Voltar para Home
                        </Link>
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
                                                className={`relative cursor-pointer border rounded-2xl p-5 transition-all duration-200 ${selectedPlan?.id === plan.id
                                                    ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                                                    : 'border-gray-200 hover:border-primary/50 bg-white hover:shadow-sm'
                                                    }`}
                                            >
                                                {plan.highlighted && (
                                                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-tr-xl rounded-bl-xl uppercase tracking-wider">
                                                        Mais Popular
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <h3 className={`font-bold ${selectedPlan?.id === plan.id ? 'text-primary' : 'text-gray-900'}`}>
                                                            {plan.name}
                                                        </h3>
                                                        <div className="flex items-baseline gap-1 mt-1">
                                                            <span className="text-2xl font-bold text-gray-900">{plan.currency || 'R$'} {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1 mb-2">{plan.credits} créditos de avaliação</p>

                                                        <ul className="space-y-1.5 mt-2 border-t border-gray-100 pt-2">
                                                            {plan.features?.map((feat: string, idx: number) => (
                                                                <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                                                                    <Check size={12} className="text-primary mt-0.5 flex-shrink-0" />
                                                                    <span className="leading-tight">{feat}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors mt-1 ${selectedPlan?.id === plan.id ? 'border-primary bg-primary' : 'border-gray-300'
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
                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${userType === 'INDIVIDUAL'
                                                ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <User size={18} /> Pessoa Física
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUserType('COMPANY')}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${userType === 'COMPANY'
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

                                        {/* Coupon Section */}
                                        <div className="pt-2">
                                            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1">
                                                <Ticket size={14} className="text-primary" />
                                                Cupom de Desconto
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    className={`block w-full px-4 py-3 rounded-lg border bg-white focus:ring-2 outline-none transition-all uppercase font-mono ${validatedCoupon ? 'border-green-500 focus:ring-green-200 text-green-700 font-bold' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
                                                    placeholder="Possui um código?"
                                                    disabled={!!validatedCoupon}
                                                />
                                                {validatedCoupon ? (
                                                    <button type="button" onClick={() => { setValidatedCoupon(null); setCouponCode(''); setCouponMessage(null); }} className="bg-red-50 border border-red-100 text-red-600 px-4 rounded-lg font-bold hover:bg-red-100 text-xs uppercase tracking-wide transition-colors">
                                                        Remover
                                                    </button>
                                                ) : (
                                                    <button type="button" onClick={handleValidateCoupon} disabled={!couponCode || validatingCoupon} className="bg-gray-900 text-white px-6 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                                                        {validatingCoupon ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                                    </button>
                                                )}
                                            </div>
                                            {couponMessage && (
                                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`text-xs mt-2 font-bold flex items-center gap-1.5 ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {couponMessage.type === 'success' ? <Percent size={12} /> : <ShieldCheck size={12} />}
                                                    {couponMessage.text}
                                                </motion.p>
                                            )}
                                        </div>

                                        {/* Order Summary */}
                                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-gray-200/50 w-16 h-16 rounded-bl-full -mr-8 -mt-8" />

                                            <div className="relative z-10">
                                                <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                                                    <Ticket size={16} className="text-primary" /> Resumo do Pedido
                                                </h3>

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Plano {selectedPlan?.name}</span>
                                                        <span className="font-medium text-gray-900">{selectedPlan?.currency} {Number(selectedPlan?.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                    </div>

                                                    {validatedCoupon && (
                                                        <div className="flex justify-between items-center text-green-600 font-bold bg-green-50 p-2 rounded-lg border border-green-100">
                                                            <span className="flex items-center gap-1"><Percent size={12} /> Desconto ({validatedCoupon.discountPercent}%)</span>
                                                            <span>- {selectedPlan?.currency} {(Number(selectedPlan?.price) * (validatedCoupon.discountPercent / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                                                    <span className="font-bold text-gray-700">Total a Pagar</span>
                                                    <span className="text-xl font-extrabold text-primary">
                                                        {selectedPlan?.currency} {(Number(selectedPlan?.price) * (validatedCoupon ? (1 - validatedCoupon.discountPercent / 100) : 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
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
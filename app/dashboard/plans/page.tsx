'use client';

import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/src/config/api';
import { Check, CreditCard, Loader2, Minus, Plus, Info } from 'lucide-react';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useAuthStore } from '@/src/store/auth-store';
import { PaymentModal } from '../components/PaymentModal';

export const dynamic = 'force-dynamic';

const CREDIT_PRICE = 29.90;

function PlansContent() {
    const { token } = useAuthStore();
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Fetch site settings for dynamic plans
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings`);
            if (!res.ok) throw new Error('Falha ao carregar planos');
            return res.json();
        }
    });

    const handleQuantityChange = (planId: string, delta: number) => {
        setQuantities(prev => ({
            ...prev,
            [planId]: Math.max(0, (prev[planId] || 0) + delta)
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const plans = settings?.pricingPlans || [];

    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Escolha seu pacote de créditos
                </h2>
                <p className="mt-4 text-xl text-gray-500">
                    Adquira créditos para liberar análises completas ou avaliar novos candidatos.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-bold border border-blue-100">
                    <Info size={16} />
                    1 Crédito = 1 Resposta de Questionário Completa
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan: any) => {
                    const quantity = quantities[plan.id] || 0;
                    const isUnlimited = plan.name.toLowerCase().includes('business'); 
                    
                    // Logic: Base price is for 1 credit (Starter/Pro) usually.
                    // If plan has 0 credits in DB, assume 1 based on user requirement.
                    const dbCredits = plan.credits || 0;
                    const baseCredits = (dbCredits === 0 && !isUnlimited) ? 1 : dbCredits;
                    
                    const totalCredits = isUnlimited ? 0 : (baseCredits + quantity);
                    const finalPrice = Number(plan.price) + (quantity * CREDIT_PRICE);

                    return (
                        <div 
                            key={plan.id}
                            className={`relative bg-white rounded-2xl shadow-xl border-2 flex flex-col p-8 transition-transform hover:scale-[1.02] ${plan.highlighted ? 'border-primary ring-4 ring-primary/10' : 'border-gray-100'}`}
                        >
                            {plan.highlighted && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    MAIS POPULAR
                                </div>
                            )}
                            
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-medium text-gray-500 mb-2">{plan.name}</h3>
                                <div className="flex justify-center items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                                    </span>
                                    {!isUnlimited && quantity > 0 && <span className="text-xs text-gray-400 font-medium">/total</span>}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {quantity > 0 ? (
                                        <>
                                            Plano Base ({baseCredits} crédito): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plan.price))}
                                        </>
                                    ) : (
                                        <>Plano Base: {baseCredits} crédito(s)</>
                                    )}
                                </p>

                                {/* Credit Selector */}
                                {!isUnlimited ? (
                                    <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Adicionar Créditos Extras</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <button 
                                                onClick={() => handleQuantityChange(plan.id, -1)}
                                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-red-500 transition-colors shadow-sm disabled:opacity-50"
                                                disabled={quantity <= 0}
                                            >
                                                <Minus size={18} />
                                            </button>
                                            <div className="flex flex-col items-center w-16">
                                                <span className="text-2xl font-bold text-primary">{quantity}</span>
                                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">adicionais</span>
                                            </div>
                                            <button 
                                                onClick={() => handleQuantityChange(plan.id, 1)}
                                                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400 flex flex-col items-center">
                                            <span>+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quantity * CREDIT_PRICE)}</span>
                                            <span className="font-bold text-primary mt-1">Total: {totalCredits} Créditos</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-100 text-green-700 font-bold text-sm flex items-center justify-center gap-2">
                                        <Check size={16} /> Créditos Ilimitados
                                    </div>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features?.map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3 text-gray-600 text-left">
                                        <div className="bg-green-100 p-1 rounded-full mt-0.5"><Check size={14} className="text-green-600" /></div>
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                )) || (
                                    <li className="text-gray-400 italic">Recursos não listados</li>
                                )}
                            </ul>

                            <button 
                                onClick={() => setSelectedPlan({ 
                                    ...plan, 
                                    price: finalPrice, 
                                    credits: totalCredits,
                                    originalPrice: plan.price
                                })}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${plan.highlighted ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                            >
                               <CreditCard size={20} /> {plan.buttonText || 'Comprar Agora'}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 text-center bg-blue-50 p-6 rounded-xl border border-blue-100 max-w-2xl mx-auto">
                <p className="text-blue-800 font-medium">
                    Precisa de um plano Corporativo customizado? 
                    <Link href="/dashboard/Help" className="underline ml-2 hover:text-blue-900">Fale com vendas</Link>
                </p>
            </div>

            <PaymentModal 
                isOpen={!!selectedPlan}
                onClose={() => setSelectedPlan(null)}
                plan={selectedPlan}
                token={token || ''}
            />
        </div>
    );
}

export default function PlansPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
            <PlansContent />
        </Suspense>
    );
}

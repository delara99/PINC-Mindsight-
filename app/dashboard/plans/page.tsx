'use client';

import { Check, CreditCard } from 'lucide-react';
import Link from 'next/link';

const PLANS = [
    { id: 'starter', credits: 1, price: 'R$ 29,90', name: 'Starter', popular: false },
    { id: 'pro', credits: 10, price: 'R$ 249,00', name: 'Pro', popular: true },
    { id: 'business', credits: 50, price: 'R$ 990,00', name: 'Business', popular: false },
];

export default function PlansPage() {
    return (
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Escolha seu pacote de créditos
                </h2>
                <p className="mt-4 text-xl text-gray-500">
                    Adquira créditos para liberar análises completas ou avaliar novos candidatos.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {PLANS.map((plan) => (
                    <div 
                        key={plan.id}
                        className={`relative bg-white rounded-2xl shadow-xl border-2 flex flex-col p-8 transition-transform hover:scale-105 ${plan.popular ? 'border-primary ring-4 ring-primary/10' : 'border-gray-100'}`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                MAIS POPULAR
                            </div>
                        )}
                        
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-medium text-gray-500 mb-2">{plan.name}</h3>
                            <div className="flex justify-center items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                            </div>
                            <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                <span className="text-3xl font-bold text-gray-900">{plan.credits}</span>
                                <span className="text-gray-500 ml-2">Créditos</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-gray-600">
                                <div className="bg-green-100 p-1 rounded-full"><Check size={14} className="text-green-600" /></div>
                                <span>Relatório Completo (Big Five)</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                <div className="bg-green-100 p-1 rounded-full"><Check size={14} className="text-green-600" /></div>
                                <span>Comparativo de Mercado</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-600">
                                <div className="bg-green-100 p-1 rounded-full"><Check size={14} className="text-green-600" /></div>
                                <span>Acesso Vitalício ao Resultado</span>
                            </li>
                        </ul>

                        <button 
                            onClick={() => alert('Integração de pagamento em breve! Entre em contato com o suporte.')}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${plan.popular ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                        >
                           <CreditCard size={20} /> Comprar Agora
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center bg-blue-50 p-6 rounded-xl border border-blue-100 max-w-2xl mx-auto">
                <p className="text-blue-800 font-medium">
                    Precisa de um plano Corporativo customizado? 
                    <Link href="/dashboard/Help" className="underline ml-2 hover:text-blue-900">Fale com vendas</Link>
                </p>
            </div>
        </div>
    );
}

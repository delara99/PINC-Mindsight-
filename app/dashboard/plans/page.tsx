import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/src/config/api';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PlansPage() {
    // Fetch site settings for dynamic plans
    const { data: settings, isLoading } = useQuery({
        queryKey: ['site-settings'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/v1/site-settings`);
            if (!res.ok) throw new Error('Falha ao carregar planos');
            return res.json();
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
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
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan: any) => (
                    <div 
                        key={plan.id}
                        className={`relative bg-white rounded-2xl shadow-xl border-2 flex flex-col p-8 transition-transform hover:scale-105 ${plan.highlighted ? 'border-primary ring-4 ring-primary/10' : 'border-gray-100'}`}
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
                                    {plan.currency || 'R$'} {plan.price}
                                </span>
                            </div>
                            <div className="mt-4 bg-gray-50 rounded-lg p-4">
                                <span className="text-3xl font-bold text-gray-900">{plan.credits || 0}</span>
                                <span className="text-gray-500 ml-2">Créditos</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features?.map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-600 text-left">
                                    <div className="bg-green-100 p-1 rounded-full mt-0.5"><Check size={14} className="text-green-600" /></div>
                                    <span>{feature}</span>
                                </li>
                            )) || (
                                <li className="text-gray-400 italic">Recursos não listados</li>
                            )}
                        </ul>

                        <button 
                            onClick={() => alert(`Plano ${plan.name} selecionado. Integração de pagamento em breve!`)}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${plan.highlighted ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                        >
                           <CreditCard size={20} /> {plan.buttonText || 'Comprar Agora'}
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

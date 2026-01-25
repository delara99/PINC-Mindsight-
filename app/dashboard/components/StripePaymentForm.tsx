import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';

export function StripePaymentForm({ onSuccess, onError, amount }: { onSuccess: () => void, onError: (msg: string) => void, amount: number }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required', // Tenta não redirecionar se possível
            confirmParams: {
                return_url: window.location.href, // Fallback se precisar de 3DS
            },
        });

        if (error) {
            setErrorMessage(error.message || 'Erro desconhecido no pagamento.');
            onError(error.message || 'Erro desconhecido');
            setLoading(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            onSuccess();
        } else {
            setErrorMessage('O status do pagamento não é conclusivo.');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4 flex items-center gap-3">
                <div className="bg-white p-2 rounded shadow-sm">
                    <Lock size={16} className="text-green-600" />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-medium">Pagamento Seguro via Stripe</p>
                    <p className="text-xs text-slate-400">Seus dados são criptografados de ponta a ponta.</p>
                </div>
            </div>

            <PaymentElement options={{ layout: 'tabs' }} />

            {errorMessage && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                    ⚠️ {errorMessage}
                </div>
            )}

            <button
                disabled={!stripe || loading}
                type="submit"
                className="w-full bg-[#635BFF] hover:bg-[#5851E8] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#635BFF]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin" /> : `Pagar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}`}
            </button>

            <div className="text-center">
                <p className="text-[10px] text-slate-400 mt-2">
                    Powered by <strong>Stripe</strong>
                </p>
            </div>
        </form>
    );
}

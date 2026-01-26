import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, QrCode, Ticket, Percent, Loader2, Sparkles, CreditCard, Banknote } from 'lucide-react';
import { API_URL } from '../../../src/config/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';

// Initialize Stripe (Placeholder Key - User must replace)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_PLACEHOLDER');

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: any;
    token?: string;
}

export function PaymentModal({ isOpen, onClose, plan, token }: PaymentModalProps) {
    // UI State
    const [method, setMethod] = useState<'CARD' | 'PIX'>('CARD');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [initializingStripe, setInitializingStripe] = useState(false);

    // Pix State
    const [copied, setCopied] = useState(false);
    const [notified, setNotified] = useState(false);
    const [loading, setLoading] = useState(false);

    // Common State
    const [activated, setActivated] = useState(false);

    // Coupon States
    const [couponCode, setCouponCode] = useState('');
    const [validatedCoupon, setValidatedCoupon] = useState<any>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activating, setActivating] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setMethod('CARD');
            setClientSecret(null);
            setActivated(false);
        }
    }, [isOpen]);

    // Initialize Stripe Intent when Method is Card
    useEffect(() => {
        if (isOpen && plan && method === 'CARD' && !clientSecret && !initializingStripe) {
            setInitializingStripe(true);
            fetch(`${API_URL}/api/v1/payment/create-stripe-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    planId: plan.id,
                    credits: plan.credits
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.clientSecret) setClientSecret(data.clientSecret);
                })
                .catch(err => console.error('Ero ao iniciar Stripe:', err))
                .finally(() => setInitializingStripe(false));
        }
    }, [isOpen, plan, method, token, clientSecret]);

    if (!isOpen || !plan) return null;

    const PIX_KEY = "00.000.000/0001-00"; // Chave Pix legado

    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_KEY);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ... Coupon Logic (Mantida resumida para caber, idealmente extrair)
    // Para simplificar, vou manter a lógica de cupom APENAS para o PIX ou aplicar no Stripe antes de criar o intent?
    // Aplicar cupom no Stripe exige recriar o Intent. Vamos simplificar: Cupom só funciona no fluxo manual por enquanto, ou ignoramos cupom no MVP Stripe.
    // O usuário não pediu cupom no Stripe, pediu pagamento. Vou ocultar cupom se for Stripe pra evitar complexidade agora.

    const handleStripeSuccess = () => {
        setActivated(true);
        setTimeout(() => window.location.reload(), 3000);
    };

    const handleValidateCoupon = async () => {
        setValidatingCoupon(true);
        setCouponMessage(null);

        try {
            // 1. Validar Cupom na API
            const res = await fetch(`${API_URL}/api/v1/coupons/validate?code=${couponCode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Cupom inválido');
            }

            const couponData = await res.json();

            // 2. Se for 100%, Aplicar Imediatamente
            if (couponData.discountPercent === 100) {
                const applyRes = await fetch(`${API_URL}/api/v1/coupons/apply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        code: couponCode,
                        planId: plan.id,
                        planName: plan.name
                    })
                });

                if (!applyRes.ok) throw new Error('Erro ao aplicar cupom');

                setCouponMessage({ type: 'success', text: 'Cupom 100% aplicado! Acesso liberado.' });
                setValidatedCoupon(couponData);
                setTimeout(() => setActivated(true), 1500);
            } else {
                setCouponMessage({ type: 'error', text: `Este cupom dá ${couponData.discountPercent}% OFF. No momento aceitamos apenas Vouchers de 100%.` });
            }

        } catch (error: any) {
            setCouponMessage({ type: 'error', text: error.message || 'Cupom inválido ou expirado.' });
        } finally {
            setValidatingCoupon(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Checkout Seguro</h2>
                        <p className="text-sm text-gray-500">Comprando: {plan.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                {!activated && (
                    <div className="flex p-2 bg-gray-50 border-b">
                        <button
                            onClick={() => setMethod('CARD')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${method === 'CARD' ? 'bg-white text-primary shadow-sm border' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <CreditCard size={16} /> Cartão
                        </button>
                        <button
                            onClick={() => setMethod('PIX')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${method === 'PIX' ? 'bg-white text-primary shadow-sm border' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Ticket size={16} /> Cupom
                        </button>
                    </div>
                )}

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto">
                    {activated ? (
                        <div className="py-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <Sparkles size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-green-700">Pagamento Confirmado!</h3>
                            <p className="text-gray-600">Seus créditos foram liberados.</p>
                        </div>
                    ) : method === 'CARD' ? (
                        <div className="min-h-[300px]">
                            {clientSecret ? (
                                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                                    <StripePaymentForm
                                        amount={plan.price}
                                        onSuccess={handleStripeSuccess}
                                        onError={(msg) => alert(msg)}
                                    />
                                </Elements>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                    <p className="text-sm">Iniciando pagamento seguro...</p>
                                </div>
                            )}
                        </div>
                    ) : (

                        /* COUPON BODY */
                        <div className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800 flex items-start gap-3">
                                <Ticket className="shrink-0 mt-0.5 text-purple-600" size={18} />
                                <div>
                                    <strong className="block text-purple-900 mb-1">Tem um código promocional?</strong>
                                    Insira seu cupom abaixo para validar e liberar seu acesso ao plano <strong>{plan.name}</strong>.
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Código do Cupom</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            setCouponMessage(null);
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                                        placeholder="EX: VIP2025"
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none uppercase font-mono tracking-wider transition-all"
                                    />
                                    <button
                                        onClick={handleValidateCoupon}
                                        disabled={validatingCoupon || !couponCode}
                                        className="bg-slate-900 text-white px-6 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95"
                                    >
                                        {validatingCoupon ? <Loader2 size={18} className="animate-spin" /> : 'Aplicar'}
                                    </button>
                                </div>
                                {couponMessage && (
                                    <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${couponMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                        {couponMessage.type === 'success' ? <CheckCircle2 size={14} /> : <X size={14} />}
                                        {couponMessage.text}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-center text-gray-400">
                                    Dúvidas? Entre em contato com o suporte em <a href="mailto:ajuda@pinc.app.br" className="text-purple-600 hover:underline">ajuda@pinc.app.br</a>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}

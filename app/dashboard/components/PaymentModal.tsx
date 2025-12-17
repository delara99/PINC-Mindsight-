import { useState } from 'react';
import { X, Copy, CheckCircle2, QrCode, Ticket, Percent, Loader2, Sparkles } from 'lucide-react';
import { API_URL } from '@/src/config/api';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: any;
    token?: string;
}

export function PaymentModal({ isOpen, onClose, plan, token }: PaymentModalProps) {
    const [copied, setCopied] = useState(false);
    const [notified, setNotified] = useState(false);
    const [loading, setLoading] = useState(false);

    // Coupon States
    const [couponCode, setCouponCode] = useState('');
    const [validatedCoupon, setValidatedCoupon] = useState<any>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activating, setActivating] = useState(false);
    const [activated, setActivated] = useState(false);

    if (!isOpen || !plan) return null;

    const PIX_KEY = "00.000.000/0001-00";

    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_KEY);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                const currentPlanEnum = planMap[plan?.id?.toLowerCase()] || 'START';

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

    const handleActivateFree = async () => {
        setActivating(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/coupons/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    code: validatedCoupon.code,
                    planId: plan.id,
                    planName: plan.name
                })
            });

            const result = await response.json();

            if (response.ok) {
                setActivated(true);
                setTimeout(() => {
                    window.location.reload(); // Refresh to update credits/plan
                }, 2500);
            } else {
                alert(result.message || 'Erro ao ativar plano.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        } finally {
            setActivating(false);
        }
    };

    const handleNotifyPayment = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/users/request-credit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ planName: plan?.name, credits: plan?.credits })
            });

            if (response.ok) {
                setNotified(true);
                setTimeout(() => {
                    onClose();
                    setNotified(false);
                }, 3000);
            } else {
                alert('Erro ao notificar pagamento. Tente novamente.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const is100PercentDiscount = validatedCoupon && validatedCoupon.discountPercent === 100;
    const finalPrice = validatedCoupon
        ? Number(plan.price) * (1 - validatedCoupon.discountPercent / 100)
        : Number(plan.price);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-bold mb-1">
                        {is100PercentDiscount ? '🎉 Parabéns!' : 'Pagamento via Pix'}
                    </h2>
                    <p className="text-white/90 text-sm">
                        {is100PercentDiscount ? 'Seu plano será ativado gratuitamente!' : 'Liberação imediata após aprovação'}
                    </p>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">

                    {/* Success State (Activated) */}
                    {activated ? (
                        <div className="py-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <Sparkles size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-green-700">Plano Ativado!</h3>
                            <p className="text-gray-600 leading-relaxed">
                                🎊 Você agora tem acesso ao <span className="font-bold text-primary">{plan.name}</span> com <span className="font-bold">{plan.credits || 1} crédito(s)</span> para realizar avaliações!
                            </p>
                            <p className="text-sm text-gray-400">Redirecionando...</p>
                        </div>
                    ) : notified ? (
                        <div className="py-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-green-700">Pagamento Informado!</h3>
                            <p className="text-gray-600">
                                Recebemos sua notificação. Assim que identificarmos o Pix, seus créditos serão liberados automaticamente.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Resumo */}
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Plano Selecionado</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {plan.name}
                                    </p>
                                    {plan.credits > 0 && <p className="text-xs text-gray-400 mt-1">{plan.credits} créditos</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Valor Total</p>
                                    <p className={`font-bold text-xl ${finalPrice === 0 ? 'text-green-600 line-through' : 'text-primary'}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                                    </p>
                                    {is100PercentDiscount && (
                                        <p className="text-2xl font-extrabold text-green-600 mt-1">GRÁTIS!</p>
                                    )}
                                </div>
                            </div>

                            {/* Coupon Section */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Ticket size={16} className="text-primary" />
                                    Cupom de Desconto
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className={`flex-1 px-4 py-3 rounded-lg border bg-white focus:ring-2 outline-none transition-all uppercase font-mono text-sm ${validatedCoupon ? 'border-green-500 focus:ring-green-200 text-green-700 font-bold' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
                                        placeholder="CÓDIGO PROMOCIONAL"
                                        disabled={!!validatedCoupon}
                                    />
                                    {validatedCoupon ? (
                                        <button
                                            type="button"
                                            onClick={() => { setValidatedCoupon(null); setCouponCode(''); setCouponMessage(null); }}
                                            className="px-4 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors"
                                        >
                                            REMOVER
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleValidateCoupon}
                                            disabled={!couponCode || validatingCoupon}
                                            className="px-4 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-50 font-medium text-sm transition-colors flex items-center gap-1"
                                        >
                                            {validatingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'APLICAR'}
                                        </button>
                                    )}
                                </div>
                                {couponMessage && (
                                    <p className={`text-xs mt-2 flex items-center gap-1 ${couponMessage.type === 'success' ? 'text-green-600 font-medium' : 'text-red-500'}`}>
                                        {couponMessage.type === 'success' ? <Percent size={12} /> : null}
                                        {couponMessage.text}
                                    </p>
                                )}
                            </div>

                            {/* 100% Discount: Hide PIX, Show Activate Button */}
                            {is100PercentDiscount ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                        <Sparkles size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-green-700">Desconto de 100% Aplicado!</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Você ganhou acesso <span className="font-bold">GRATUITO</span> ao plano <span className="font-bold text-primary">{plan.name}</span>!<br />
                                        Clique abaixo para ativar agora mesmo.
                                    </p>
                                    <button
                                        onClick={handleActivateFree}
                                        disabled={activating}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {activating ? <><Loader2 className="animate-spin" size={20} /> Ativando...</> : '🎉 Ativar Plano Gratuitamente'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* QR Code Fake */}
                                    <div className="flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6">
                                        <QrCode size={64} className="text-gray-400 mb-2" />
                                        <p className="text-xs text-gray-500 text-center">QR Code gerado para {plan.name}</p>
                                    </div>

                                    {/* Chave Pix */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Chave Pix (CNPJ)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={PIX_KEY}
                                                className="flex-1 bg-gray-100 border-none rounded-lg text-gray-600 font-mono text-sm px-4 py-2 focus:ring-0"
                                            />
                                            <button
                                                onClick={handleCopyPix}
                                                className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                                            >
                                                {copied ? <><CheckCircle2 size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={handleNotifyPayment}
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? 'Enviando...' : 'Já fiz o pagamento'}
                                    </button>

                                    <p className="text-xs text-center text-gray-400">
                                        Ao clicar acima, você notifica nosso time financeiro para agilizar a liberação.
                                    </p>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

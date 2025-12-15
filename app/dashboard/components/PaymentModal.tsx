import { useState } from 'react';
import { X, Copy, CheckCircle2, QrCode } from 'lucide-react';
import { API_URL } from '@/src/config/api';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: any;
    token?: string; // Se precisar de auth
}

export function PaymentModal({ isOpen, onClose, plan, token }: PaymentModalProps) {
    const [copied, setCopied] = useState(false);
    const [notified, setNotified] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !plan) return null;

    // Chave PIX Placeholder (Usuário deve configurar isso depois no SiteSettings se quiser dinâmico)
    const PIX_KEY = "00.000.000/0001-00"; // CNPJ Fictício

    const handleCopyPix = () => {
        navigator.clipboard.writeText(PIX_KEY);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNotifyPayment = async () => {
        setLoading(true);
        try {
            // Reaproveitar o endpoint de solicitacao ou criar um novo
            // Vamos usar o request-credit existente que o usuario já tem
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
                    <h2 className="text-2xl font-bold mb-1">Pagamento via Pix</h2>
                    <p className="text-white/90 text-sm">Liberação imediata após aprovação</p>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    
                    {/* Resumo */}
                    <div className="flex justify-between items-center border-b pb-4">
                        <div>
                            <p className="text-sm text-gray-500">Item</p>
                            <p className="font-bold text-gray-900 text-lg">
                                {plan.name}
                                {plan.credits > 0 && <span className="text-sm font-normal text-gray-500 ml-2">(Total: {plan.credits} créditos)</span>}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Valor Total</p>
                            <p className="font-bold text-primary text-xl">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plan.price))}
                            </p>
                        </div>
                    </div>

                    {notified ? (
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
                                        className="flex-1 bg-gray-100 border-none rounded-lg text-gray-600 font-mono text-sm px-4 focus:ring-0"
                                    />
                                    <button 
                                        onClick={handleCopyPix}
                                        className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                                    >
                                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                        {copied ? 'Copiado!' : 'Copiar'}
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
                </div>
            </div>
        </div>
    );
}

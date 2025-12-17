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


            </div>
        </div>
    );
}

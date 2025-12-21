'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../src/config/api';
import { CheckCircle, AlertCircle, Lock, User, Phone, Building, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [verificationType, setVerificationType] = useState<'phone' | 'cnpj'>('phone');
    const [phone, setPhone] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name,
                    phone: verificationType === 'phone' ? phone : undefined,
                    cnpj: verificationType === 'cnpj' ? cnpj : undefined,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Erro ao redefinir senha');
            }

            setSuccess(true);
            setTimeout(() => router.push('/auth/login'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex">
            {/* Left Side - Purple */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-purple-700 to-pink-600 p-12 flex-col justify-between text-white">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/logo.png" alt="PINC" className="h-12" />
                </Link>
                <div className="max-w-md">
                    <h1 className="text-4xl font-bold mb-6">Recuperação de Senha</h1>
                    <p className="text-lg text-white/90">
                        Sistema inteligente de validação de identidade. Nada de emails! Confirme seus dados e redefina sua senha de forma rápida e prática.
                    </p>
                </div>
                <div className="text-sm opacity-50">
                    PINC By Sued.Inc - 2025 - CNPJ: 57.810.083/0001-00
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <img src="/logo.png" alt="PINC" className="h-12 mx-auto mb-6 lg:hidden" />

                        {!success ? (
                            <>
                                {/* Progress Indicator */}
                                <div className="flex items-center justify-center gap-2 mb-8">
                                    {[1, 2, 3].map((s) => (
                                        <div
                                            key={s}
                                            className={`h-2 rounded-full transition-all ${s <= step ? 'w-12 bg-primary' : 'w-8 bg-gray-200'
                                                }`}
                                        />
                                    ))}
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                                    {step === 1 && '📧 Seu Email'}
                                    {step === 2 && '✋ Validação de Identidade'}
                                    {step === 3 && '🔐 Nova Senha'}
                                </h2>
                                <p className="text-gray-600 text-center mb-6 text-sm">
                                    {step === 1 && 'Digite seu email cadastrado'}
                                    {step === 2 && 'Confirme seus dados para validar sua identidade'}
                                    {step === 3 && 'Crie uma nova senha segura'}
                                </p>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Email Cadastrado
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                        placeholder="seu@email.com"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(2)}
                                                    disabled={!email}
                                                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    Continuar <ArrowRight size={18} />
                                                </button>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Nome Completo
                                                    </label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input
                                                            type="text"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            required
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                            placeholder="João Silva Santos"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                                        Escolha o tipo de validação:
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setVerificationType('phone')}
                                                            className={`p-3 rounded-lg border-2 transition-all ${verificationType === 'phone'
                                                                ? 'border-primary bg-primary/5 text-primary'
                                                                : 'border-gray-200 hover:border-gray-300 text-gray-900'
                                                                }`}
                                                        >
                                                            <Phone size={20} className="mx-auto mb-1" />
                                                            <span className="text-xs font-medium">Telefone</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setVerificationType('cnpj')}
                                                            className={`p-3 rounded-lg border-2 transition-all ${verificationType === 'cnpj'
                                                                ? 'border-primary bg-primary/5 text-primary'
                                                                : 'border-gray-200 hover:border-gray-300 text-gray-900'
                                                                }`}
                                                        >
                                                            <Building size={20} className="mx-auto mb-1" />
                                                            <span className="text-xs font-medium">CNPJ</span>
                                                        </button>
                                                    </div>

                                                    {verificationType === 'phone' ? (
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input
                                                                type="tel"
                                                                value={phone}
                                                                onChange={(e) => setPhone(e.target.value)}
                                                                required
                                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                                placeholder="(11) 98765-4321"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                            <input
                                                                type="text"
                                                                value={cnpj}
                                                                onChange={(e) => setCnpj(e.target.value)}
                                                                required
                                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900"
                                                                placeholder="00.000.000/0000-00"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(1)}
                                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ArrowLeft size={18} /> Voltar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(3)}
                                                        disabled={!name || (!phone && !cnpj)}
                                                        className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        Continuar <ArrowRight size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {step === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Nova Senha
                                                    </label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            required
                                                            minLength={6}
                                                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                            placeholder="Mínimo 6 caracteres"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Confirmar Nova Senha
                                                    </label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            required
                                                            minLength={6}
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                            placeholder="Digite a senha novamente"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(2)}
                                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ArrowLeft size={18} /> Voltar
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading || !newPassword || !confirmPassword}
                                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {loading ? 'Redefinindo...' : (
                                                            <>
                                                                <CheckCircle size={18} /> Redefinir Senha
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link href="/auth/login" className="text-sm text-primary hover:text-primary-hover font-medium">
                                        ← Voltar para Login
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={40} className="text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 Senha Redefinida!</h3>
                                <p className="text-gray-600 mb-6">
                                    Sua senha foi atualizada com sucesso. Redirecionando para o login...
                                </p>
                                <div className="w-16 h-1 bg-primary rounded-full mx-auto animate-pulse" />
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

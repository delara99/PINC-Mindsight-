'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../src/config/api';
import { CheckCircle, AlertCircle, Lock, User, Phone, Building, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [document, setDocument] = useState(''); // CPF ou CNPJ
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
                    phone,
                    cnpj: document, // Backend aceita 'cpf' ou 'cnpj'. Mandando como cnpj ele valida.
                    cpf: document,  // Mandando como cpf também por garantia semântica futura
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Erro ao redefinir senha');
            }

            setSuccess(true);
            setTimeout(() => router.push('/auth/login'), 4000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2A0E61] to-[#7B1FA2] p-12 flex-col justify-between text-white">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all py-2.5 px-5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 font-medium text-sm group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar para o Site
                    </Link>
                </div>
                <div className="max-w-md">
                    <div className="bg-white/10 w-fit p-3 rounded-2xl mb-6 backdrop-blur-sm border border-white/10">
                        <ShieldCheck size={32} className="text-green-400" />
                    </div>
                    <h1 className="text-4xl font-bold mb-6 leading-tight">Segurança Máxima para sua Conta.</h1>
                    <p className="text-lg text-white/80 leading-relaxed">
                        Utilizamos um sistema de validação em múltiplas etapas. Para sua proteção, exigimos a confirmação de dados sensíveis antes de permitir a troca da senha.
                    </p>
                </div>
                <div className="text-sm opacity-40 font-mono">
                    ID Verificação: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                        <img src="/logo.png" alt="PINC" className="h-10 mx-auto mb-8 lg:hidden" />

                        {!success ? (
                            <>
                                {/* Progress Tracker */}
                                <div className="flex items-center justify-between mb-8 px-4 relative">
                                    <div className="absolute left-0 top-1/2 h-0.5 bg-gray-100 w-full -z-10"></div>
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${s <= step ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-gray-200 text-gray-500'
                                            }`}>
                                            {s}
                                        </div>
                                    ))}
                                </div>

                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {step === 1 && 'Identificação'}
                                        {step === 2 && 'Validação Extra'}
                                        {step === 3 && 'Nova Senha'}
                                    </h2>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {step === 1 && 'Comece informando seu email principal'}
                                        {step === 2 && 'Confirme nome, telefone e documento'}
                                        {step === 3 && 'Defina uma senha forte e segura'}
                                    </p>
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm"
                                    >
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <AnimatePresence mode="wait">
                                        {step === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-5"
                                            >
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">
                                                        Email Cadastrado
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-400">@</span>
                                                        </div>
                                                        <input
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            required
                                                            autoFocus
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all group-hover:border-gray-300"
                                                            placeholder="nome@empresa.com"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep(2)}
                                                    disabled={!email || !email.includes('@')}
                                                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                                                >
                                                    Continuar Validação <ArrowRight size={18} />
                                                </button>
                                            </motion.div>
                                        )}

                                        {step === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-5"
                                            >
                                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-2">
                                                    <p className="text-xs text-blue-800 flex items-center gap-2 font-medium">
                                                        <ShieldCheck size={14} />
                                                        Preencha todos os campos para provar que é você.
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">
                                                        Nome Completo
                                                    </label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input
                                                            type="text"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            required
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                            placeholder="Como consta no cadastro"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">
                                                        Telefone Celular
                                                    </label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input
                                                            type="tel"
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            required
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                            placeholder="(DDD) 99999-9999"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">
                                                        Documento (CPF ou CNPJ)
                                                    </label>
                                                    <div className="relative">
                                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input
                                                            type="text"
                                                            value={document}
                                                            onChange={(e) => setDocument(e.target.value)}
                                                            required
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                                                            placeholder="Digite apenas os números"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(1)}
                                                        className="w-12 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors flex items-center justify-center"
                                                        title="Voltar"
                                                    >
                                                        <ArrowLeft size={20} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(3)}
                                                        disabled={!name || !phone || !document}
                                                        className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                                    >
                                                        Verificar Dados <ArrowRight size={18} />
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
                                                className="space-y-5"
                                            >
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">
                                                        Defina sua Nova Senha
                                                    </label>
                                                    <div className="relative mb-3">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            required
                                                            minLength={6}
                                                            className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                            placeholder="Mínimo 6 caracteres"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                                        >
                                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>

                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            required
                                                            minLength={6}
                                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                            placeholder="Confirme a senha"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(2)}
                                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <ArrowLeft size={18} /> Corrigir
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={loading || !newPassword || !confirmPassword}
                                                        className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                                                    >
                                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                                            <>
                                                                <CheckCircle size={18} /> Alterar Senha
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>

                                <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                                    <Link href="/auth/login" className="text-sm text-gray-500 hover:text-primary font-medium transition-colors">
                                        ← Cancelar e voltar para Login
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100">
                                    <CheckCircle size={48} className="text-green-600" />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Sucesso!</h3>
                                <p className="text-gray-600 mb-8 max-w-xs mx-auto">
                                    Sua senha segura foi criada. Você será redirecionado em instantes...
                                </p>
                                <div className="w-32 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full animate-progress-indeterminate"></div>
                                </div>
                                {/* CSS Trick for indeterminate progress if needed, otherwise just pulse */}
                                <style jsx>{`
                                    @keyframes progress-indet {
                                        0% { width: 0%; margin-left: 0; }
                                        50% { width: 50%; margin-left: 25%; }
                                        100% { width: 100%; margin-left: 0; }
                                    }
                                    .animate-progress-indeterminate {
                                        animation: progress-indet 1.5s infinite ease-in-out;
                                    }
                                `}</style>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

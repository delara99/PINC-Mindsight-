'use client';
import { useState, Suspense } from 'react';
import { useAuthStore } from '../../../src/store/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { API_URL } from '../../../src/config/api';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const login = useAuthStore((state) => state.login);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Credenciais inválidas');
            }

            const data = await response.json();

            // Buscar dados completos do usuário
            const userResponse = await fetch(`${API_URL}/api/v1/users/me`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });

            if (!userResponse.ok) {
                throw new Error('Erro ao buscar dados do usuário');
            }

            const userData = await userResponse.json();

            // Garantir flag se vier do login payload também
            if (data.user?.mustChangePassword) {
                userData.mustChangePassword = true;
            }

            // Salvar no store
            login(data.access_token, userData);

            // Redirecionamento Prioritário de Segurança
            if (userData.mustChangePassword) {
                router.push('/auth/force-change-password');
                return;
            }

            // Redirecionar para URL de redirect ou dashboard padrão
            const redirectTo = searchParams.get('redirect') || '/dashboard';
            router.push(redirectTo);
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Image/Brand */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary to-[#a00050] text-white p-12">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Voltar para Home
                    </Link>
                </div>
                <div className="max-w-md">
                    <h1 className="text-4xl font-bold mb-6">Bem-vindo de volta!</h1>
                    <p className="text-lg text-white/90">
                        Acesse sua conta para gerenciar avaliações, visualizar relatórios e acompanhar o desenvolvimento.
                    </p>
                </div>
                <div className="text-sm opacity-50">
                    PINC By Sued.Inc - 2025 - CNPJ: 57.810.083/0001-00
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <img src="/logo.png" alt="PINC" className="h-12 w-auto object-contain" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Login</h2>
                        <p className="text-gray-500 mt-2">Entre com suas credenciais para continuar.</p>
                    </div>

                    {/* OAuth Buttons - Top Priority */}
                    <div className="flex flex-col gap-3 mb-6">
                        <a
                            href={`${API_URL}/api/v1/auth/google`}
                            className="w-full py-3 rounded-lg font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Entrar com Google
                        </a>

                        <a
                            href={`${API_URL}/api/v1/auth/linkedin`}
                            className="w-full py-3 rounded-lg font-bold text-white bg-[#0A66C2] hover:bg-[#004182] shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            Entrar com LinkedIn
                        </a>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500 font-medium">ou</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">Senha</label>
                                <Link href="/auth/reset-password" className="text-xs font-semibold text-primary hover:text-primary-hover">
                                    Esqueceu?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : "Entrar na Plataforma"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-500">
                        Não tem uma conta? <Link href="/auth/register" className="font-bold text-primary hover:underline">Cadastre-se</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
            <LoginForm />
        </Suspense>
    );
}
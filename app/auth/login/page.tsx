'use client';
import { useState, Suspense } from 'react';
import { useAuthStore } from '@/src/store/auth-store';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Mail } from 'lucide-react';

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
            const response = await fetch('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Credenciais inválidas');
            }

            const data = await response.json();

            // Buscar dados completos do usuário
            const userResponse = await fetch('http://localhost:3000/api/v1/users/me', {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });

            if (!userResponse.ok) {
                throw new Error('Erro ao buscar dados do usuário');
            }

            const userData = await userResponse.json();

            // Salvar no store
            login(data.access_token, userData);

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
                        Acesse sua conta para gerenciar avaliações, visualizar relatórios e acompanhar o desenvolvimento do seu time.
                    </p>
                </div>
                <div className="text-sm opacity-50">
                    © 2024 SaaS Avaliação. Todos os direitos reservados.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Login</h2>
                        <p className="text-gray-500 mt-2">Entre com suas credenciais para continuar.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
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
                                <a href="#" className="text-xs font-semibold text-primary hover:text-primary-hover">Esqueceu?</a>
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

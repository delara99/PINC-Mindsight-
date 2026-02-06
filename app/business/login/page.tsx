
"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Building2, User, Home } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/src/config/api';

function BusinessLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<'company' | 'candidate'>('company');
    const [loading, setLoading] = useState(false);

    // Detectar query parameter ?tab
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'candidate') {
            setMode('candidate');
        } else if (tab === 'company') {
            setMode('company');
        }
    }, [searchParams]);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let res;

            if (mode === 'company') {
                res = await axios.post(`${API_URL}/api/v1/auth/login`, {
                    email,
                    password
                });
            } else {
                // Login por Código de Acesso
                res = await axios.post(`${API_URL}/api/v1/auth/login-code`, {
                    code: accessCode
                });
            }

            const { access_token, user } = res.data;

            // Validar Role vs Modo
            if (mode === 'company') {
                if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
                    throw new Error('Esta conta não tem permissão de gestão corporativa.');
                }
            }

            // Salvar token (simples para exemplo)
            localStorage.setItem('accessToken', access_token);
            localStorage.setItem('user', JSON.stringify(user));

            // Redirecionamento
            if (mode === 'company') {
                router.push('/business/dashboard');
            } else {
                router.push('/business/employee');
            }

        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Erro ao realizar login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Lado Esquerdo - Branding */}
            <div className={`hidden md:flex w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden transition-colors duration-500 ${mode === 'candidate' ? 'bg-indigo-900' : 'bg-slate-900'}`}>
                <div className="relative z-10">
                    <Link href="/business" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium transition-all hover:scale-105">
                        <Home size={16} />
                        Voltar para Home
                    </Link>
                    <p className="text-slate-400 text-sm mt-4">Plataforma de Inteligência Comportamental</p>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl font-bold mb-6">
                        {mode === 'company' ? 'Gestão de Talentos baseada em dados.' : 'Descubra seu potencial profissional.'}
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed">
                        {mode === 'company'
                            ? 'Acesse o painel administrativo para gerenciar avaliações, visualizar relatórios de equipe e tomar decisões de contratação assertivas.'
                            : 'Bem-vindo à área do candidato. Complete sua avaliação para gerar insights valiosos sobre seu perfil comportamental.'}
                    </p>
                </div>

                <div className="relative z-10 text-xs text-slate-500">
                    © {new Date().getFullYear()} PINC Mindsight. Todos os direitos reservados.
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-1/4 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>
            </div>

            {/* Lado Direito - Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 bg-white">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo PINC */}
                    <div className="flex justify-center mb-6">
                        <Image src="/pinc-logo.png" alt="PINC" width={120} height={45} className="object-contain" />
                    </div>

                    {/* Toggle Mode */}
                    <div className="bg-slate-100 p-1 rounded-xl flex mb-8">
                        <button
                            onClick={() => setMode('company')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${mode === 'company' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Building2 size={16} /> Sou Empresa
                        </button>
                        <button
                            onClick={() => setMode('candidate')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${mode === 'candidate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <User size={16} /> Sou Candidato
                        </button>
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900">
                            {mode === 'company' ? 'Login Corporativo' : 'Acesso do Candidato'}
                        </h2>
                        <p className="text-slate-500 mt-2">
                            {mode === 'company' ? 'Entre com suas credenciais de gestor.' : 'Use o código fornecido pela sua empresa.'}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        {mode === 'company' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">E-mail Profissional</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                        placeholder="nome@empresa.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Senha</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all font-medium text-slate-900 placeholder:text-slate-400 pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Código de Acesso</label>
                                <input
                                    type="text"
                                    required
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all font-medium text-slate-900 placeholder:text-slate-400 font-mono tracking-wider text-center Uppercase"
                                    placeholder="PINC-XXXX"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 ${mode === 'company' ? 'bg-slate-900 hover:bg-black hover:shadow-slate-900/20' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/20'}`}
                        >
                            {loading ? 'Entrando...' : (<>{mode === 'company' ? 'Acessar Painel' : 'Acessar Avaliação'} <Lock size={16} opacity={0.5} /></>)}
                        </button>

                        {/* Google OAuth - Apenas para Empresas (B2C) */}
                        {mode === 'company' && (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-slate-500 font-medium">ou</span>
                                    </div>
                                </div>

                                <a
                                    href={`${API_URL}/api/v1/auth/google`}
                                    className="w-full py-4 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Entrar com Google
                                </a>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function BusinessLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando...</div>}>
            <BusinessLoginForm />
        </Suspense>
    );
}


"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Building2, User } from 'lucide-react';
import { API_URL } from '@/src/config/api';

export default function BusinessLoginPage() {
    // ...
    const handleLogin = async (e: React.FormEvent) => {
        // ...
        try {
            // Reutiliza endpoint padrão de auth, a distinção é feita pelo role no retorno
            const res = await axios.post(`${API_URL}/api/v1/auth/login`, {
                email,
                password
            });


            const { accessToken, user } = res.data;

            // Validar Role vs Modo
            if (mode === 'company') {
                if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
                    throw new Error('Esta conta não tem permissão de gestão corporativa.');
                }
            }

            // Salvar token (simples para exemplo)
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));

            // Redirecionamento
            if (mode === 'company') {
                router.push('/business/dashboard');
            } else {
                // Candidato vai para o dashboard padrão de usuário (limitado) ou área específica
                // Para manter isolamento perfeito, poderiamos ter /business/candidate-area
                // Por hora, enviaremos para o dashboard padrão que já sabe lidar com usuários members
                router.push('/dashboard');
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
                    <Link href="/business" className="text-2xl font-bold tracking-tight mb-2 inline-block">PINC Business</Link>
                    <p className="text-slate-400 text-sm">Plataforma de Inteligência Comportamental</p>
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
                            {mode === 'company' ? 'Entre com suas credenciais de gestor.' : 'Use o e-mail convidado pela empresa.'}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                                {error}
                            </div>
                        )}

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
                            <div className="flex justify-end">
                                <a href="#" className="text-xs font-semibold text-slate-500 hover:text-slate-800">Esqueceu a senha?</a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 ${mode === 'company' ? 'bg-slate-900 hover:bg-black hover:shadow-slate-900/20' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/20'}`}
                        >
                            {loading ? 'Entrando...' : (<>{mode === 'company' ? 'Acessar Painel' : 'Acessar Avaliação'} <Lock size={16} opacity={0.5} /></>)}
                        </button>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-500">
                            Ainda não tem conta corporativa? <Link href="/business" className="text-slate-900 font-bold hover:underline">Saiba mais</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

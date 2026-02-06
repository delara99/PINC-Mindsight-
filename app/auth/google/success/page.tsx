"use client";
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../../src/store/auth-store';

function GoogleAuthSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const login = useAuthStore((state) => state.login);

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Salvar token no localStorage para persistência manual (backup)
            localStorage.setItem('accessToken', token);

            // Atualizar o store do Zustand (CRÍTICO: O UserSynchronizer depende disso)
            // Passamos um objeto user vazio temporário, o UserSynchronizer vai preencher depois
            login(token, { email: 'loading...', name: 'Carregando...' });

            // Redirecionar para dashboard
            router.push('/dashboard');
        } else {
            // Se não tiver token, voltar para login
            router.push('/auth/login?error=google_auth_failed');
        }
    }, [searchParams, router, login]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Autenticando com Google...</p>
            </div>
        </div>
    );
}

export default function GoogleAuthSuccess() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando...</p>
                </div>
            </div>
        }>
            <GoogleAuthSuccessContent />
        </Suspense>
    );
}

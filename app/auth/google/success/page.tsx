"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleAuthSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Salvar token no localStorage
            localStorage.setItem('accessToken', token);

            // Redirecionar para dashboard
            router.push('/dashboard');
        } else {
            // Se não tiver token, voltar para login
            router.push('/auth/login?error=google_auth_failed');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Autenticando com Google...</p>
            </div>
        </div>
    );
}

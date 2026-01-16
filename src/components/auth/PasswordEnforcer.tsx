'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/auth-store';

export function PasswordEnforcer() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (user && (user as any).mustChangePassword) {
            // Se o usuário precisa trocar a senha e NÃO está na página de troca, redireciona
            if (!pathname.includes('/auth/force-change-password')) {
                router.replace('/auth/force-change-password');
            }
        }
    }, [user, pathname, router]);

    return null;
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/auth-store';
import { useEffect } from 'react';

export function UserSynchronizer() {
    const token = useAuthStore((state) => state.token);
    const updateUser = useAuthStore((state) => state.updateUser);

    const { data: userData } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            if (!token) return null;

            const response = await fetch('http://localhost:3000/api/v1/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) return null;
            return response.json();
        },
        enabled: !!token,
        refetchOnWindowFocus: true, // Garante que atualiza ao voltar para a aba
        staleTime: 0 // Sempre considera os dados obsoletos para forçar verificação
    });

    useEffect(() => {
        if (userData) {
            console.log('Synchronizing user data:', userData);
            updateUser(userData);
        }
    }, [userData, updateUser]);

    return null;
}

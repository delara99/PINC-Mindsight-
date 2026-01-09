
import { API_URL } from '../config/api';
import { useAuthStore } from '../store/auth-store';

export interface InterpretationPattern {
    id: string;
    code: string;
    name: string;
    description: string;
    conditions: any[];
    priority: number;
}

export const interpretationService = {
    getHeaders: () => {
        const token = useAuthStore.getState().token;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    },

    listPatterns: async (): Promise<InterpretationPattern[]> => {
        const res = await fetch(`${API_URL}/api/v1/interpretation/patterns`, {
            headers: interpretationService.getHeaders()
        });
        if (!res.ok) throw new Error('Falha ao listar padrões');
        const json = await res.json();
        return json.data;
    },

    createPattern: async (data: Omit<InterpretationPattern, 'id'>) => {
        const res = await fetch(`${API_URL}/api/v1/interpretation/patterns`, {
            method: 'POST',
            headers: interpretationService.getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Falha ao criar padrão');
        const json = await res.json();
        return json.data;
    },

    updatePattern: async (id: string, data: Partial<InterpretationPattern>) => {
        const res = await fetch(`${API_URL}/api/v1/interpretation/patterns/${id}`, {
            method: 'POST',
            headers: interpretationService.getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Falha ao atualizar padrão');
        const json = await res.json();
        return json.data;
    },

    deletePattern: async (id: string) => {
        const res = await fetch(`${API_URL}/api/v1/interpretation/patterns/${id}/delete`, {
            method: 'POST',
            headers: interpretationService.getHeaders()
        });
        if (!res.ok) throw new Error('Falha ao remover padrão');
        return await res.json();
    }
};

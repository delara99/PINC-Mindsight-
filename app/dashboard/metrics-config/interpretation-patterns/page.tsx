
'use client';
import { InterpretationMatrix } from '../../../../src/components/admin/InterpretationMatrix';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PatternsPage() {
    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="mb-6">
                <Link href="/dashboard/metrics-config" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft size={18} /> Voltar para Configurações
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Padrões Interpretativos</h1>
                        <p className="text-gray-600 max-w-2xl">
                            Crie regras combinatórias (ex: Alta Extroversão + Baixa Amabilidade) e defina o texto exato que aparecerá no relatório.
                            Utilize códigos únicos (ex: LOGIC_CIC) para referenciar estes padrões nos templates das seções.
                        </p>
                    </div>
                </div>
            </div>

            <InterpretationMatrix />
        </div>
    );
}

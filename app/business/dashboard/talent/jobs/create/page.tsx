'use client';

import { useRouter } from 'next/navigation';
import JobProfileEditor from '@/src/components/business/JobProfileEditor';
import { ArrowLeft } from 'lucide-react';

export default function CreateJobProfilePage() {
    const router = useRouter();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                >
                    <ArrowLeft />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Novo Perfil de Cargo</h1>
                    <p className="text-slate-500">Defina os critérios comportamentais ideais para esta posição.</p>
                </div>
            </header>

            <JobProfileEditor
                onSuccess={() => router.push('/business/dashboard/talent')}
            />
        </div>
    );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, FileBarChart, ArrowRight } from 'lucide-react';

export default function EmployeeDashboard() {

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Visão Geral</h1>
            <p className="text-slate-500 mb-8">Bem-vindo ao seu painel de avaliação profissional.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cards linking to the main actions */}
                <Link href="/business/employee/inventory" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-purple-300 transition-all group block">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Avaliação Comportamental</h3>
                            <p className="text-sm text-slate-500">Responda ao inventário PINC</p>
                        </div>
                    </div>
                    <div className="inline-flex items-center text-purple-600 font-bold text-sm group-hover:gap-2 transition-all">
                        Acessar Inventário <ArrowRight size={16} className="ml-1" />
                    </div>
                </Link>

                <Link href="/business/employee/reports" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all group block">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                            <FileBarChart size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Meus Relatórios</h3>
                            <p className="text-sm text-slate-500">Visualize sua análise de perfil</p>
                        </div>
                    </div>
                    <div className="inline-flex items-center text-blue-600 font-bold text-sm group-hover:gap-2 transition-all">
                        Ver Relatórios <ArrowRight size={16} className="ml-1" />
                    </div>
                </Link>
            </div>
        </div>
    );
}

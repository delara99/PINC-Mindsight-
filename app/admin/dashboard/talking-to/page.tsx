'use client';
import { useState } from 'react';
import { useAuthStore } from '@/src/store/auth-store';
import { Sparkles, Database, BrainCircuit, Activity, Layers } from 'lucide-react';

// Import Modular Tabs
import TalkingToTextsTab from './tabs/TalkingToTextsTab';
import TalkingToRulesTab from './tabs/TalkingToRulesTab';
import TalkingToSimulatorTab from './tabs/TalkingToSimulatorTab';
import TalkingToStructureTab from './tabs/TalkingToStructureTab';

export default function TalkingToManager() {
    const token = useAuthStore((state) => state.token);
    const [activeSection, setActiveSection] = useState('RULES'); // RULES, TEXTS, LAB, STRUCTURE

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-8 font-sans">
            {/* Header */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles size={14} /> Motor de Inteligência v2.0
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">Motor PINC</h1>
                        <p className="text-slate-500 mt-1 max-w-2xl">
                            Central de controle PINC: Gerencie regras, calibrações e conteúdo.
                        </p>
                    </div>
                </div>

                {/* Main Navigation (Tabs) */}
                <div className="flex gap-1 mt-8 border-b border-slate-100 overflow-x-auto">
                    {[
                        { id: 'RULES', label: 'Regras de Inteligência', icon: BrainCircuit },
                        { id: 'STRUCTURE', label: 'Estrutura do Modelo', icon: Database },
                        { id: 'TEXTS', label: 'Biblioteca de Conteúdo', icon: Layers },
                        { id: 'LAB', label: 'Simulador (Lab)', icon: Activity },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeSection === tab.id
                                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg'
                                }`}
                        >
                            <tab.icon size={18} className={activeSection === tab.id ? "" : "opacity-50"} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div>
                <TalkingToRulesTab isActive={activeSection === 'RULES'} />
                <TalkingToStructureTab isActive={activeSection === 'STRUCTURE'} />
                <TalkingToTextsTab isActive={activeSection === 'TEXTS'} />
                <TalkingToSimulatorTab isActive={activeSection === 'LAB'} />
            </div>
        </div>
    );
}


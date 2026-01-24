import React from 'react';
import { HelpCircle } from 'lucide-react';

export const HelpTooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-2 cursor-help align-middle">
        <HelpCircle size={14} className="text-slate-400 hover:text-purple-600 transition-colors" />
        <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl pointer-events-none z-50 text-center font-normal leading-relaxed">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -border-4 border-transparent border-t-slate-800"></div>
        </div>
    </div>
);

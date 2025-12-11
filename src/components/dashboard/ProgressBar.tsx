import React from 'react';

interface ProgressBarProps {
    value: number; // 0-100
    label: string;
    score: string | number;
    className?: string;
}

export function ProgressBar({ value, label, score, className = '' }: ProgressBarProps) {
    // Determinar cor baseada no valor
    const getColorClass = () => {
        if (value < 40) return 'bg-red-500';
        if (value < 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getBgColorClass = () => {
        if (value < 40) return 'bg-red-50';
        if (value < 70) return 'bg-yellow-50';
        return 'bg-green-50';
    };

    return (
        <div className={`space-y-1 ${className}`}>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="font-bold text-gray-900">{score}</span>
            </div>
            <div className={`w-full h-2.5 rounded-full ${getBgColorClass()}`}>
                <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${getColorClass()}`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        </div>
    );
}

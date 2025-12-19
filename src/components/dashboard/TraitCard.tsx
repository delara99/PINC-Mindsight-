import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface Facet {
    facet: string;
    rawScore: number;
    normalizedScore: number;
}

interface TraitCardProps {
    traitName: string;
    overallScore: number;
    interpretation: string;
    facets: Facet[];
    defaultExpanded?: boolean;
}

export function TraitCard({
    traitName,
    overallScore,
    interpretation,
    facets,
    defaultExpanded = true
}: TraitCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const safeOverallScore = typeof overallScore === 'number' ? overallScore : 0;

    const getInterpretationColor = () => {
        const normalized = (safeOverallScore / 5) * 100;
        if (normalized < 40) return 'bg-red-100 text-red-700 border-red-200';
        if (normalized < 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">{traitName}</h3>
                    <span className="text-2xl font-bold text-gray-900">{safeOverallScore.toFixed(1)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getInterpretationColor()}`}>
                        {interpretation}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {/* Facets Grid */}
            {isExpanded && facets && facets.length > 0 && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {facets.map((facet, index) => {
                            const safeRawScore = typeof facet.rawScore === 'number' ? facet.rawScore : 0;
                            return (
                                <ProgressBar
                                    key={index}
                                    label={facet.facet}
                                    value={facet.normalizedScore || 0}
                                    score={safeRawScore.toFixed(1)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

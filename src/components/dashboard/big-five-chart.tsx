import React, { useState } from 'react';

interface RadarChartProfessionalProps {
    scores: Record<string, number>;
}

export function BigFiveChart({ scores }: RadarChartProfessionalProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Validação: verificar se scores existe e não está vazio
    if (!scores || typeof scores !== 'object' || Object.keys(scores).length === 0) {
        return (
            <div className="w-full bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
                <p className="text-yellow-800 font-medium">⚠️ Dados insuficientes para gerar o gráfico radar.</p>
            </div>
        );
    }

    // Cores para rotação dinâmica (para suportar novos traços)
    const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4', '#6366F1'];

    // Processar scores dinamicamente - Agnostic to Trait Names
    // Estrutura esperada de keys: "TraitName::FacetName"
    const traitsData: Record<string, { facets: Array<{ name: string, score: number }>, color: string }> = {};
    const allFacets: Array<{ trait: string, name: string, score: number, color: string }> = [];

    let traitColorIndex = 0;
    const traitColorMap: Record<string, string> = {};

    Object.entries(scores).forEach(([key, value]) => {
        const parts = key.split('::');
        if (parts.length === 2) {
            const [traitNameRaw, facetName] = parts;
            const score = typeof value === 'number' ? value : parseFloat(value as string) || 0;
            const traitName = traitNameRaw.trim(); // Usar o nome exato que vem do backend (configurado pelo usuário)

            // Inicializar grupo do traço se não existir
            if (!traitsData[traitName]) {
                // Atribuir cor
                if (!traitColorMap[traitName]) {
                    traitColorMap[traitName] = COLORS[traitColorIndex % COLORS.length];
                    traitColorIndex++;
                }
                traitsData[traitName] = {
                    facets: [],
                    color: traitColorMap[traitName]
                };
            }

            // Adicionar faceta
            traitsData[traitName].facets.push({ name: facetName, score });

            // Adicionar à lista flat
            allFacets.push({
                trait: traitName,
                name: facetName,
                score,
                color: traitsData[traitName].color
            });
        }
    });

    const totalFacets = allFacets.length;

    // Validação adicional: se nenhuma facet foi processada
    if (totalFacets === 0) {
        return (
            <div className="w-full bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
                <p className="text-yellow-800 font-medium">⚠️ Nenhuma faceta encontrada nos dados.</p>
            </div>
        );
    }

    // Ajustado para dar muito mais espaço lateral para os textos
    const centerX = 450;
    const centerY = 350;
    const radius = 160;
    const labelRadius = 240;

    // Calcular pontos do polígono
    const points = allFacets.map((facet, index) => {
        const angle = (index * 2 * Math.PI / totalFacets) - Math.PI / 2;
        const distance = (facet.score / 5) * radius;
        return {
            x: centerX + distance * Math.cos(angle),
            y: centerY + distance * Math.sin(angle),
            labelX: centerX + labelRadius * Math.cos(angle),
            labelY: centerY + labelRadius * Math.sin(angle),
            angle: angle,
            facet: facet
        };
    });

    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="w-full bg-white p-4 md:p-8 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Radar do Perfil de Personalidade</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">Análise completa das {totalFacets} facetas avaliadas</p>

            <div className="flex justify-center -ml-4 md:ml-0 overflow-x-auto">
                <svg width="900" height="700" viewBox="0 0 900 700" className="min-w-[700px] h-auto">
                    {/* Grid circular */}
                    {[1, 2, 3, 4, 5].map((level) => (
                        <circle
                            key={level}
                            cx={centerX}
                            cy={centerY}
                            r={(level / 5) * radius}
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                        />
                    ))}

                    {/* Linhas radiais */}
                    {points.map((point, index) => (
                        <line
                            key={`line-${index}`}
                            x1={centerX}
                            y1={centerY}
                            x2={centerX + radius * Math.cos(point.angle)}
                            y2={centerY + radius * Math.sin(point.angle)}
                            stroke={hoveredIndex === index ? point.facet.color : "#E5E7EB"}
                            strokeWidth={hoveredIndex === index ? "2" : "1"}
                            style={{ transition: 'all 0.2s' }}
                        />
                    ))}

                    {/* Arcos coloridos removidos conforme solicitado */}

                    {/* Polígono dos scores */}
                    <polygon
                        points={polygonPoints}
                        fill="#6366F1"
                        fillOpacity="0.25"
                        stroke="#6366F1"
                        strokeWidth="2"
                    />

                    {/* Pontos e valores com hover */}
                    {points.map((point, index) => {
                        const isHovered = hoveredIndex === index;
                        const pointRadius = isHovered ? 22 : 16;

                        return (
                            <g
                                key={`point-${index}`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Círculo externo de destaque no hover */}
                                {isHovered && (
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r="28"
                                        fill={point.facet.color}
                                        opacity="0.2"
                                        style={{ animation: 'pulse 1s infinite' }}
                                    />
                                )}

                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r={pointRadius}
                                    fill={point.facet.color}
                                    stroke="white"
                                    strokeWidth="3"
                                    style={{
                                        transition: 'all 0.2s',
                                        filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : 'none'
                                    }}
                                />
                                <text
                                    x={point.x}
                                    y={point.y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="white"
                                    fontSize={isHovered ? "13" : "11"}
                                    fontWeight="bold"
                                    style={{ pointerEvents: 'none', transition: 'all 0.2s' }}
                                >
                                    {point.facet.score.toFixed(0)}
                                </text>

                                {/* Tooltip no hover */}
                                {isHovered && (
                                    <g>
                                        <rect
                                            x={point.x - 80}
                                            y={point.y - 50}
                                            width="160"
                                            height="35"
                                            fill="white"
                                            stroke={point.facet.color}
                                            strokeWidth="2"
                                            rx="6"
                                            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }}
                                        />
                                        <text
                                            x={point.x}
                                            y={point.y - 38}
                                            textAnchor="middle"
                                            fill="#1F2937"
                                            fontSize="11"
                                            fontWeight="600"
                                        >
                                            {point.facet.name}
                                        </text>
                                        <text
                                            x={point.x}
                                            y={point.y - 23}
                                            textAnchor="middle"
                                            fill={point.facet.color}
                                            fontSize="13"
                                            fontWeight="bold"
                                        >
                                            Pontuação: {point.facet.score.toFixed(2)}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* Labels das facetas */}
                    {points.map((point, index) => {
                        const angle = point.angle * 180 / Math.PI;
                        let textAnchor: 'start' | 'middle' | 'end' = 'middle';

                        if (angle > -90 && angle < 90) textAnchor = 'start';
                        else if (angle > 90 || angle < -90) textAnchor = 'end';

                        const isHovered = hoveredIndex === index;

                        return (
                            <text
                                key={`label-${index}`}
                                x={point.labelX}
                                y={point.labelY}
                                textAnchor={textAnchor}
                                dominantBaseline="middle"
                                fill={isHovered ? point.facet.color : "#374151"}
                                fontSize={isHovered ? "12" : "10"}
                                fontWeight={isHovered ? "700" : "500"}
                                style={{
                                    pointerEvents: 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {point.facet.name} ({point.facet.score.toFixed(1)})
                            </text>
                        );
                    })}

                    {/* Números da escala */}
                    {[1, 2, 3, 4, 5].map((level) => (
                        <text
                            key={`scale-${level}`}
                            x={centerX + 5}
                            y={centerY - (level / 5) * radius}
                            fill="#9CA3AF"
                            fontSize="10"
                            fontWeight="500"
                        >
                            {level}
                        </text>
                    ))}
                </svg>
            </div>

            {/* Legenda dos traços */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
                {Object.entries(traitsData)
                    .filter(([_, data]) => data.facets.length > 0)
                    .map(([traitName, data]) => (
                        <div key={traitName} className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: data.color }}
                            ></div>
                            <span className="text-sm font-medium text-gray-700">{traitName}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
}

// Função auxiliar para desenhar arcos
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

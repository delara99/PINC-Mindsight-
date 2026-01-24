import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ScoreResult {
    traitKey: string;
    traitName: string;
    score: number;
    normalizedScore: number;
    level: 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH';
    levelLabel?: string;
    interpretation: string;
    facets?: {
        facetKey: string;
        facetName: string;
        score: number;
        rawScore: number;
    }[];
}

@Injectable()
export class ScoreCalculationService {
    private readonly logger = new Logger(ScoreCalculationService.name);

    constructor(private prisma: PrismaService) { }

    async calculateScores(assignmentId: string): Promise<{
        scores: Record<string, ScoreResult>;
        conceptScores: Record<string, any>;
        subtraitScores: Record<string, any>;
        dichotomyScores: Record<string, any>;
        config: any;
    }> {
        this.logger.log(`Calculando scores para assignment: ${assignmentId} usando Motor de Cálculo Dinâmico`);

        // 1. Fetch Assignment & Data
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: true
            }
        });

        if (!assignment) throw new Error('Assignment não encontrado');

        // 2. Fetch Calculation Engine Configs (Mappings & Classifications)
        const [mappings, classifications] = await Promise.all([
            this.prisma.calculationQuestionMapping.findMany({
                where: { isActive: true }
            }),
            this.prisma.calculationClassification.findMany({
                where: { isActive: true },
                orderBy: { priority: 'asc' }
            })
        ]);

        if (mappings.length === 0) {
            this.logger.warn('Nenhum mapeamento de questão encontrado no Motor de Cálculo!');
        }

        // 3. Process Responses & Normalize
        const normalizedResponses: Record<string, number> = {}; // QuestionID -> Normalized Value (0-100)

        assignment.responses.forEach(r => {
            const qId = r.questionId;
            let rawVal = r.value || 0;

            // Validação básica de range 1-6
            if (rawVal < 1) rawVal = 1;
            if (rawVal > 6) rawVal = 6;

            const mapping = mappings.find(m => m.questionId === qId);

            if (mapping && mapping.isReversed) {
                // Inversão: 7 - valor
                const inverted = 7 - rawVal;
                // Normalização: (val - 1) / 5 * 100
                normalizedResponses[qId] = Math.round(((inverted - 1) / 5) * 100);
            } else {
                // Normalização direta
                normalizedResponses[qId] = Math.round(((rawVal - 1) / 5) * 100);
            }
        });

        // 4. Calculate Facet Scores (Weighted Average)
        const facetScores: Record<string, {
            dimension: string,
            score: number,
            sum: number,
            weightSum: number,
            count: number
        }> = {};

        mappings.forEach(mapping => {
            const qId = mapping.questionId;
            const normVal = normalizedResponses[qId];

            // Se não tem resposta para esta questão mapeada, ignoramos
            if (normVal === undefined) return;

            const facetKey = `${mapping.dimension}_${mapping.facet}`; // Ex: EXTRAVERSION_ENTUSIASMO

            if (!facetScores[facetKey]) {
                facetScores[facetKey] = {
                    dimension: mapping.dimension,
                    score: 0,
                    sum: 0,
                    weightSum: 0,
                    count: 0
                };
            }

            facetScores[facetKey].sum += normVal * mapping.weight;
            facetScores[facetKey].weightSum += mapping.weight;
            facetScores[facetKey].count++;
        });

        // Finalize Facet Scores
        Object.values(facetScores).forEach(f => {
            if (f.weightSum > 0) {
                f.score = Math.round(f.sum / f.weightSum);
            }
        });

        // 5. Calculate Dimension Scores (Simple Average of Facets)
        const dimensionScores: Record<string, { score: number, facets: number[] }> = {};

        // Initialize Dimensions
        ['EXTRAVERSION', 'AGREEABLENESS', 'CONSCIENTIOUSNESS', 'OPENNESS', 'NEUROTICISM'].forEach(dim => {
            dimensionScores[dim] = { score: 0, facets: [] };
        });

        Object.values(facetScores).forEach(f => {
            if (dimensionScores[f.dimension]) {
                dimensionScores[f.dimension].facets.push(f.score);
            }
        });

        // Finalize Dimension Scores
        Object.keys(dimensionScores).forEach(dim => {
            const facets = dimensionScores[dim].facets;
            if (facets.length > 0) {
                const sum = facets.reduce((a, b) => a + b, 0);
                dimensionScores[dim].score = Math.round(sum / facets.length);
            }
        });

        // 6. Build Final Result Structure
        const finalScores: Record<string, ScoreResult> = {};

        // Map Dimensions names to PT-BR (Visual)
        const traitNames: Record<string, string> = {
            'EXTRAVERSION': 'Extroversão',
            'AGREEABLENESS': 'Amabilidade',
            'CONSCIENTIOUSNESS': 'Conscienciosidade',
            'OPENNESS': 'Abertura à Experiência',
            'NEUROTICISM': 'Estabilidade Emocional'
        };

        // Determine Levels based on DB Classifications
        Object.entries(dimensionScores).forEach(([dimKey, data]) => {
            const score = data.score;

            // Find matching classification
            const dimClassifs = classifications.filter(c => c.dimension === dimKey);
            const match = dimClassifs.find(c => score >= c.minScore && score <= c.maxScore);

            const level = (match?.level as any) || 'AVERAGE';
            const label = match?.label || 'Médio';
            const description = match?.description || '';

            // Get Facets details for this dimension
            const dimFacets = Object.entries(facetScores)
                .filter(([_, fData]) => fData.dimension === dimKey)
                .map(([key, fData]) => ({
                    facetKey: key,
                    facetName: key.split('_')[1], // Simple name extraction
                    score: fData.score,
                    rawScore: (fData.score / 100) * 5 + 1 // Aproximate back to 1-6 for legacy compatibility if needed
                }));

            finalScores[dimKey] = {
                traitKey: dimKey,
                traitName: traitNames[dimKey] || dimKey,
                score: score,
                normalizedScore: score,
                level: level,
                levelLabel: label,
                interpretation: description, // Usando a descrição do range como interpretação básica
                facets: dimFacets
            };
        });

        // 7. Adapters for Legacy Props (concept, subtrait, etc)
        // O frontend antigo pode olhar para esses objetos. Vamos populá-los com as facetas.
        const legacySubtraitScores: Record<string, any> = {};

        Object.entries(facetScores).forEach(([key, data]) => {
            const legacyKey = key.split('_')[1] || key;
            legacySubtraitScores[legacyKey] = {
                name: legacyKey,
                score: (data.score / 100) * 5 + 1, // Legacy often expects 1-6 scale here
                normalizedScore: data.score,
                level: 'AVERAGE' // Dummy
            };
        });

        const dummyConfig = {
            veryLowLabel: 'Muito Baixo',
            lowLabel: 'Baixo',
            averageLabel: 'Médio',
            highLabel: 'Alto',
            veryHighLabel: 'Muito Alto'
        };

        return {
            scores: finalScores,
            conceptScores: {}, // Deprecated
            subtraitScores: legacySubtraitScores, // Mapped to Facets
            dichotomyScores: {}, // Deprecated
            config: dummyConfig
        };
    }
}

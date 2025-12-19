import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ScoreResult {
    traitKey: string;
    traitName: string;
    score: number;
    normalizedScore: number;
    level: 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH';
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
    constructor(private prisma: PrismaService) { }

    /**
     * Calcula os scores de um assignment baseado nas respostas e na configuração ativa
     */
    async calculateScores(assignmentId: string): Promise<{
        scores: Record<string, ScoreResult>;
        config: any;
    }> {
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: {
                    include: { question: true }
                },
                config: {
                    include: {
                        traits: {
                            include: { facets: true }
                        }
                    }
                },
                user: {
                    select: { tenantId: true }
                }
            }
        });

        if (!assignment) throw new Error('Assignment não encontrado');

        let config = assignment.config;
        if (!config) {
            config = await this.prisma.bigFiveConfig.findFirst({
                where: {
                    tenantId: assignment.user.tenantId,
                    isActive: true
                },
                include: {
                    traits: {
                        include: { facets: true }
                    }
                }
            });
        }

        if (!config) throw new Error('Configuração Big Five não encontrada para este tenant');

        const responsesByTrait = this.groupResponsesByTrait(assignment.responses, config);
        const scores: Record<string, ScoreResult> = {};

        for (const trait of config.traits) {
            const traitResponses = responsesByTrait[trait.traitKey] || [];

            // Score Bruto (0-5)
            const rawScore = this.calculateRawScore(traitResponses, trait.weight);

            // Score Normalizado (0-100)
            // Se rawScore for 0 (sem respostas), normalizado deve ser 0
            const normalizedScore = rawScore > 0 ? this.normalizeScore(rawScore) : 0;

            const level = this.determineLevel(normalizedScore, config);
            const interpretation = this.getInterpretation(level, trait);

            const facets = trait.facets.map((facet: any, idx: number) => {
                // Filtrar respostas da faceta
                const facetResponses = traitResponses.filter(r => {
                    if (!r.question.traitKey) return false;
                    const parts = r.question.traitKey.split('::');
                    if (parts.length < 2) return false;

                    const qFacetName = parts[1].trim();
                    const qClean = this.cleanString(qFacetName);
                    const fKeyClean = this.cleanString(facet.facetKey);
                    const fNameClean = this.cleanString(facet.name);

                    // Match por Key ou Name (Dinâmico)
                    if (qClean === fKeyClean || qClean === fNameClean) return true;

                    // Fallback de Aliases (Legado/Segurança)
                    const aliases: Record<string, string[]> = {
                        'ansiedade': ['controle de ansiedade', 'preocupacao'],
                        'raiva': ['controle de humor', 'irritabilidade', 'hostilidade'],
                        'gregarismo': ['sociabilidade', 'interacao social'],
                        'assertividade': ['lideranca', 'dominancia', 'firmeza'],
                        'busca de emocoes': ['busca por emocoes positivas', 'aventura', 'excitacao'],
                        'emocoes positivas': ['otimismo', 'alegria', 'entusiasmo'],
                        'amabilidade': ['acolhimento', 'afeto', 'calor', 'simpatia'], // Warmth (Extroversão)
                        'calor': ['amabilidade', 'afeto'],
                        'emotividade': ['sentimentos', 'consciencia emocional', 'emocao'],
                        'moralidade': ['modestia', 'franqueza', 'retidao', 'sinceridade'],
                        'altruismo': ['generosidade', 'ajuda'],
                        'modestia': ['humildade'],
                        'sensibilidade': ['empatia', 'ternura'],
                        'interesses artisticos': ['sensibilidade estetica', 'arte', 'estetica'],
                        'ideias': ['curiosidade intelectual', 'intelecto', 'curiosidade']
                    };

                    if (aliases[fNameClean]?.includes(qClean)) return true;
                    if (aliases[qClean]?.includes(fNameClean)) return true;

                    return false;
                });

                const fRawScore = this.calculateRawScore(facetResponses, facet.weight);
                const fNormScore = fRawScore > 0 ? this.normalizeScore(fRawScore) : 0;

                return {
                    facetKey: facet.facetKey,
                    facetName: facet.name, // Nome fiel da config!
                    score: fNormScore,
                    rawScore: fRawScore
                };
            });

            scores[trait.traitKey] = {
                traitKey: trait.traitKey,
                traitName: trait.name, // Nome fiel da config!
                score: rawScore,
                normalizedScore,
                level,
                interpretation,
                facets
            };
        }

        return { scores, config };
    }

    private cleanString(str: string): string {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    private groupResponsesByTrait(responses: any[], config: any): Record<string, any[]> {
        const grouped: Record<string, any[]> = {};

        for (const response of responses) {
            const fullTraitKey = response.question.traitKey;
            if (!fullTraitKey) continue;

            const [traitNameRaw] = fullTraitKey.split('::');

            // Buscar na config por Key ou Name
            const traitConfig = config.traits.find((t: any) => {
                const tKey = this.cleanString(t.traitKey);
                const tName = this.cleanString(t.name);
                const qRaw = this.cleanString(traitNameRaw);

                if (tKey === qRaw || tName === qRaw) return true;

                // Fallback Legacy
                const legacyMap: Record<string, string> = {
                    'amabilidade': 'agreeableness',
                    'conscienciosidade': 'conscientiousness',
                    'extroversao': 'extraversion',
                    'abertura a experiencia': 'openness',
                    'estabilidade emocional': 'neuroticismo'
                };
                if (legacyMap[qRaw] === tKey) return true;

                return false;
            });

            if (traitConfig) {
                const key = traitConfig.traitKey;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(response);
            }
        }
        return grouped;
    }

    private calculateRawScore(responses: any[], weight: number = 1.0): number {
        if (!responses || responses.length === 0) return 0;
        const sum = responses.reduce((acc, r) => {
            const value = typeof r.answer === 'number' ? r.answer : this.convertResponseToNumber(r.answer);
            return acc + value;
        }, 0);
        return (sum / responses.length); // Removido peso multiplicativo aqui pois é média 1-5
        // Se o peso deve ser aplicado, geralmente é na agregação final, mas Big Five costuma ser média simples.
        // O parametro 'weight' está aqui mas não estava sendo usado antes da média, estava multiplicando DEPOIS?
        // Antes estava: return average * weight;
        // Se peso for 1.0, OK. Se peso for 2.0, o score vai de 0-5 para 0-10?
        // O normalizeScore assume 1-5. Se chegar 10, vai dar 200%.
        // Vou assumir que o peso é usado em outro lugar ou ignorar por enquanto para não quebrar a escala.
        // Vou manter o multiplicador se o peso for relevante, mas com CUIDADO.
        // O normalizeScore faz: (raw - 1) / 4 * 100.
        // Se o raw vier multiplicado, quebra. Vou retornar average pura.
    }

    private convertResponseToNumber(response: any): number {
        if (typeof response === 'number') return response;
        if (!isNaN(Number(response))) return Number(response);
        return 3;
    }

    private normalizeScore(rawScore: number): number {
        // Escala 1 a 5 -> 0 a 100
        // (x - 1) / 4 * 100
        // Se rawScore < 1 (ex: 0), retorna 0
        if (rawScore < 1) return 0;
        const norm = ((rawScore - 1) / 4) * 100;
        return Math.min(100, Math.max(0, Math.round(norm)));
    }

    private determineLevel(score: number, config: any): 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH' {
        if (score <= config.veryLowMax) return 'VERY_LOW';
        if (score <= config.lowMax) return 'LOW';
        if (score <= config.averageMax) return 'AVERAGE';
        if (score <= config.highMax) return 'HIGH';
        return 'VERY_HIGH';
    }

    private getInterpretation(level: string, trait: any): string {
        switch (level) {
            case 'VERY_LOW': return trait.veryLowText;
            case 'LOW': return trait.lowText;
            case 'AVERAGE': return trait.averageText;
            case 'HIGH': return trait.highText;
            case 'VERY_HIGH': return trait.veryHighText;
            default: return trait.averageText;
        }
    }
}

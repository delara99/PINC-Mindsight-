import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ScoreResult {
    traitKey: string;
    traitName: string;
    score: number;
    normalizedScore: number; // 0-100
    level: 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH';
    interpretation: string;
    facets?: {
        facetKey: string;
        facetName: string;
        score: number;
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
        // Buscar assignment com respostas e config
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: {
                    include: {
                        question: true
                    }
                },
                config: {
                    include: {
                        traits: {
                            include: {
                                facets: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        tenantId: true
                    }
                }
            }
        });

        if (!assignment) {
            throw new Error('Assignment não encontrado');
        }

        // Se não tem config vinculada, buscar a ativa do tenant
        let config = assignment.config;
        if (!config) {
            config = await this.prisma.bigFiveConfig.findFirst({
                where: {
                    tenantId: assignment.user.tenantId,
                    isActive: true
                },
                include: {
                    traits: {
                        include: {
                            facets: true
                        }
                    }
                }
            });
        }

        if (!config) {
            throw new Error('Configuração Big Five não encontrada para este tenant');
        }

        // Agrupar respostas por trait
        const responsesByTrait = this.groupResponsesByTrait(assignment.responses);

        const scores: Record<string, ScoreResult> = {};

        // Calcular score para cada trait
        for (const trait of config.traits) {
            const traitResponses = responsesByTrait[trait.traitKey] || [];

            // Calcular score bruto (média das respostas)
            const rawScore = this.calculateRawScore(traitResponses, trait.weight);

            // Normalizar para 0-100
            const normalizedScore = this.normalizeScore(rawScore);

            // Determinar nível baseado nas faixas da config
            const level = this.determineLevel(normalizedScore, config);

            // Obter interpretação
            const interpretation = this.getInterpretation(level, trait);

            // Calcular scores de facetas
            const facets = trait.facets.map(facet => {
                const facetResponses = traitResponses.filter(r =>
                    r.question.metadata && JSON.parse(r.question.metadata as string).facet === facet.facetKey
                );
                const facetScore = this.calculateRawScore(facetResponses, facet.weight);
                return {
                    facetKey: facet.facetKey,
                    facetName: facet.name,
                    score: this.normalizeScore(facetScore)
                };
            });

            scores[trait.traitKey] = {
                traitKey: trait.traitKey,
                traitName: trait.name,
                score: rawScore,
                normalizedScore,
                level,
                interpretation,
                facets
            };
        }

        return { scores, config };
    }

    /**
     * Agrupa respostas por trait key
     */
    private groupResponsesByTrait(responses: any[]): Record<string, any[]> {
        console.log('[groupResponsesByTrait] Total de respostas:', responses.length);
        const grouped: Record<string, any[]> = {};

        // Mapeamento de nomes em português para keys em inglês
        const traitNameToKey: Record<string, string> = {
            'Amabilidade': 'AGREEABLENESS',
            'Conscienciosidade': 'CONSCIENTIOUSNESS',
            'Extroversão': 'EXTRAVERSION',
            'Abertura à Experiência': 'OPENNESS',
            'Estabilidade Emocional': 'NEUROTICISM'
        };

        for (const response of responses) {
            // As questões têm traitKey no formato "Trait::Facet"
            const fullTraitKey = response.question.traitKey;

            // LOG: Primeira questão para debug
            if (Object.keys(grouped).length === 0) {
                console.log('[groupResponsesByTrait] Exemplo de questão:', {
                    questionId: response.question.id,
                    questionText: response.question.text?.substring(0, 50),
                    traitKey: response.question.traitKey,
                    answer: response.answer,
                    hasMetadata: !!response.question.metadata
                });
            }

            if (!fullTraitKey) {
                console.warn('Questão sem traitKey:', response.question.id);
                continue;
            }

            // Extrair apenas o nome do trait (antes de "::")
            const traitName = fullTraitKey.split('::')[0];

            // Converter nome português para key em inglês
            const traitKey = traitNameToKey[traitName];

            if (!traitKey) {
                console.warn('Trait não reconhecido:', traitName, 'de:', fullTraitKey);
                continue;
            }

            if (!grouped[traitKey]) {
                grouped[traitKey] = [];
            }

            grouped[traitKey].push(response);
        }

        console.log('[groupResponsesByTrait] Traits encontradas:', Object.keys(grouped));
        console.log('[groupResponsesByTrait] Respostas por trait:',
            Object.entries(grouped).map(([k, v]) => ({ trait: k, count: v.length }))
        );

        return grouped;
    }

    /**
     * Calcula score bruto (média ponderada)
     */
    private calculateRawScore(responses: any[], weight: number = 1.0): number {
        if (responses.length === 0) return 0;

        const sum = responses.reduce((acc, r) => {
            // A resposta está no campo 'answer' (número 1-5)
            const value = r.answer || 3; // fallback para neutro se não houver resposta
            return acc + value;
        }, 0);

        const average = sum / responses.length;
        return average * weight;
    }

    /**
     * Converte resposta em número
     */
    private convertResponseToNumber(response: string): number {
        // Se já é número, retorna
        if (!isNaN(Number(response))) {
            return Number(response);
        }

        // Mapear respostas textuais para números
        const mapping: Record<string, number> = {
            'discordo_totalmente': 1,
            'discordo': 2,
            'neutro': 3,
            'concordo': 4,
            'concordo_totalmente': 5,
            // Adicionar outros mapeamentos conforme necessário
        };

        return mapping[response.toLowerCase()] || 3;
    }

    /**
     * Normaliza score para escala 0-100
     */
    private normalizeScore(rawScore: number): number {
        // Assumindo que rawScore vem de escala 1-5
        // Converter para 0-100
        return Math.round(((rawScore - 1) / 4) * 100);
    }

    /**
     * Determina o nível baseado nas faixas da config
     */
    private determineLevel(score: number, config: any): 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH' {
        if (score <= config.veryLowMax) return 'VERY_LOW';
        if (score <= config.lowMax) return 'LOW';
        if (score <= config.averageMax) return 'AVERAGE';
        if (score <= config.highMax) return 'HIGH';
        return 'VERY_HIGH';
    }

    /**
     * Obtém interpretação textual baseada no nível
     */
    private getInterpretation(level: string, trait: any): string {
        switch (level) {
            case 'VERY_LOW':
                return trait.veryLowText;
            case 'LOW':
                return trait.lowText;
            case 'AVERAGE':
                return trait.averageText;
            case 'HIGH':
                return trait.highText;
            case 'VERY_HIGH':
                return trait.veryHighText;
            default:
                return trait.averageText;
        }
    }
}

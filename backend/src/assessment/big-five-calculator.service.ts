import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QuestionResponse {
    questionId: string;
    value: number; // 1-5
}

export interface FacetScore {
    facet: string;
    rawScore: number;
    normalizedScore: number; // 0-100
}

export interface TraitScore {
    trait: string;
    rawScore: number;
    normalizedScore: number; // 0-100
    facets: FacetScore[];
    interpretation: string;
}

export interface BigFiveResult {
    totalQuestions: number;
    answeredQuestions: number;
    traits: TraitScore[];
    completionPercentage: number;
    timestamp: Date;
}

@Injectable()
export class BigFiveCalculatorService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calcula scores do Big Five baseado nas respostas
     */
    async calculateBigFiveScores(
        assessmentId: string,
        responses: QuestionResponse[]
    ): Promise<BigFiveResult> {
        // 1. Buscar todas as perguntas da avaliação
        const questions = await this.prisma.question.findMany({
            where: { assessmentModelId: assessmentId },
            select: {
                id: true,
                text: true,
                traitKey: true,
                weight: true
            }
        });

        // 2. Criar mapa de respostas para acesso rápido
        const responseMap = new Map<string, number>();
        responses.forEach(r => responseMap.set(r.questionId, r.value));

        // 3. Organizar perguntas por Traço e Faceta
        const traitFacetMap: Map<string, Map<string, any[]>> = new Map();

        questions.forEach(q => {
            if (!q.traitKey) return;

            const [trait, facet] = q.traitKey.split('::');
            if (!trait || !facet) return;

            // Detectar se é pergunta invertida
            const isInverted = q.text.includes('(INV)');

            if (!traitFacetMap.has(trait)) {
                traitFacetMap.set(trait, new Map());
            }

            const facetMap = traitFacetMap.get(trait)!;
            if (!facetMap.has(facet)) {
                facetMap.set(facet, []);
            }

            facetMap.get(facet)!.push({
                id: q.id,
                weight: q.weight,
                isInverted
            });
        });

        // 4. Calcular scores por traço
        const traitScores: TraitScore[] = [];

        traitFacetMap.forEach((facetMap, traitName) => {
            const facetScores: FacetScore[] = [];

            facetMap.forEach((questions, facetName) => {
                let facetSum = 0;
                let facetCount = 0;

                questions.forEach(q => {
                    const response = responseMap.get(q.id);
                    if (response !== undefined) {
                        // Inverter se necessário: 1→5, 2→4, 3→3, 4→2, 5→1
                        const adjustedValue = q.isInverted ? (6 - response) : response;
                        facetSum += adjustedValue * q.weight;
                        facetCount += q.weight;
                    }
                });

                if (facetCount > 0) {
                    const rawScore = facetSum / facetCount; // 1-5
                    const normalizedScore = ((rawScore - 1) / 4) * 100; // 0-100

                    facetScores.push({
                        facet: facetName,
                        rawScore: Math.round(rawScore * 100) / 100,
                        normalizedScore: Math.round(normalizedScore * 10) / 10
                    });
                }
            });

            // Score do traço = média das facetas
            if (facetScores.length > 0) {
                const traitRawScore = facetScores.reduce((sum, f) => sum + f.rawScore, 0) / facetScores.length;
                const traitNormalizedScore = facetScores.reduce((sum, f) => sum + f.normalizedScore, 0) / facetScores.length;

                traitScores.push({
                    trait: traitName,
                    rawScore: Math.round(traitRawScore * 100) / 100,
                    normalizedScore: Math.round(traitNormalizedScore * 10) / 10,
                    facets: facetScores,
                    interpretation: this.interpretScore(traitNormalizedScore)
                });
            }
        });

        return {
            totalQuestions: questions.length,
            answeredQuestions: responses.length,
            traits: traitScores,
            completionPercentage: Math.round((responses.length / questions.length) * 100),
            timestamp: new Date()
        };
    }

    /**
     * Interpreta score normalizado (0-100) em categorias
     */
    private interpretScore(score: number): string {
        if (score >= 80) return 'Muito Alto';
        if (score >= 60) return 'Alto';
        if (score >= 40) return 'Médio';
        if (score >= 20) return 'Baixo';
        return 'Muito Baixo';
    }

    /**
     * Gera descrição detalhada de cada traço
     */
    getTraitDescription(trait: string, score: number): string {
        const level = this.interpretScore(score);

        const descriptions: Record<string, Record<string, string>> = {
            'Abertura à Experiência': {
                'Muito Alto': 'Extremamente criativo, curioso e aberto a novas experiências. Busca constantemente novidades e valora diversidade.',
                'Alto': 'Criativo e disposto a explorar novas ideias. Aprecia inovação e mudanças.',
                'Médio': 'Equilibrado entre tradição e inovação. Aberto a mudanças quando necessário.',
                'Baixo': 'Prefere rotinas estabelecidas e métodos testados. Mais conservador em abordagens.',
                'Muito Baixo': 'Fortemente orientado a tradições e rotinas. Desconforto significativo com mudanças.'
            },
            'Conscienciosidade': {
                'Muito Alto': 'Extremamente organizado, disciplinado e orientado a objetivos. Altíssimo senso de responsabilidade.',
                'Alto': 'Organizado e confiável. Cumpre prazos e mantém compromissos consistentemente.',
                'Médio': 'Razoavelmente organizado com equilíbrio entre flexibilidade e estrutura.',
                'Baixo': 'Mais espontâneo que planejado. Pode ter dificuldade com organização.',
                'Muito Baixo': 'Muito espontâneo e desorganizado. Desafios significativos com planejamento e prazos.'
            },
            'Extroversão': {
                'Muito Alto': 'Extremamente sociável e energético. Prospera em interações sociais e ambientes estimulantes.',
                'Alto': 'Sociável e assertivo. Gosta de trabalhar com pessoas e em equipes.',
                'Médio': 'Equilibrado entre interação social e trabalho independente.',
                'Baixo': 'Mais reservado e introspectivo. Prefere trabalho individual.',
                'Muito Baixo': 'Muito reservado e quieto. Forte preferência por trabalho solitário.'
            },
            'Amabilidade': {
                'Muito Alto': 'Extremamente empático, cooperativo e altruísta. Prioriza harmonia nas relações.',
                'Alto': 'Cooperativo e confiável. Valoriza trabalho em equipe e relações positivas.',
                'Médio': 'Equilibrado entre cooperação e assertividade própria.',
                'Baixo': 'Mais competitivo e direto. Foca em resultados acima de relações.',
                'Muito Baixo': 'Muito competitivo e cético. Pode ser percebido como difícil em trabalho colaborativo.'
            },
            'Estabilidade Emocional': {
                'Muito Alto': 'Extremamente calmo e resiliente. Rara ansiedade mesmo sob alta pressão.',
                'Alto': 'Emocionalmente estável. Lida bem com estresse e críticas.',
                'Médio': 'Resiliência moderada. Geralmente estável com momentos de tensão.',
                'Baixo': 'Mais sensível a estresse e ansiedade. Pode ter variações de humor.',
                'Muito Baixo': 'Muito sensível emocionalmente. Significativa dificuldade sob pressão ou críticas.'
            }
        };

        return descriptions[trait]?.[level] || 'Descrição não disponível.';
    }

    /**
     * Gera recomendações de desenvolvimento baseadas nos scores
     */
    generateDevelopmentRecommendations(results: BigFiveResult): string[] {
        const recommendations: string[] = [];

        results.traits.forEach(trait => {
            const score = trait.normalizedScore;

            // Recomendações baseadas em scores extremos
            if (trait.trait === 'Abertura à Experiência' && score < 40) {
                recommendations.push('Considere participar de workshops ou cursos fora da sua área de expertise para expandir horizontes.');
            }

            if (trait.trait === 'Conscienciosidade' && score < 40) {
                recommendations.push('Utilize ferramentas de gestão de tarefas (como Trello ou Notion) para melhorar organização.');
            }

            if (trait.trait === 'Extroversão' && score < 40) {
                recommendations.push('Pratique técnicas de comunicação e apresentação para aumentar confiança em grupos.');
            }

            if (trait.trait === 'Amabilidade' && score > 80) {
                recommendations.push('Trabalhe assertividade - nem sempre concordar com tudo gera melhores resultados.');
            }

            if (trait.trait === 'Estabilidade Emocional' && score < 40) {
                recommendations.push('Considere práticas de mindfulness ou técnicas de gestão de estresse.');
            }
        });

        return recommendations;
    }
}

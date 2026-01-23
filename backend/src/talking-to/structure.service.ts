import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TalkingToStructureService {
    constructor(private prisma: PrismaService) { }

    async getAllDimensions() {
        return this.prisma.talkingToDimension.findMany({
            include: { facets: true },
            orderBy: { name: 'asc' }
        });
    }

    async createDimension(data: any) {
        return this.prisma.talkingToDimension.create({
            data: {
                key: data.key,
                name: data.name,
                dichotomy: data.dichotomy,
                questionTraitLow: data.questionTraitLow,
                questionTraitHigh: data.questionTraitHigh,
                color: data.color,
                minRange: data.minRange,
                maxRange: data.maxRange
            }
        });
    }

    async updateDimension(id: string, data: any) {
        return this.prisma.talkingToDimension.update({
            where: { id },
            data
        });
    }

    async deleteDimension(id: string) {
        return this.prisma.talkingToDimension.delete({
            where: { id }
        });
    }

    // Facets
    async createFacet(dimensionId: string, data: any) {
        return this.prisma.talkingToFacet.create({
            data: {
                dimensionId,
                dichotomy: data.dichotomy,
                facetLow: data.facetLow,
                facetHigh: data.facetHigh,
                concept: data.concept,
                key: data.key,
                name: data.name
            }
        });
    }

    async updateFacet(id: string, data: any) {
        return this.prisma.talkingToFacet.update({
            where: { id },
            data
        });
    }

    async deleteFacet(id: string) {
        return this.prisma.talkingToFacet.delete({
            where: { id }
        });
    }

    // Seeding logic adapted from script
    async seedStructure() {
        const DATA = [
            {
                key: 'E',
                name: 'EXTROVERSÃO',
                dichotomy: 'Introversão-Extroversão',
                low: 'INTROVERTIDO',
                high: 'EXTROVERTIDO',
                color: '#F59E0B',
                facets: [
                    { dichotomy: 'ouvinte-falante', low: 'ouvinte', high: 'falante', concept: 'comunicação', key: 'COMMUNICATION' },
                    { dichotomy: 'seletivo-sociável', low: 'seletivo', high: 'sociável', concept: 'interação social', key: 'SOCIAL_INTERACTION' },
                    { dichotomy: 'contido-afirmativo', low: 'contido', high: 'afirmativo', concept: 'autoridade', key: 'AUTHORITY' },
                    { dichotomy: 'reflexivo-ativo', low: 'reflexivo', high: 'ativo', concept: 'orientação para ação', key: 'ACTION_ORIENTATION' }
                ]
            },
            {
                key: 'A',
                name: 'AMABILIDADE',
                dichotomy: 'Lógico-Sentimental',
                low: 'LÓGICO',
                high: 'SENTIMENTAL',
                color: '#10B981',
                facets: [
                    { dichotomy: 'crítico-tolerante', low: 'crítico', high: 'tolerante', concept: 'lógica', key: 'LOGIC' },
                    { dichotomy: 'independente-conectado', low: 'independente', high: 'conectado', concept: 'independência pessoal', key: 'INDEPENDENCE' },
                    { dichotomy: 'competitivo-colaborativo', low: 'competitivo', high: 'colaborativo', concept: 'competitividade', key: 'COMPETITIVENESS' }
                ]
            },
            {
                key: 'C',
                name: 'ESTRUTURA',
                dichotomy: 'Adaptável-Estrutura',
                low: 'ADAPTÁVEL',
                high: 'ESTRUTURADO',
                color: '#3B82F6',
                facets: [
                    { dichotomy: 'aventureiro-planejado', low: 'aventureiro', high: 'planejado', concept: 'estilo de planejamento', key: 'PLANNING' },
                    { dichotomy: 'espontâneo-disciplinado', low: 'espontâneo', high: 'disciplinado', concept: 'disciplina', key: 'DISCIPLINE' },
                    { dichotomy: 'flexível-persistente', low: 'flexível', high: 'persistente', concept: 'persistência', key: 'PERSISTENCE' }
                ]
            },
            {
                key: 'O',
                name: 'ABERTURA',
                dichotomy: 'Concreto-Abstrato',
                low: 'CONCRETO',
                high: 'ABSTRATO',
                color: '#8B5CF6',
                facets: [
                    { dichotomy: 'realista-imaginativo', low: 'realista', high: 'imaginativo', concept: 'imaginação', key: 'IMAGINATION' },
                    { dichotomy: 'prático-conceitual', low: 'prático', high: 'conceitual', concept: 'intelectualidade', key: 'INTELLECT' },
                    { dichotomy: 'conservador-aberto', low: 'conservador', high: 'aberto', concept: 'abertura ao novo', key: 'OPENNESS_TO_NEW' }
                ]
            },
            {
                key: 'N',
                name: 'ESTABILIDADE EMOCIONAL',
                dichotomy: 'Emoção-Razão',
                low: 'EMOCIONAL',
                high: 'RACIONAL',
                color: '#EF4444',
                facets: [
                    { dichotomy: 'inquieto-despreocupado', low: 'inquieto', high: 'despreocupado', concept: 'confiança', key: 'CONFIDENCE' },
                    { dichotomy: 'inseguro-autoconfiante', low: 'inseguro', high: 'autoconfiante', concept: 'autoconfiança', key: 'SELF_CONFIDENCE' },
                    { dichotomy: 'irritável-paciente', low: 'irritável', high: 'paciente', concept: 'temperamento', key: 'TEMPERAMENT' },
                    { dichotomy: 'reativo-controlado', low: 'reativo', high: 'controlado', concept: 'controlado', key: 'CONTROL' }
                ]
            }
        ];

        let createdCount = 0;

        for (const dim of DATA) {
            const dimension = await this.prisma.talkingToDimension.upsert({
                where: { key: dim.key },
                update: {
                    name: dim.name,
                    dichotomy: dim.dichotomy,
                    questionTraitLow: dim.low,
                    questionTraitHigh: dim.high,
                    color: dim.color
                },
                create: {
                    key: dim.key,
                    name: dim.name,
                    dichotomy: dim.dichotomy,
                    questionTraitLow: dim.low,
                    questionTraitHigh: dim.high,
                    color: dim.color
                }
            });

            for (const facet of dim.facets) {
                const existing = await this.prisma.talkingToFacet.findFirst({
                    where: { dimensionId: dimension.id, dichotomy: facet.dichotomy }
                });

                if (existing) {
                    await this.prisma.talkingToFacet.update({
                        where: { id: existing.id },
                        data: {
                            facetLow: facet.low,
                            facetHigh: facet.high,
                            concept: facet.concept,
                            key: facet.key,
                        }
                    });
                } else {
                    await this.prisma.talkingToFacet.create({
                        data: {
                            dimensionId: dimension.id,
                            dichotomy: facet.dichotomy,
                            facetLow: facet.low,
                            facetHigh: facet.high,
                            concept: facet.concept,
                            key: facet.key,
                            name: facet.dichotomy
                        }
                    });
                }
            }
            createdCount++;
        }
        return { message: `Estrutura base (5 Dimensões e suas Facetas) sincronizada.` };
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InterpretationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Gera relatório completo baseado em scores calculados e config
     */
    async generateFullReport(assignmentId: string, tenantId: string) {
        // Buscar configuração ativa
        const config = await this.prisma.bigFiveConfig.findFirst({
            where: {
                tenantId: tenantId,
                isActive: true
            },
            include: {
                interpretativeTexts: true,
                traits: {
                    include: {
                        facets: true
                    }
                }
            }
        });

        if (!config) {
            throw new Error('Configuração Big Five não encontrada');
        }

        // Buscar assignment com respostas
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: {
                    include: {
                        question: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!assignment) {
            throw new Error('Assignment não encontrado');
        }

        // Agrupar respostas por trait
        const responsesByTrait = this.groupResponsesByTrait(assignment.responses);

        const report = {
            userName: assignment.user.name || assignment.user.email,
            completedAt: assignment.completedAt,
            config: {
                name: config.name,
                primaryColor: config.primaryColor,
                companyLogo: config.companyLogo,
                reportHeader: config.reportHeader,
                reportFooter: config.reportFooter
            },
            traits: [] as any[]
        };

        // Gerar análise para cada trait
        for (const trait of config.traits) {
            const traitResponses = responsesByTrait[trait.traitKey] || [];

            // Calcular score
            const rawScore = this.calculateScore(traitResponses, trait.weight);
            const normalizedScore = this.normalizeScore(rawScore);

            // Determinar nível
            const level = this.determineLevel(normalizedScore, config);

            // Obter interpretação
            const interpretation = this.getInterpretation(level, trait);

            // Calcular facetas
            const facets = trait.facets.map(facet => {
                const facetResponses = traitResponses.filter(r => {
                    try {
                        const metadata = JSON.parse(r.question.metadata as string);
                        return metadata.facet === facet.facetKey;
                    } catch {
                        return false;
                    }
                });

                const score = this.calculateScore(facetResponses, facet.weight);
                return {
                    name: facet.name,
                    score: this.normalizeScore(score),
                    description: facet.description
                };
            });

            
            // Mapear Level para Enum
            const levelMap: Record<string, string> = {
                'Muito Baixo': 'VERY_LOW',
                'Baixo': 'LOW',
                'Médio': 'AVERAGE',
                'Alto': 'HIGH',
                'Muito Alto': 'VERY_HIGH'
            };
            const rangeEnum = levelMap[level] || 'AVERAGE';
            
            // Filtrar textos da config
            // @ts-ignore
            const relevantTexts = config.interpretativeTexts ? config.interpretativeTexts.filter((t: any) => 
                t.traitKey === trait.traitKey && t.scoreRange === rangeEnum
            ) : [];
    
            report.traits.push({
                key: trait.traitKey,
                name: trait.name,
                icon: trait.icon,
                description: trait.description,
                score: normalizedScore,
                level: level,
                interpretation: interpretation,
                facets: facets,

                customTexts: {
                    summary: relevantTexts.find((t: any) => t.category === 'SUMMARY')?.text,
                    practicalImpact: relevantTexts.filter((t: any) => t.category === 'PRACTICAL_IMPACT').map((t: any) => ({ context: t.context, text: t.text })),
                    expertSynthesis: relevantTexts.find((t: any) => t.category === 'EXPERT_SYNTHESIS')?.text,
                    expertHypothesis: relevantTexts.filter((t: any) => t.category === 'EXPERT_HYPOTHESIS').map((t: any) => ({ type: t.context, text: t.text }))
                },
    
            });
        }

        return report;
    }

    /**
     * Agrupa respostas por trait
     */
    private groupResponsesByTrait(responses: any[]): Record<string, any[]> {
        const grouped: Record<string, any[]> = {};

        for (const response of responses) {
            if (!response.question.metadata) continue;

            try {
                const metadata = JSON.parse(response.question.metadata as string);
                const traitKey = metadata.trait || metadata.dimension;

                if (!traitKey) continue;

                if (!grouped[traitKey]) {
                    grouped[traitKey] = [];
                }

                grouped[traitKey].push(response);
            } catch (e) {
                console.error('Erro ao parsear metadata:', e);
            }
        }

        return grouped;
    }

    /**
     * Calcula score médio
     */
    private calculateScore(responses: any[], weight: number = 1.0): number {
        if (responses.length === 0) return 0;

        const sum = responses.reduce((acc, r) => {
            const value = this.convertResponseToNumber(r.response);
            return acc + value;
        }, 0);

        return (sum / responses.length) * weight;
    }

    /**
     * Converte resposta para número
     */
    private convertResponseToNumber(response: string): number {
        if (!isNaN(Number(response))) {
            return Number(response);
        }

        const mapping: Record<string, number> = {
            'discordo_totalmente': 1,
            'discordo_parcialmente': 2,
            'discordo': 2,
            'neutro': 3,
            'indiferente': 3,
            'concordo': 4,
            'concordo_parcialmente': 4,
            'concordo_totalmente': 5,
        };

        return mapping[response.toLowerCase()] || 3;
    }

    /**
     * Normaliza para 0-100
     */
    private normalizeScore(rawScore: number): number {
        return Math.round(((rawScore - 1) / 4) * 100);
    }

    /**
     * Determina nível baseado na config
     */
    private determineLevel(score: number, config: any): string {
        if (score <= config.veryLowMax) return 'Muito Baixo';
        if (score <= config.lowMax) return 'Baixo';
        if (score <= config.averageMax) return 'Médio';
        if (score <= config.highMax) return 'Alto';
        return 'Muito Alto';
    }

    /**
     * Obtém interpretação
     */
    private getInterpretation(level: string, trait: any): string {
        switch (level) {
            case 'Muito Baixo':
                return trait.veryLowText;
            case 'Baixo':
                return trait.lowText;
            case 'Médio':
                return trait.averageText;
            case 'Alto':
                return trait.highText;
            case 'Muito Alto':
                return trait.veryHighText;
            default:
                return trait.averageText;
        }
    }
}

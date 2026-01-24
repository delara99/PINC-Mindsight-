import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin/seed')
@UseGuards(AuthGuard('jwt'))
export class SeedController {
    constructor(private prisma: PrismaService) { }

    @Post('calculation-engine')
    async seedCalculationEngine(@Request() req) {
        // Verificar se é admin
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new Error('Acesso negado');
        }

        const results = {
            formulas: 0,
            classifications: 0,
            mappings: 0
        };

        // 1. FÓRMULAS
        const formulas = [
            {
                name: 'REVERSE_SCORING_1_6',
                type: 'TRANSFORMATION',
                formula: { expression: '7 - x', description: 'Inverte escala 1-6' },
                minValue: 1,
                maxValue: 6,
                precision: 0,
                description: 'Inversão de questões reversas na escala Likert 1-6',
                example: 'Se resposta = 1, então invertido = 6'
            },
            {
                name: 'NORMALIZATION_1_6_TO_0_100',
                type: 'TRANSFORMATION',
                formula: { expression: '((x - 1) / 5) * 100', description: 'Normaliza 1-6 para 0-100' },
                minValue: 0,
                maxValue: 100,
                precision: 2,
                description: 'Converte escala Likert 1-6 para percentual 0-100',
                example: 'Se resposta = 6, então normalizado = 100'
            },
            {
                name: 'FACET_WEIGHTED_AVERAGE',
                type: 'AGGREGATION',
                formula: { expression: 'sum(score * weight) / sum(weight)', description: 'Média ponderada' },
                minValue: 0,
                maxValue: 100,
                precision: 2,
                description: 'Calcula média ponderada das questões de uma faceta',
                example: 'Faceta com 3 questões (scores: 80, 90, 70; pesos: 1, 1, 1) = 80'
            },
            {
                name: 'DIMENSION_SIMPLE_AVERAGE',
                type: 'AGGREGATION',
                formula: { expression: 'sum(facet_scores) / count(facets)', description: 'Média simples' },
                minValue: 0,
                maxValue: 100,
                precision: 2,
                description: 'Calcula média simples das facetas de uma dimensão',
                example: 'Dimensão com 2 facetas (scores: 80, 90) = 85'
            }
        ];

        for (const formula of formulas) {
            await this.prisma.calculationFormula.upsert({
                where: { name: formula.name },
                update: formula,
                create: formula
            });
            results.formulas++;
        }

        // 2. CLASSIFICAÇÕES
        const dimensions = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'];
        const levels = [
            { level: 'VERY_LOW', label: 'Muito Baixo', minScore: 0, maxScore: 20, color: '#EF4444', priority: 1 },
            { level: 'LOW', label: 'Baixo', minScore: 21, maxScore: 40, color: '#F97316', priority: 2 },
            { level: 'AVERAGE', label: 'Médio', minScore: 41, maxScore: 60, color: '#6B7280', priority: 3 },
            { level: 'HIGH', label: 'Alto', minScore: 61, maxScore: 80, color: '#3B82F6', priority: 4 },
            { level: 'VERY_HIGH', label: 'Muito Alto', minScore: 81, maxScore: 100, color: '#10B981', priority: 5 }
        ];

        for (const dimension of dimensions) {
            for (const level of levels) {
                await this.prisma.calculationClassification.upsert({
                    where: {
                        dimension_level: {
                            dimension,
                            level: level.level
                        }
                    },
                    update: {
                        minScore: level.minScore,
                        maxScore: level.maxScore,
                        label: level.label,
                        color: level.color,
                        priority: level.priority
                    },
                    create: {
                        dimension,
                        level: level.level,
                        minScore: level.minScore,
                        maxScore: level.maxScore,
                        label: level.label,
                        description: `${level.label} nível de ${dimension}`,
                        color: level.color,
                        priority: level.priority
                    }
                });
                results.classifications++;
            }
        }

        // 3. MAPEAMENTOS DE QUESTÕES
        const mappings = [
            // OPENNESS (O) - 26 questões
            ...Array.from({ length: 26 }, (_, i) => ({
                questionId: i + 1,
                dimension: 'O',
                facet: ['FANTASIA', 'ESTÉTICA', 'SENTIMENTOS', 'AÇÕES', 'IDEIAS', 'VALORES'][Math.floor(i / 4.33)],
                weight: 1.0,
                isReversed: i % 2 === 1
            })),
            // CONSCIENTIOUSNESS (C) - 25 questões
            ...Array.from({ length: 25 }, (_, i) => ({
                questionId: 27 + i,
                dimension: 'C',
                facet: ['COMPETÊNCIA', 'ORDEM', 'SENSO_DEVER', 'ESFORÇO', 'AUTODISCIPLINA', 'PONDERAÇÃO'][Math.floor(i / 4.17)],
                weight: 1.0,
                isReversed: i % 2 === 0
            })),
            // EXTRAVERSION (E) - 25 questões
            ...Array.from({ length: 25 }, (_, i) => ({
                questionId: 52 + i,
                dimension: 'E',
                facet: ['ACOLHIMENTO', 'GREGARISMO', 'ASSERTIVIDADE', 'ATIVIDADE', 'BUSCA_EXCITAÇÃO', 'EMOÇÕES_POSITIVAS'][Math.floor(i / 4.17)],
                weight: 1.0,
                isReversed: i % 2 === 1
            })),
            // AGREEABLENESS (A) - 25 questões
            ...Array.from({ length: 25 }, (_, i) => ({
                questionId: 77 + i,
                dimension: 'A',
                facet: ['CONFIANÇA', 'FRANQUEZA', 'ALTRUÍSMO', 'COMPLACÊNCIA', 'MODÉSTIA', 'SENSIBILIDADE'][Math.floor(i / 4.17)],
                weight: 1.0,
                isReversed: i % 2 === 0
            })),
            // NEUROTICISM (N) - 25 questões
            ...Array.from({ length: 25 }, (_, i) => ({
                questionId: 102 + i,
                dimension: 'N',
                facet: ['ANSIEDADE', 'RAIVA', 'DEPRESSÃO', 'AUTOCONSCIÊNCIA', 'IMODERAÇÃO', 'VULNERABILIDADE'][Math.floor(i / 4.17)],
                weight: 1.0,
                isReversed: i % 2 === 1
            }))
        ];

        for (const mapping of mappings) {
            await this.prisma.calculationQuestionMapping.upsert({
                where: {
                    questionId_dimension: {
                        questionId: mapping.questionId,
                        dimension: mapping.dimension
                    }
                },
                update: mapping,
                create: {
                    ...mapping,
                    questionText: `Questão ${mapping.questionId}`,
                    description: `Questão ${mapping.questionId} - ${mapping.dimension} - ${mapping.facet}`
                }
            });
            results.mappings++;
        }

        return {
            success: true,
            message: 'Motor de Cálculo populado com sucesso!',
            results
        };
    }
}

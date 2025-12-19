import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCalculationService } from './score-calculation.service';

/**
 * CONTROLLER DE DEBUG - SEM AUTENTICAÇÃO (TEMPORÁRIO)
 * Usar apenas para investigar problemas de relatórios
 * REMOVER EM PRODUÇÃO APÓS DEBUG
 */
@Controller('debug-reports')
export class DebugReportsController {
    constructor(
        private prisma: PrismaService,
        private scoreCalculation: ScoreCalculationService
    ) { }

    /**
     * Buscar assignments por email do usuário
     */
    @Get('user/:email')
    async getUserAssignments(@Param('email') email: string) {
        const user = await this.prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            return { error: 'Usuário não encontrado', email };
        }

        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: { userId: user.id },
            include: {
                assessment: true,
                config: true
            },
            orderBy: {
                completedAt: 'desc'
            }
        });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                tenantId: user.tenantId
            },
            assignmentsCount: assignments.length,
            assignments: assignments.map(a => ({
                id: a.id,
                assessmentName: a.assessment.title,
                completedAt: a.completedAt,
                configId: a.configId,
                configName: a.config?.name || 'SEM CONFIG',
                hasConfig: !!a.configId,
                status: a.status
            }))
        };
    }

    /**
     * Ver detalhes de um assignment específico
     */
    @Get('assignment/:assignmentId')
    async getAssignmentDetails(@Param('assignmentId') assignmentId: string) {
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        tenantId: true
                    }
                },
                assessment: true,
                config: {
                    include: {
                        traits: true
                    }
                }
            }
        });

        if (!assignment) {
            return { error: 'Assignment não encontrado' };
        }

        try {
            const { scores, config } = await this.scoreCalculation.calculateScores(assignmentId);

            return {
                assignment: {
                    id: assignment.id,
                    userId: assignment.userId,
                    userName: assignment.user.name,
                    userEmail: assignment.user.email,
                    completedAt: assignment.completedAt,
                    configId: assignment.configId,
                    responsesCount: assignment.responses.length,
                    status: assignment.status
                },
                config: {
                    id: config.id,
                    name: config.name,
                    isActive: config.isActive,
                    traitsCount: config.traits.length,
                    traits: config.traits.map(t => ({
                        key: t.traitKey,
                        name: t.name,
                        weight: t.weight
                    }))
                },
                scores: Object.values(scores).map(s => ({
                    trait: s.traitName,
                    score: s.normalizedScore,
                    level: s.level,
                    interpretation: s.interpretation?.substring(0, 100) + '...',
                    facets: s.facets?.map(f => ({
                        name: f.facetName,
                        score: f.score
                    })) || []
                }))
            };
        } catch (error) {
            return {
                error: 'Erro ao calcular scores',
                message: error.message,
                assignment: {
                    id: assignment.id,
                    configId: assignment.configId,
                    responsesCount: assignment.responses.length
                }
            };
        }
    }

    /**
     * Health check - Verificar se o código novo está deployado
     */
    @Get('health')
    async healthCheck() {
        return {
            status: 'OK',
            version: '2.2-in-progress-fix',
            timestamp: new Date().toISOString(),
            message: 'Debug active. Fixes: Scores, Facets UI, Auto-Assign (IN_PROGRESS).'
        };
    }

    /**
     * DEBUG: Listar questões e respostas de um assignment para ver os traitKeys brutos
     * GET /api/v1/debug-reports/questions/:assignmentId
     */
    @Get('questions/:assignmentId')
    async listQuestionsWithTraits(@Param('assignmentId') assignmentId: string) {
        if (!this.prisma) return { error: 'Prisma not available' };

        const responses = await this.prisma.assessmentResponse.findMany({
            where: { assignmentId },
            include: {
                question: true
            }
        });

        return {
            total: responses.length,
            samples: responses.map(r => ({
                qId: r.questionId,
                text: r.question.text,
                traitKey: r.question.traitKey,
                answer: r.answer
            }))
        };
    }

    /**
     * CORREÇÃO: Deduplicar Traits e Facetas em uma configuração
     * POST /api/v1/debug-reports/deduplicate/:configId
     */
    @Post('deduplicate/:configId')
    async deduplicateConfig(@Param('configId') configId: string) {
        if (!this.prisma) return { error: 'Prisma not available' };

        const config = await this.prisma.bigFiveConfig.findUnique({
            where: { id: configId },
            include: {
                traits: {
                    include: { facets: true }
                }
            }
        });

        if (!config) return { error: 'Config not found' };

        const keptTraits = [];
        const removedTraits = [];
        const errors = [];

        // Agrupar traits por KEY
        const traitsByKey: Record<string, any[]> = {};
        for (const trait of config.traits) {
            if (!traitsByKey[trait.traitKey]) {
                traitsByKey[trait.traitKey] = [];
            }
            traitsByKey[trait.traitKey].push(trait);
        }

        // Processar duplicatas
        for (const key of Object.keys(traitsByKey)) {
            const group = traitsByKey[key];
            if (group.length > 1) {
                // Ordenar por número de facetas (manter o mais completo) e depois data
                group.sort((a, b) => b.facets.length - a.facets.length);

                const toKeep = group[0];
                const toRemove = group.slice(1);

                keptTraits.push(`${toKeep.name} (${toKeep.id}) - Facets: ${toKeep.facets.length} `);

                for (const traitToRemove of toRemove) {
                    try {
                        // Deletar facetas primeiro
                        await this.prisma.bigFiveFacetConfig.deleteMany({
                            where: { traitId: traitToRemove.id }
                        });
                        // Deletar trait
                        await this.prisma.bigFiveTraitConfig.delete({
                            where: { id: traitToRemove.id }
                        });
                        removedTraits.push(`${traitToRemove.name} (${traitToRemove.id})`);
                    } catch (e) {
                        errors.push(`Erro ao remover ${traitToRemove.id}: ${e.message} `);
                    }
                }
            } else {
                keptTraits.push(`${group[0].name} (Unique)`);
            }
        }

        return {
            message: 'Deduplicação concluída',
            stats: {
                kept: keptTraits.length,
                removed: removedTraits.length,
                errors: errors.length
            },
            details: {
                keptTraits,
                removedTraits,
                errors
            }
        };
    }

    /**
     * DEBUG: Listar todas as configs do banco (SYSTEM ADMIN ONLY)
     * GET /api/v1/debug-reports/configs
     */
    @Get('configs')
    async listAllConfigs() {
        if (!this.prisma) {
            return { error: 'Prisma Service not available' };
        }

        try {
            const configs = await this.prisma.bigFiveConfig.findMany({
                include: {
                    _count: { select: { traits: true } }
                }
            });

            // Retornar dados para debug
            return configs.map(c => ({
                id: c.id,
                name: c.name,
                isActive: c.isActive,
                tenantId: c.tenantId, // Mostrar o tenantId real para compararmos
                traitsCount: c._count?.traits
            }));
        } catch (e) {
            return { error: e.message };
        }
    }
}

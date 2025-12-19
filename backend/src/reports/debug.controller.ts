import { Controller, Get, Param } from '@nestjs/common';
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
                    interpretation: s.interpretation?.substring(0, 100) + '...'
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
}

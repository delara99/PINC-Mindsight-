
import { Controller, Get, Param, Query, Res, StreamableFile, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { InterpretationService } from './interpretation.service';
import { PdfService } from './pdf.service';
import { ScoreCalculationService } from './score-calculation.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
    constructor(
        private analytics: AnalyticsService,
        private interpretation: InterpretationService,
        private pdf: PdfService,
        private scoreCalculation: ScoreCalculationService,
        private prisma: PrismaService
    ) { }

    // @Get('interpretation')
    // async getInterpretation(@Query('scores') scoresStr: string) {
    //     const scores = JSON.parse(scoresStr);
    //     return this.interpretation.generateFullReport(scores)
    // }

    @Get('fit/:profileId')
    async getFit(@Param('profileId') profileId: string, @Query('scores') scoresStr: string) {
        const scores = JSON.parse(scoresStr);
        return {
            fit: await this.analytics.calculateJobFit(scores, profileId)
        };
    }

    /**
     * ✅ CORREÇÃO: Download de relatório com dados REAIS
     */
    @Get('download/:assignmentId')
    async downloadReport(
        @Param('assignmentId') assignmentId: string,
        @Res({ passthrough: true }) res: Response,
        @Request() req
    ) {
        // Buscar assignment completo com respostas e usuário
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
                        id: true,
                        name: true,
                        email: true,
                        tenantId: true
                    }
                },
                assessment: true
            }
        });

        if (!assignment) {
            throw new Error('Assignment não encontrado');
        }

        // Verificar permissão (apenas o próprio usuário ou admin)
        const isOwner = assignment.userId === req.user.userId;
        const isAdmin = req.user.role === 'TENANT_ADMIN' || req.user.role === 'SUPER_ADMIN';

        if (!isOwner && !isAdmin) {
            throw new Error('Acesso negado');
        }

        // ✅ Gerar interpretação REAL baseada na config do tenant
        const report = await this.interpretation.generateFullReport(
            assignmentId,
            assignment.user.tenantId
        );

        // Calcular scores reais
        const { scores, config } = await this.scoreCalculation.calculateScores(assignmentId);

        // Preparar dados para PDF
        const pdfData = {
            userName: assignment.user.name || assignment.user.email,
            completedAt: assignment.completedAt,
            config: {
                name: config.name,
                primaryColor: config.primaryColor,
                companyLogo: config.companyLogo,
                reportHeader: config.reportHeader,
                reportFooter: config.reportFooter
            },
            traits: Object.values(scores).map(score => {
                const enriched = report.traits.find((t: any) => t.key === score.traitKey);
                return {
                    key: score.traitKey,
                    name: score.traitName,
                    score: score.normalizedScore,
                    level: score.level,
                    interpretation: score.interpretation,
                    facets: score.facets,
                    customTexts: enriched?.customTexts
                };
            }),
            report: report
        };

        // Gerar PDF
        const pdfBuffer = await this.pdf.generatePdf(pdfData);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="relatorio-${assignment.user.name || 'usuario'}-${assignmentId.substring(0, 8)}.pdf"`,
        });

        return new StreamableFile(pdfBuffer);
    }

    /**
     * DEBUG: Verificar dados do assignment
     */
    @Get('debug/:assignmentId')
    async debugAssignment(
        @Param('assignmentId') assignmentId: string,
        @Request() req
    ) {
        // Buscar assignment completo
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
                        id: true,
                        name: true,
                        email: true,
                        tenantId: true
                    }
                },
                assessment: true,
                config: {
                    include: {
                        traits: {
                            include: {
                                facets: true
                            }
                        }
                    }
                }
            }
        });

        if (!assignment) {
            return { error: 'Assignment não encontrado' };
        }

        // Calcular scores
        const { scores, config } = await this.scoreCalculation.calculateScores(assignmentId);

        return {
            assignment: {
                id: assignment.id,
                userId: assignment.userId,
                userName: assignment.user.name,
                userEmail: assignment.user.email,
                completedAt: assignment.completedAt,
                configId: assignment.configId,
                responsesCount: assignment.responses.length
            },
            config: {
                id: config.id,
                name: config.name,
                isActive: config.isActive,
                traitsCount: config.traits.length
            },
            scores: scores,
            rawResponses: assignment.responses.map(r => ({
                questionId: r.questionId,
                questionText: r.question.text,
                answer: r.answer,
                traitKey: r.question.traitKey
            }))
        };
    }

    /**
     * DEBUG: Buscar assignments por email do usuário (SEM AUTENTICAÇÃO - TEMPORÁRIO)
     */
    @Get('debug-user/:email')
    async debugUserAssignments(
        @Param('email') email: string
    ) {
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
     * DEBUG: Ver detalhes de um assignment específico (SEM AUTENTICAÇÃO - TEMPORÁRIO)
     */
    @Get('debug-assignment/:assignmentId')
    async debugAssignmentPublic(
        @Param('assignmentId') assignmentId: string
    ) {
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

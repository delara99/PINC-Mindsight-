
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
            traits: Object.values(scores).map(score => ({
                key: score.traitKey,
                name: score.traitName,
                score: score.normalizedScore,
                level: score.level,
                interpretation: score.interpretation,
                facets: score.facets
            })),
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
}

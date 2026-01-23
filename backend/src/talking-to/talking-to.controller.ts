import { Controller, Post, Body, Get, UseGuards, Request, NotFoundException, UnauthorizedException, Param, Res, Delete } from '@nestjs/common';
import { TalkingToService, TalkingToInput } from './talking-to.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCalculationService } from '../reports/score-calculation.service';
import { PdfService } from '../reports/pdf.service';
import { Response } from 'express';

@Controller('talking-to')
export class TalkingToController {
    constructor(
        private readonly service: TalkingToService,
        private readonly prisma: PrismaService,
        private readonly scoreService: ScoreCalculationService,
        private readonly pdfService: PdfService
    ) { }

    // --- ADMIN ENDPOINTS (Gerenciamento do Motor) ---

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/texts')
    async getAllTexts(@Request() req) {
        // TODO: Mover validação de admin para Guard
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
        return this.prisma.talkingToMessage.findMany({
            orderBy: [{ group: 'asc' }, { key: 'asc' }]
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/texts')
    async updateText(@Request() req, @Body() body: { id?: string, content: string, key?: string, group?: string, description?: string }) {
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }

        // CREATE OR UPDATE
        if (body.id) {
            return this.prisma.talkingToMessage.update({
                where: { id: body.id },
                data: { content: body.content }
            });
        } else {
            // Create Logic
            return this.prisma.talkingToMessage.create({
                data: {
                    key: body.key || `CUSTOM_${Date.now()}`,
                    group: body.group || 'GENERAL',
                    description: body.description,
                    content: body.content
                }
            });
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('admin/texts/:id')
    async deleteText(@Request() req, @Param('id') id: string) {
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
        return this.prisma.talkingToMessage.delete({
            where: { id }
        });
    }

    // Endpoint para popular o banco inicialmente (Admin pode chamar quando quiser resetar/criar defaults)
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/seed')
    async seedDefaults(@Request() req) {
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
        // 1. Simulações Dummy (Garantem dimensões básicas)
        const dummy: TalkingToInput = { O: 10, C: 10, E: 10, A: 10, N: 90 };
        await this.service.analyzeProfile(dummy);
        await this.service.analyzeProfile({ O: 90, C: 90, E: 90, A: 90, N: 10 });
        await this.service.analyzeProfile({ O: 50, C: 50, E: 50, A: 50, N: 50 });

        // 2. Seed Exaustivo de Fine-Tuned (Garante todas as combinações)
        const count = await this.service.seedAllDefinitions();

        return { message: `Sincronização concluída. ${count} interpretações finas verificadas/criadas.` };
    }

    // Endpoint público ou protegido para testar o motor
    @Post('simulate')
    simulate(@Body() scores: TalkingToInput) {
        return this.service.analyzeProfile(scores);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('history')
    async getHistory(@Request() req) {
        const userId = req.user.userId;
        // ... (Mesma lógica de antes)
        const history = await this.prisma.assessmentAssignment.findMany({
            where: {
                userId: userId,
                status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' },
            select: {
                id: true,
                completedAt: true,
                assessment: {
                    select: { title: true }
                }
            }
        });
        return history;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('report/:id')
    async getReportById(@Request() req, @Param('id') id: string) {
        const userId = req.user.userId;

        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: {
                id: id,
                userId: userId,
                status: 'COMPLETED'
            },
            include: { responses: { include: { question: true } }, assessment: true, config: true }
        });

        if (!assignment) {
            throw new NotFoundException('Relatório não encontrado ou acesso negado.');
        }

        return this.generateUnifiedAnalysis(assignment);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async getMyLatestAnalysis(@Request() req) {
        const userId = req.user.userId;

        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: {
                userId: userId,
                status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' },
            include: { responses: { include: { question: true } }, assessment: true, config: true }
        });

        if (!assignment) {
            throw new NotFoundException('Nenhuma avaliação completada encontrada.');
        }

        return this.generateUnifiedAnalysis(assignment);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('export/pdf/:id')
    async exportPdf(@Request() req, @Param('id') id: string, @Res() res: Response) {
        const userId = req.user.userId;

        let assignment;

        // Se ID for 'latest', busca o último do usuário
        if (id === 'latest') {
            assignment = await this.prisma.assessmentAssignment.findFirst({
                where: { userId: userId, status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                include: { responses: { include: { question: true } }, assessment: true, config: true, user: true }
            });
        } else {
            assignment = await this.prisma.assessmentAssignment.findFirst({
                where: { id: id, userId: userId, status: 'COMPLETED' },
                include: { responses: { include: { question: true } }, assessment: true, config: true, user: true }
            });
        }

        if (!assignment) {
            throw new NotFoundException('Relatório não encontrado ou acesso negado.');
        }

        const data = await this.generateUnifiedAnalysis(assignment);

        const pdfData = {
            ...data,
            userName: (assignment.user as any)?.name || 'Cliente',
            date: new Date().toLocaleDateString('pt-BR')
        };

        const buffer = await this.pdfService.generateTalkingToPdf(pdfData);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Relatorio_Mindsight_${assignment.user?.name?.split(' ')[0] || 'PINC'}.pdf"`,
            'Content-Length': buffer.length.toString(),
        });

        res.end(buffer);
    }

    // --- NOVA LÓGICA UNIFICADA ---
    private async generateUnifiedAnalysis(assignment: any) {
        // 1. Usar o Motor Central de Cálculo (já blindado com fallback do TalkingTo)
        const { scores } = await this.scoreService.calculateScores(assignment.id);

        // 2. Extrair inputs para o TalkingTo Service (O, C, E, A, N)
        // O ScoreService retorna chaves normalizadas (EXTRAVERSION, NEUROTICISM, etc.)
        // Precisamos mapear para O, C, E, A, N
        const talkingToInput: TalkingToInput = {
            O: scores['OPENNESS']?.normalizedScore || 50,
            C: scores['CONSCIENTIOUSNESS']?.normalizedScore || 50,
            E: scores['EXTRAVERSION']?.normalizedScore || 50,
            A: scores['AGREEABLENESS']?.normalizedScore || 50,
            N: scores['NEUROTICISM']?.normalizedScore || 50, // Note: TalkingToService expects Stability?
            facets: {
                EXTRAVERSION: scores['EXTRAVERSION']?.facets || [],
                AGREEABLENESS: scores['AGREEABLENESS']?.facets || [],
                CONSCIENTIOUSNESS: scores['CONSCIENTIOUSNESS']?.facets || [],
                OPENNESS: scores['OPENNESS']?.facets || [],
                NEUROTICISM: scores['NEUROTICISM']?.facets || []
            }
        };

        // NOTA: TalkingToService.analyzeStability INVERTE se achar que é Neuroticismo.
        // O ScoreService retorna 'AGREEABLENESS' normalizado (High = High Agreeableness).
        // ScoreService retorna 'NEUROTICISM' (High = High Neuroticism / Low Stable).
        // O TalkingToService espera o que em 'N'?
        // Se TalkingToService.analyzeStability(N) faz "100 - N", ele espera Neuroticismo como input.
        // ScoreService envia Neuroticismo. Tudo certo.

        // 3. Gerar Análise Narrativa
        const analysis = await this.service.analyzeProfile(talkingToInput);

        return {
            id: assignment.id,
            title: assignment.assessment?.title || 'Relatório Unificado',
            completedAt: assignment.completedAt,

            // Dados Narrativos
            talkingToAnalysis: analysis,

            // Dados Quantitativos (Para o Radar e Detalhes)
            unifiedScores: scores,

            // Metadados para UI
            radarData: [
                { subject: 'Extroversão', A: talkingToInput.E, fullMark: 100 },
                { subject: 'Amabilidade', A: talkingToInput.A, fullMark: 100 },
                { subject: 'Estrutura', A: talkingToInput.C, fullMark: 100 },
                { subject: 'Estabilidade', A: 100 - talkingToInput.N, fullMark: 100 }, // Radar mostra Estabilidade (Bom)
                { subject: 'Abertura', A: talkingToInput.O, fullMark: 100 }
            ]
        };
    }
}

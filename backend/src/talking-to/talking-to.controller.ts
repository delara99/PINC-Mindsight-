import { Controller, Post, Body, Get, UseGuards, Request, NotFoundException, Param } from '@nestjs/common';
import { TalkingToService, TalkingToInput } from './talking-to.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('talking-to')
export class TalkingToController {
    constructor(
        private readonly service: TalkingToService,
        private readonly prisma: PrismaService
    ) { }

    // Endpoint público ou protegido para testar o motor
    @Post('simulate')
    simulate(@Body() scores: TalkingToInput) {
        return this.service.analyzeProfile(scores);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('history')
    async getHistory(@Request() req) {
        const userId = req.user.userId;
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
                userId: userId, // Garante segurança que o usuário é dono
                status: 'COMPLETED'
            },
            include: {
                responses: {
                    include: { question: true }
                }
            }
        });

        if (!assignment) {
            throw new NotFoundException('Relatório não encontrado ou acesso negado.');
        }

        return this.generateAnalysis(assignment);
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
            include: {
                responses: {
                    include: { question: true }
                }
            }
        });

        if (!assignment) {
            throw new NotFoundException('Nenhuma avaliação completada encontrada.');
        }

        return this.generateAnalysis(assignment);
    }

    // Lógica compartilhada de cálculo
    private generateAnalysis(assignment: any) {
        // Agrupar somas
        const traistsSums: Record<string, { sum: number, count: number }> = {};

        assignment.responses.forEach(r => {
            const key = r.question.traitKey;
            if (!traistsSums[key]) traistsSums[key] = { sum: 0, count: 0 };

            const val = Number(r.answer);
            if (!isNaN(val)) {
                traistsSums[key].sum += val;
                traistsSums[key].count++;
            }
        });

        // Calcular médias e normalizar
        const scores: any = {};

        ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'].forEach(trait => {
            const key = Object.keys(traistsSums).find(k => k.toUpperCase().includes(trait.substring(0, 4)));

            if (key) {
                const { sum, count } = traistsSums[key];
                const avg = sum / count;
                scores[trait[0]] = Math.round(((avg - 1) / 4) * 100);
            } else {
                scores[trait[0]] = 50;
            }
        });

        // Gerar Análise
        const analysis = this.service.analyzeProfile({
            O: scores.O,
            C: scores.C,
            E: scores.E,
            A: scores.A,
            N: scores.N
        });

        return {
            id: assignment.id, // Importante retornar o ID
            title: assignment.assessment?.title || 'Inventário de Personalidade',
            completedAt: assignment.completedAt,
            talkingToAnalysis: analysis,
            // debugScores: scores
        };
    }
}

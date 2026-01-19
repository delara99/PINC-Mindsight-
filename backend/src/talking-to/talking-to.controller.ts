import { Controller, Post, Body, Get, UseGuards, Request, NotFoundException } from '@nestjs/common';
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
    @Get('me')
    async getMyAnalysis(@Request() req) {
        const userId = req.user.userId;

        // 1. Buscar último assignment completo
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

        // 2. Calcular Scores Simplificados (Média das Respostas)
        // Agrupar somas
        const traistsSums: Record<string, { sum: number, count: number }> = {};

        assignment.responses.forEach(r => {
            const key = r.question.traitKey;
            if (!traistsSums[key]) traistsSums[key] = { sum: 0, count: 0 };

            // Assumindo que answer é numérico ou conversível
            const val = Number(r.answer);
            if (!isNaN(val)) {
                traistsSums[key].sum += val;
                traistsSums[key].count++;
            }
        });

        // Calcular médias e normalizar (assumindo escala 1-5 -> 0-100)
        // Formula: ((Média - 1) / 4) * 100
        const scores: any = {};

        ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'].forEach(trait => {
            // Tentar chaves parciais também (ex: OPEN)
            const key = Object.keys(traistsSums).find(k => k.includes(trait.substring(0, 4)));

            if (key) {
                const { sum, count } = traistsSums[key];
                const avg = sum / count;
                // Converter 1-5 para 0-100
                scores[trait[0]] = Math.round(((avg - 1) / 4) * 100);
            } else {
                scores[trait[0]] = 50; // Fallback
            }
        });

        // 3. Gerar Análise
        const analysis = this.service.analyzeProfile({
            O: scores.O,
            C: scores.C,
            E: scores.E,
            A: scores.A,
            N: scores.N
        });

        return {
            completedAt: assignment.completedAt,
            talkingToAnalysis: analysis,
            debugScores: scores
        };
    }
}

import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

interface ComparisonData {
    user1: {
        name: string;
        email: string;
        scores: Record<string, number>;
    };
    user2: {
        name: string;
        email: string;
        scores: Record<string, number>;
    };
    insights: {
        compatibility: number;
        strengths: string[];
        differences: Array<{
            trait: string;
            difference: number;
            interpretation: string;
        }>;
    };
}

@Controller('api/v1/comparison')
@UseGuards(AuthGuard('jwt'))
export class ComparisonController {
    constructor(private readonly prisma: PrismaService) { }

    @Get('radar/:connectionId')
    async getRadarComparison(
        @Param('connectionId') connectionId: string,
        @Req() req: any
    ): Promise<ComparisonData> {
        const currentUserId = req.user.userId;

        // Buscar conexão e validar permissões
        const connection = await this.prisma.connection.findFirst({
            where: {
                id: connectionId,
                OR: [
                    { userAId: currentUserId },
                    { userBId: currentUserId }
                ]
            },
            include: {
                userA: true,
                userB: true,
                sharingSettings: true
            }
        });

        if (!connection) {
            throw new Error('Conexão não encontrada');
        }

        // Verificar permissões de compartilhamento
        const currentUserSetting = connection.sharingSettings.find(s => s.userId === currentUserId);
        const otherUserId = connection.userAId === currentUserId ? connection.userBId : connection.userAId;
        const otherUserSetting = connection.sharingSettings.find(s => s.userId === otherUserId);

        if (!currentUserSetting?.shareInventories || !otherUserSetting?.shareInventories) {
            throw new Error('Um ou ambos usuários não compartilharam seus inventários');
        }

        // Buscar último assessment completado de cada usuário
        const [currentUserAssignment, otherUserAssignment] = await Promise.all([
            this.prisma.assessmentAssignment.findFirst({
                where: {
                    userId: currentUserId,
                    status: 'COMPLETED'
                },
                orderBy: { completedAt: 'desc' },
                include: {
                    assessment: true,
                    user: true
                }
            }),
            this.prisma.assessmentAssignment.findFirst({
                where: {
                    userId: otherUserId,
                    status: 'COMPLETED'
                },
                orderBy: { completedAt: 'desc' },
                include: {
                    assessment: true,
                    user: true
                }
            })
        ]);

        if (!currentUserAssignment || !otherUserAssignment) {
            throw new Error('Um ou ambos usuários não possuem avaliações completadas');
        }

        // Extrair scores
        const user1Scores = (currentUserAssignment as any).result?.scores || {};
        const user2Scores = (otherUserAssignment as any).result?.scores || {};

        // Calcular compatibilidade e insights
        const insights = this.calculateInsights(user1Scores, user2Scores);

        return {
            user1: {
                name: currentUserAssignment.user.name,
                email: currentUserAssignment.user.email,
                scores: user1Scores
            },
            user2: {
                name: otherUserAssignment.user.name,
                email: otherUserAssignment.user.email,
                scores: user2Scores
            },
            insights
        };
    }

    private calculateInsights(
        scores1: Record<string, number>,
        scores2: Record<string, number>
    ) {
        // Agrupar scores por traço
        const traitScores1 = this.groupScoresByTrait(scores1);
        const traitScores2 = this.groupScoresByTrait(scores2);

        // Calcular diferenças
        const differences = [];
        let totalDiff = 0;
        let count = 0;

        for (const [trait, avg1] of Object.entries(traitScores1)) {
            const avg2 = traitScores2[trait] || 0;
            const diff = Math.abs(avg1 - avg2);
            totalDiff += diff;
            count++;

            let interpretation = '';
            if (diff < 0.5) interpretation = 'Muito semelhantes';
            else if (diff < 1.0) interpretation = 'Semelhantes';
            else if (diff < 1.5) interpretation = 'Diferenças moderadas';
            else if (diff < 2.0) interpretation = 'Bastante diferentes';
            else interpretation = 'Muito diferentes';

            differences.push({
                trait,
                difference: diff,
                interpretation
            });
        }

        // Compatibilidade (0-100, invertido da diferença média)
        const avgDiff = totalDiff / count;
        const compatibility = Math.max(0, Math.min(100, 100 - (avgDiff * 20)));

        // Identificar pontos fortes
        const strengths = [];
        if (compatibility > 80) strengths.push('Alta compatibilidade geral');
        if (differences.find(d => d.trait.includes('Amabilidade') && d.difference < 1))
            strengths.push('Valores semelhantes');
        if (differences.find(d => d.trait.includes('Conscienciosidade') && d.difference < 1))
            strengths.push('Abordagem de trabalho compatível');

        return {
            compatibility: Math.round(compatibility),
            strengths,
            differences: differences.sort((a, b) => b.difference - a.difference)
        };
    }

    private groupScoresByTrait(scores: Record<string, number>): Record<string, number> {
        const traitScores: Record<string, number[]> = {};

        Object.entries(scores).forEach(([key, score]) => {
            if (key.includes('::')) {
                const [trait] = key.split('::');
                if (!traitScores[trait]) traitScores[trait] = [];
                traitScores[trait].push(typeof score === 'number' ? score : 0);
            }
        });

        // Calcular médias
        const result: Record<string, number> = {};
        for (const [trait, values] of Object.entries(traitScores)) {
            result[trait] = values.reduce((sum, v) => sum + v, 0) / values.length;
        }

        return result;
    }
}

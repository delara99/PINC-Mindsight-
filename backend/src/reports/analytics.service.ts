
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    // Calcula aderência ao perfil do cargo (Job Fit)
    async calculateJobFit(candidateScores: Record<string, number>, jobProfileId: string) {
        const profile = await this.prisma.jobProfile.findUnique({
            where: { id: jobProfileId }
        });

        if (!profile) throw new Error('Perfil não encontrado');

        const idealScores = profile.idealScores as Record<string, number>;
        let totalDiff = 0;
        let traitCount = 0;

        for (const [trait, idealScore] of Object.entries(idealScores)) {
            if (candidateScores[trait] !== undefined) {
                // Diferença absoluta
                const diff = Math.abs(candidateScores[trait] - idealScore);

                // Normaliza diferença (quanto maior a diferença, menor o fit)
                // Assumindo escala 1-5, max diff é 4.
                totalDiff += diff;
                traitCount++;
            }
        }

        if (traitCount === 0) return 0;

        // Média de desvio
        const avgDiff = totalDiff / traitCount;

        // Fit Score (100% - (desvio / max_possivel * 100))
        // Max desvio possível realista = 4. 
        // Se avgDiff = 0, Fit = 100%. Se avgDiff = 2, Fit = 50%.
        const fitPercentage = Math.max(0, 100 - (avgDiff * 25));

        return Math.round(fitPercentage);
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TalentIntelligenceService {
    constructor(private prisma: PrismaService) { }

    // Calcula o fit entre um candidato (assessment) e um perfil de cargo
    async calculateJobFit(candidateAssignmentId: string, jobProfileId: string) {
        // 1. Buscar dados do candidato (AssessmentExecution/Assignment)
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: candidateAssignmentId },
            include: {
                user: true,
                result: true
            }
        });

        if (!assignment || !assignment.result) {
            throw new Error('Assessment assignment or result not found');
        }

        // 2. Buscar perfil do cargo
        const jobProfile = await this.prisma.jobProfile.findUnique({
            where: { id: jobProfileId }
        });

        if (!jobProfile) {
            throw new Error('Job profile not found');
        }

        // 3. Comparar
        // O campo 'scores' do resultado contém os valores calculados
        const candidateScores = this.extractScores(assignment.result);
        const idealScores = jobProfile.idealScores as any;
        const weights = (jobProfile.weights as any) || { O: 1, C: 1, E: 1, A: 1, N: 1 };

        let totalWeightedDiff = 0;
        let totalWeight = 0;
        const dimensionFits = {};
        const strengths = [];
        const concerns = [];

        const dimensions = ['O', 'C', 'E', 'A', 'N'];
        // Mapeamento de nomes completos para siglas se necessário

        for (const dim of dimensions) {
            const candScore = candidateScores[dim] || 0;
            const idealScore = idealScores[dim] || 50;
            const weight = weights[dim] || 1;

            // Diferença absoluta
            const diff = Math.abs(candScore - idealScore);

            // Score de fit da dimensão (100 - diff)
            let dimFit = Math.max(0, 100 - (diff * 1.5));
            dimensionFits[dim] = Math.round(dimFit);

            totalWeightedDiff += (diff * weight);
            totalWeight += weight;

            // Gerar Insights
            if (dimFit > 80) strengths.push(`Alta compatibilidade em ${dim}`);
            if (dimFit < 50) concerns.push(`Baixa compatibilidade em ${dim} (Gap: ${diff})`);
        }

        // Fit Geral
        const avgDiff = totalWeightedDiff / totalWeight;
        const overallFit = Math.max(0, 100 - (avgDiff * 1.2));

        // 4. Salvar Análise
        return this.prisma.candidateFitAnalysis.create({
            data: {
                candidateId: assignment.user.id,
                jobProfileId: jobProfile.id,
                overallFit: Math.round(overallFit),
                dimensionFits: dimensionFits,
                strengths: strengths,
                concerns: concerns,
                recommendations: ["Rever gaps com gestor", "Acompanhar onboarding"]
            }
        });
    }

    private extractScores(result: any): Record<string, number> {
        const scores = result.scores || {};
        // Tenta mapear tanto siglas quanto nomes completos
        return {
            O: scores.O || scores.OPENNESS || 50,
            C: scores.C || scores.CONSCIENTIOUSNESS || 50,
            E: scores.E || scores.EXTRAVERSION || 50,
            A: scores.A || scores.AGREEABLENESS || 50,
            N: scores.N || scores.NEUROTICISM || 50
        };
    }
}

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

    // --- TEAM INTELLIGENCE ---

    async createTeam(tenantId: string, dto: { name: string; description?: string; memberIds?: string[] }) {
        const memberIds = dto.memberIds || [];
        const avgScores = await this.calculateTeamAverage(memberIds);

        return this.prisma.team.create({
            data: {
                tenantId,
                name: dto.name,
                description: dto.description,
                memberIds: memberIds,
                avgScores: avgScores || {}
            }
        });
    }

    async getTeams(tenantId: string) {
        return this.prisma.team.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async addMembersToTeam(tenantId: string, teamId: string, memberIds: string[]) {
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        if (!team || team.tenantId !== tenantId) throw new Error("Team not found");

        const currentMembers = (team.memberIds as string[]) || [];
        // Merge único para evitar duplicatas
        const updatedMembers = Array.from(new Set([...currentMembers, ...memberIds]));

        // Recalcular a média da equipe com os novos membros
        const avgScores = await this.calculateTeamAverage(updatedMembers);

        return this.prisma.team.update({
            where: { id: teamId },
            data: {
                memberIds: updatedMembers,
                avgScores: avgScores || {}
            }
        });
    }

    async calculateTeamFit(candidateId: string, teamId: string) {
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        if (!team) throw new Error("Team not found");

        const candidateScores = await this.getLatestScores(candidateId);
        if (!candidateScores) throw new Error("Candidate has no assessment results");

        const teamScores = (team.avgScores as any) || { O: 50, C: 50, E: 50, A: 50, N: 50 };

        // 1. Cultural Fit (Similaridade de Valores)
        // Geralmente medido pela proximidade em Amabilidade e Conscienciosidade (piliares de convivência)
        const cultDim = ['A', 'C'];
        let cultDiff = 0;
        cultDim.forEach(d => cultDiff += Math.abs(candidateScores[d] - (teamScores[d] || 50)));
        const culturalFit = Math.max(0, 100 - (cultDiff / cultDim.length) * 1.5);

        // 2. Complementaridade (Sinergia)
        // Onde o time é fraco (<40) e o candidato é forte (>60)?
        let synergyPoints = 0;
        const synergies: string[] = [];
        const risks: string[] = [];

        ['O', 'C', 'E', 'A', 'N'].forEach(dim => {
            const tScore = teamScores[dim] || 50;
            const cScore = candidateScores[dim] || 50;

            // Complemento: Time baixo, Candidato alto
            if (tScore < 40 && cScore > 60) {
                synergyPoints += 20;
                synergies.push(`Compensa baixa ${dim} da equipe`);
            }
            // Reforço: Time alto, Candidato alto
            if (tScore > 60 && cScore > 60) {
                synergyPoints += 10;
                synergies.push(`Reforça cultura de alta ${dim}`);
            }

            // Risco de Conflito: Extroversão muito alta em ambos pode gerar disputa de espaço
            if (dim === 'E' && tScore > 70 && cScore > 70) {
                risks.push("Possível disputa de liderança (Alta Extroversão)");
            }
            // Risco de Choque: Abertura muito diferente
            if (dim === 'O' && Math.abs(tScore - cScore) > 40) {
                risks.push("Divergência em inovação/tradição");
            }
        });

        const complementarity = Math.min(100, 50 + synergyPoints);
        const conflictRisk = Math.min(100, risks.length * 25);

        // Salvar análise
        return this.prisma.teamFitAnalysis.create({
            data: {
                candidateId,
                teamId,
                culturalFit: Math.round(culturalFit),
                complementarity: Math.round(complementarity),
                conflictRisk: Math.round(conflictRisk),
                synergies: synergies,
                risks: risks
            }
        });
    }

    private async calculateTeamAverage(memberIds: string[]) {
        if (!memberIds || memberIds.length === 0) return null;

        const totals = { O: 0, C: 0, E: 0, A: 0, N: 0 };
        let count = 0;

        for (const userId of memberIds) {
            const scores = await this.getLatestScores(userId);
            if (scores) {
                totals.O += scores.O;
                totals.C += scores.C;
                totals.E += scores.E;
                totals.A += scores.A;
                totals.N += scores.N;
                count++;
            }
        }

        if (count === 0) return null;

        return {
            O: Math.round(totals.O / count),
            C: Math.round(totals.C / count),
            E: Math.round(totals.E / count),
            A: Math.round(totals.A / count),
            N: Math.round(totals.N / count)
        };
    }

    private async getLatestScores(userId: string) {
        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: { userId, status: 'COMPLETED', result: { isNot: null } },
            orderBy: { completedAt: 'desc' },
            include: { result: true }
        });
        if (!assignment || !assignment.result) return null;
        return this.extractScores(assignment.result);
    }

    private extractScores(result: any): Record<string, number> {
        const scores = result.scores || {};
        return {
            O: scores.O || scores.OPENNESS || 50,
            C: scores.C || scores.CONSCIENTIOUSNESS || 50,
            E: scores.E || scores.EXTRAVERSION || 50,
            A: scores.A || scores.AGREEABLENESS || 50,
            N: scores.N || scores.NEUROTICISM || 50
        };
    }
}

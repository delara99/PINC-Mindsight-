
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TalentIntelligenceService } from '../talent-intelligence/talent-intelligence.service';

@Injectable()
export class TeamService {
    constructor(
        private prisma: PrismaService,
        private intelligence: TalentIntelligenceService
    ) { }

    async create(tenantId: string, data: any) {
        return this.prisma.team.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description,
                memberIds: data.memberIds || [], // Array de IDs
                managerId: data.managerId
            }
        });
    }

    async findAll(tenantId: string) {
        const teams = await this.prisma.team.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        // Enriquecer com contagem e nomes (leve)
        const enriched = await Promise.all(teams.map(async (t) => {
            const memberIds = (t.memberIds as string[]) || [];
            return {
                ...t,
                memberCount: memberIds.length
            };
        }));

        return enriched;
    }

    async getAvailableMembers(tenantId: string) {
        return this.prisma.user.findMany({
            where: {
                tenantId,
                role: 'MEMBER'
            },
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: { name: 'asc' }
        });
    }

    async findOne(id: string) {
        const team = await this.prisma.team.findUnique({
            where: { id }
        });
        if (!team) throw new NotFoundException('Team not found');
        return team;
    }

    async update(id: string, data: any) {
        // Se vier members, garante que é array
        const updateData: any = { ...data };
        if (updateData.members) {
            // Frontend pode mandar objetos users, precisamos extrair IDs
            updateData.memberIds = updateData.members.map((m: any) => m.id);
            delete updateData.members;
        }

        return this.prisma.team.update({
            where: { id },
            data: updateData
        });
    }

    async remove(id: string) {
        return this.prisma.team.delete({
            where: { id }
        });
    }

    // --- O MOTOR DE INTELEGÊNCIA ---
    async getAnalysis(id: string) {
        const team = await this.findOne(id);
        const memberIds = (team.memberIds as string[]) || [];

        if (memberIds.length === 0) {
            return {
                team,
                members: [],
                stats: {
                    avgScores: { O: 0, C: 0, E: 0, A: 0, N: 0 },
                    diversity: 0,
                    size: 0
                }
            };
        }

        // Buscar dados completos dos membros
        const members = await this.prisma.user.findMany({
            where: { id: { in: memberIds } },
            include: {
                assignments: {
                    where: { status: 'COMPLETED', assessment: { type: 'BIG_FIVE' } },
                    orderBy: { completedAt: 'desc' },
                    take: 1,
                    include: { result: true }
                }
            }
        });

        // Processar Scores Individuais
        const membersAnalysis = members.map(m => {
            const assignment = m.assignments[0];
            const scores = assignment
                ? this.intelligence.extractScores(assignment.result) // NOSSO EXTRATOR BLINDADO COM FACETAS
                : { O: 0, C: 0, E: 0, A: 0, N: 0 };

            return {
                user: { id: m.id, name: m.name, email: m.email },
                scores,
                hasData: !!assignment
            };
        });

        // Filtrar apenas quem tem dados para a média
        const validMembers = membersAnalysis.filter(m => m.hasData);
        const count = validMembers.length;

        if (count === 0) {
            return { team, members: membersAnalysis, stats: null };
        }

        // 1. Calcular Médias (Dimensões e Facetas)
        const sums: Record<string, number> = {};
        const facetsSums: Record<string, number> = {}; // Para somar 'O_F1', 'C_F2'...

        validMembers.forEach(m => {
            // Soma Dimensões Principais
            ['O', 'C', 'E', 'A', 'N'].forEach(dim => {
                sums[dim] = (sums[dim] || 0) + (m.scores[dim] || 0);
            });

            // Soma Facetas (Todas as chaves que não são OCEAN)
            Object.keys(m.scores).forEach(key => {
                if (!['O', 'C', 'E', 'A', 'N'].includes(key)) {
                    facetsSums[key] = (facetsSums[key] || 0) + (m.scores[key] || 0);
                }
            });
        });

        const avgScores: Record<string, number> = {};
        ['O', 'C', 'E', 'A', 'N'].forEach(dim => {
            avgScores[dim] = Math.round(sums[dim] / count);
        });

        // Médias das Facetas
        Object.keys(facetsSums).forEach(key => {
            avgScores[key] = Math.round(facetsSums[key] / count);
        });

        // 2. Calcular Diversidade (Desvio Padrão Médio das 5 dimensões)
        let totalVariance = 0;
        ['O', 'C', 'E', 'A', 'N'].forEach(dim => {
            let dimVariance = 0;
            const mean = avgScores[dim];
            validMembers.forEach(m => {
                const val = m.scores[dim] || 0;
                dimVariance += Math.pow(val - mean, 2);
            });
            totalVariance += (dimVariance / count);
        });

        // Média das variâncias das 5 dimensões (simplificado)
        const avgVariance = totalVariance / 5;
        const diversityScore = Math.round(Math.sqrt(avgVariance)); // Desvio Padrão médio

        return {
            team,
            members: membersAnalysis,
            stats: {
                count,
                avgScores, // Inclui O, C, E, A, N e todas as facetas (O_F1...)
                diversityScore, // Quanto maior, mais heterogêneo
                highDiversity: diversityScore > 15, // Threshold empírico
                dominantTraits: Object.entries(avgScores)
                    .filter(([k, v]) => ['O', 'C', 'E', 'A', 'N'].includes(k) && (v as number) > 65)
                    .map(([k]) => k)
            }
        };
    }

    // --- SIMULADOR DE IMPACTO ---
    async simulateCandidate(teamId: string, candidateId: string) {
        // 1. Buscar análise atual do time
        const teamAnalysis = await this.getAnalysis(teamId);
        if (!teamAnalysis.stats) {
            throw new Error('Team has no valid data for simulation');
        }

        const team = teamAnalysis.team;
        const teamAvg = teamAnalysis.stats.avgScores;

        // 2. Buscar dados do candidato
        const candidate = await this.prisma.user.findUnique({
            where: { id: candidateId },
            include: {
                assignments: {
                    where: { status: 'COMPLETED', assessment: { type: 'BIG_FIVE' } },
                    orderBy: { completedAt: 'desc' },
                    take: 1,
                    include: { result: true }
                }
            }
        });

        if (!candidate || !candidate.assignments[0]) {
            throw new Error('Candidate has no completed assessment');
        }

        const candidateScores = this.intelligence.extractScores(candidate.assignments[0].result);

        // 3. Análise de Complementariedade e Conflito
        const dimensions = ['O', 'C', 'E', 'A', 'N'];
        const dimensionLabels: Record<string, string> = {
            O: 'Abertura',
            C: 'Conscienciosidade',
            E: 'Extroversão',
            A: 'Amabilidade',
            N: 'Estabilidade'
        };

        const synergies: any[] = [];
        const risks: any[] = [];
        const recommendations: string[] = [];

        dimensions.forEach(dim => {
            const teamScore = teamAvg[dim] || 50;
            const candScore = candidateScores[dim] || 50;
            const diff = candScore - teamScore;

            // COMPLEMENTARIEDADE: Candidato preenche lacuna
            if (teamScore < 45 && candScore > 65) {
                synergies.push({
                    dimension: dim,
                    label: dimensionLabels[dim],
                    type: 'complement',
                    message: `Candidato eleva ${dimensionLabels[dim]} (Time: ${teamScore} → +${Math.abs(diff)} pontos)`,
                    impact: 'positive'
                });
                recommendations.push(`✅ Forte complemento em ${dimensionLabels[dim]} - Preenche lacuna crítica do time`);
            }

            // RISCO: Candidato muito diferente (pode gerar atrito ou isolamento)
            if (Math.abs(diff) > 30) {
                risks.push({
                    dimension: dim,
                    label: dimensionLabels[dim],
                    type: 'mismatch',
                    message: `Grande diferença em ${dimensionLabels[dim]} (Candidato: ${candScore} vs Time: ${teamScore})`,
                    impact: 'warning'
                });
                recommendations.push(`⚠️ Atenção: Diferença significativa em ${dimensionLabels[dim]} - Pode exigir adaptação cultural`);
            }

            // SINERGIA: Candidato reforça ponto forte
            if (teamScore > 65 && candScore > 65) {
                synergies.push({
                    dimension: dim,
                    label: dimensionLabels[dim],
                    type: 'reinforce',
                    message: `Reforça ponto forte do time em ${dimensionLabels[dim]}`,
                    impact: 'neutral'
                });
            }
        });

        // 4. Análise de Conflito com Gestor (se houver)
        let managerConflict = null;
        if (team.managerId) {
            const manager = await this.prisma.user.findUnique({
                where: { id: team.managerId },
                include: {
                    assignments: {
                        where: { status: 'COMPLETED', assessment: { type: 'BIG_FIVE' } },
                        orderBy: { completedAt: 'desc' },
                        take: 1,
                        include: { result: true }
                    }
                }
            });

            if (manager && manager.assignments[0]) {
                const managerScores = this.intelligence.extractScores(manager.assignments[0].result);

                // Conflito em Extroversão (2 muito altos = competição por atenção)
                if (managerScores.E > 70 && candidateScores.E > 70) {
                    managerConflict = {
                        type: 'dominance',
                        message: 'Ambos têm alta Extroversão - Risco de competição por liderança',
                        severity: 'medium'
                    };
                }

                // Conflito em Amabilidade (gestor baixo + candidato baixo = atrito)
                if (managerScores.A < 40 && candidateScores.A < 40) {
                    managerConflict = {
                        type: 'friction',
                        message: 'Baixa Amabilidade em ambos - Risco de conflitos diretos',
                        severity: 'high'
                    };
                }
            }
        }

        // 5. Impacto na Diversidade
        const currentDiversity = teamAnalysis.stats.diversityScore;
        // Simulação simplificada: se candidato é muito diferente, aumenta diversidade
        const avgDiff = dimensions.reduce((sum, dim) => {
            return sum + Math.abs((candidateScores[dim] || 50) - (teamAvg[dim] || 50));
        }, 0) / 5;

        const diversityImpact = avgDiff > 20 ? 'increase' : avgDiff < 10 ? 'decrease' : 'neutral';

        // 6. Recomendação Final
        let finalRecommendation = '';
        if (synergies.filter(s => s.type === 'complement').length >= 2) {
            finalRecommendation = '🎯 ALTAMENTE RECOMENDADO - Complementa bem o perfil do time';
        } else if (risks.length >= 3) {
            finalRecommendation = '⚠️ AVALIAR COM CAUTELA - Perfil muito divergente pode exigir gestão ativa';
        } else {
            finalRecommendation = '✅ COMPATÍVEL - Boa adição ao time com ajustes mínimos';
        }

        return {
            candidate: {
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
                scores: candidateScores
            },
            team: {
                id: team.id,
                name: team.name,
                avgScores: teamAvg
            },
            analysis: {
                synergies,
                risks,
                managerConflict,
                diversityImpact: {
                    current: currentDiversity,
                    direction: diversityImpact,
                    message: diversityImpact === 'increase'
                        ? '📈 Aumenta diversidade cognitiva do time'
                        : diversityImpact === 'decrease'
                            ? '📉 Perfil similar ao time atual'
                            : '➡️ Impacto neutro na diversidade'
                },
                recommendations,
                finalRecommendation
            }
        };
    }
}

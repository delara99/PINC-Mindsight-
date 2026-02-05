
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
}

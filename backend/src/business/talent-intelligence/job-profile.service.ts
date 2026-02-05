import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TalentIntelligenceService } from './talent-intelligence.service';

@Injectable()
export class JobProfileService {
    constructor(
        private prisma: PrismaService,
        private intelligenceService: TalentIntelligenceService
    ) { }

    async createProfile(tenantId: String, data: any) {
        return this.prisma.jobProfile.create({
            data: {
                tenantId: tenantId as string,
                ...data
            }
        });
    }

    async getProfiles(tenantId: String) {
        return this.prisma.jobProfile.findMany({
            where: { tenantId: tenantId as string },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getProfile(id: string) {
        return this.prisma.jobProfile.findUnique({
            where: { id }
        });
    }

    async updateProfile(id: string, data: any) {
        return this.prisma.jobProfile.update({
            where: { id },
            data
        });
    }

    async deleteProfile(id: string) {
        return this.prisma.jobProfile.delete({
            where: { id }
        });
    }

    async getProfileAnalysis(tenantId: string, profileId: string) {
        // 1. Buscar o Perfil
        const profile = await this.prisma.jobProfile.findFirst({
            where: { id: profileId, tenantId }
        });

        if (!profile) throw new Error('Profile not found');

        // 2. Buscar todos os colaboradores do tenant com assessments concluídos
        const employees = await this.prisma.user.findMany({
            where: {
                tenantId,
                role: 'MEMBER', // Apenas colaboradores
                assignments: {
                    some: {
                        status: 'COMPLETED',
                        assessment: { type: 'BIG_FIVE' }
                    }
                }
            },
            include: {
                assignments: {
                    where: { status: 'COMPLETED', assessment: { type: 'BIG_FIVE' } },
                    orderBy: { completedAt: 'desc' },
                    take: 1,
                    include: { result: true }
                }
            }
        });

        // 3. Calcular Fit para cada um
        const analysisResults = [];

        for (const emp of employees) {
            const assignment = emp.assignments[0];
            if (!assignment) continue;

            // Usar a lógica centralizada do TalentIntelligenceService (se possível)
            // Ou implementar cálculo rápido aqui para evitar overhead de DB

            // Simulação rápida para performance (o service original salva no DB, aqui queremos apenas visualizar)
            const fit = await this.calculateFitInMemory(assignment, profile);

            analysisResults.push({
                user: {
                    id: emp.id,
                    name: emp.name,
                    email: emp.email,
                    avatar: null // Futuro
                },
                source: {
                    assignmentId: assignment.id,
                    completedAt: assignment.completedAt
                },
                userScores: fit.userScores, // Corrigido: pegando do resultado do fit
                fit: fit.overall,
                dimensions: fit.dimensions,
                strengths: fit.strengths,
                gaps: fit.gaps
            });
        }

        // 4. Ordenar por maior Fit
        return {
            profile,
            candidates: analysisResults.sort((a, b) => b.fit - a.fit)
        };
    }

    private async calculateFitInMemory(assignment: any, profile: any) {
        const result = assignment.result;
        if (!result || !result.scores) return { overall: 0, dimensions: {}, strengths: [], gaps: [] };

        // CONEXÃO DIRETA COM O 'CORE'
        // Usamos o serviço central para garantir que a lógica de leitura de notas seja IDÊNTICA em todo o sistema.
        const userScores = this.intelligenceService.extractScores(result);

        const ideal = profile.idealScores as any; // { O: 80, ... }

        const dims = ['O', 'C', 'E', 'A', 'N'];
        let totalDiff = 0;
        const dimensionFits: any = {};
        const strengths = [];
        const gaps = [];

        for (const d of dims) {
            // CORREÇÃO CRÍTICA: Aceitar 0 como valor válido. Antes (userScores[d] || 50) transformava 0 em 50.
            const uVal = userScores[d] !== undefined && userScores[d] !== null ? userScores[d] : 50;
            const iVal = ideal[d] || 50;
            const diff = Math.abs(uVal - iVal);

            // Score de 0 a 100 para essa dimensão
            const dimFit = Math.max(0, 100 - (diff * 1.5));
            dimensionFits[d] = Math.round(dimFit);

            totalDiff += diff;

            if (dimFit > 85) strengths.push(d);
            if (dimFit < 60) gaps.push(d);
        }

        const avgDiff = totalDiff / 5;
        const overallFit = Math.max(0, 100 - (avgDiff * 1.2));

        return {
            userScores, // Retornando para o controller
            overall: Math.round(overallFit),
            dimensions: dimensionFits,
            strengths,
            gaps
        };
    }
}

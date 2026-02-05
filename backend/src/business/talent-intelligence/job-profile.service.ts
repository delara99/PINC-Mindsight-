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

        const userScores = this.extractScores(result); // Usando extrator robusto
        const ideal = profile.idealScores as any; // { O: 80, ... }

        const dims = ['O', 'C', 'E', 'A', 'N'];
        let totalDiff = 0;
        const dimensionFits: any = {};
        const strengths = [];
        const gaps = [];

        for (const d of dims) {
            const uVal = userScores[d] || 50;
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
            overall: Math.round(overallFit),
            dimensions: dimensionFits,
            strengths,
            gaps
        };
    }

    private extractScores(result: any): Record<string, number> {
        const scores = result.scores || {};
        // 1. Mapeamento robusto (Siglas e Nomes Completos)
        const raw: any = {
            O: Number(scores.O || scores.OPENNESS || 0),
            C: Number(scores.C || scores.CONSCIENTIOUSNESS || 0),
            E: Number(scores.E || scores.EXTRAVERSION || 0),
            A: Number(scores.A || scores.AGREEABLENESS || 0),
            N: Number(scores.N || scores.NEUROTICISM || scores.STABILITY || 0)
        };

        // DEBUG: Verificar se estamos extraindo zeros
        // console.warn(`[FitCalculation] RAW: ${JSON.stringify(raw)}`);

        // 2. Normalização de Escala (1-5 para 0-100)
        const maxVal = Math.max(raw.O, raw.C, raw.E, raw.A, raw.N);

        if (maxVal > 0 && maxVal <= 6) {
            Object.keys(raw).forEach(key => {
                const val = Math.max(1, Math.min(5, raw[key]));
                raw[key] = Math.round(((val - 1) / 4) * 100);
            });
        }

        // 3. Fallback para evitar zeros absolutos se não houver dados
        if (maxVal === 0) {
            return { O: 50, C: 50, E: 50, A: 50, N: 50 };
        }

        return raw;
    }
}

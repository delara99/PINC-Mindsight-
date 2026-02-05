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
            const tScore = teamScores[dim] !== undefined ? teamScores[dim] : 50;
            // CORREÇÃO CRÍTICA: Respeitar nota 0 do candidato
            const cScore = candidateScores[dim] !== undefined && candidateScores[dim] !== null ? candidateScores[dim] : 50;

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

    public extractScores(result: any): Record<string, number> {
        if (!result) return { O: 0, C: 0, E: 0, A: 0, N: 0 };

        // 0. Coleta Agressiva: Tenta pegar de result.scores, do próprio result, ou result.result
        const normalized: Record<string, any> = {};

        const scanAndNormalize = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach(k => {
                const upper = k.toUpperCase();
                // Se ainda não temos esse valor e o valor atual é válido (não nulo)
                if (normalized[upper] === undefined && obj[k] !== null && obj[k] !== undefined) {
                    normalized[upper] = obj[k];
                }
            });
        };

        // Ordem de prioridade de varredura:
        scanAndNormalize(result.scores); // 1. O padrão correto
        scanAndNormalize(result);        // 2. O raiz (fallback comum)
        scanAndNormalize(result.result); // 3. Aninhamento profundo (legacy)

        // DEBUG: Ver o que achamos
        // console.log('[ExtractScores] Keys Found:', Object.keys(normalized));

        const safeParse = (val: any) => {
            if (val === null || val === undefined) return 0;
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const standardized = val.replace(',', '.');
                const num = parseFloat(standardized);
                return isNaN(num) ? 0 : num;
            }
            return 0;
        };

        // 1. Mapeamento Final com Fallbacks em cascata
        const raw: any = {
            O: safeParse(normalized.O || normalized.OPENNESS || normalized.ABERTURA),
            C: safeParse(normalized.C || normalized.CONSCIENTIOUSNESS || normalized.CONSCIENCIOSIDADE || normalized.ESTRUTURA),
            E: safeParse(normalized.E || normalized.EXTRAVERSION || normalized.EXTROVERSAO || normalized.EXTROVERSÃO),
            A: safeParse(normalized.A || normalized.AGREEABLENESS || normalized.AMABILIDADE),
            N: safeParse(normalized.N || normalized.NEUROTICISM || normalized.STABILITY || normalized.ESTABILIDADE || normalized.ESTABILIDADE_EMOCIONAL)
        };

        // DEBUG
        // console.log('[ExtractScores] Raw Parsed:', raw);

        // 2. Normalização de Escala (1-5 para 0-100)
        const maxVal = Math.max(raw.O, raw.C, raw.E, raw.A, raw.N);

        if (maxVal > 0 && maxVal <= 6) {
            Object.keys(raw).forEach(key => {
                const val = Math.max(1, Math.min(5, raw[key]));
                raw[key] = Math.round(((val - 1) / 4) * 100);
            });
        }

        // 3. Fallback: Se tudo for zero, retorna zero.
        if (maxVal === 0) {
            return { O: 0, C: 0, E: 0, A: 0, N: 0 };
        }

        return raw;
    }

    // --- ACTION PLANS ---

    async createActionPlan(managerId: string, data: any) {
        // Sugestão automática básica (Mock de IA Generativa)
        let actions = data.actions || [];
        if (actions.length === 0) {
            if (data.type === 'ONBOARDING') {
                actions = [
                    { id: '1', title: 'Leitura do Manual de Cultura', status: 'PENDING' },
                    { id: '2', title: 'Reunião 1:1 com Gestor', status: 'PENDING' },
                    { id: '3', title: 'Configuração de Ferramentas', status: 'PENDING' }
                ];
            } else if (data.type === 'DEVELOPMENT') {
                actions = [
                    { id: '1', title: 'Identificar Gap Principal', status: 'COMPLETED' },
                    { id: '2', title: 'Sessão de Mentoria (2x/mês)', status: 'PENDING' },
                    { id: '3', title: 'Curso Online Sugerido', status: 'PENDING' }
                ];
            }
        }

        return this.prisma.actionPlan.create({
            data: {
                managerId,
                employeeId: data.employeeId,
                title: data.title,
                type: data.type,
                objectives: data.objectives || [],
                actions: actions,
                milestones: data.milestones || [],
                status: 'ACTIVE'
            }
        });
    }

    async getActionPlans(tenantId: string) {
        return this.prisma.actionPlan.findMany({
            where: { employee: { tenantId } },
            include: {
                employee: { select: { id: true, name: true, email: true } },
                manager: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getAnalytics(tenantId: string) {
        // 1. Buscar todos usuários do tenant (Colaboradores)
        const employees = await this.prisma.user.findMany({
            where: { tenantId },
            select: { id: true, name: true, email: true }
        });

        const employeeIds = employees.map(e => e.id);

        // 2. Buscar análises de fit recentes para esses usuários
        const recentAnalysis = await this.prisma.candidateFitAnalysis.findMany({
            where: { candidateId: { in: employeeIds } },
            orderBy: { calculatedAt: 'desc' }
        });

        // 3. Processar dados
        const performers = employees.map(emp => {
            // Pegar análise mais recente
            const analysis = recentAnalysis.find(a => a.candidateId === emp.id);
            return {
                ...emp,
                fit: analysis ? analysis.overallFit : 0,
                hasAnalysis: !!analysis,
                trend: 'neutral' // Sem histórico real ainda, então neutro. Nada de dados inventados.
            };
        });

        // Métricas Gerais
        const activeFits = performers.filter(p => p.hasAnalysis);
        const avgFit = activeFits.length > 0
            ? Math.round(activeFits.reduce((acc, curr) => acc + curr.fit, 0) / activeFits.length)
            : 0;

        return {
            metrics: {
                avgFit,
                avgFitTrend: '0%', // Requer snapshots históricos reais
                assessmentsCount: activeFits.length,
                topPerformers: activeFits.filter(p => p.fit >= 80).length,
                needsAttention: activeFits.filter(p => p.fit < 50).length
            },
            performers: performers.sort((a, b) => b.fit - a.fit)
        };
    }
}

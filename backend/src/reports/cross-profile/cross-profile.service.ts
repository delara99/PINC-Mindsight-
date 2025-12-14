import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BigFiveCalculatorService } from '../../assessment/big-five-calculator.service';

@Injectable()
export class CrossProfileService {
    constructor(
        private prisma: PrismaService,
        private calculator: BigFiveCalculatorService
    ) {}

    // Método principal para gerar o relatório
    async generateReport(connectionId: string, authorId: string) {
        // 1. Validar Conexão
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: { userA: true, userB: true },
        });

        if (!connection || connection.status !== 'ACTIVE') {
            throw new BadRequestException('Conexão inválida ou inativa.');
        }

        // Identificar quem é o alvo (o outro usuário da conexão)
        const targetId = connection.userAId === authorId ? connection.userBId : connection.userAId;

        // 2. Buscar Inventários (Big Five) mais recentes
        const authorAssessment = await this.getLatestBigFiveResult(authorId);
        const targetAssessment = await this.getLatestBigFiveResult(targetId);

        if (!authorAssessment) {
            const authorName = authorId === connection.userAId ? connection.userA.name : connection.userB.name;
            const debug = await this.getUserDiagnostic(authorId);
            throw new BadRequestException(`Você (${authorName}) não possui um resultado de Big Five válido. (Diag: ${debug})`);
        }
        if (!targetAssessment) {
            const targetName = targetId === connection.userAId ? connection.userA.name : connection.userB.name;
            const debug = await this.getUserDiagnostic(targetId);
            throw new BadRequestException(`O usuário ${targetName} não possui um resultado de Big Five válido. (Diag: ${debug})`);
        }

        // 3. ENGINE: Calcular Diferenças
        try {
            if (!authorAssessment.scores || !targetAssessment.scores) {
                console.error('[CrossProfile] Scores missing:', { 
                    authorScores: authorAssessment.scores, 
                    targetScores: targetAssessment.scores 
                });
                throw new Error('Pontuações inválidas encontradas.');
            }

            const gaps = this.calculateGaps(authorAssessment.scores, targetAssessment.scores);
            const matchLevel = this.determineOverallMatch(gaps);

            // 4. Salvar no Banco
            const report = await this.prisma.crossProfileReport.create({
                data: {
                    connectionId,
                    authorId,
                    targetId,
                    scoreGap: gaps,
                    matchLevel,
                },
            });

            return report;
        } catch (error) {
            console.error('[CrossProfile] Critical Error:', error);
            throw new BadRequestException(`Erro ao processar relatório: ${error.message}`);
        }
    }

    // Diagnóstico para entender por que o inventário não está sendo encontrado
    private async getUserDiagnostic(userId: string) {
        try {
            const assignments = await this.prisma.assessmentAssignment.findMany({
                where: { userId },
                include: { assessment: true, result: true },
                take: 5,
                orderBy: { assignedAt: 'desc' }
            });

            if (assignments.length === 0) return '0 assignments found';

            return assignments.map((a: any) => 
                `[${a.assessment?.title?.substring(0,10)}..|Type:${a.assessment?.type}|St:${a.status}|Res:${a.result ? 'YES' : 'NO'}]`
            ).join(', ');
        } catch (e) {
            return 'Error details unavailable';
        }
    }

    async getReport(reportId: string) {
        return this.prisma.crossProfileReport.findUnique({
            where: { id: reportId },
            include: { author: true, target: true }
        });
    }
    
    async listReports(connectionId: string) {
        return this.prisma.crossProfileReport.findMany({
            where: { connectionId },
            orderBy: { createdAt: 'desc' }
        });
    }

    // --- Helpers ---

    private async getLatestBigFiveResult(userId: string) {
        // 1. Busca Assignment candidato (Big Five por Type ou Title)
        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: {
                userId,
                assessment: {
                    OR: [
                        { type: 'BIG_FIVE' },
                        { title: { contains: 'Big Five' } }
                    ]
                }
            },
            orderBy: { assignedAt: 'desc' },
            include: { 
                result: true, 
                responses: true,
                assessment: true 
            }
        });

        if (!assignment) return null;

        // 2. Se já tem resultado, retorna
        if (assignment.result) return assignment.result;

        // 3. AUTO-REPAIR: Se tem respostas mas não tem resultado, calcula agora.
        if (assignment.responses && assignment.responses.length > 0) {
            console.log(`[CrossProfile] Repairing missing result for assignment ${assignment.id}`);
            
            try {
                // Formatar respostas
                const formattedResponses = assignment.responses.map((r: any) => ({
                    questionId: r.questionId,
                    value: Number(r.answer)
                }));

                // Calcular
                const calculated = await this.calculator.calculateBigFiveScores(
                    assignment.assessmentId,
                    formattedResponses
                );

                // Mapeamento PT -> EN
                const traitMap: Record<string, string> = {
                    'Abertura à Experiência': 'OPENNESS',
                    'Conscienciosidade': 'CONSCIENTIOUSNESS',
                    'Extroversão': 'EXTRAVERSION',
                    'Amabilidade': 'AGREEABLENESS',
                    'Estabilidade Emocional': 'NEUROTICISM'
                };
                
                const finalScores: any = {};
                calculated.traits.forEach(t => {
                    const enKey = traitMap[t.trait];
                    if (enKey) finalScores[enKey] = t.normalizedScore;
                });

                // Salvar resultado recuperado
                const newResult = await this.prisma.assessmentResult.create({
                    data: {
                        assignmentId: assignment.id,
                        scores: finalScores
                    }
                });

                // Garantir status COMPLETED
                if (assignment.status !== 'COMPLETED') {
                    await this.prisma.assessmentAssignment.update({
                        where: { id: assignment.id },
                        data: { status: 'COMPLETED', completedAt: new Date() }
                    });
                }

                return newResult;

            } catch (e) {
                console.error('[CrossProfile] Repair failed', e);
                // Se falhar o reparo, retorna null e deixa o erro original pro usuário
                return null;
            }
        }

        return null;
    }

    private calculateGaps(scoresA: any, scoresB: any) {
        if (!scoresA || !scoresB) {
             // Redundancia pois verifiquei acima, mas seguro.
             return {};
        }

        const traits = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'];
        const result = {};

        traits.forEach(trait => {
            const valA = scoresA[trait] || 0;
            const valB = scoresB[trait] || 0;
            const diff = Math.abs(valA - valB);
            
            // Classificação da distância
            let classification = 'HIGH_SIMILARITY'; // 0-10
            if (diff > 10 && diff <= 25) classification = 'MODERATE_SIMILARITY';
            else if (diff > 25 && diff <= 40) classification = 'COMPLEMENTARY';
            else if (diff > 40) classification = 'HIGH_DISSONANCE';

            result[trait] = {
                scoreA: valA,
                scoreB: valB,
                diff,
                classification
            };
        });

        return result;
    }

    private determineOverallMatch(gaps: any) {
        if (!gaps || Object.keys(gaps).length === 0) return 'UNKNOWN';

        // Lógica simples: Média das diferenças
        const diffs = Object.values(gaps).map((g: any) => g.diff);
        const avgDiff = diffs.reduce((a: any, b: any) => a + b, 0) / diffs.length;

        if (avgDiff <= 15) return 'HIGH_SYNCHRONY';
        if (avgDiff <= 30) return 'BALANCED';
        return 'CHALLENGING';
    }
}

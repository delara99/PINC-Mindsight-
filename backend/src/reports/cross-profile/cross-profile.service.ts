
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrossProfileService {
    constructor(private prisma: PrismaService) {}

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
            throw new BadRequestException(`Você (${authorName}) não possui um resultado de Big Five válido registrado no sistema.`);
        }
        if (!targetAssessment) {
            const targetName = targetId === connection.userAId ? connection.userA.name : connection.userB.name;
            throw new BadRequestException(`O usuário ${targetName} não possui um resultado de Big Five válido registrado no sistema.`);
        }

        // 3. ENGINE: Calcular Diferenças
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
        // Busca o resultado mais recente diretamente, validando apenas o tipo de teste
        // Isso é mais robusto do que filtrar por status do assignment, pois se existe resultado, está completo.
        const result = await this.prisma.assessmentResult.findFirst({
            where: {
                assignment: {
                    userId,
                    assessment: { type: 'BIG_FIVE' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return result;
    }

    private calculateGaps(scoresA: any, scoresB: any) {
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
        // Lógica simples: Média das diferenças
        const diffs = Object.values(gaps).map((g: any) => g.diff);
        const avgDiff = diffs.reduce((a: any, b: any) => a + b, 0) / diffs.length;

        if (avgDiff <= 15) return 'HIGH_SYNCHRONY';
        if (avgDiff <= 30) return 'BALANCED';
        return 'CHALLENGING';
    }
}

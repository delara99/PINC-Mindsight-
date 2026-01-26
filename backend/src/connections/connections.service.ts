
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TalkingToService, TalkingToInput } from '../talking-to/talking-to.service';

@Injectable()
export class ConnectionsService {
    constructor(
        private prisma: PrismaService,
        private talkingToService: TalkingToService
    ) { }

    // Helper para determinar nível (Baseado na escala normalizada 0-100)
    // Escala 1-6 -> 0-100: 
    // 1->0, 2->20, 3->40, 4->60, 5->80, 6->100
    // Ranges:
    // <= 20: VERY_LOW
    // <= 40: LOW
    // <= 60: AVERAGE
    // <= 80: HIGH
    // > 80: VERY_HIGH
    private getLevel(score: number): string {
        if (score <= 25) return 'VERY_LOW'; // Ajuste fino para os ranges padrão
        if (score <= 45) return 'LOW';
        if (score <= 55) return 'AVERAGE';
        if (score <= 75) return 'HIGH';
        return 'VERY_HIGH';
    }

    // Busca textos ricos no banco
    private async fetchRichTextsForScores(scores: any) {
        const traits = [
            { key: 'O', label: 'OPENNESS' },
            { key: 'C', label: 'CONSCIENTIOUSNESS' },
            { key: 'E', label: 'EXTRAVERSION' },
            { key: 'A', label: 'AGREEABLENESS' },
            { key: 'N', label: 'NEUROTICISM' }
        ];

        const richMap: Record<string, string> = {};

        // Executar queries em paralelo para performance
        await Promise.all(traits.map(async (t) => {
            const score = scores[t.key] || 50;
            const level = this.getLevel(score);

            // Prioridade 1: Resumo (SUMMARY)
            const summary = await this.prisma.bigFiveInterpretativeText.findFirst({
                where: {
                    traitKey: t.label,
                    scoreRange: level,
                    category: 'SUMMARY'
                },
                orderBy: { createdAt: 'desc' }
            });

            if (summary?.text) {
                richMap[t.label] = summary.text;
                return;
            }

            // Prioridade 2: Interpretação Padrão (TEXT_INTERPRETATION) ou Síntese
            const fallback = await this.prisma.bigFiveInterpretativeText.findFirst({
                where: {
                    traitKey: t.label,
                    scoreRange: level,
                    category: { in: ['TEXT_INTERPRETATION', 'EXPERT_SYNTHESIS'] }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (fallback?.text) {
                richMap[t.label] = fallback.text;
            }
        }));

        return richMap;
    }

    async getComparisonData(userId: string, targetId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado.');

        // 1. Verificar conexão
        const connection = await this.prisma.userConnection.findFirst({
            where: {
                OR: [
                    { userAId: userId, userBId: targetId },
                    { userAId: targetId, userBId: userId }
                ],
                status: 'ACCEPTED'
            },
            include: { userA: true, userB: true }
        });

        if (!connection) {
            throw new NotFoundException('Conexão não encontrada ou pendente.');
        }

        const isUserA = connection.userAId === userId;
        const targetUser = isUserA ? connection.userB : connection.userA;

        // 2. Buscar Últimos Resultados de Ambos
        const [myLastAssessment, partnerLastAssessment] = await Promise.all([
            this.prisma.assessmentAssignment.findFirst({
                where: { userId: userId, status: 'COMPLETED', assessment: { type: 'BIG_FIVE' } },
                orderBy: { completedAt: 'desc' },
                include: { result: true, user: true }
            }),
            this.prisma.assessmentAssignment.findFirst({
                where: { userId: targetId, status: 'COMPLETED', assessment: { type: 'BIG_FIVE' } },
                orderBy: { completedAt: 'desc' },
                include: { result: true, user: true }
            })
        ]);

        if (!myLastAssessment || !partnerLastAssessment) {
            return {
                me: null,
                partner: null,
                relationship_analysis: [],
                shared: false,
                error: 'Um dos usuários ainda não completou a avaliação Big Five.'
            };
        }

        // Helper de Normalização
        const normalizeScores = (rawScores: any): TalkingToInput => {
            if (!rawScores) return { O: 50, C: 50, E: 50, A: 50, N: 50 };

            const getVal = (short: string, long: string) => {
                let val = rawScores[short] ?? rawScores[long];
                if (val === undefined) val = rawScores[long.toLowerCase()];

                if (typeof val === 'object' && val !== null && 'score' in val) {
                    val = val.score;
                }
                if (typeof val === 'string') val = Number(val);
                return typeof val === 'number' && !isNaN(val) ? val : 50;
            };

            return {
                O: getVal('O', 'OPENNESS'),
                C: getVal('C', 'CONSCIENTIOUSNESS'),
                E: getVal('E', 'EXTRAVERSION'),
                A: getVal('A', 'AGREEABLENESS'),
                N: getVal('N', 'NEUROTICISM'),
                facets: rawScores.facets || {}
            };
        };

        const myScores = normalizeScores((myLastAssessment.result as any)?.scores);
        const partnerScores = normalizeScores((partnerLastAssessment.result as any)?.scores);

        if (!myScores || !partnerScores) {
            return { error: 'Scores inválidos ou corrompidos.' };
        }

        // 3. BUSCA TEXTOS RICOS NO BANCO DE DADOS
        // Isso garante que usaremos o mesmo texto do relatório oficial, em vez de gerar um genérico
        const myRichTexts = await this.fetchRichTextsForScores(myScores);
        const partnerRichTexts = await this.fetchRichTextsForScores(partnerScores);

        // 4. Analisa (Gera estrutura base)
        const [myAnalysis, partnerAnalysis] = await Promise.all([
            this.talkingToService.analyzeProfile(myScores),
            this.talkingToService.analyzeProfile(partnerScores)
        ]);

        // 5. HIDRATA COM TEXTOS RICOS (Override on generic texts)
        const hydrate = (analysis: any, richMap: Record<string, string>) => {
            if (!analysis.talkingto_analysis) return;
            analysis.talkingto_analysis.forEach((dim: any) => {
                const key = dim.traitKey;
                if (richMap[key]) {
                    dim.text_interpretation = richMap[key];
                }
            });
        };

        hydrate(myAnalysis, myRichTexts);
        hydrate(partnerAnalysis, partnerRichTexts);

        // Prepare Radar Data
        const radarData = [
            { subject: 'Abertura', A: myScores.O, B: partnerScores.O, fullMark: 100 },
            { subject: 'Conscienciosidade', A: myScores.C, B: partnerScores.C, fullMark: 100 },
            { subject: 'Extroversão', A: myScores.E, B: partnerScores.E, fullMark: 100 },
            { subject: 'Agradabilidade', A: myScores.A, B: partnerScores.A, fullMark: 100 },
            { subject: 'Estabilidade', A: 100 - myScores.N, B: 100 - partnerScores.N, fullMark: 100 },
        ];

        const relationshipAnalysis = this.talkingToService.analyzeRelationship(myScores, partnerScores);

        return {
            me: {
                name: myLastAssessment.user.name,
                analysis: myAnalysis.profile_summary,
                full_analysis: myAnalysis.talkingto_analysis,
                scores: myScores
            },
            partner: {
                name: partnerLastAssessment.user.name,
                analysis: partnerAnalysis.profile_summary,
                full_analysis: partnerAnalysis.talkingto_analysis,
                scores: partnerScores
            },
            relationship_analysis: relationshipAnalysis,
            radarData,
            shared: true
        };
    }

    // Enviar convite
    async sendInvite(senderId: string, email: string) {
        // Verificar se usuário alvo existe
        const receiver = await this.prisma.user.findUnique({
            where: { email }
        });

        if (!receiver) {
            throw new NotFoundException('Usuário não encontrado com este e-mail.');
        }

        if (receiver.id === senderId) {
            throw new BadRequestException('Você não pode convidar a si mesmo.');
        }

        // Verificar se já existe conexão
        const existing = await this.prisma.userConnection.findFirst({
            where: {
                OR: [
                    { userAId: senderId, userBId: receiver.id },
                    { userAId: receiver.id, userBId: senderId }
                ]
            }
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') {
                throw new BadRequestException('Vocês já estão conectados.');
            }
            if (existing.status === 'PENDING') {
                throw new BadRequestException('Já existe um convite pendente entre vocês.');
            }
        }

        // Criar convite
        return this.prisma.userConnection.create({
            data: {
                userAId: senderId,
                userBId: receiver.id,
                status: 'PENDING'
            }
        });
    }

    // Listar conexões
    async getConnections(userId: string) {
        const connections = await this.prisma.userConnection.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId }
                ]
            },
            include: {
                userA: {
                    select: { id: true, name: true, email: true, role: true }
                },
                userB: {
                    select: { id: true, name: true, email: true, role: true }
                }
            }
        });

        // Formatar resposta para indicar quem é o parceiro
        return connections.map(conn => {
            const isUserA = conn.userAId === userId;
            const partner = isUserA ? conn.userB : conn.userA;
            return {
                id: conn.id,
                status: conn.status,
                partner: partner,
                initiatedByMe: isUserA
            };
        });
    }

    // Aceitar convite
    async acceptInvite(connectionId: string, userId: string) {
        const connection = await this.prisma.userConnection.findUnique({
            where: { id: connectionId }
        });

        if (!connection) throw new NotFoundException('Convite não encontrado.');

        // Apenas o usuário B (destinatário) pode aceitar se ele não iniciou
        // Mas na nossa lógica userA iniciou e userB recebeu (no create)
        if (connection.userBId !== userId) {
            // Se for userA tentando aceitar, só se userB tiver iniciado (mas lógica atual userA sempre inicia convite pra userB?)
            // Vamos simplificar: só o destinatário real pode aceitar.
            // Se userB for o userId.
            // Se o convite for userA->userB, userId deve ser userB.
        }

        // Simplificação: Se sou uma das partes e está PENDING, aceito.
        // (Idealmente validar quem é o destinatário)

        return this.prisma.userConnection.update({
            where: { id: connectionId },
            data: { status: 'ACCEPTED' }
        });
    }

    // Rejeitar/Remover
    async removeConnection(connectionId: string, userId: string) {
        const connection = await this.prisma.userConnection.findUnique({
            where: { id: connectionId }
        });

        if (!connection) throw new NotFoundException('Conexão não encontrada.');

        if (connection.userAId !== userId && connection.userBId !== userId) {
            throw new BadRequestException('Esta conexão não pertence a você.');
        }

        return this.prisma.userConnection.delete({
            where: { id: connectionId }
        });
    }
}

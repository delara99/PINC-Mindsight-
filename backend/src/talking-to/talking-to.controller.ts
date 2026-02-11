import { Controller, Post, Body, Get, UseGuards, Request, NotFoundException, UnauthorizedException, Param, Res, Delete } from '@nestjs/common';
import { TalkingToService, TalkingToInput } from './talking-to.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCalculationService } from '../reports/score-calculation.service';
import { PdfService } from '../reports/pdf.service';
import { Response } from 'express';

@Controller('talking-to')
export class TalkingToController {
    constructor(
        private readonly service: TalkingToService,
        private readonly prisma: PrismaService,
        private readonly scoreService: ScoreCalculationService,
        private readonly pdfService: PdfService
    ) { }

    // --- ADMIN ENDPOINTS (Gerenciamento do Motor) ---

    @UseGuards(AuthGuard('jwt'))
    @Get('admin/texts')
    async getAllTexts(@Request() req) {
        // TODO: Mover validação de admin para Guard
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
        return this.prisma.talkingToMessage.findMany({
            orderBy: [{ group: 'asc' }, { key: 'asc' }]
        });
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('admin/texts')
    async updateText(@Request() req, @Body() body: { id?: string, content: string, key?: string, group?: string, description?: string }) {
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }

        // CREATE OR UPDATE
        if (body.id) {
            return this.prisma.talkingToMessage.update({
                where: { id: body.id },
                data: { content: body.content }
            });
        } else {
            // Create Logic
            return this.prisma.talkingToMessage.create({
                data: {
                    key: body.key || `CUSTOM_${Date.now()}`,
                    group: body.group || 'GENERAL',
                    description: body.description,
                    content: body.content
                }
            });
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('admin/texts/:id')
    async deleteText(@Request() req, @Param('id') id: string) {
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
        return this.prisma.talkingToMessage.delete({
            where: { id }
        });
    }

    // Endpoint para popular o banco inicialmente (Admin pode chamar quando quiser resetar/criar defaults)
    @UseGuards(AuthGuard('jwt'))
    @Post('admin/seed')
    async seedDefaults(@Request() req) {
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
        // 1. Simulações Dummy (Garantem dimensões básicas)
        const dummy: TalkingToInput = { O: 10, C: 10, E: 10, A: 10, N: 90 };
        await this.service.analyzeProfile(dummy);
        await this.service.analyzeProfile({ O: 90, C: 90, E: 90, A: 90, N: 10 });
        await this.service.analyzeProfile({ O: 50, C: 50, E: 50, A: 50, N: 50 });

        // 2. Seed Exaustivo de Fine-Tuned (Garante todas as combinações)
        const count = await this.service.seedAllDefinitions();

        return { message: `Sincronização concluída. ${count} interpretações finas verificadas/criadas.` };
    }

    // Endpoint público ou protegido para testar o motor
    @Post('simulate')
    simulate(@Body() scores: TalkingToInput) {
        return this.service.analyzeProfile(scores);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('history')
    async getHistory(@Request() req) {
        const userId = req.user.userId;
        // ... (Mesma lógica de antes)
        const history = await this.prisma.assessmentAssignment.findMany({
            where: {
                userId: userId,
                status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' },
            select: {
                id: true,
                completedAt: true,
                assessment: {
                    select: { title: true }
                }
            }
        });
        return history;
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('report/:id')
    async getReportById(@Request() req, @Param('id') id: string) {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const isAdm = userRole === 'SUPER_ADMIN' || userRole === 'TENANT_ADMIN';

        const whereCondition: any = {
            id: id,
            status: 'COMPLETED'
        };

        // Se NÃO for admin, restringe ao próprio usuário
        if (!isAdm) {
            whereCondition.userId = userId;
        }

        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: whereCondition,
            include: { responses: { include: { question: true } }, assessment: true, config: true }
        });

        if (!assignment) {
            throw new NotFoundException('Relatório não encontrado ou acesso negado.');
        }

        return this.generateUnifiedAnalysis(assignment);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async getMyLatestAnalysis(@Request() req) {
        const userId = req.user.userId;

        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: {
                userId: userId,
                status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' },
            include: { responses: { include: { question: true } }, assessment: true, config: true }
        });

        if (!assignment) {
            throw new NotFoundException('Nenhuma avaliação completada encontrada.');
        }

        return this.generateUnifiedAnalysis(assignment);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('export/pdf/:id')
    async exportPdf(@Request() req, @Param('id') id: string, @Res() res: Response) {
        const userId = req.user.userId;

        let assignment;

        // Se ID for 'latest', busca o último do usuário
        if (id === 'latest') {
            assignment = await this.prisma.assessmentAssignment.findFirst({
                where: { userId: userId, status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                include: { responses: { include: { question: true } }, assessment: true, config: true, user: true }
            });
        } else {
            assignment = await this.prisma.assessmentAssignment.findFirst({
                where: { id: id, userId: userId, status: 'COMPLETED' },
                include: { responses: { include: { question: true } }, assessment: true, config: true, user: true }
            });
        }

        if (!assignment) {
            throw new NotFoundException('Relatório não encontrado ou acesso negado.');
        }

        const data = await this.generateUnifiedAnalysis(assignment);

        const pdfData = {
            ...data,
            userName: (assignment.user as any)?.name || 'Cliente',
            date: new Date().toLocaleDateString('pt-BR')
        };

        const buffer = await this.pdfService.generateTalkingToPdf(pdfData);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Relatorio_Mindsight_${assignment.user?.name?.split(' ')[0] || 'PINC'}.pdf"`,
            'Content-Length': buffer.length.toString(),
        });

        res.end(buffer);
    }

    // --- NOVA LÓGICA UNIFICADA ---
    private async generateUnifiedAnalysis(assignment: any) {
        // 1. Usar o Motor Central de Cálculo (já blindado com fallback do TalkingTo)
        const { scores: rawScores } = await this.scoreService.calculateScores(assignment.id);

        // --- CORREÇÃO DE COMPATIBILIDADE: Mapear chaves PT -> EN ---
        // O ScoreService agora retorna chaves nativas (CONCRETO-ABSTRATO), mas este controller
        // e o TalkingToService esperam chaves em Inglês (OPENNESS).
        const scores: any = {};
        const keyMap: Record<string, string> = {
            // Mapeamentos PINC (PT -> EN)
            'CONCRETO-ABSTRATO': 'OPENNESS',
            'ADAPTÁVEL-ESTRUTURADO': 'CONSCIENTIOUSNESS', 'ADAPTAVEL-ESTRUTURADO': 'CONSCIENTIOUSNESS',
            'INTROVERSÃO-EXTROVERSÃO': 'EXTRAVERSION', 'INTROVERSAO-EXTROVERSAO': 'EXTRAVERSION',
            'LÓGICO-SENTIMENTAL': 'AGREEABLENESS', 'LOGICO-SENTIMENTAL': 'AGREEABLENESS',
            'EMOÇÃO-RAZÃO': 'NEUROTICISM', 'EMOCAO-RAZAO': 'NEUROTICISM', 'EMOÇÃO-RAZAO': 'NEUROTICISM', 'EMOCAO-RAZÃO': 'NEUROTICISM',

            // Legacy / Direct
            'OPENNESS': 'OPENNESS', 'ABERTURA': 'OPENNESS',
            'CONSCIENTIOUSNESS': 'CONSCIENTIOUSNESS', 'CONSCIENCIOSIDADE': 'CONSCIENTIOUSNESS',
            'EXTRAVERSION': 'EXTRAVERSION', 'EXTROVERSAO': 'EXTRAVERSION',
            'AGREEABLENESS': 'AGREEABLENESS', 'AMABILIDADE': 'AGREEABLENESS',
            'NEUROTICISM': 'NEUROTICISM', 'ESTABILIDADE': 'NEUROTICISM'
        };

        Object.keys(rawScores).forEach(k => {
            const norm = k.toUpperCase();
            const target = keyMap[norm] || k;
            scores[target] = rawScores[k];
        });

        // 2. Extrair inputs para o TalkingTo Service (O, C, E, A, N)
        const talkingToInput: TalkingToInput = {
            O: scores['OPENNESS']?.normalizedScore || 51,
            C: scores['CONSCIENTIOUSNESS']?.normalizedScore || 51,
            E: scores['EXTRAVERSION']?.normalizedScore || 51,
            A: scores['AGREEABLENESS']?.normalizedScore || 51,
            N: scores['NEUROTICISM']?.normalizedScore || 51, // Note: TalkingToService expects Stability?
            facets: {
                EXTRAVERSION: scores['EXTRAVERSION']?.facets || [],
                AGREEABLENESS: scores['AGREEABLENESS']?.facets || [],
                CONSCIENTIOUSNESS: scores['CONSCIENTIOUSNESS']?.facets || [],
                OPENNESS: scores['OPENNESS']?.facets || [],
                NEUROTICISM: scores['NEUROTICISM']?.facets || []
            }
        };

        // NOTA: TalkingToService.analyzeStability INVERTE se achar que é Neuroticismo.
        // O ScoreService retorna 'AGREEABLENESS' normalizado (High = High Agreeableness).
        // ScoreService retorna 'NEUROTICISM' (High = High Neuroticism / Low Stable).
        // O TalkingToService espera o que em 'N'?
        // Se TalkingToService.analyzeStability(N) faz "100 - N", ele espera Neuroticismo como input.
        // ScoreService envia Neuroticismo. Tudo certo.

        // 3. Gerar Análise Narrativa
        const analysis = await this.service.analyzeProfile(talkingToInput);

        // 3.1 Busca Crossings (Como falar com...)
        const crossings = await this.service.getCrossingsForAnalysis(analysis.talkingto_analysis);

        // --- MERGE CRUCIAL: Injetar textos do TalkingTo dentro dos Scores ---
        // E AGORA: TRANSFORMAR FACETAS IPIP -> PINC (Para exibição correta)

        const pincMapping = {
            'EXTRAVERSION': [
                { pinc: 'COMMUNICATION', sources: ['acolhimento', 'warmth'], label: 'Comunicação', invert: false },
                { pinc: 'SOCIAL_INTERACTION', sources: ['gregarismo', 'gregariousness', 'social'], label: 'Interação Social', invert: false },
                { pinc: 'AUTHORITY', sources: ['assertividade', 'assertiveness', 'autoridade'], label: 'Autoridade', invert: false },
                { pinc: 'ACTION_ORIENTATION', sources: ['atividade', 'activity', 'nivel de atividade', 'acao'], label: 'Orientação p/ Ação', invert: false }
            ],
            'AGREEABLENESS': [
                { pinc: 'LOGIC', sources: ['franqueza', 'straightforwardness', 'sinceridade'], label: 'Lógica', invert: true },
                { pinc: 'INDEPENDENCE', sources: ['altruismo', 'altruísmo', 'altruism'], label: 'Independência', invert: true },
                { pinc: 'COMPETITIVENESS', sources: ['complacencia', 'complacência', 'compliance'], label: 'Competitividade', invert: true }
            ],
            'CONSCIENTIOUSNESS': [
                { pinc: 'PLANNING', sources: ['deliberacao', 'deliberação', 'deliberation', 'planejamento', 'ponderacao', 'ponderação'], label: 'Planejamento', invert: false },
                { pinc: 'DISCIPLINE', sources: ['autodisciplina', 'selfdiscipline', 'disciplina'], label: 'Disciplina', invert: false },
                { pinc: 'PERSISTENCE', sources: ['realizacao', 'realização', 'achievement', 'esforço', 'esforco por realizacao'], label: 'Persistência', invert: false }
            ],
            'OPENNESS': [
                { pinc: 'IMAGINATION', sources: ['fantasia', 'fantasy', 'imaginacao'], label: 'Imaginação', invert: false },
                { pinc: 'INTELLECT', sources: ['ideias', 'ideas', 'intelecto'], label: 'Intelectualidade', invert: false },
                { pinc: 'OPENNESS_TO_NEW', sources: ['valores', 'values', 'abertura'], label: 'Abertura ao Novo', invert: false }
            ],
            'NEUROTICISM': [
                { pinc: 'CONFIDENCE', sources: ['ansiedade', 'anxiety'], label: 'Confiança', invert: true },
                { pinc: 'SELF_CONFIDENCE', sources: ['depressao', 'depressão', 'depression'], label: 'Autoconfiança', invert: true },
                { pinc: 'TEMPERAMENT', sources: ['hostilidade', 'angryhostility', 'raiva', 'temperamento'], label: 'Temperamento', invert: true },
                { pinc: 'CONTROL', sources: ['impulsividade', 'impulsiveness', 'imoderacao', 'imoderação', 'controle'], label: 'Controle', invert: true }
            ]
        };

        if (analysis && analysis.talkingto_analysis) {
            analysis.talkingto_analysis.forEach((dimResult: any) => {
                const key = dimResult.traitKey; // EXTRAVERSION, etc.
                if (scores[key]) {
                    (scores[key] as any).customTexts = {
                        summary: dimResult.text_interpretation, // COMPATIBILIDADE FRONTEND
                        text_interpretation: dimResult.text_interpretation,
                        environment: dimResult.needs.environment,
                        risk: dimResult.needs.risk,
                        needs: dimResult.needs.primary
                    };

                    // 2. Transforma Facetas (IPIP -> PINC) com Lógica de Sinônimos
                    const mapping = pincMapping[key];
                    if (mapping && scores[key].facets) {
                        const newFacets = mapping.map(m => {
                            // Tenta encontrar match em qualquer um dos sources
                            let original: any = null;

                            for (const src of m.sources) {
                                original = scores[key].facets.find((f: any) =>
                                    (f.name || f.facetName || '').toLowerCase().includes(src)
                                );
                                if (original) break; // Achou!
                            }

                            let rawScore = original ? ((original as any).score || (original as any).normalizedScore || 50) : 50;

                            // Aplica Inversão se necessário
                            const finalScore = m.invert ? (100 - rawScore) : rawScore;

                            // Classificação simples (inline para evitar erro de acesso privado)
                            const level = finalScore <= 50 ? 'BAIXO' : 'ALTO'; // Binário conforme update recente

                            return {
                                name: m.pinc,
                                score: finalScore,
                                normalizedScore: finalScore,
                                level: level
                            };
                        });

                        // SUBSTITUI as facetas antigas pelas novas
                        scores[key].facets = newFacets;
                    }
                }
            });
        }

        return {
            id: assignment.id,
            title: assignment.assessment?.title || 'Relatório Unificado',
            completedAt: assignment.completedAt,

            // Dados Narrativos
            talkingToAnalysis: analysis,
            crossings: crossings, // NOVO CAMPO

            // Dados Quantitativos (Para o Radar e Detalhes)
            unifiedScores: scores,
            calculatedScores: { scores: Object.values(scores) }, // Fallback para frontends antigos que esperam array em calculatedScores.scores

            // Metadados para UI
            radarData: [
                { subject: 'Extroversão', A: talkingToInput.E, fullMark: 100 },
                { subject: 'Amabilidade', A: talkingToInput.A, fullMark: 100 },
                { subject: 'Estrutura', A: talkingToInput.C, fullMark: 100 },
                { subject: 'Estabilidade', A: 100 - talkingToInput.N, fullMark: 100 }, // Radar mostra Estabilidade (Bom)
                { subject: 'Abertura', A: talkingToInput.O, fullMark: 100 }
            ]
        };
    }
}

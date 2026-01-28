
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Role, UserStatus, PlanType } from '@prisma/client';
import { TalkingToService, TalkingToInput } from '../talking-to/talking-to.service';
import { ScoreCalculationService } from '../reports/score-calculation.service';

@Injectable()
export class BusinessService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly talkingToService: TalkingToService,
        private readonly scoreService: ScoreCalculationService
    ) { }

    // --- DASHBOARD ---
    async getDashboardStats(tenantId: string) {
        if (!tenantId) throw new BadRequestException('Tenant ID obrigatório');

        const totalEmployees = await this.prisma.user.count({
            where: { tenantId, role: Role.MEMBER }
        });

        const activeEmployees = await this.prisma.user.count({
            where: { tenantId, role: Role.MEMBER, status: UserStatus.active }
        });

        const assessments = await this.prisma.assessmentAssignment.findMany({
            where: {
                user: { tenantId }
            },
            select: { status: true }
        });

        const completed = assessments.filter(a => a.status === 'COMPLETED').length;
        const pending = assessments.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length;

        const adminUsers = await this.prisma.user.findMany({
            where: { tenantId, role: { in: [Role.TENANT_ADMIN, Role.SUPER_ADMIN] } }
        });

        // Soma créditos de todos os admins do tenant para evitar confusão se houver múltiplas contas
        const totalCredits = adminUsers.reduce((sum, user) => sum + (user.credits || 0), 0);

        return {
            employees: { total: totalEmployees, active: activeEmployees },
            assessments: { completed, pending, total: assessments.length },
            credits: totalCredits
        };
    }

    // --- EMPLOYEES ---
    async getEmployees(tenantId: string) {
        return this.prisma.user.findMany({
            where: { tenantId, role: Role.MEMBER },
            select: {
                id: true, name: true, email: true, status: true,
                createdAt: true, lastActivityAt: true,
                credits: true, // Inclui créditos na listagem
                assignments: {
                    select: { status: true, assignedAt: true, completedAt: true },
                    orderBy: { assignedAt: 'desc' },
                    take: 1
                },
                companyName: true // Add companyName explicitly
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async deleteEmployee(tenantId: string, userId: string) {
        // Valida antes
        await this.validateEmployee(tenantId, userId);

        return this.prisma.$transaction(async (tx) => {
            // 1. Limpar relações de Conexões e Reports (Ordem importa devido FKs)
            await tx.crossProfileReport.deleteMany({
                where: { OR: [{ authorId: userId }, { targetId: userId }] }
            });

            // Connection cascade deletes: Messages, SharingSettings
            await tx.connection.deleteMany({
                where: { OR: [{ userAId: userId }, { userBId: userId }] }
            });

            await tx.connectionRequest.deleteMany({
                where: { OR: [{ senderId: userId }, { receiverId: userId }] }
            });

            await tx.connectionInviteLink.deleteMany({
                where: { OR: [{ creatorId: userId }, { usedById: userId }] }
            });

            // 2. Limpar Feedbacks e Pagamentos
            await tx.professionalFeedback.deleteMany({
                where: { userId }
            });

            await tx.payment.deleteMany({
                where: { userId }
            });

            // 3. Limpar Avaliações e Créditos (Existentes)
            await tx.assessmentResponse.deleteMany({
                where: { assignment: { userId } }
            });
            await tx.assessmentAssignment.deleteMany({
                where: { userId }
            });
            await tx.creditSolicitation.deleteMany({
                where: { userId }
            });

            // 4. Deletar Usuário Final
            await tx.user.delete({
                where: { id: userId }
            });
        });
    }

    async resetAccessCode(tenantId: string, userId: string) {
        const user = await this.validateEmployee(tenantId, userId);

        // Gerar novo código
        const newCode = 'PINC-' + Math.floor(1000 + Math.random() * 9000);
        // const dummyEmail = `${newCode.toLowerCase()}.${Date.now()}@func.pinc.app`;
        const hashedPassword = await bcrypt.hash(newCode, 10);

        return this.prisma.user.update({
            where: { id: userId },
            data: {
                companyName: newCode, // Guarda o código visível
                password: hashedPassword, // Atualiza a senha
            }
        });
    }

    async createEmployee(tenantId: string, data: { name: string; accessCode?: string, initialCredits?: number }) {
        // Gera um email fictício para unicidade no banco se não fornecido
        const accessCode = data.accessCode || Math.random().toString(36).slice(-6).toUpperCase();

        // Email placeholder único
        const dummyEmail = `${accessCode.toLowerCase()}.${Date.now()}@func.pinc.app`;

        // 1. Senha = Código de Acesso Hash
        const hashedPassword = await bcrypt.hash(accessCode, 10);

        // 2. Criar Usuário
        const newUser = await this.prisma.user.create({
            data: {
                name: data.name,
                email: dummyEmail, // Email de sistema
                password: hashedPassword, // Código é a senha
                role: Role.MEMBER,
                tenantId: tenantId,
                status: UserStatus.active,
                plan: PlanType.BUSINESS,
                mustChangePassword: false, // Código é fixo
                companyName: accessCode, // Usamos companyName temporariamente
                credits: data.initialCredits || 0
            }
        });

        // Retorna o usuário com o código
        return { ...newUser, accessCode };
    }

    // --- REPORTS ---
    async getAllReports(tenantId: string) {
        console.log(`[getAllReports] Buscando relatórios para tenant: ${tenantId}`);

        const reports = await this.prisma.assessmentAssignment.findMany({
            where: {
                user: { tenantId },
                status: 'COMPLETED'
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true }
                },
                assessment: {
                    select: { title: true }
                },
                result: true
            },
            orderBy: { completedAt: 'desc' }
        });

        console.log(`[getAllReports] Encontrados ${reports.length} relatórios`);

        return reports.map(r => ({
            reportId: r.id,
            userId: r.user.id,
            userName: r.user.name,
            userEmail: r.user.email,
            assessmentTitle: r.assessment.title,
            completedAt: r.completedAt,
            resultId: r.result?.id
        }));
    }

    // --- REPORT GENERATION ORCHESTRATION ---
    async generateReportData(userId: string) {
        // 1. Buscar último assignment completado
        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: { userId, status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
            include: { assessment: true, user: true }
        });

        if (!assignment) {
            throw new NotFoundException('Nenhuma avaliação concluída encontrada para este colaborador.');
        }

        // 2. Calcular Scores
        const { scores } = await this.scoreService.calculateScores(assignment.id);

        // 3. Preparar Input para TalkingTo
        const talkingToInput: TalkingToInput = {
            O: scores['OPENNESS']?.normalizedScore || 50,
            C: scores['CONSCIENTIOUSNESS']?.normalizedScore || 50,
            E: scores['EXTRAVERSION']?.normalizedScore || 50,
            A: scores['AGREEABLENESS']?.normalizedScore || 50,
            N: scores['NEUROTICISM']?.normalizedScore || 50,
            facets: {
                EXTRAVERSION: scores['EXTRAVERSION']?.facets || [],
                AGREEABLENESS: scores['AGREEABLENESS']?.facets || [],
                CONSCIENTIOUSNESS: scores['CONSCIENTIOUSNESS']?.facets || [],
                OPENNESS: scores['OPENNESS']?.facets || [],
                NEUROTICISM: scores['NEUROTICISM']?.facets || []
            }
        };

        // 4. Gerar Análise Narrativa
        const analysis = this.talkingToService.analyzeProfile(talkingToInput);

        // 5. Retornar Objeto Completo
        return {
            talkingToAnalysis: analysis,
            unifiedScores: scores,
            userName: assignment.user.name,
            date: assignment.completedAt ? new Date(assignment.completedAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
            radarData: [
                { subject: 'Extroversão', A: talkingToInput.E, fullMark: 100 },
                { subject: 'Amabilidade', A: talkingToInput.A, fullMark: 100 },
                { subject: 'Estrutura', A: talkingToInput.C, fullMark: 100 },
                { subject: 'Estabilidade', A: 100 - talkingToInput.N, fullMark: 100 },
                { subject: 'Abertura', A: talkingToInput.O, fullMark: 100 }
            ]
        };
    }

    // --- UTILS ---
    async validateEmployee(tenantId: string, userId: string) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId }
        });
        if (!user) {
            throw new NotFoundException('Colaborador não encontrado ou não pertence a esta empresa.');
        }
        return user;
    }

    // --- ACCESS CONTROL & CREDITS & ASSIGNMENTS ---

    async toggleEmployeeStatus(tenantId: string, userId: string) {
        const user = await this.validateEmployee(tenantId, userId);
        const newStatus = user.status === 'active' ? 'inactive' : 'active';

        return this.prisma.user.update({
            where: { id: userId },
            data: { status: newStatus }
        });
    }

    // NOVO: Transferir Créditos do Gestor -> Colaborador
    async transferCredits(tenantId: string, adminUserId: string, targetUserId: string, amount: number) {
        if (amount < 1) throw new BadRequestException('Quantidade inválida.');

        const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
        if (!admin || admin.credits < amount) {
            throw new BadRequestException('Saldo insuficiente na conta do gestor.');
        }
        if (admin.tenantId !== tenantId) throw new ForbiddenException();
        await this.validateEmployee(tenantId, targetUserId);

        await this.prisma.$transaction(async (tx) => {
            // Debita Gestor
            await tx.user.update({
                where: { id: adminUserId },
                data: { credits: { decrement: amount } }
            });
            // Credita Colaborador
            await tx.user.update({
                where: { id: targetUserId },
                data: { credits: { increment: amount } }
            });
        });

        // AUTO-ASSIGN: Se o colaborador recebeu crédito e não tem teste, cria um agora.
        try {
            await this.createAssignmentFromWallet(tenantId, targetUserId);
        } catch (e) {
            console.log('Auto-assign on transfer skipped:', e.message);
        }

        return { success: true, amount };
    }

    // NOVO: Criar Assignment (FREE - Cobrança no Submit)
    async createAssignmentFromWallet(tenantId: string, targetUserId: string) {
        const target = await this.validateEmployee(tenantId, targetUserId);

        // Não cobramos mais na criação. Apenas garantimos que o assignment exista.
        // A cobrança será feita no Submit, verificando se o user tem créditos.

        return this.prisma.$transaction(async (tx) => {
            // Busca Modelo Padrão
            let assessment = await tx.assessmentModel.findFirst({
                where: { tenantId, isDefault: true }
            });

            if (!assessment) {
                assessment = await tx.assessmentModel.findFirst({
                    where: { OR: [{ tenantId }, { isDefault: true }] }
                });
            }

            if (!assessment) throw new NotFoundException('Nenhuma avaliação configurada.');

            // Check if exists
            const existing = await tx.assessmentAssignment.findFirst({
                where: { userId: targetUserId, assessmentId: assessment.id, status: { not: 'COMPLETED' } }
            });
            if (existing) return existing;

            // Cria Assignment (FREE)
            const assignment = await tx.assessmentAssignment.create({
                data: {
                    userId: targetUserId,
                    assessmentId: assessment.id,
                    status: 'PENDING',
                    assignedAt: new Date()
                }
            });

            return assignment;
        });
    }

    /**
     * @deprecated Legacy method name kept for controller compatibility, but now uses wallet logic.
     */
    async distributeCredit(tenantId: string, adminUserId: string, targetUserId: string) {
        // Redireciona para o novo fluxo
        return this.createAssignmentFromWallet(tenantId, targetUserId);
    }

    // --- UNIFIED REPORT (TALKING TO ENGINE) ---
    async getUnifiedReport(assignmentId: string, requestUser: any) {
        // 1. Validar e Buscar Assignment
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                user: true,
                assessment: true,
                result: true
            }
        });

        if (!assignment) throw new NotFoundException('Relatório não encontrado');

        // Validar Acesso
        if (requestUser.role === 'TENANT_ADMIN' || requestUser.role === 'SUPER_ADMIN') {
            // Admin ok
        } else {
            // Colaborador validando próprio acesso
            if (assignment.userId !== requestUser.userId) {
                throw new ForbiddenException('Acesso negado a este relatório.');
            }
        }

        // 2. Calcular Scores REAIS
        const scoreResult = await this.scoreService.calculateScores(assignmentId);
        const { scores } = scoreResult;

        if (!scores || Object.keys(scores).length === 0) {
            console.error('Falha ao calcular scores para TalkingTo:', assignmentId);
            throw new BadRequestException('Não foi possível calcular os scores.');
        }

        // Helper
        const getScore = (k: string) => Math.round(scores[k]?.normalizedScore || 0);

        // 3. Preparar Input
        const input: TalkingToInput = {
            O: getScore('OPENNESS'),
            C: getScore('CONSCIENTIOUSNESS'),
            E: getScore('EXTRAVERSION'),
            A: getScore('AGREEABLENESS'),
            N: getScore('NEUROTICISM'),
            facets: {
                EXTRAVERSION: scores['EXTRAVERSION']?.facets || [],
                AGREEABLENESS: scores['AGREEABLENESS']?.facets || [],
                CONSCIENTIOUSNESS: scores['CONSCIENTIOUSNESS']?.facets || [],
                OPENNESS: scores['OPENNESS']?.facets || [],
                NEUROTICISM: scores['NEUROTICISM']?.facets || []
            }
        };

        // 4. Rodar TalkingTo Engine
        const analysis = await this.talkingToService.analyzeProfile(input);

        // 5. Harmonizar
        const mappedScores = analysis.talkingto_analysis.map(dim => {
            let traitKey = '';
            let finalScore = 0;
            let realFacets: any[] = [];

            if (dim.dimension.includes('Extroversão')) {
                traitKey = 'EXTRAVERSION';
                finalScore = input.E;
                realFacets = scores['EXTRAVERSION']?.facets || [];
            }
            else if (dim.dimension.includes('Agradabilidade')) {
                traitKey = 'AGREEABLENESS';
                finalScore = input.A;
                realFacets = scores['AGREEABLENESS']?.facets || [];
            }
            else if (dim.dimension.includes('Estrutura') || dim.dimension.includes('Conscienciosidade')) {
                traitKey = 'CONSCIENTIOUSNESS';
                finalScore = input.C;
                realFacets = scores['CONSCIENTIOUSNESS']?.facets || [];
            }
            else if (dim.dimension.includes('Abertura') || dim.dimension.includes('Mentalidade')) {
                traitKey = 'OPENNESS';
                finalScore = input.O;
                realFacets = scores['OPENNESS']?.facets || [];
            }
            else if (dim.dimension.includes('Estabilidade') || dim.dimension.includes('Resiliência')) {
                traitKey = 'NEUROTICISM';
                finalScore = 100 - input.N;
                realFacets = scores['NEUROTICISM']?.facets || [];
            }

            const levelMap: Record<string, string> = { 'BAIXO': 'LOW', 'FLEX': 'AVERAGE', 'ALTO': 'HIGH' };

            return {
                key: traitKey,
                name: dim.dimension,
                score: finalScore,
                level: levelMap[dim.classification] || 'AVERAGE',
                customTexts: {
                    text_interpretation: dim.text_interpretation,
                    needs: dim.needs
                },
                facets: realFacets
            };
        });

        const order = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'];
        mappedScores.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

        return {
            ...assignment,
            calculatedScores: {
                scores: mappedScores,
                profile_summary: analysis.profile_summary,
                executive_summary: analysis.executive_summary
            }
        };
    }
    // --- LEADS ---
    async createLead(data: {
        name: string,
        email: string,
        phone: string,
        company: string,
        companySize: string,
        role: string,
        interests: any,
        consent: boolean
    }) {
        // @ts-ignore - Prisma might not have regenerated types yet locally
        return this.prisma.businessLead.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company,
                companySize: data.companySize,
                role: data.role,
                interests: data.interests,
                consent: data.consent,
                status: 'PENDING'
            }
        });
    }

    async getLeads() {
        // @ts-ignore
        return this.prisma.businessLead.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
}

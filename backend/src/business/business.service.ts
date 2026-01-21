
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
                assignments: {
                    select: { status: true, assignedAt: true, completedAt: true },
                    orderBy: { assignedAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createEmployee(tenantId: string, data: { name: string; accessCode?: string }) {
        // Gera um email fictício para unicidade no banco se não fornecido
        // Formato: codigo.empresa@pinc.app (mas precisamos garantir unicidade)
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
                companyName: accessCode // Usamos companyName temporariamente
            }
        });

        // Retorna o usuário com o código (guardado em companyName ou re-injetado)
        return { ...newUser, accessCode };
    }

    // --- REPORTS ---
    async getAllReports(tenantId: string) {
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

    // --- ACCESS CONTROL & CREDITS ---

    async toggleEmployeeStatus(tenantId: string, userId: string) {
        const user = await this.validateEmployee(tenantId, userId);
        const newStatus = user.status === 'active' ? 'inactive' : 'active';

        return this.prisma.user.update({
            where: { id: userId },
            data: { status: newStatus }
        });
    }

    async distributeCredit(tenantId: string, adminUserId: string, targetUserId: string) {
        // 1. Validar Admin (Fonte)
        const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
        if (!admin || admin.credits < 1) {
            throw new BadRequestException('Saldo insuficiente para distribuir créditos.');
        }

        if (admin.tenantId !== tenantId) throw new ForbiddenException();

        // 2. Validar Alvo
        const target = await this.validateEmployee(tenantId, targetUserId);

        // 3. Transação: Tira de Admin -> Cria Assignment (Usa crédito)
        // Nota: O sistema atual não põe créditos no Member, ele CRIA a avaliação PAGA.
        // Se o pedido for "dar créditos para o membro redistribuir", seria diferente.
        // Mas o pedido diz "redistribuir para seus colaboradores... poderem realizar o inventario".
        // Isso significa: Gastar 1 crédito do Admin para criar 1 Assignment para o Member.

        return this.prisma.$transaction(async (tx) => {
            // Decrementa Admin
            await tx.user.update({
                where: { id: adminUserId },
                data: { credits: { decrement: 1 } }
            });

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

            // Cria Assignment
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
}


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

        return {
            employees: { total: totalEmployees, active: activeEmployees },
            assessments: { completed, pending, total: assessments.length }
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

    async createEmployee(tenantId: string, data: { name: string; email: string }) {
        // 1. Verificar duplicação
        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new BadRequestException('E-mail já cadastrado na plataforma.');
        }

        // 2. Senha temporária
        const tempList = '123456';
        const hashedPassword = await bcrypt.hash(tempList, 10);

        // 3. Criar Usuário
        const newUser = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: Role.MEMBER,
                tenantId: tenantId,
                status: UserStatus.pending,
                plan: PlanType.BUSINESS,
                mustChangePassword: true
            }
        });

        // 4. Atribuir Assessment Padrão do Tenant
        let assessment = await this.prisma.assessmentModel.findFirst({
            where: { tenantId, isDefault: true }
        });

        if (!assessment) {
            assessment = await this.prisma.assessmentModel.findFirst({
                where: { OR: [{ tenantId }, { isDefault: true }] }
            });
        }

        if (assessment) {
            await this.prisma.assessmentAssignment.create({
                data: {
                    userId: newUser.id,
                    assessmentId: assessment.id,
                    status: 'PENDING'
                }
            });
        }

        return newUser;
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
}

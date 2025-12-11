import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
    constructor(private prisma: PrismaService) { }

    @Get('stats')
    async getStats(@Request() req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Acesso negado');
        }

        const tenantId = user.tenantId;

        // 1. Avaliações Ativas (Pending ou In Progress)
        const activeAssessments = await this.prisma.assessmentAssignment.count({
            where: {
                assessment: { tenantId },
                status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
        });

        // 2. Candidatos na Fila (Pending)
        const candidatesInQueue = await this.prisma.assessmentAssignment.count({
            where: {
                assessment: { tenantId },
                status: 'PENDING'
            }
        });

        // 3. Usuários Online (ativos nos últimos 5 minutos)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineUsersWhere: any = {
            userType: 'INDIVIDUAL',
            lastActivityAt: { gte: fiveMinutesAgo }
        };

        // Filter by tenant only if user is TENANT_ADMIN
        if (user.role === 'TENANT_ADMIN' && tenantId) {
            onlineUsersWhere.tenantId = tenantId;
        }

        const onlineUsers = await this.prisma.user.count({
            where: onlineUsersWhere
        });

        // 4. Candidatos Recentes (com assignment mais recente)
        const recentAssignments = await this.prisma.assessmentAssignment.findMany({
            where: { assessment: { tenantId } },
            take: 5,
            orderBy: { assignedAt: 'desc' },
            include: {
                user: { select: { name: true, role: true } },
                result: { select: { scores: true } }
            }
        });

        // 5. Usuários sem créditos e com pendências
        // Se for SUPER_ADMIN, busca em todos os tenants (considerando que ele gerencia todos)
        // Se for TENANT_ADMIN, busca apenas no seu tenant
        const usersWithoutCreditsWhere: any = {
            credits: { lte: 0 },
            assignments: {
                some: { status: 'PENDING' }
            }
        };

        if (user.role !== 'SUPER_ADMIN') {
            usersWithoutCreditsWhere.tenantId = tenantId;
        }

        const usersWithoutCredits = await this.prisma.user.findMany({
            where: usersWithoutCreditsWhere,
            select: { id: true, name: true, email: true }
        });

        // 6. Solicitações de Crédito Pendentes
        const creditRequestsWhere: any = {
            status: 'PENDING'
        };

        if (user.role !== 'SUPER_ADMIN') {
            creditRequestsWhere.tenantId = tenantId;
        }

        const creditRequests = await this.prisma.creditSolicitation.findMany({
            where: creditRequestsWhere,
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return {
            activeAssessments,
            candidatesInQueue,
            onlineUsers,
            recentCandidates: recentAssignments.map(a => ({
                name: a.user.name || 'Sem nome',
                role: 'Candidato', // Pode ajustar se tiver campo 'position'
                date: a.assignedAt,
                score: a.result ? 'Concluído' : 'Pendente',
                status: a.status === 'COMPLETED' ? 'Concluído' : 'Pendente' // Traduzir depois
            })),
            usersWithoutCredits,
            creditRequests
        };
    }
}

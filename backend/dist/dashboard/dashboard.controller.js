"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const passport_1 = require("@nestjs/passport");
let DashboardController = class DashboardController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        const tenantId = user.tenantId;
        const activeAssessments = await this.prisma.assessmentAssignment.count({
            where: {
                assessment: { tenantId },
                status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
        });
        const candidatesInQueue = await this.prisma.assessmentAssignment.count({
            where: {
                assessment: { tenantId },
                status: 'PENDING'
            }
        });
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineUsersWhere = {
            userType: 'INDIVIDUAL',
            lastActivityAt: { gte: fiveMinutesAgo }
        };
        if (user.role === 'TENANT_ADMIN' && tenantId) {
            onlineUsersWhere.tenantId = tenantId;
        }
        const onlineUsers = await this.prisma.user.count({
            where: onlineUsersWhere
        });
        const recentAssignments = await this.prisma.assessmentAssignment.findMany({
            where: { assessment: { tenantId } },
            take: 5,
            orderBy: { assignedAt: 'desc' },
            include: {
                user: { select: { name: true, role: true } },
                result: { select: { scores: true } }
            }
        });
        const usersWithoutCreditsWhere = {
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
        const creditRequestsWhere = {
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
                role: 'Candidato',
                date: a.assignedAt,
                score: a.result ? 'Concluído' : 'Pendente',
                status: a.status === 'COMPLETED' ? 'Concluído' : 'Pendente'
            })),
            usersWithoutCredits,
            creditRequests
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map
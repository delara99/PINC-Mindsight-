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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConnectionsService = class ConnectionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendInvite(senderId, email) {
        const receiver = await this.prisma.user.findUnique({
            where: { email }
        });
        if (!receiver) {
            throw new common_1.NotFoundException('Usuário não encontrado com este e-mail.');
        }
        if (receiver.id === senderId) {
            throw new common_1.BadRequestException('Você não pode convidar a si mesmo.');
        }
        const existingConnection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { userAId: senderId, userBId: receiver.id },
                    { userAId: receiver.id, userBId: senderId }
                ]
            }
        });
        if (existingConnection) {
            throw new common_1.BadRequestException('Vocês já estão conectados ou bloqueados.');
        }
        const existingRequest = await this.prisma.connectionRequest.findFirst({
            where: {
                OR: [
                    { senderId, receiverId: receiver.id, status: 'PENDING' },
                    { senderId: receiver.id, receiverId: senderId, status: 'PENDING' }
                ]
            }
        });
        if (existingRequest) {
            throw new common_1.BadRequestException('Já existe um convite pendente entre vocês.');
        }
        return this.prisma.connectionRequest.create({
            data: {
                senderId,
                receiverId: receiver.id,
                status: 'PENDING'
            }
        });
    }
    async getConnections(userId) {
        const connections = await this.prisma.connection.findMany({
            where: {
                OR: [
                    { userAId: userId },
                    { userBId: userId }
                ],
                status: 'ACTIVE'
            },
            include: {
                userA: { select: { id: true, name: true, email: true, companyName: true, userType: true } },
                userB: { select: { id: true, name: true, email: true, companyName: true, userType: true } }
            }
        });
        return connections.map(conn => {
            const isUserA = conn.userAId === userId;
            const otherUser = isUserA ? conn.userB : conn.userA;
            return Object.assign({ connectionId: conn.id }, otherUser);
        });
    }
    async getPendingRequests(userId) {
        return this.prisma.connectionRequest.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING'
            },
            include: {
                sender: { select: { id: true, name: true, email: true } }
            }
        });
    }
    async acceptRequest(requestId, userId) {
        const request = await this.prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });
        if (!request)
            throw new common_1.NotFoundException('Convite não encontrado.');
        if (request.receiverId !== userId)
            throw new common_1.ForbiddenException('Este convite não é para você.');
        if (request.status !== 'PENDING')
            throw new common_1.BadRequestException('Convite já processado.');
        return this.prisma.$transaction(async (tx) => {
            await tx.connectionRequest.update({
                where: { id: requestId },
                data: { status: 'ACCEPTED' }
            });
            const connection = await tx.connection.create({
                data: {
                    userAId: request.senderId,
                    userBId: request.receiverId,
                    status: 'ACTIVE'
                }
            });
            await tx.connectionSharingSetting.createMany({
                data: [
                    { connectionId: connection.id, userId: request.senderId },
                    { connectionId: connection.id, userId: request.receiverId }
                ]
            });
            return connection;
        });
    }
    async rejectRequest(requestId, userId) {
        const request = await this.prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });
        if (!request)
            throw new common_1.NotFoundException('Convite não encontrado.');
        if (request.receiverId !== userId)
            throw new common_1.ForbiddenException('Este convite não é para você.');
        return this.prisma.connectionRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        });
    }
    async removeConnection(connectionId, userId) {
        const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
        if (!conn)
            throw new common_1.NotFoundException('Conexão não encontrada');
        if (conn.userAId !== userId && conn.userBId !== userId)
            throw new common_1.ForbiddenException('Acesso negado');
        return this.prisma.connection.delete({
            where: { id: connectionId }
        });
    }
    async getConnectionDetail(connectionId, userId) {
        const conn = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: {
                userA: { select: { id: true, name: true, email: true, companyName: true, userType: true } },
                userB: { select: { id: true, name: true, email: true, companyName: true, userType: true } },
                sharingSettings: true
            }
        });
        if (!conn)
            throw new common_1.NotFoundException('Conexão não encontrada');
        if (conn.userAId !== userId && conn.userBId !== userId)
            throw new common_1.ForbiddenException('Acesso negado');
        const isUserA = conn.userAId === userId;
        const otherUser = isUserA ? conn.userB : conn.userA;
        const mySettings = conn.sharingSettings.find(s => s.userId === userId);
        const theirSettings = conn.sharingSettings.find(s => s.userId === otherUser.id);
        return {
            connectionId: conn.id,
            partner: otherUser,
            mySettings: mySettings || {},
            theirSettings: theirSettings || {}
        };
    }
    async updateSharingSettings(connectionId, userId, settings) {
        const existing = await this.prisma.connectionSharingSetting.findFirst({
            where: { connectionId, userId }
        });
        if (existing) {
            return this.prisma.connectionSharingSetting.update({
                where: { id: existing.id },
                data: Object.assign({}, settings)
            });
        }
        else {
            return this.prisma.connectionSharingSetting.create({
                data: Object.assign({ connectionId,
                    userId }, settings)
            });
        }
    }
    async getSharedContent(connectionId, requesterId) {
        const conn = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: { userA: true, userB: true, sharingSettings: true }
        });
        if (!conn)
            throw new common_1.NotFoundException('Conexão não encontrada');
        if (conn.userAId !== requesterId && conn.userBId !== requesterId)
            throw new common_1.ForbiddenException('Acesso negado');
        const partnerId = conn.userAId === requesterId ? conn.userBId : conn.userAId;
        const partnerSettings = conn.sharingSettings.find(s => s.userId === partnerId);
        if (!partnerSettings) {
            return { message: 'Este usuário ainda não compartilhou dados com você.', blocked: true };
        }
        const content = {};
        if (partnerSettings.shareInventories) {
            content.inventories = await this.prisma.assessmentResult.findMany({
                where: { assignment: { userId: partnerId } },
                include: { assignment: { include: { assessment: true } } },
                take: 5,
                orderBy: { createdAt: 'desc' }
            });
        }
        if (partnerSettings.shareQuestionnaires) {
        }
        if (partnerSettings.shareActivityHistory) {
        }
        return content;
    }
    async sendMessage(connectionId, senderId, content) {
        const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
        if (!conn)
            throw new common_1.NotFoundException('Conexão não encontrada');
        if (conn.userAId !== senderId && conn.userBId !== senderId)
            throw new common_1.ForbiddenException('Acesso negado');
        return this.prisma.connectionMessage.create({
            data: {
                connectionId,
                senderId,
                content
            }
        });
    }
    async getMessages(connectionId, userId) {
        const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
        if (!conn)
            throw new common_1.NotFoundException('Conexão não encontrada');
        if (conn.userAId !== userId && conn.userBId !== userId)
            throw new common_1.ForbiddenException('Acesso negado');
        return this.prisma.connectionMessage.findMany({
            where: { connectionId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, name: true } } }
        });
    }
    async generateInviteLink(creatorId) {
        const token = Math.random().toString(36).substring(2, 10).toUpperCase();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const link = await this.prisma.connectionInviteLink.create({
            data: {
                creatorId,
                token,
                expiresAt,
                status: 'ACTIVE'
            }
        });
        return {
            token: link.token,
            link: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/connections/join/${link.token}`,
            expiresAt: link.expiresAt
        };
    }
    async validateInviteToken(token) {
        const invite = await this.prisma.connectionInviteLink.findUnique({
            where: { token },
            include: {
                creator: { select: { id: true, name: true, email: true, companyName: true } }
            }
        });
        if (!invite)
            throw new common_1.NotFoundException('Link de convite inválido.');
        if (invite.status !== 'ACTIVE')
            throw new common_1.BadRequestException('Este link já foi utilizado.');
        if (invite.expiresAt && new Date() > invite.expiresAt) {
            throw new common_1.BadRequestException('Este link expirou.');
        }
        return invite;
    }
    async acceptInviteViaToken(token, userId) {
        const invite = await this.validateInviteToken(token);
        if (invite.creatorId === userId) {
            throw new common_1.BadRequestException('Você não pode aceitar seu próprio convite.');
        }
        const existingConnection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { userAId: invite.creatorId, userBId: userId },
                    { userAId: userId, userBId: invite.creatorId }
                ]
            }
        });
        if (existingConnection) {
            throw new common_1.BadRequestException('Você já está conectado com este usuário.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.connectionInviteLink.update({
                where: { id: invite.id },
                data: {
                    status: 'USED',
                    usedById: userId
                }
            });
            const request = await tx.connectionRequest.create({
                data: {
                    senderId: invite.creatorId,
                    receiverId: userId,
                    status: 'PENDING_ADMIN_APPROVAL',
                    requiresAdminApproval: true,
                    message: `Conexão via link compartilhável`
                }
            });
            return request;
        });
    }
    async getPendingAdminApprovals(adminId) {
        return this.prisma.connectionRequest.findMany({
            where: {
                status: 'PENDING_ADMIN_APPROVAL',
                requiresAdminApproval: true
            },
            include: {
                sender: { select: { id: true, name: true, email: true, companyName: true } },
                receiver: { select: { id: true, name: true, email: true, companyName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async approveConnectionByAdmin(requestId, adminId) {
        const request = await this.prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });
        if (!request)
            throw new common_1.NotFoundException('Solicitação não encontrada.');
        if (request.status !== 'PENDING_ADMIN_APPROVAL') {
            throw new common_1.BadRequestException('Esta solicitação já foi processada.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.connectionRequest.update({
                where: { id: requestId },
                data: {
                    status: 'ACCEPTED',
                    approvedByAdminId: adminId
                }
            });
            const connection = await tx.connection.create({
                data: {
                    userAId: request.senderId,
                    userBId: request.receiverId,
                    status: 'ACTIVE'
                }
            });
            await tx.connectionSharingSetting.createMany({
                data: [
                    { connectionId: connection.id, userId: request.senderId },
                    { connectionId: connection.id, userId: request.receiverId }
                ]
            });
            return connection;
        });
    }
    async rejectConnectionByAdmin(requestId, adminId) {
        const request = await this.prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });
        if (!request)
            throw new common_1.NotFoundException('Solicitação não encontrada.');
        if (request.status !== 'PENDING_ADMIN_APPROVAL') {
            throw new common_1.BadRequestException('Esta solicitação já foi processada.');
        }
        return this.prisma.connectionRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        });
    }
    async getAllConnectionsAdmin(adminId) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, userType: true }
        });
        if (!admin || (admin.role !== 'SUPER_ADMIN' && !(admin.role === 'TENANT_ADMIN' && admin.userType === 'COMPANY'))) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return this.prisma.connection.findMany({
            include: {
                userA: { select: { id: true, name: true, email: true, companyName: true, userType: true } },
                userB: { select: { id: true, name: true, email: true, companyName: true, userType: true } },
                cancelledByUser: { select: { id: true, name: true, email: true } },
                _count: { select: { messages: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async adminCancelConnection(connectionId, adminId, reason) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, userType: true, name: true }
        });
        if (!admin || (admin.role !== 'SUPER_ADMIN' && !(admin.role === 'TENANT_ADMIN' && admin.userType === 'COMPANY'))) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: {
                userA: { select: { id: true, name: true } },
                userB: { select: { id: true, name: true } }
            }
        });
        if (!connection)
            throw new common_1.NotFoundException('Conexão não encontrada');
        if (connection.status === 'CANCELLED')
            throw new common_1.BadRequestException('Conexão já foi cancelada');
        const updated = await this.prisma.connection.update({
            where: { id: connectionId },
            data: {
                status: 'CANCELLED',
                cancelledBy: adminId,
                cancelledAt: new Date(),
                cancellationReason: reason || 'Cancelada por administrador'
            }
        });
        return updated;
    }
    async getConnectionMessagesAdmin(connectionId, adminId) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, userType: true, name: true }
        });
        if (!admin || (admin.role !== 'SUPER_ADMIN' && !(admin.role === 'TENANT_ADMIN' && admin.userType === 'COMPANY'))) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: {
                userA: { select: { name: true, email: true } },
                userB: { select: { name: true, email: true } }
            }
        });
        if (!connection)
            throw new common_1.NotFoundException('Conexão não encontrada');
        const messages = await this.prisma.connectionMessage.findMany({
            where: { connectionId },
            include: { sender: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' }
        });
        return {
            connection: {
                id: connection.id,
                userA: connection.userA,
                userB: connection.userB,
                status: connection.status,
                createdAt: connection.createdAt
            },
            messages,
            messageCount: messages.length
        };
    }
};
exports.ConnectionsService = ConnectionsService;
exports.ConnectionsService = ConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConnectionsService);
//# sourceMappingURL=connections.service.js.map
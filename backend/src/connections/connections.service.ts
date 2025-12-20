import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConnectionsService {
    constructor(private prisma: PrismaService) { }

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

        const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
        if (sender?.plan === 'START') {
            throw new ForbiddenException('Seu plano atual não permite enviar convites. Faça o upgrade para o PRO.');
        }

        // Verificar se já existe conexão ou pedido
        const existingConnection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { userAId: senderId, userBId: receiver.id },
                    { userAId: receiver.id, userBId: senderId }
                ]
            }
        });

        if (existingConnection) {
            throw new BadRequestException('Vocês já estão conectados ou bloqueados.');
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
            throw new BadRequestException('Já existe um convite pendente entre vocês.');
        }

        // Criar pedido
        return this.prisma.connectionRequest.create({
            data: {
                senderId,
                receiverId: receiver.id,
                status: 'PENDING'
            }
        });
    }

    // Listar conexões ativas
    async getConnections(userId: string) {
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
            return {
                connectionId: conn.id,
                ...otherUser
            };
        });
    }

    // Listar pedidos pendentes (recebidos)
    async getPendingRequests(userId: string) {
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

    // Aceitar pedido
    async acceptRequest(requestId: string, userId: string) {
        const request = await this.prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) throw new NotFoundException('Convite não encontrado.');
        if (request.receiverId !== userId) throw new ForbiddenException('Este convite não é para você.');
        if (request.status !== 'PENDING') throw new BadRequestException('Convite já processado.');

        // Verificar permissão de plano (Logica Viral: Start só conecta com Pro/Business)
        const receiver = await this.prisma.user.findUnique({ where: { id: userId } });
        const sender = await this.prisma.user.findUnique({ where: { id: request.senderId } });

        if (receiver?.plan === 'START' && sender?.plan === 'START') {
            throw new ForbiddenException('Usuários do plano Start não podem se conectar entre si. Faça um upgrade para conectar.');
        }

        // Transação: Atualiza pedido e cria conexão
        return this.prisma.$transaction(async (tx) => {
            await tx.connectionRequest.update({
                where: { id: requestId },
                data: { status: 'ACCEPTED' }
            });

            // Cria conexão bidirecional lógica (userA <-> userB)
            const connection = await tx.connection.create({
                data: {
                    userAId: request.senderId,
                    userBId: request.receiverId,
                    status: 'ACTIVE'
                }
            });

            // Inicializa configurações de compartilhamento padrão (tudo false)
            await tx.connectionSharingSetting.createMany({
                data: [
                    { connectionId: connection.id, userId: request.senderId },
                    { connectionId: connection.id, userId: request.receiverId }
                ]
            });

            return connection;
        });
    }

    // Rejeitar pedido
    async rejectRequest(requestId: string, userId: string) {
        const request = await this.prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) throw new NotFoundException('Convite não encontrado.');
        if (request.receiverId !== userId) throw new ForbiddenException('Este convite não é para você.');

        return this.prisma.connectionRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        });
    }

    // Remover/Bloquear conexão
    async removeConnection(connectionId: string, userId: string) {
        const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
        if (!conn) throw new NotFoundException('Conexão não encontrada');
        if (conn.userAId !== userId && conn.userBId !== userId) throw new ForbiddenException('Acesso negado');

        // Deletar fisicamente ou marcar como blocked? O requisito diz "Encerrar" ou "Bloquear".
        // Vamos deletar para "Encerrar".
        return this.prisma.connection.delete({
            where: { id: connectionId }
        });
    }

    // ==========================================
    // ÁREA COMPARTILHADA & CHAT
    // ==========================================

    async getConnectionDetail(connectionId: string, userId: string) {
        const conn = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: {
                userA: { select: { id: true, name: true, email: true, companyName: true, userType: true } },
                userB: { select: { id: true, name: true, email: true, companyName: true, userType: true } },
                sharingSettings: true
            }
        });

        if (!conn) throw new NotFoundException('Conexão não encontrada');
        if (conn.userAId !== userId && conn.userBId !== userId) throw new ForbiddenException('Acesso negado');

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

    async updateSharingSettings(connectionId: string, userId: string, settings: any) {
        // Upsert settings
        const existing = await this.prisma.connectionSharingSetting.findFirst({
            where: { connectionId, userId }
        });

        if (existing) {
            return this.prisma.connectionSharingSetting.update({
                where: { id: existing.id },
                data: { ...settings }
            });
        } else {
            return this.prisma.connectionSharingSetting.create({
                data: {
                    connectionId,
                    userId,
                    ...settings
                }
            });
        }
    }

    async getSharedContent(connectionId: string, requesterId: string) {
        const conn = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: { userA: true, userB: true, sharingSettings: true }
        });

        if (!conn) throw new NotFoundException('Conexão não encontrada');
        if (conn.userAId !== requesterId && conn.userBId !== requesterId) throw new ForbiddenException('Acesso negado');

        const partnerId = conn.userAId === requesterId ? conn.userBId : conn.userAId;
        const partnerSettings = conn.sharingSettings.find(s => s.userId === partnerId);

        // Se o parceiro não configurou nada, assume tudo bloqueado (falta de registro = false)
        if (!partnerSettings) {
            return { message: 'Este usuário ainda não compartilhou dados com você.', blocked: true };
        }

        const content: any = {};

        // 1. Inventários / Relatórios
        if (partnerSettings.shareInventories) {
            content.inventories = await this.prisma.assessmentResult.findMany({
                where: { assignment: { userId: partnerId } },
                include: { assignment: { include: { assessment: true } } },
                take: 5,
                orderBy: { createdAt: 'desc' }
            });
        }

        // 2. Questionários Respondidos
        if (partnerSettings.shareQuestionnaires) {
            // Exemplo: pegar ultimas respostas
            // content.questionnaires = ...
        }

        // 3. Histórico de Atividades
        if (partnerSettings.shareActivityHistory) {
            // content.history = ...
        }

        return content;
    }

    // Chat
    async sendMessage(connectionId: string, senderId: string, content: string) {
        // Verifica pertinencia
        const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
        if (!conn) throw new NotFoundException('Conexão não encontrada');
        if (conn.userAId !== senderId && conn.userBId !== senderId) throw new ForbiddenException('Acesso negado');

        return this.prisma.connectionMessage.create({
            data: {
                connectionId,
                senderId,
                content
            }
        });
    }

    async getMessages(connectionId: string, userId: string) {
        const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
        if (!conn) throw new NotFoundException('Conexão não encontrada');
        if (conn.userAId !== userId && conn.userBId !== userId) throw new ForbiddenException('Acesso negado');

        return this.prisma.connectionMessage.findMany({
            where: { connectionId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, name: true } } }
        });
    }

    // ==========================================
    // SISTEMA DE LINKS COMPARTILHÁVEIS + ADMIN APPROVAL
    // ==========================================

    async generateInviteLink(creatorId: string) {
        // Gera token único de 8 caracteres
        const token = Math.random().toString(36).substring(2, 10).toUpperCase();

        // Expira em 7 dias
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
            link: `${process.env.FRONTEND_URL || 'https://pinc-mindsight.vercel.app'}/dashboard/connections/join/${link.token}`,
            expiresAt: link.expiresAt
        };
    }

    async validateInviteToken(token: string) {
        const invite = await this.prisma.connectionInviteLink.findUnique({
            where: { token },
            include: {
                creator: { select: { id: true, name: true, email: true, companyName: true } }
            }
        });

        if (!invite) throw new NotFoundException('Link de convite inválido.');
        if (invite.status !== 'ACTIVE') throw new BadRequestException('Este link já foi utilizado.');
        if (invite.expiresAt && new Date() > invite.expiresAt) {
            throw new BadRequestException('Este link expirou.');
        }

        return invite;
    }

    async acceptInviteViaToken(token: string, userId: string) {
        const invite = await this.validateInviteToken(token);

        if (invite.creatorId === userId) {
            throw new BadRequestException('Você não pode aceitar seu próprio convite.');
        }

        // Verificar planos (Logica Viral)
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const creator = await this.prisma.user.findUnique({ where: { id: invite.creatorId } });

        if (user?.plan === 'START' && creator?.plan === 'START') {
            throw new ForbiddenException('Usuários Starter não podem se conectar com outros Starters. Upgrade necessário.');
        }

        // Verificar se já existe conexão
        const existingConnection = await this.prisma.connection.findFirst({
            where: {
                OR: [
                    { userAId: invite.creatorId, userBId: userId },
                    { userAId: userId, userBId: invite.creatorId }
                ]
            }
        });

        if (existingConnection) {
            throw new BadRequestException('Você já está conectado com este usuário.');
        }

        // Criar ConnectionRequest com flag de aprovação admin
        return this.prisma.$transaction(async (tx) => {
            // Marcar link como usado
            await tx.connectionInviteLink.update({
                where: { id: invite.id },
                data: {
                    status: 'USED',
                    usedById: userId
                }
            });

            // Criar request pendente de aprovação do admin
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

    async getPendingAdminApprovals(adminId: string) {
        // TODO: Verificar se o user é admin
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

    async approveConnectionByAdmin(requestId: string, adminId: string) {
        const request = await this.prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) throw new NotFoundException('Solicitação não encontrada.');
        if (request.status !== 'PENDING_ADMIN_APPROVAL') {
            throw new BadRequestException('Esta solicitação já foi processada.');
        }

        // Criar conexão
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

            // Inicializar sharing settings
            await tx.connectionSharingSetting.createMany({
                data: [
                    { connectionId: connection.id, userId: request.senderId },
                    { connectionId: connection.id, userId: request.receiverId }
                ]
            });

            return connection;
        });
    }

    async rejectConnectionByAdmin(requestId: string, adminId: string) {
        const request = await this.prisma.connectionRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) throw new NotFoundException('Solicitação não encontrada.');
        if (request.status !== 'PENDING_ADMIN_APPROVAL') {
            throw new BadRequestException('Esta solicitação já foi processada.');
        }

        return this.prisma.connectionRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        });
    }

    // ========================================
    // ADMIN CONNECTION MANAGEMENT
    // ========================================

    async getAllConnectionsAdmin(adminId: string) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, userType: true }
        });

        if (!admin || (admin.role !== 'SUPER_ADMIN' && !(admin.role === 'TENANT_ADMIN' && admin.userType === 'COMPANY'))) {
            throw new ForbiddenException('Acesso negado');
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

    async adminCancelConnection(connectionId: string, adminId: string, reason?: string) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, userType: true, name: true }
        });

        if (!admin || (admin.role !== 'SUPER_ADMIN' && !(admin.role === 'TENANT_ADMIN' && admin.userType === 'COMPANY'))) {
            throw new ForbiddenException('Acesso negado');
        }

        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: {
                userA: { select: { id: true, name: true } },
                userB: { select: { id: true, name: true } }
            }
        });

        if (!connection) throw new NotFoundException('Conexão não encontrada');
        if (connection.status === 'CANCELLED') throw new BadRequestException('Conexão já foi cancelada');

        const updated = await this.prisma.connection.update({
            where: { id: connectionId },
            data: {
                status: 'CANCELLED',
                cancelledBy: adminId,
                cancelledAt: new Date(),
                cancellationReason: reason || 'Cancelada por administrador'
            }
        });

        // TODO: Add audit log when AuditLog model is created
        // await this.prisma.auditLog.create({
        //     data: {
        //         action: 'ADMIN_CANCEL_CONNECTION',
        //         userId: adminId,
        //         details: `Admin ${admin.name} cancelou conexão entre ${connection.userA.name} e ${connection.userB.name}. Motivo: ${reason || 'Não especificado'}`
        //     }
        // });

        return updated;
    }

    async getConnectionMessagesAdmin(connectionId: string, adminId: string) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, userType: true, name: true }
        });

        if (!admin || (admin.role !== 'SUPER_ADMIN' && !(admin.role === 'TENANT_ADMIN' && admin.userType === 'COMPANY'))) {
            throw new ForbiddenException('Acesso negado');
        }

        const connection = await this.prisma.connection.findUnique({
            where: { id: connectionId },
            include: {
                userA: { select: { name: true, email: true } },
                userB: { select: { name: true, email: true } }
            }
        });

        if (!connection) throw new NotFoundException('Conexão não encontrada');

        const messages = await this.prisma.connectionMessage.findMany({
            where: { connectionId },
            include: { sender: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' }
        });

        // TODO: Add audit log when AuditLog model is created
        // await this.prisma.auditLog.create({
        //     data: {
        //         action: 'ADMIN_VIEW_MESSAGES',
        //         userId: adminId,
        //         details: `Admin ${admin.name} visualizou mensagens da conexão entre ${connection.userA.name} e ${connection.userB.name}`
        //     }
        // });

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

    async getComparisonData(connectionId: string, userId: string) {
        const connection = await this.prisma.connection.findFirst({
            where: {
                id: connectionId,
                OR: [{ userAId: userId }, { userBId: userId }]
            },
            include: { userA: true, userB: true, sharingSettings: true }
        });

        if (!connection) {
            throw new NotFoundException('Conexão não encontrada');
        }

        const otherUserId = connection.userAId === userId ? connection.userBId : connection.userAId;

        const [currentUser, otherUser] = await Promise.all([
            this.prisma.assessmentAssignment.findFirst({
                where: { userId, status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                include: { user: true }
            }),
            this.prisma.assessmentAssignment.findFirst({
                where: { userId: otherUserId, status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                include: { user: true }
            })
        ]);

        if (!currentUser || !otherUser) {
            throw new NotFoundException('Um ou ambos usuários não possuem avaliações completadas');
        }

        const scores1 = (currentUser as any).result?.scores || {};
        const scores2 = (otherUser as any).result?.scores || {};

        return {
            user1: {
                name: currentUser.user.name,
                email: currentUser.user.email,
                scores: scores1
            },
            user2: {
                name: otherUser.user.name,
                email: otherUser.user.email,
                scores: scores2
            },
            insights: {
                compatibility: 75,
                strengths: ['Comunicação aberta', 'Objetivos alinhados'],
                differences: []
            }
        };
    }
}

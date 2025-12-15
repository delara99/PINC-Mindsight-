import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcryptjs';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
    constructor(private prisma: PrismaService) { }

    // ... (outros métodos)

    // Listar todos os clientes (apenas para Admin)
    @Get('clients')
    async listClients(@Request() req) {
        // Se for SUPER_ADMIN, lista:
        // 1. Administradores de outros tenants (Clientes SaaS)
        // 2. Membros do próprio tenant (Clientes da Consultoria)
        if (req.user.role === 'SUPER_ADMIN') {
            return this.prisma.user.findMany({
                where: {
                    OR: [
                        { role: 'TENANT_ADMIN', NOT: { id: req.user.userId } },
                        { tenantId: req.user.tenantId, role: 'MEMBER' }
                    ]
                },
                select: { id: true, name: true, email: true, credits: true, createdAt: true, status: true, companyName: true, userType: true, plan: true }
            });
        }

        // Se for TENANT_ADMIN comum, lista seus membros
        if (req.user.role === 'TENANT_ADMIN') {
            return this.prisma.user.findMany({
                where: {
                    tenantId: req.user.tenantId,
                    role: 'MEMBER'
                },
                select: { id: true, name: true, email: true, credits: true, createdAt: true, status: true, companyName: true, userType: true, plan: true }
            });
        }

        throw new ForbiddenException('Apenas administradores podem listar clientes.');
    }

    // Adicionar créditos (apenas para Admin)
    @Post(':id/credits')
    async addCredits(@Param('id') id: string, @Body() body: { amount: number }, @Request() req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas admins podem adicionar créditos');
        }

        return this.prisma.user.update({
            where: { id },
            data: {
                credits: { increment: body.amount }
            }
        });
    }

    // Registrar novo cliente (PF ou PJ)
    @Post('register-client')
    async registerClient(@Body() data: any, @Request() req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas admins podem cadastrar clientes');
        }

        // Validar se email já existe
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            throw new BadRequestException('Email já cadastrado');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Criar novo cliente
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: 'MEMBER',
                userType: data.userType || 'INDIVIDUAL',
                cpf: data.cpf || null,
                cnpj: data.cnpj || null,
                companyName: data.companyName || null,
                phone: data.phone || null,
                tenantId: user.tenantId,
                credits: 0
            },
            select: {
                id: true,
                email: true,
                name: true,
                userType: true,
                cpf: true,
                cnpj: true,
                companyName: true,
                phone: true,
                credits: true,
                createdAt: true
            }
        });
    }

    // Atualizar dados do cliente
    @Put(':id')
    async updateClient(@Param('id') id: string, @Body() data: any, @Request() req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem atualizar clientes.');
        }

        // Verificar se o cliente pertence ao tenant do admin ou se é SUPER_ADMIN
        const whereCondition: any = { id };

        // Se NÃO for SUPER_ADMIN, restringe ao próprio tenant
        if (user.role !== 'SUPER_ADMIN') {
            whereCondition.tenantId = user.tenantId;
        }

        const existingClient = await this.prisma.user.findFirst({
            where: whereCondition
        });

        if (!existingClient) {
            throw new BadRequestException('Cliente não encontrado.');
        }

        // Preparar dados para atualização
        const updateData: any = {
            name: data.name,
            phone: data.phone || null,
        };

        // Se for SUPER_ADMIN, permite atualizar status
        if (req.user.role === 'SUPER_ADMIN' && data.status) {
            updateData.status = data.status;
        }

        // Permitir atualização de Plano
        if (data.plan) {
            updateData.plan = data.plan;
        }

        // Atualizar CPF ou CNPJ baseado no tipo
        if (data.userType === 'INDIVIDUAL') {
            updateData.cpf = data.cpf || null;
            updateData.cnpj = null;
            updateData.companyName = null;
        } else {
            updateData.cnpj = data.cnpj || null;
            updateData.cpf = null;
            updateData.companyName = data.companyName || null;
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                userType: true,
                cpf: true,
                cnpj: true,
                companyName: true,
                phone: true,
                credits: true,
                createdAt: true,
                status: true,
                plan: true
            }
        });
    }

    // Excluir cliente
    @Delete(':id')
    async deleteClient(@Param('id') id: string, @Request() req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Apenas administradores podem excluir clientes.');
        }

        const whereCondition: any = { id };
        if (user.role !== 'SUPER_ADMIN') {
            whereCondition.tenantId = user.tenantId;
        }

        const clientToDelete = await this.prisma.user.findFirst({
            where: whereCondition
        });

        if (!clientToDelete) {
            throw new BadRequestException('Cliente não encontrado ou sem permissão.');
        }

        // Não permitir deletar a si mesmo
        if (clientToDelete.id === user.userId) {
            throw new BadRequestException('Você não pode se excluir.');
        }

        // Realizar exclusão em cascata manual via transação
        return this.prisma.$transaction(async (tx) => {
            // 1. Remover Solicitações de Crédito
            await tx.creditSolicitation.deleteMany({ where: { userId: id } });

            // 2. Remover Configurações de Compartilhamento
            await tx.connectionSharingSetting.deleteMany({ where: { userId: id } });

            // 3. Remover Mensagens enviadas
            await tx.connectionMessage.deleteMany({ where: { senderId: id } });

            // 4. Remover Links de Convite (Criados ou Usados)
            await tx.connectionInviteLink.deleteMany({
                where: { OR: [{ creatorId: id }, { usedById: id }] }
            });

            // 5. Remover Requests de Conexão (Enviados ou Recebidos e aprovados por ele)
            await tx.connectionRequest.deleteMany({
                where: { OR: [{ senderId: id }, { receiverId: id }, { approvedByAdminId: id }] }
            });

            // 6. Remover Conexões (Ativas ou Canceladas)
            await tx.connection.deleteMany({
                where: { OR: [{ userAId: id }, { userBId: id }, { cancelledBy: id }] }
            });

            // 7. Remover Avaliações (Deep Clean)
            // Primeiro buscamos os assignments para limpar os filhos manualmente, 
            // caso o cascade do banco falhe.
            const assignments = await tx.assessmentAssignment.findMany({
                where: { userId: id },
                select: { id: true }
            });
            
            if (assignments.length > 0) {
                const assignmentIds = assignments.map(a => a.id);
                
                // Limpar respostas
                await tx.assessmentResponse.deleteMany({
                    where: { assignmentId: { in: assignmentIds } }
                });

                // Limpar resultados
                await tx.assessmentResult.deleteMany({
                    where: { assignmentId: { in: assignmentIds } }
                });

                // Limpar assignments
                await tx.assessmentAssignment.deleteMany({
                    where: { id: { in: assignmentIds } }
                });
            }

            // 8. Enfim, remover o usuário
            return tx.user.delete({
                where: { id }
            });
        });
    }

    // Obter dados do usuário logado (saldo)
    @Get('me')
    async getMe(@Request() req) {
        const userId = req.user.userId;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                credits: true,
                userType: true,
                cpf: true,
                cnpj: true,
                companyName: true,
                phone: true,
                plan: true
            }
        });
        return user;
    }

    // Solicitar compra de créditos (Cliente)
    // Solicitar compra de créditos (Cliente)
    @Post('request-credit')
    async requestCredit(@Request() req, @Body() body: { planName?: string }) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;

        // Verificar se já existe solicitação pendente
        const existing = await this.prisma.creditSolicitation.findFirst({
            where: {
                userId,
                status: 'PENDING'
            }
        });

        if (existing) {
            // Se já existe e o usuário está tentando comprar de novo, atualizamos o plano
            if (body.planName) {
                await this.prisma.creditSolicitation.update({
                    where: { id: existing.id },
                    data: { planName: body.planName }
                });
                return { message: 'Solicitação atualizada com o novo plano.' };
            }
            return { message: 'Já existe uma solicitação pendente.' };
        }

        return this.prisma.creditSolicitation.create({
            data: {
                userId,
                tenantId,
                status: 'PENDING',
                planName: body.planName
            }
        });
    }
}

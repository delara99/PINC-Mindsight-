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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const passport_1 = require("@nestjs/passport");
const bcrypt = require("bcryptjs");
let UserController = class UserController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listClients(req) {
        if (req.user.role === 'SUPER_ADMIN') {
            return this.prisma.user.findMany({
                where: {
                    OR: [
                        { role: 'TENANT_ADMIN', NOT: { id: req.user.userId } },
                        { tenantId: req.user.tenantId, role: 'MEMBER' }
                    ]
                },
                select: { id: true, name: true, email: true, credits: true, createdAt: true, status: true, companyName: true, userType: true }
            });
        }
        if (req.user.role === 'TENANT_ADMIN') {
            return this.prisma.user.findMany({
                where: {
                    tenantId: req.user.tenantId,
                    role: 'MEMBER'
                },
                select: { id: true, name: true, email: true, credits: true, createdAt: true, status: true, companyName: true, userType: true }
            });
        }
        throw new common_1.ForbiddenException('Apenas administradores podem listar clientes.');
    }
    async addCredits(id, body, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas admins podem adicionar créditos');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                credits: { increment: body.amount }
            }
        });
    }
    async registerClient(data, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas admins podem cadastrar clientes');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email já cadastrado');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
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
    async updateClient(id, data, req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem atualizar clientes.');
        }
        const whereCondition = { id };
        if (user.role !== 'SUPER_ADMIN') {
            whereCondition.tenantId = user.tenantId;
        }
        const existingClient = await this.prisma.user.findFirst({
            where: whereCondition
        });
        if (!existingClient) {
            throw new common_1.BadRequestException('Cliente não encontrado.');
        }
        const updateData = {
            name: data.name,
            phone: data.phone || null,
        };
        if (req.user.role === 'SUPER_ADMIN' && data.status) {
            updateData.status = data.status;
        }
        if (data.userType === 'INDIVIDUAL') {
            updateData.cpf = data.cpf || null;
            updateData.cnpj = null;
            updateData.companyName = null;
        }
        else {
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
                status: true
            }
        });
    }
    async getMe(req) {
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
                phone: true
            }
        });
        return user;
    }
    async requestCredit(req) {
        const userId = req.user.userId;
        const tenantId = req.user.tenantId;
        const existing = await this.prisma.creditSolicitation.findFirst({
            where: {
                userId,
                status: 'PENDING'
            }
        });
        if (existing) {
            return { message: 'Já existe uma solicitação pendente.' };
        }
        return this.prisma.creditSolicitation.create({
            data: {
                userId,
                tenantId,
                status: 'PENDING'
            }
        });
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Get)('clients'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "listClients", null);
__decorate([
    (0, common_1.Post)(':id/credits'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "addCredits", null);
__decorate([
    (0, common_1.Post)('register-client'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "registerClient", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateClient", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('request-credit'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "requestCredit", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserController);
//# sourceMappingURL=user.controller.js.map
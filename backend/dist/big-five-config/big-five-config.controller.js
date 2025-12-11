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
exports.BigFiveConfigController = void 0;
const common_1 = require("@nestjs/common");
const big_five_config_service_1 = require("./big-five-config.service");
const passport_1 = require("@nestjs/passport");
let BigFiveConfigController = class BigFiveConfigController {
    constructor(configService) {
        this.configService = configService;
    }
    async getActive(req) {
        return this.configService.getActiveConfig(req.user.tenantId);
    }
    async list(req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem acessar configurações');
        }
        return this.configService.listConfigs(req.user.tenantId);
    }
    async getById(id, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem acessar configurações');
        }
        return this.configService.getConfig(id, req.user.tenantId);
    }
    async create(data, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem criar configurações');
        }
        return this.configService.createConfig(req.user.tenantId, data);
    }
    async update(id, data, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem atualizar configurações');
        }
        return this.configService.updateConfig(id, req.user.tenantId, data);
    }
    async activate(id, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem ativar configurações');
        }
        return this.configService.activateConfig(id, req.user.tenantId);
    }
    async populate(id, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem popular configurações');
        }
        return this.configService.populateFromActive(id, req.user.tenantId);
    }
    async updateTrait(traitId, data, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem atualizar traços');
        }
        return this.configService.updateTrait(traitId, data);
    }
    async updateFacet(facetId, data, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem atualizar facetas');
        }
        return this.configService.updateFacet(facetId, data);
    }
    async listRecommendations(configId) {
        return this.configService.listRecommendations(configId);
    }
    async createRecommendation(data, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem criar recomendações');
        }
        return this.configService.createRecommendation(data);
    }
    async updateRecommendation(id, data, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem atualizar recomendações');
        }
        return this.configService.updateRecommendation(id, data);
    }
    async deleteRecommendation(id, req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Apenas administradores podem deletar recomendações');
        }
        return this.configService.deleteRecommendation(id);
    }
};
exports.BigFiveConfigController = BigFiveConfigController;
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/activate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/populate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "populate", null);
__decorate([
    (0, common_1.Put)('traits/:traitId'),
    __param(0, (0, common_1.Param)('traitId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "updateTrait", null);
__decorate([
    (0, common_1.Put)('facets/:facetId'),
    __param(0, (0, common_1.Param)('facetId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "updateFacet", null);
__decorate([
    (0, common_1.Get)(':configId/recommendations'),
    __param(0, (0, common_1.Param)('configId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "listRecommendations", null);
__decorate([
    (0, common_1.Post)('recommendations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "createRecommendation", null);
__decorate([
    (0, common_1.Put)('recommendations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "updateRecommendation", null);
__decorate([
    (0, common_1.Delete)('recommendations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BigFiveConfigController.prototype, "deleteRecommendation", null);
exports.BigFiveConfigController = BigFiveConfigController = __decorate([
    (0, common_1.Controller)('big-five-config'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [big_five_config_service_1.BigFiveConfigService])
], BigFiveConfigController);
//# sourceMappingURL=big-five-config.controller.js.map
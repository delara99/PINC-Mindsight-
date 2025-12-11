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
exports.ConnectionsController = void 0;
const common_1 = require("@nestjs/common");
const connections_service_1 = require("./connections.service");
const passport_1 = require("@nestjs/passport");
let ConnectionsController = class ConnectionsController {
    constructor(connectionsService) {
        this.connectionsService = connectionsService;
    }
    async sendInvite(body, req) {
        return this.connectionsService.sendInvite(req.user.userId, body.email);
    }
    async generateInviteLink(req) {
        return this.connectionsService.generateInviteLink(req.user.userId);
    }
    async validateInvite(token) {
        return this.connectionsService.validateInviteToken(token);
    }
    async acceptInviteViaLink(token, req) {
        return this.connectionsService.acceptInviteViaToken(token, req.user.userId);
    }
    async getPendingAdminApprovals(req) {
        return this.connectionsService.getPendingAdminApprovals(req.user.userId);
    }
    async approveConnection(id, req) {
        return this.connectionsService.approveConnectionByAdmin(id, req.user.userId);
    }
    async rejectConnection(id, req) {
        return this.connectionsService.rejectConnectionByAdmin(id, req.user.userId);
    }
    async getAllConnectionsAdmin(req) {
        return this.connectionsService.getAllConnectionsAdmin(req.user.userId);
    }
    async adminCancelConnection(id, body, req) {
        return this.connectionsService.adminCancelConnection(id, req.user.userId, body.reason);
    }
    async getConnectionMessagesAdmin(id, req) {
        return this.connectionsService.getConnectionMessagesAdmin(id, req.user.userId);
    }
    async getPendingRequests(req) {
        return this.connectionsService.getPendingRequests(req.user.userId);
    }
    async getConnections(req) {
        return this.connectionsService.getConnections(req.user.userId);
    }
    async getConnectionDetail(id, req) {
        return this.connectionsService.getConnectionDetail(id, req.user.userId);
    }
    async getSharedContent(id, req) {
        return this.connectionsService.getSharedContent(id, req.user.userId);
    }
    async getMessages(id, req) {
        return this.connectionsService.getMessages(id, req.user.userId);
    }
    async updateSettings(id, body, req) {
        return this.connectionsService.updateSharingSettings(id, req.user.userId, body);
    }
    async sendMessage(id, body, req) {
        return this.connectionsService.sendMessage(id, req.user.userId, body.content);
    }
    async acceptRequest(id, req) {
        return this.connectionsService.acceptRequest(id, req.user.userId);
    }
    async rejectRequest(id, req) {
        return this.connectionsService.rejectRequest(id, req.user.userId);
    }
    async removeConnection(id, req) {
        return this.connectionsService.removeConnection(id, req.user.userId);
    }
};
exports.ConnectionsController = ConnectionsController;
__decorate([
    (0, common_1.Post)('invite'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "sendInvite", null);
__decorate([
    (0, common_1.Post)('generate-invite'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "generateInviteLink", null);
__decorate([
    (0, common_1.Get)('validate-invite/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "validateInvite", null);
__decorate([
    (0, common_1.Post)('join/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "acceptInviteViaLink", null);
__decorate([
    (0, common_1.Get)('pending-approvals'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getPendingAdminApprovals", null);
__decorate([
    (0, common_1.Post)('approve/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "approveConnection", null);
__decorate([
    (0, common_1.Post)('reject/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "rejectConnection", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getAllConnectionsAdmin", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "adminCancelConnection", null);
__decorate([
    (0, common_1.Get)('admin/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getConnectionMessagesAdmin", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getConnectionDetail", null);
__decorate([
    (0, common_1.Get)(':id/shared-content'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getSharedContent", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Put)(':id/settings'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('requests/:id/accept'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Post)('requests/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConnectionsController.prototype, "removeConnection", null);
exports.ConnectionsController = ConnectionsController = __decorate([
    (0, common_1.Controller)('connections'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [connections_service_1.ConnectionsService])
], ConnectionsController);
//# sourceMappingURL=connections.controller.js.map
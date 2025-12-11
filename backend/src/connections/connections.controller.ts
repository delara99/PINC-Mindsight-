import { Controller, Get, Post, Body, Param, UseGuards, Request, Put, Delete } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('connections')
@UseGuards(AuthGuard('jwt'))
export class ConnectionsController {
    constructor(private readonly connectionsService: ConnectionsService) { }

    @Post('invite')
    async sendInvite(@Body() body: { email: string }, @Request() req) {
        return this.connectionsService.sendInvite(req.user.userId, body.email);
    }

    // === Sistema de Links Compartilháveis (ANTES de rotas com :id) ===

    @Post('generate-invite')
    async generateInviteLink(@Request() req) {
        return this.connectionsService.generateInviteLink(req.user.userId);
    }

    @Get('validate-invite/:token')
    async validateInvite(@Param('token') token: string) {
        return this.connectionsService.validateInviteToken(token);
    }

    @Post('join/:token')
    async acceptInviteViaLink(@Param('token') token: string, @Request() req) {
        return this.connectionsService.acceptInviteViaToken(token, req.user.userId);
    }

    @Get('pending-approvals')
    async getPendingAdminApprovals(@Request() req) {
        return this.connectionsService.getPendingAdminApprovals(req.user.userId);
    }

    @Post('approve/:id')
    async approveConnection(@Param('id') id: string, @Request() req) {
        return this.connectionsService.approveConnectionByAdmin(id, req.user.userId);
    }

    @Post('reject/:id')
    async rejectConnection(@Param('id') id: string, @Request() req) {
        return this.connectionsService.rejectConnectionByAdmin(id, req.user.userId);
    }

    // === ADMIN CONNECTION MANAGEMENT ===

    @Get('admin/all')
    async getAllConnectionsAdmin(@Request() req) {
        return this.connectionsService.getAllConnectionsAdmin(req.user.userId);
    }

    @Delete('admin/:id')
    async adminCancelConnection(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req) {
        return this.connectionsService.adminCancelConnection(id, req.user.userId, body.reason);
    }

    @Get('admin/:id/messages')
    async getConnectionMessagesAdmin(@Param('id') id: string, @Request() req) {
        return this.connectionsService.getConnectionMessagesAdmin(id, req.user.userId);
    }

    // === Rotas de listagem (sem parâmetros) ===

    @Get('requests')
    async getPendingRequests(@Request() req) {
        return this.connectionsService.getPendingRequests(req.user.userId);
    }

    @Get()
    async getConnections(@Request() req) {
        return this.connectionsService.getConnections(req.user.userId);
    }

    // === Rotas com :id (DEVEM VIR POR ÚLTIMO) ===

    @Get(':id')
    async getConnectionDetail(@Param('id') id: string, @Request() req) {
        return this.connectionsService.getConnectionDetail(id, req.user.userId);
    }

    @Get(':id/shared-content')
    async getSharedContent(@Param('id') id: string, @Request() req) {
        return this.connectionsService.getSharedContent(id, req.user.userId);
    }

    @Get(':id/messages')
    async getMessages(@Param('id') id: string, @Request() req) {
        return this.connectionsService.getMessages(id, req.user.userId);
    }

    @Put(':id/settings')
    async updateSettings(@Param('id') id: string, @Body() body: any, @Request() req) {
        return this.connectionsService.updateSharingSettings(id, req.user.userId, body);
    }

    @Post(':id/messages')
    async sendMessage(@Param('id') id: string, @Body() body: { content: string }, @Request() req) {
        return this.connectionsService.sendMessage(id, req.user.userId, body.content);
    }

    @Post('requests/:id/accept')
    async acceptRequest(@Param('id') id: string, @Request() req) {
        return this.connectionsService.acceptRequest(id, req.user.userId);
    }

    @Post('requests/:id/reject')
    async rejectRequest(@Param('id') id: string, @Request() req) {
        return this.connectionsService.rejectRequest(id, req.user.userId);
    }

    @Delete(':id')
    async removeConnection(@Param('id') id: string, @Request() req) {
        return this.connectionsService.removeConnection(id, req.user.userId);
    }
}

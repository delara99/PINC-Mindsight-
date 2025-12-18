import { Controller, Get, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    // Contar notificações do admin
    @Get('admin/counts')
    async getAdminCounts(@Request() req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new Error('Acesso negado');
        }
        return this.notificationsService.getAdminCounts();
    }
}

import { Controller, Post, Get, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('feedback')
@UseGuards(AuthGuard('jwt'))
export class FeedbackController {
    constructor(private feedbackService: FeedbackService) { }

    // Cliente solicita devolutiva
    @Post('request')
    async createRequest(@Body() body: { assignmentId: string, phone?: string }, @Request() req) {
        return this.feedbackService.createRequest(req.user.userId, body.assignmentId, body.phone);
    }

    // Cliente verifica status
    @Get('my-request/:assignmentId')
    async getMyRequest(@Param('assignmentId') assignmentId: string, @Request() req) {
        return this.feedbackService.getMyRequest(req.user.userId, assignmentId);
    }

    // Admin lista todas
    @Get('admin/all')
    async getAllRequests(@Request() req) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new Error('Acesso negado');
        }
        return this.feedbackService.getAllRequests();
    }

    // Admin atualiza status
    @Patch('admin/:id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED', notes?: string, scheduledAt?: string },
        @Request() req
    ) {
        if (req.user.role !== 'TENANT_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            throw new Error('Acesso negado');
        }
        return this.feedbackService.updateStatus(
            id,
            body.status,
            body.notes,
            body.scheduledAt ? new Date(body.scheduledAt) : undefined
        );
    }
}

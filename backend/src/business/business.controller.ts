
import { Controller, Get, Post, Body, Param, Res, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { BusinessService } from './business.service';
import { Role } from '@prisma/client';
import { PdfService } from '../reports/pdf.service';

@Controller('business')
@UseGuards(AuthGuard('jwt'))
export class BusinessController {
    constructor(
        private readonly service: BusinessService,
        private readonly pdfService: PdfService
    ) { }

    // Helper para validar acesso RH
    private validateCompanyAccess(user: any) {
        if (!user.tenantId || (user.role !== Role.TENANT_ADMIN && user.role !== Role.SUPER_ADMIN)) {
            throw new ForbiddenException('Acesso restrito a gestores de empresa.');
        }
    }

    @Get('dashboard')
    async getDashboard(@Request() req) {
        this.validateCompanyAccess(req.user);
        return this.service.getDashboardStats(req.user.tenantId);
    }

    @Get('employees')
    async getEmployees(@Request() req) {
        this.validateCompanyAccess(req.user);
        return this.service.getEmployees(req.user.tenantId);
    }

    @Post('employees')
    async createEmployee(@Request() req, @Body() body: { name: string; email: string }) {
        this.validateCompanyAccess(req.user);
        return this.service.createEmployee(req.user.tenantId, body);
    }

    @Get('reports')
    async getReports(@Request() req) {
        this.validateCompanyAccess(req.user);
        return this.service.getAllReports(req.user.tenantId);
    }

    @Get('reports/:userId/pdf')
    async exportEmployeePdf(@Request() req, @Param('userId') targetUserId: string, @Res() res: Response) {
        this.validateCompanyAccess(req.user);

        // 1. Validar se o usuário alvo pertence ao mesmo tenant
        const targetUser = await this.service.validateEmployee(req.user.tenantId, targetUserId);

        // 2. Gerar dados (Usando BusinessService)
        const reportData = await this.service.generateReportData(targetUserId);

        // 3. Gerar HTML
        const html = this.pdfService.generateTalkingToHtml(reportData);

        // 4. Gerar PDF
        const pdfBuffer = await this.pdfService.generatePdf(html);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="PINC_Report_${targetUser.name.replace(/\s+/g, '_')}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
        });

        res.end(pdfBuffer);
    }

    // Endpoint para o Candidato ver seus dados (se houver especificidade B2B)
    @Get('me')
    async getMyBusinessInfo(@Request() req) {
        return {
            tenantId: req.user.tenantId,
            role: req.user.role,
            isBusiness: true
        };
    }
}

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { CalculationEngineService } from './calculation-engine.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('calculation-engine')
@UseGuards(AuthGuard('jwt'))
export class CalculationEngineController {
    constructor(private readonly service: CalculationEngineService) { }

    private checkAdmin(req) {
        if (!req.user) {
            throw new UnauthorizedException('Usuário não autenticado');
        }
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
    }

    // ============================================
    // FÓRMULAS
    // ============================================

    @Get('formulas')
    async getAllFormulas(@Request() req) {
        this.checkAdmin(req);
        return this.service.getAllFormulas();
    }

    @Get('formulas/:id')
    async getFormula(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req);
        return this.service.getFormula(id);
    }

    @Put('formulas/:id')
    async updateFormula(@Request() req, @Param('id') id: string, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.updateFormula(id, data, req.user.userId);
    }

    // ============================================
    // CLASSIFICAÇÕES
    // ============================================

    @Get('classifications')
    async getAllClassifications(@Request() req) {
        this.checkAdmin(req);
        return this.service.getAllClassifications();
    }

    @Get('classifications/:dimension')
    async getClassificationsByDimension(@Request() req, @Param('dimension') dimension: string) {
        this.checkAdmin(req);
        return this.service.getClassificationsByDimension(dimension);
    }

    @Put('classifications/:id')
    async updateClassification(@Request() req, @Param('id') id: string, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.updateClassification(id, data, req.user.userId);
    }

    // ============================================
    // MAPEAMENTO DE QUESTÕES
    // ============================================

    @Get('question-mappings')
    async getAllQuestionMappings(@Request() req) {
        this.checkAdmin(req);
        return this.service.getAllQuestionMappings();
    }

    @Get('question-mappings/:dimension')
    async getQuestionMappingsByDimension(@Request() req, @Param('dimension') dimension: string) {
        this.checkAdmin(req);
        return this.service.getQuestionMappingsByDimension(dimension);
    }

    @Post('question-mappings')
    async createQuestionMapping(@Request() req, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.createQuestionMapping(data, req.user.userId);
    }

    @Put('question-mappings/:id')
    async updateQuestionMapping(@Request() req, @Param('id') id: string, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.updateQuestionMapping(id, data, req.user.userId);
    }

    @Delete('question-mappings/:id')
    async deleteQuestionMapping(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req);
        return this.service.deleteQuestionMapping(id, req.user.userId);
    }

    // ============================================
    // SIMULADOR
    // ============================================

    @Post('simulate')
    async simulate(@Request() req, @Body() data: { name: string, inputs: Record<string, number> }) {
        this.checkAdmin(req);
        return this.service.simulate(data.name, data.inputs, req.user.userId);
    }

    @Get('simulations')
    async getSimulations(@Request() req) {
        this.checkAdmin(req);
        return this.service.getSimulations(req.user.userId);
    }

    @Get('simulations/:id')
    async getSimulation(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req);
        return this.service.getSimulation(id);
    }

    // ============================================
    // AUDITORIA
    // ============================================

    @Get('audit')
    async getAuditLogs(@Request() req) {
        this.checkAdmin(req);
        return this.service.getAuditLogs();
    }

    @Get('audit/:entityId')
    async getAuditLogsByEntity(@Request() req, @Param('entityId') entityId: string) {
        this.checkAdmin(req);
        return this.service.getAuditLogsByEntity(entityId);
    }

    // ============================================
    // EXPORTAÇÃO/IMPORTAÇÃO
    // ============================================

    @Get('export')
    async exportConfiguration(@Request() req) {
        this.checkAdmin(req);
        return this.service.exportConfiguration();
    }

    @Post('import')
    async importConfiguration(@Request() req, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.importConfiguration(data, req.user.userId);
    }

    // ============================================
    // DOCUMENTAÇÃO
    // ============================================

    @Get('documentation')
    async getDocumentation(@Request() req) {
        this.checkAdmin(req);
        return this.service.getDocumentation();
    }
}

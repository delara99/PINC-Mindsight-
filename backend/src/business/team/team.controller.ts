

import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamService } from './team.service';
import { Role } from '@prisma/client';

// Assumindo guards padrão do projeto, ajuste conforme necessário
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('business/team')
@UseGuards(AuthGuard('jwt'))
export class TeamController {
    constructor(private readonly teamService: TeamService) { }

    // Helper para validar acesso
    private validateCompanyAccess(user: any) {
        if (!user.tenantId || (user.role !== Role.TENANT_ADMIN && user.role !== Role.SUPER_ADMIN)) {
            throw new ForbiddenException('Acesso restrito a gestores de empresa.');
        }
    }

    @Post()
    create(@Request() req, @Body() data: any) {
        this.validateCompanyAccess(req.user);
        return this.teamService.create(req.user.tenantId, data);
    }

    @Get()
    findAll(@Request() req) {
        this.validateCompanyAccess(req.user);
        return this.teamService.findAll(req.user.tenantId);
    }

    @Get('members')
    async getMembers(@Request() req) {
        this.validateCompanyAccess(req.user);
        return this.teamService.getAvailableMembers(req.user.tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.teamService.findOne(id);
    }

    @Get(':id/analysis')
    getAnalysis(@Param('id') id: string) {
        return this.teamService.getAnalysis(id);
    }

    @Post(':id/simulate')
    simulateCandidate(@Param('id') id: string, @Body() data: { candidateId: string }) {
        return this.teamService.simulateCandidate(id, data.candidateId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.teamService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.teamService.remove(id);
    }
}

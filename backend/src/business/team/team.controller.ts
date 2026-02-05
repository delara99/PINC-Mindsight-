
import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';

// Assumindo guards padrão do projeto, ajuste conforme necessário
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('business/team')
export class TeamController {
    constructor(private readonly teamService: TeamService) { }

    @Post()
    create(@Request() req, @Body() data: any) {
        // Pegar tenantId do usuário logado (simulado aqui se não tiver guard)
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.teamService.create(tenantId, data);
    }

    @Get()
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId || 'default-tenant';
        return this.teamService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.teamService.findOne(id);
    }

    @Get(':id/analysis')
    getAnalysis(@Param('id') id: string) {
        return this.teamService.getAnalysis(id);
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

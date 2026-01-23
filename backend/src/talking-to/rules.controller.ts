
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { TalkingToRulesService } from './rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('talking-to/admin/rules')
@UseGuards(JwtAuthGuard)
export class TalkingToRulesController {
    constructor(private readonly service: TalkingToRulesService) { }

    private checkAdmin(req) {
        if (!req.user) {
            throw new UnauthorizedException('Usuário não autenticado');
        }
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
    }

    @Get()
    async findAll(@Request() req) {
        this.checkAdmin(req);
        return this.service.findAll();
    }

    @Post()
    async create(@Request() req, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.create(data);
    }

    @Put(':id')
    async update(@Request() req, @Param('id') id: string, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.update(id, data);
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req);
        return this.service.delete(id);
    }

    // --- Simulator Endpoint ---
    @Post('simulate')
    async simulate(@Request() req, @Body() scores: any) {
        this.checkAdmin(req);
        // Expects { O: 10, C: 20 ... }
        const matches = await this.service.evaluateProfile(scores);
        return {
            matchesCount: matches.length,
            matches: matches.map(r => ({
                id: r.id,
                name: r.name,
                domain: r.domain,
                message: r.message?.content
            }))
        };
    }
}

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { TalkingToStructureService } from './structure.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('talking-to/admin/structure')
@UseGuards(AuthGuard('jwt'))
export class TalkingToStructureController {
    constructor(private readonly service: TalkingToStructureService) { }

    private checkAdmin(req) {
        if (!req.user) {
            throw new UnauthorizedException('Usuário não autenticado');
        }
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
    }

    @Get()
    async getAll(@Request() req) {
        this.checkAdmin(req);
        return this.service.getAllDimensions();
    }

    @Post('seed')
    async seed(@Request() req) {
        this.checkAdmin(req);
        return this.service.seedStructure();
    }

    // Dimensions
    @Post()
    async createDimension(@Request() req, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.createDimension(data);
    }

    @Put(':id')
    async updateDimension(@Request() req, @Param('id') id: string, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.updateDimension(id, data);
    }

    @Delete(':id')
    async deleteDimension(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req);
        return this.service.deleteDimension(id);
    }

    // Facets (Nested routing or separate? Using separate /facets path for simplicity in body/id)
    @Post('facets')
    async createFacet(@Request() req, @Body() data: any) {
        // data should have dimensionId
        this.checkAdmin(req);
        return this.service.createFacet(data.dimensionId, data);
    }

    @Put('facets/:id')
    async updateFacet(@Request() req, @Param('id') id: string, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.updateFacet(id, data);
    }

    @Delete('facets/:id')
    async deleteFacet(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req);
        return this.service.deleteFacet(id);
    }
}

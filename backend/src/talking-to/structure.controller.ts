import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { TalkingToStructureService } from './structure.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('talking-to/admin/structure')
export class TalkingToStructureController {
    constructor(private readonly service: TalkingToStructureService) { }

    private checkAdmin(req) {
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TENANT_ADMIN') {
            throw new UnauthorizedException('Acesso restrito a administradores');
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    async getAll(@Request() req) {
        this.checkAdmin(req);
        return this.service.getAllDimensions();
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('seed')
    async seed(@Request() req) {
        this.checkAdmin(req);
        return this.service.seedStructure();
    }

    // Dimensions
    @UseGuards(AuthGuard('jwt'))
    @Post()
    async createDimension(@Request() req, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.createDimension(data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    async updateDimension(@Request() req, @Param('id') id: string, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.updateDimension(id, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    async deleteDimension(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req);
        return this.service.deleteDimension(id);
    }

    // Facets (Nested routing or separate? Using separate /facets path for simplicity in body/id)
    @UseGuards(AuthGuard('jwt'))
    @Post('facets')
    async createFacet(@Request() req, @Body() data: any) {
        // data should have dimensionId
        this.checkAdmin(req);
        return this.service.createFacet(data.dimensionId, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('facets/:id')
    async updateFacet(@Request() req, @Param('id') id: string, @Body() data: any) {
        this.checkAdmin(req);
        return this.service.updateFacet(id, data);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('facets/:id')
    async deleteFacet(@Request() req, @Param('id') id: string) {
        this.checkAdmin(req);
        return this.service.deleteFacet(id);
    }
}

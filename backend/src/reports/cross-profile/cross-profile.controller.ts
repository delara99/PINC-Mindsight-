
import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CrossProfileService } from './cross-profile.service';

@Controller('cross-profile')
@UseGuards(AuthGuard('jwt'))
export class CrossProfileController {
    constructor(private readonly service: CrossProfileService) { }

    @Post('generate')
    async generate(@Request() req, @Body('connectionId') connectionId: string) {
        return this.service.generateReport(connectionId, req.user.userId);
    }

    @Get('connection/:connectionId')
    async list(@Param('connectionId') connectionId: string) {
        return this.service.listReports(connectionId);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        return this.service.getReport(id);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.service.deleteReport(id);
    }
}

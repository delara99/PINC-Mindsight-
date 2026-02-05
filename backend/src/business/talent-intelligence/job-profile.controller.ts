import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobProfileService } from './job-profile.service';

@Controller('business/job-profiles')
@UseGuards(AuthGuard('jwt'))
export class JobProfileController {
    constructor(private jobProfileService: JobProfileService) { }

    @Post()
    async create(@Request() req, @Body() data: any) {
        return this.jobProfileService.createProfile(req.user.tenantId, data);
    }

    @Get()
    async findAll(@Request() req) {
        return this.jobProfileService.getProfiles(req.user.tenantId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.jobProfileService.getProfile(id);
    }

    @Get(':id/analysis')
    async getAnalysis(@Request() req, @Param('id') id: string) {
        return this.jobProfileService.getProfileAnalysis(req.user.tenantId, id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any) {
        return this.jobProfileService.updateProfile(id, data);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.jobProfileService.deleteProfile(id);
    }
}

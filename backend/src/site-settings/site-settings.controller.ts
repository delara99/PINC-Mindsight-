import { Controller, Get, Put, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('site-settings')
export class SiteSettingsController {
    constructor(private readonly service: SiteSettingsService) { }

    // Public endpoint - get current settings
    @Get()
    async getSettings() {
        return this.service.getSettings();
    }

    // Admin endpoint - get settings for editing
    @Get('admin')
    @UseGuards(AuthGuard('jwt'))
    async getSettingsAdmin(@Request() req) {
        const user = req.user;
        if (user.role !== 'TENANT_ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Acesso negado');
        }

        const tenantId = user.role === 'SUPER_ADMIN' ? null : user.tenantId;
        return this.service.getSettings(tenantId);
    }

    // Admin endpoint - update settings
    @Put()
    @UseGuards(AuthGuard('jwt'))
    async updateSettings(@Body() data: any, @Request() req) {
        return this.service.updateSettings(data, req.user.userId);
    }

    // Admin endpoint - reset to defaults
    @Post('reset')
    @UseGuards(AuthGuard('jwt'))
    async resetSettings(@Request() req) {
        return this.service.resetToDefaults(req.user.userId);
    }
}

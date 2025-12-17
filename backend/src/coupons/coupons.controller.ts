import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/coupons')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() body: any) {
        return this.couponsService.create(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
        return this.couponsService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.couponsService.delete(id);
    }

    // Public endpoint for validation during checkout
    @Get('validate')
    validate(@Query('code') code: string) {
        if (!code) return { valid: false };
        return this.couponsService.validate(code);
    }
}

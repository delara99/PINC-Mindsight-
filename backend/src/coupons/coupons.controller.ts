import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('coupons')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) {
        console.log('🎟️ CouponsController Initialized');
    }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() body: any) {
        return this.couponsService.create(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll() {
        return this.couponsService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
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

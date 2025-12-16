
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v1/leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) {}

    @Post()
    async create(@Body() data: any) {
        return this.leadsService.create(data);
    }

    @Get()
    @UseGuards(AuthGuard) // Protect this route
    async findAll() {
        return this.leadsService.findAll();
    }
}

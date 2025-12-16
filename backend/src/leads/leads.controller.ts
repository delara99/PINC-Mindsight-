
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/leads')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) {}

    @Post()
    async create(@Body() data: any) {
        return this.leadsService.create(data);
    }

    @Get()
    @UseGuards(AuthGuard('jwt')) // Protect this route
    async findAll() {
        return this.leadsService.findAll();
    }
}

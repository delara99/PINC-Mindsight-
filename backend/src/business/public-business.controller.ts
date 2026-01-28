
import { Controller, Post, Body } from '@nestjs/common';
import { BusinessService } from './business.service';

@Controller('public/business')
export class PublicBusinessController {
    constructor(private readonly service: BusinessService) { }

    @Post('leads')
    async createLead(@Body() body: {
        name: string,
        email: string,
        phone: string,
        company: string,
        companySize: string,
        role: string,
        interests: any,
        consent: boolean
    }) {
        return this.service.createLead(body);
    }
}

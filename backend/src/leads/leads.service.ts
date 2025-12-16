
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) {}

    async create(data: any) {
        return this.prisma.businessLead.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                companyName: data.companyName,
                employees: data.employees,
                message: data.message,
                status: 'PENDING'
            }
        });
    }

    async findAll() {
        return this.prisma.businessLead.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
}

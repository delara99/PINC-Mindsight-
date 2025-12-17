import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
    constructor(private prisma: PrismaService) { }

    async create(data: { code: string; discountPercent: number; usageLimit?: number; expiresAt?: Date; allowedPlans?: string[] }) {
        // Check if code exists
        const existing = await this.prisma.coupon.findUnique({ where: { code: data.code } });
        if (existing) throw new BadRequestException('Código de cupom já existe.');

        return this.prisma.coupon.create({
            data: {
                code: data.code.toUpperCase(),
                discountPercent: data.discountPercent,
                usageLimit: data.usageLimit,
                expiresAt: data.expiresAt,
                allowedPlans: data.allowedPlans || [],
            },
        });
    }

    async findAll() {
        return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async delete(id: string) {
        return this.prisma.coupon.delete({ where: { id } });
    }

    async validate(code: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) throw new NotFoundException('Cupom inválido.');
        if (!coupon.isActive) throw new BadRequestException('Cupom inativo.');

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            throw new BadRequestException('Limite de uso deste cupom atingido.');
        }

        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            throw new BadRequestException('Cupom expirado.');
        }

        return coupon;
    }
}

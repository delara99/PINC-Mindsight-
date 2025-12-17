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
    async applyCoupon(userId: string, code: string, planId: string, planName: string) {
        const coupon = await this.validate(code);

        // Check User/Tenant exist
        const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { tenant: true } });
        if (!user || !user.tenant) throw new BadRequestException('Usuário inválido.');

        // Plan Validation
        const allowedPlans = coupon.allowedPlans as any;
        const planMap: Record<string, string> = {
            'starter': 'START', 'start': 'START',
            'pro': 'PRO',
            'business': 'BUSINESS'
        };
        const inputPlanId = (planId || 'starter').toLowerCase();
        let selectedPlanEnum = planMap[inputPlanId];

        if (!selectedPlanEnum && planName) {
            const name = planName.toLowerCase();
            if (name.includes('business')) selectedPlanEnum = 'BUSINESS';
            else if (name.includes('pro')) selectedPlanEnum = 'PRO';
            else selectedPlanEnum = 'START';
        }
        if (!selectedPlanEnum) selectedPlanEnum = 'START';

        if (Array.isArray(allowedPlans) && allowedPlans.length > 0) {
            if (!allowedPlans.includes(selectedPlanEnum)) {
                throw new BadRequestException(`Este cupom é válido apenas para o plano: ${allowedPlans.join(', ')}`);
            }
        }

        await this.prisma.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });

        if (coupon.discountPercent === 100) {
            const requestedPlan = selectedPlanEnum as any;
            const currentUserPlan = user.plan || 'START';
            const currentTenantPlan = user.tenant.plan || 'START';

            // Hierarquia de planos: START < PRO < BUSINESS
            const planHierarchy: Record<string, number> = {
                'START': 1,
                'PRO': 2,
                'BUSINESS': 3
            };

            // Determinar o plano final (nunca fazer downgrade)
            const currentLevel = planHierarchy[currentUserPlan] || 1;
            const requestedLevel = planHierarchy[requestedPlan] || 1;
            const finalPlan = requestedLevel > currentLevel ? requestedPlan : currentUserPlan;

            // Sempre adicionar 1 crédito independente do plano
            const creditsToAdd = 1;

            // Atualizar apenas se for upgrade ou primeiro uso
            if (finalPlan !== currentUserPlan || finalPlan !== currentTenantPlan) {
                await this.prisma.tenant.update({
                    where: { id: user.tenant.id },
                    data: { plan: finalPlan }
                });
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    plan: finalPlan,
                    credits: { increment: creditsToAdd }
                }
            });

            const message = finalPlan === requestedPlan
                ? `Plano ${finalPlan} ativado com sucesso! Você recebeu ${creditsToAdd} crédito.`
                : `${creditsToAdd} crédito adicionado! Você mantém seu plano ${finalPlan}.`;

            return { success: true, message };
        }

        return { success: true, message: 'Cupom aplicado.' };
    }
}

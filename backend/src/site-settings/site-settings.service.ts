import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiteSettingsService {
    constructor(private prisma: PrismaService) { }

    // Get settings (public or authenticated)
    async getSettings(tenantId?: string) {
        let settings = await this.prisma.siteSettings.findFirst({
            where: tenantId ? { tenantId } : { tenantId: null }
        });

        // If no settings exist, create with defaults
        if (!settings) {
            settings = await this.prisma.siteSettings.create({
                data: {
                    tenantId: tenantId || null,
                    heroDescription: 'A ferramenta definitiva baseada no Big Five para mapeamento de perfil comportamental e inteligência organizacional.',
                    features: [
                        {
                            id: '1',
                            icon: 'target',
                            title: 'Teste Big Five',
                            description: 'Avaliação cientificamente validada dos 5 grandes fatores da personalidade.'
                        },
                        {
                            id: '2',
                            icon: 'grid',
                            title: 'Dashboard RH',
                            description: 'Visão unificada de toda sua equipe com filtros avançados de competência.'
                        },
                        {
                            id: '3',
                            icon: 'users',
                            title: 'Gestão de Pessoas',
                            description: 'Histórico completo de avaliações e evolução de cada colaborador.'
                        },
                        {
                            id: '4',
                            icon: 'shield',
                            title: 'Multi-tenant Seguro',
                            description: 'Seus dados isolados e protegidos com criptografia de ponta a ponta.'
                        },
                        {
                            id: '5',
                            icon: 'file-text',
                            title: 'Relatórios PDF',
                            description: 'Exporte análises detalhadas prontas para apresentação executiva.'
                        }
                    ],
                    pricingPlans: [
                        {
                            id: '1',
                            name: 'Starter',
                            price: 99,
                            currency: 'R$',
                            period: 'mês',
                            features: ['Até 10 avaliações/mês', 'Relatórios básicos', 'Suporte por email'],
                            highlighted: false,
                            buttonText: 'Começar Agora'
                        },
                        {
                            id: '2',
                            name: 'Professional',
                            price: 299,
                            currency: 'R$',
                            period: 'mês',
                            features: ['Avaliações ilimitadas', 'Relatórios avançados', 'Dashboard completo', 'Suporte prioritário'],
                            highlighted: true,
                            buttonText: 'Mais Popular'
                        },
                        {
                            id: '3',
                            name: 'Enterprise',
                            price: 999,
                            currency: 'R$',
                            period: 'mês',
                            features: ['Tudo do Professional', 'API dedicada', 'Integrações personalizadas', 'Gerente de conta dedicado'],
                            highlighted: false,
                            buttonText: 'Falar com Vendas'
                        }
                    ]
                }
            });
        }

        return settings;
    }

    // Update settings (admin only)
    async updateSettings(data: any, adminId: string) {
        // Verify admin permissions
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, userType: true, tenantId: true }
        });

        if (!admin || (admin.role !== 'SUPER_ADMIN' && admin.role !== 'TENANT_ADMIN')) {
            throw new ForbiddenException('Acesso negado');
        }

        const tenantId = admin.role === 'SUPER_ADMIN' ? null : admin.tenantId;

        // Find or create settings
        let settings = await this.prisma.siteSettings.findFirst({
            where: { tenantId }
        });

        if (settings) {
            return this.prisma.siteSettings.update({
                where: { id: settings.id },
                data
            });
        } else {
            return this.prisma.siteSettings.create({
                data: {
                    ...data,
                    tenantId
                }
            });
        }
    }

    // Reset to defaults (admin only)
    async resetToDefaults(adminId: string) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, tenantId: true }
        });

        if (!admin || (admin.role !== 'SUPER_ADMIN' && admin.role !== 'TENANT_ADMIN')) {
            throw new ForbiddenException('Acesso negado');
        }

        const tenantId = admin.role === 'SUPER_ADMIN' ? null : admin.tenantId;

        // Delete existing and let getSettings recreate
        await this.prisma.siteSettings.deleteMany({
            where: { tenantId }
        });

        return this.getSettings(tenantId);
    }
}

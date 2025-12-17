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
                    aboutTitle: 'Sobre Nossa Empresa',
                    aboutContent: 'Escreva aqui a história da sua empresa, missão e valores.',
                    showAbout: true,
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
                            id: 'starter',
                            name: 'Starter',
                            price: '29,90',
                            currency: 'R$',
                            period: 'único',
                            credits: 1,
                            features: ['1 Avaliação completa', 'Relatório básico', 'Suporte por email'],
                            highlighted: false,
                            buttonText: 'Comprar Agora'
                        },
                        {
                            id: 'pro',
                            name: 'Pro',
                            price: '249,00',
                            currency: 'R$',
                            period: 'único',
                            credits: 10,
                            features: ['10 Avaliações', 'Relatórios avançados', 'Dashboard completo', 'Suporte prioritário'],
                            highlighted: true,
                            buttonText: 'Mais Popular'
                        },
                        {
                            id: 'business',
                            name: 'Business',
                            price: '990,00',
                            currency: 'R$',
                            period: 'único',
                            credits: 50,
                            features: ['50 Avaliações', 'Tudo do Pro', 'Gerente de conta dedicado', 'API de integração'],
                            highlighted: false,
                            buttonText: 'Comprar Agora'
                        }
                    ],
                    // Defaults for new fields
                    logoUrl: '/logo-pinc.png',
                    footerText: '© 2024 SaaS Avaliação. Todos os direitos reservados.',
                    menuItems: [
                        { label: 'Recursos', href: '#features' },
                        { label: 'Relatórios', href: '#reports' },
                        { label: 'Preços', href: '#pricing' },
                        { label: 'Sobre', href: '#about' }
                    ],
                    featuresSection: [
                        {
                            id: 'reports',
                            title: 'Seu Manual de Instruções Pessoal',
                            description: 'Receba uma análise detalhada baseada nos 5 Grandes Fatores da personalidade. Entenda seus pontos fortes, áreas de desenvolvimento e como você interage com o mundo.',
                            image: '/feature-report-bars.png', 
                            orientation: 'left',
                            items: ['Análise profunda de personalidade', 'Gráficos interativos', 'Feedback personalizado']
                        },
                        {
                            id: 'connections',
                            title: 'Conecte-se de verdade',
                            description: 'Descubra como sua personalidade se alinha com a de colegas e parceiros. Nossa ferramenta de compatibilidade ajuda a melhorar a comunicação e reduzir conflitos.',
                            image: '/feature-connections.png',
                            orientation: 'right',
                            items: ['Comparação de perfis', 'Dicas de comunicação', 'Previsão de sinergia']
                        },
                        {
                            id: 'comparison',
                            title: 'Entenda a dinâmica dos seus relacionamentos',
                            description: 'Compare seu perfil com o de outras pessoas para identificar pontos de convergência e divergência. Ideal para formação de equipes e terapia de casais.',
                            image: '/feature-report-radar.png',
                            orientation: 'left',
                            items: ['Radar comparativo', 'Análise de gaps', 'Insights relacionais']
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

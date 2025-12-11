"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SiteSettingsService = class SiteSettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings(tenantId) {
        let settings = await this.prisma.siteSettings.findFirst({
            where: tenantId ? { tenantId } : { tenantId: null }
        });
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
    async updateSettings(data, adminId) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, userType: true, tenantId: true }
        });
        if (!admin || (admin.role !== 'SUPER_ADMIN' && admin.role !== 'TENANT_ADMIN')) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        const tenantId = admin.role === 'SUPER_ADMIN' ? null : admin.tenantId;
        let settings = await this.prisma.siteSettings.findFirst({
            where: { tenantId }
        });
        if (settings) {
            return this.prisma.siteSettings.update({
                where: { id: settings.id },
                data
            });
        }
        else {
            return this.prisma.siteSettings.create({
                data: Object.assign(Object.assign({}, data), { tenantId })
            });
        }
    }
    async resetToDefaults(adminId) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true, tenantId: true }
        });
        if (!admin || (admin.role !== 'SUPER_ADMIN' && admin.role !== 'TENANT_ADMIN')) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        const tenantId = admin.role === 'SUPER_ADMIN' ? null : admin.tenantId;
        await this.prisma.siteSettings.deleteMany({
            where: { tenantId }
        });
        return this.getSettings(tenantId);
    }
};
exports.SiteSettingsService = SiteSettingsService;
exports.SiteSettingsService = SiteSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SiteSettingsService);
//# sourceMappingURL=site-settings.service.js.map
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
exports.BigFiveConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BigFiveConfigService = class BigFiveConfigService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveConfig(tenantId) {
        return this.prisma.bigFiveConfig.findFirst({
            where: {
                tenantId,
                isActive: true
            },
            include: {
                traits: {
                    include: {
                        facets: true
                    }
                }
            }
        });
    }
    async listConfigs(tenantId) {
        return this.prisma.bigFiveConfig.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { traits: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getConfig(id, tenantId) {
        return this.prisma.bigFiveConfig.findFirst({
            where: { id, tenantId },
            include: {
                traits: {
                    include: {
                        facets: true
                    },
                    orderBy: { traitKey: 'asc' }
                }
            }
        });
    }
    async createConfig(tenantId, data) {
        const activeConfig = await this.prisma.bigFiveConfig.findFirst({
            where: {
                tenantId,
                isActive: true
            },
            include: {
                traits: {
                    include: {
                        facets: true
                    }
                }
            }
        });
        const newConfig = await this.prisma.bigFiveConfig.create({
            data: {
                tenantId,
                name: data.name,
                veryLowMax: data.veryLowMax || 20,
                lowMax: data.lowMax || 40,
                averageMax: data.averageMax || 60,
                highMax: data.highMax || 80,
                primaryColor: data.primaryColor || '#d11c9e',
                reportHeader: data.reportHeader || '',
                reportFooter: data.reportFooter || '',
                isActive: false
            }
        });
        if (activeConfig === null || activeConfig === void 0 ? void 0 : activeConfig.traits) {
            for (const trait of activeConfig.traits) {
                const newTrait = await this.prisma.bigFiveTraitConfig.create({
                    data: {
                        configId: newConfig.id,
                        traitKey: trait.traitKey,
                        name: trait.name,
                        icon: trait.icon,
                        weight: trait.weight,
                        description: trait.description,
                        veryLowText: trait.veryLowText,
                        lowText: trait.lowText,
                        averageText: trait.averageText,
                        highText: trait.highText,
                        veryHighText: trait.veryHighText
                    }
                });
                if (trait.facets) {
                    for (const facet of trait.facets) {
                        await this.prisma.bigFiveFacetConfig.create({
                            data: {
                                traitId: newTrait.id,
                                facetKey: facet.facetKey,
                                name: facet.name,
                                weight: facet.weight,
                                description: facet.description
                            }
                        });
                    }
                }
            }
        }
        return newConfig;
    }
    async updateConfig(id, tenantId, data) {
        const config = await this.prisma.bigFiveConfig.findFirst({
            where: { id, tenantId }
        });
        if (!config) {
            throw new Error('Config not found or access denied');
        }
        return this.prisma.bigFiveConfig.update({
            where: { id },
            data
        });
    }
    async populateFromActive(configId, tenantId) {
        const config = await this.prisma.bigFiveConfig.findFirst({
            where: { id: configId, tenantId },
            include: { traits: true }
        });
        if (!config) {
            throw new Error('Config not found');
        }
        const activeConfig = await this.prisma.bigFiveConfig.findFirst({
            where: {
                tenantId,
                isActive: true
            },
            include: {
                traits: {
                    include: { facets: true }
                }
            }
        });
        if (!(activeConfig === null || activeConfig === void 0 ? void 0 : activeConfig.traits)) {
            throw new Error('No active config found to clone from');
        }
        for (const trait of activeConfig.traits) {
            const newTrait = await this.prisma.bigFiveTraitConfig.create({
                data: {
                    configId: config.id,
                    traitKey: trait.traitKey,
                    name: trait.name,
                    icon: trait.icon,
                    weight: trait.weight,
                    description: trait.description,
                    veryLowText: trait.veryLowText,
                    lowText: trait.lowText,
                    averageText: trait.averageText,
                    highText: trait.highText,
                    veryHighText: trait.veryHighText
                }
            });
            if (trait.facets) {
                for (const facet of trait.facets) {
                    await this.prisma.bigFiveFacetConfig.create({
                        data: {
                            traitId: newTrait.id,
                            facetKey: facet.facetKey,
                            name: facet.name,
                            weight: facet.weight,
                            description: facet.description
                        }
                    });
                }
            }
        }
        return { success: true, traitsCount: activeConfig.traits.length };
    }
    async activateConfig(id, tenantId) {
        const config = await this.prisma.bigFiveConfig.findFirst({
            where: { id, tenantId }
        });
        if (!config) {
            throw new Error('Config not found or access denied');
        }
        await this.prisma.bigFiveConfig.updateMany({
            where: { tenantId, NOT: { id } },
            data: { isActive: false }
        });
        return this.prisma.bigFiveConfig.update({
            where: { id },
            data: { isActive: true }
        });
    }
    async updateTrait(traitId, data) {
        return this.prisma.bigFiveTraitConfig.update({
            where: { id: traitId },
            data
        });
    }
    async updateFacet(facetId, data) {
        return this.prisma.bigFiveFacetConfig.update({
            where: { id: facetId },
            data
        });
    }
    async listRecommendations(configId) {
        return this.prisma.bigFiveRecommendation.findMany({
            where: { configId },
            orderBy: [
                { traitKey: 'asc' },
                { scoreRange: 'asc' },
                { order: 'asc' }
            ]
        });
    }
    async createRecommendation(data) {
        return this.prisma.bigFiveRecommendation.create({
            data
        });
    }
    async updateRecommendation(id, data) {
        return this.prisma.bigFiveRecommendation.update({
            where: { id },
            data
        });
    }
    async deleteRecommendation(id) {
        return this.prisma.bigFiveRecommendation.delete({
            where: { id }
        });
    }
    async getRecommendationsForScore(configId, traitKey, scoreRange) {
        return this.prisma.bigFiveRecommendation.findMany({
            where: {
                configId,
                traitKey,
                scoreRange
            },
            orderBy: { order: 'asc' }
        });
    }
};
exports.BigFiveConfigService = BigFiveConfigService;
exports.BigFiveConfigService = BigFiveConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BigFiveConfigService);
//# sourceMappingURL=big-five-config.service.js.map
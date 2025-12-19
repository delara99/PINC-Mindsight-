import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BigFiveConfigService {
    constructor(private prisma: PrismaService) { }

    /**
     * Busca configuração ativa do tenant
     */
    async getActiveConfig(tenantId: string) {
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

    /**
     * Lista todas as configurações do tenant
     */
    async listConfigs(tenantId: string) {
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

    /**
     * Busca configuração específica com todos os detalhes
     */
    async getConfig(id: string, tenantId: string) {
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

    /**
     * Cria nova configuração (clonando traços da config ativa)
     */
    async createConfig(tenantId: string, data: any) {
        // Buscar config ativa para clonar traços
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

        // Criar nova config
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
                isActive: false // Nova config não é ativa por padrão
            }
        });

        // Se existe config ativa, clonar os traços
        if (activeConfig?.traits) {
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

                // Clonar facetas do traço
                if (trait.facets) {
                    for (const facet of trait.facets) {
                        await this.prisma.bigFiveFacetConfig.create({
                            data: {
                                traitId: newTrait.id,
                                facetKey: facet.facetKey,
                                name: facet.name,
                                weight: facet.weight,
                                description: facet.description,
                                isActive: facet.isActive,
                                veryLowText: facet.veryLowText,
                                lowText: facet.lowText,
                                averageText: facet.averageText,
                                highText: facet.highText,
                                veryHighText: facet.veryHighText
                            }
                        });
                    }
                }
            }
        }

        return newConfig;
    }

    /**
     * Atualiza configuração básica (ranges, branding)
     */
    async updateConfig(id: string, tenantId: string, data: any) {
        // Verificar propriedade
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

    /**
     * Popula configuração vazia com traços da config ativa
     */
    async populateFromActive(configId: string, tenantId: string) {
        // Verificar se config existe e está vazia
        const config = await this.prisma.bigFiveConfig.findFirst({
            where: { id: configId, tenantId },
            include: { traits: true }
        });

        if (!config) {
            throw new Error('Config not found');
        }

        // Buscar config ativa para clonar
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

        if (!activeConfig?.traits) {
            throw new Error('No active config found to clone from');
        }

        // Clonar traços
        for (const trait of activeConfig.traits) {
            const newTrait = await this.prisma.bigFiveTraitConfig.create({
                data: {
                    configId: config.id,
                    traitKey: trait.traitKey,
                    name: trait.name,
                    icon: trait.icon,
                    weight: trait.weight,
                    isActive: trait.isActive,
                    description: trait.description,
                    veryLowText: trait.veryLowText,
                    lowText: trait.lowText,
                    averageText: trait.averageText,
                    highText: trait.highText,
                    veryHighText: trait.veryHighText
                }
            });

            // Clonar facetas
            if (trait.facets) {
                for (const facet of trait.facets) {
                    await this.prisma.bigFiveFacetConfig.create({
                        data: {
                            traitId: newTrait.id,
                            facetKey: facet.facetKey,
                            name: facet.name,
                            weight: facet.weight,
                            description: facet.description,
                            isActive: facet.isActive,
                            veryLowText: facet.veryLowText,
                            lowText: facet.lowText,
                            averageText: facet.averageText,
                            highText: facet.highText,
                            veryHighText: facet.veryHighText
                        }
                    });
                }
            }
        }

        return { success: true, traitsCount: activeConfig.traits.length };
    }

    /**
     * Ativa uma configuração (desativa outras do tenant)
     */
    async activateConfig(id: string, tenantId: string) {
        // Verificar propriedade
        const config = await this.prisma.bigFiveConfig.findFirst({
            where: { id, tenantId }
        });

        if (!config) {
            throw new Error('Config not found or access denied');
        }

        // Desativar todas as outras
        await this.prisma.bigFiveConfig.updateMany({
            where: { tenantId, NOT: { id } },
            data: { isActive: false }
        });

        // Ativar esta
        return this.prisma.bigFiveConfig.update({
            where: { id },
            data: { isActive: true }
        });
    }

    /**
     * Atualiza um traço
     */
    async updateTrait(traitId: string, data: any) {
        return this.prisma.bigFiveTraitConfig.update({
            where: { id: traitId },
            data
        });
    }

    /**
     * Atualiza uma faceta
     */
    async updateFacet(facetId: string, data: any) {
        return this.prisma.bigFiveFacetConfig.update({
            where: { id: facetId },
            data
        });
    }

    /**
     * Cria um novo traço na configuração
     */
    async createTrait(configId: string, data: any) {
        return this.prisma.bigFiveTraitConfig.create({
            data: {
                configId,
                traitKey: data.traitKey,
                name: data.name,
                icon: data.icon || 'circle',
                weight: data.weight || 1.0,
                isActive: data.isActive !== undefined ? data.isActive : true,
                description: data.description || '',
                veryLowText: data.veryLowText || '',
                lowText: data.lowText || '',
                averageText: data.averageText || '',
                highText: data.highText || '',
                veryHighText: data.veryHighText || ''
            }
        });
    }

    /**
     * Cria uma nova faceta para um traço
     */
    async createFacet(traitId: string, data: any) {
        return this.prisma.bigFiveFacetConfig.create({
            data: {
                traitId,
                facetKey: data.facetKey,
                name: data.name,
                weight: data.weight || 1.0,
                isActive: data.isActive !== undefined ? data.isActive : true,
                description: data.description || '',
                veryLowText: data.veryLowText || '',
                lowText: data.lowText || '',
                averageText: data.averageText || '',
                highText: data.highText || '',
                veryHighText: data.veryHighText || ''
            }
        });
    }

    /**
     * Lista recomendações de uma configuração
     */
    async listRecommendations(configId: string) {
        return this.prisma.bigFiveRecommendation.findMany({
            where: { configId },
            orderBy: [
                { traitKey: 'asc' },
                { scoreRange: 'asc' },
                { order: 'asc' }
            ]
        });
    }

    /**
     * Cria nova recomendação
     */
    async createRecommendation(data: any) {
        return this.prisma.bigFiveRecommendation.create({
            data
        });
    }

    /**
     * Atualiza recomendação
     */
    async updateRecommendation(id: string, data: any) {
        return this.prisma.bigFiveRecommendation.update({
            where: { id },
            data
        });
    }

    /**
     * Deleta recomendação
     */
    async deleteRecommendation(id: string) {
        return this.prisma.bigFiveRecommendation.delete({
            where: { id }
        });
    }

    /**
     * Busca recomendações para um traço e score range
     */
    async getRecommendationsForScore(configId: string, traitKey: string, scoreRange: string) {
        return this.prisma.bigFiveRecommendation.findMany({
            where: {
                configId,
                traitKey,
                scoreRange
            },
            orderBy: { order: 'asc' }
        });
    }
}

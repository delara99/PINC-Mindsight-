import { PrismaService } from '../prisma/prisma.service';
export declare class BigFiveConfigService {
    private prisma;
    constructor(prisma: PrismaService);
    getActiveConfig(tenantId: string): Promise<{
        traits: ({
            facets: {
                id: string;
                name: string;
                description: string;
                weight: number;
                traitId: string;
                facetKey: string;
            }[];
        } & {
            id: string;
            name: string;
            description: string;
            traitKey: string;
            weight: number;
            icon: string;
            configId: string;
            veryLowText: string;
            lowText: string;
            averageText: string;
            highText: string;
            veryHighText: string;
        })[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        primaryColor: string;
        isActive: boolean;
        veryLowMax: number;
        lowMax: number;
        averageMax: number;
        highMax: number;
        companyLogo: string | null;
        reportHeader: string | null;
        reportFooter: string | null;
    }>;
    listConfigs(tenantId: string): Promise<({
        _count: {
            traits: number;
        };
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        primaryColor: string;
        isActive: boolean;
        veryLowMax: number;
        lowMax: number;
        averageMax: number;
        highMax: number;
        companyLogo: string | null;
        reportHeader: string | null;
        reportFooter: string | null;
    })[]>;
    getConfig(id: string, tenantId: string): Promise<{
        traits: ({
            facets: {
                id: string;
                name: string;
                description: string;
                weight: number;
                traitId: string;
                facetKey: string;
            }[];
        } & {
            id: string;
            name: string;
            description: string;
            traitKey: string;
            weight: number;
            icon: string;
            configId: string;
            veryLowText: string;
            lowText: string;
            averageText: string;
            highText: string;
            veryHighText: string;
        })[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        primaryColor: string;
        isActive: boolean;
        veryLowMax: number;
        lowMax: number;
        averageMax: number;
        highMax: number;
        companyLogo: string | null;
        reportHeader: string | null;
        reportFooter: string | null;
    }>;
    createConfig(tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        primaryColor: string;
        isActive: boolean;
        veryLowMax: number;
        lowMax: number;
        averageMax: number;
        highMax: number;
        companyLogo: string | null;
        reportHeader: string | null;
        reportFooter: string | null;
    }>;
    updateConfig(id: string, tenantId: string, data: any): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        primaryColor: string;
        isActive: boolean;
        veryLowMax: number;
        lowMax: number;
        averageMax: number;
        highMax: number;
        companyLogo: string | null;
        reportHeader: string | null;
        reportFooter: string | null;
    }>;
    populateFromActive(configId: string, tenantId: string): Promise<{
        success: boolean;
        traitsCount: number;
    }>;
    activateConfig(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        primaryColor: string;
        isActive: boolean;
        veryLowMax: number;
        lowMax: number;
        averageMax: number;
        highMax: number;
        companyLogo: string | null;
        reportHeader: string | null;
        reportFooter: string | null;
    }>;
    updateTrait(traitId: string, data: any): Promise<{
        id: string;
        name: string;
        description: string;
        traitKey: string;
        weight: number;
        icon: string;
        configId: string;
        veryLowText: string;
        lowText: string;
        averageText: string;
        highText: string;
        veryHighText: string;
    }>;
    updateFacet(facetId: string, data: any): Promise<{
        id: string;
        name: string;
        description: string;
        weight: number;
        traitId: string;
        facetKey: string;
    }>;
    listRecommendations(configId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        traitKey: string;
        icon: string;
        configId: string;
        scoreRange: string;
        order: number;
    }[]>;
    createRecommendation(data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        traitKey: string;
        icon: string;
        configId: string;
        scoreRange: string;
        order: number;
    }>;
    updateRecommendation(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        traitKey: string;
        icon: string;
        configId: string;
        scoreRange: string;
        order: number;
    }>;
    deleteRecommendation(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        traitKey: string;
        icon: string;
        configId: string;
        scoreRange: string;
        order: number;
    }>;
    getRecommendationsForScore(configId: string, traitKey: string, scoreRange: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        traitKey: string;
        icon: string;
        configId: string;
        scoreRange: string;
        order: number;
    }[]>;
}

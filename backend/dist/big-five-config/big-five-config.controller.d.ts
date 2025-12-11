import { BigFiveConfigService } from './big-five-config.service';
export declare class BigFiveConfigController {
    private configService;
    constructor(configService: BigFiveConfigService);
    getActive(req: any): Promise<{
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
    list(req: any): Promise<({
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
    getById(id: string, req: any): Promise<{
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
    create(data: any, req: any): Promise<{
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
    update(id: string, data: any, req: any): Promise<{
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
    activate(id: string, req: any): Promise<{
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
    populate(id: string, req: any): Promise<{
        success: boolean;
        traitsCount: number;
    }>;
    updateTrait(traitId: string, data: any, req: any): Promise<{
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
    updateFacet(facetId: string, data: any, req: any): Promise<{
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
    createRecommendation(data: any, req: any): Promise<{
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
    updateRecommendation(id: string, data: any, req: any): Promise<{
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
    deleteRecommendation(id: string, req: any): Promise<{
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
}

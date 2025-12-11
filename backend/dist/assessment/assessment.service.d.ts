import { PrismaService } from '../prisma/prisma.service';
export declare class AssessmentService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.AssessmentType;
    }>;
    findAll(tenantId: string): Promise<({
        questions: {
            id: string;
            createdAt: Date;
            text: string;
            assessmentModelId: string;
            traitKey: string | null;
            weight: number;
        }[];
        _count: {
            assignments: number;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.AssessmentType;
    })[]>;
    findOne(id: string, tenantId?: string): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            text: string;
            assessmentModelId: string;
            traitKey: string | null;
            weight: number;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.AssessmentType;
    }>;
    update(id: string, data: any, tenantId?: string): Promise<{
        questions: {
            id: string;
            createdAt: Date;
            text: string;
            assessmentModelId: string;
            traitKey: string | null;
            weight: number;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.AssessmentType;
    }>;
    delete(id: string, tenantId?: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.AssessmentType;
    }>;
}

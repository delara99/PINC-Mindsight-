import { PrismaService } from '../prisma/prisma.service';
export declare class AssessmentTemplateService {
    private prisma;
    constructor(prisma: PrismaService);
    listTemplates(): Promise<{
        id: string;
        title: string;
        description: string;
        type: import(".prisma/client").$Enums.AssessmentType;
        questionCount: number;
        createdAt: Date;
        isTemplate: boolean;
    }[]>;
    cloneTemplate(templateId: string, tenantId: string, customTitle?: string): Promise<{
        id: string;
        title: string;
        description: string;
        type: import(".prisma/client").$Enums.AssessmentType;
        questionCount: number;
        message: string;
    }>;
    getTemplateDetails(templateId: string): Promise<{
        id: string;
        title: string;
        description: string;
        type: import(".prisma/client").$Enums.AssessmentType;
        totalQuestions: number;
        traits: {
            name: string;
            questionCount: number;
            questions: any[];
        }[];
    }>;
}

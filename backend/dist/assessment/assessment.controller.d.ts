import { AssessmentService } from './assessment.service';
import { BigFiveCalculatorService } from './big-five-calculator.service';
import { AssessmentTemplateService } from './assessment-template.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AssessmentController {
    private assessmentService;
    private bigFiveCalculator;
    private templateService;
    private prisma;
    constructor(assessmentService: AssessmentService, bigFiveCalculator: BigFiveCalculatorService, templateService: AssessmentTemplateService, prisma: PrismaService);
    getAssignmentDetails(id: string, req: any): Promise<{
        user: {
            id: string;
            email: string;
            cpf: string | null;
            cnpj: string | null;
            password: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
            status: import(".prisma/client").$Enums.UserStatus;
            userType: import(".prisma/client").$Enums.UserType;
            companyName: string | null;
            phone: string | null;
            tenantId: string | null;
            credits: number;
            createdAt: Date;
            updatedAt: Date;
            lastActivityAt: Date | null;
        };
        result: {
            id: string;
            createdAt: Date;
            assignmentId: string;
            scores: import("@prisma/client/runtime/library").JsonValue;
        };
        assessment: {
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
        };
        responses: {
            id: string;
            createdAt: Date;
            answer: number;
            assignmentId: string;
            questionId: string;
        }[];
    } & {
        id: string;
        status: string;
        userId: string;
        assessmentId: string;
        assignedAt: Date;
        completedAt: Date | null;
        feedback: string | null;
        feedbackAt: Date | null;
    }>;
    getMyAssignment(assessmentId: string, req: any): Promise<{
        user: {
            id: string;
            email: string;
            cpf: string | null;
            cnpj: string | null;
            password: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
            status: import(".prisma/client").$Enums.UserStatus;
            userType: import(".prisma/client").$Enums.UserType;
            companyName: string | null;
            phone: string | null;
            tenantId: string | null;
            credits: number;
            createdAt: Date;
            updatedAt: Date;
            lastActivityAt: Date | null;
        };
        result: {
            id: string;
            createdAt: Date;
            assignmentId: string;
            scores: import("@prisma/client/runtime/library").JsonValue;
        };
        assessment: {
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
        };
        responses: {
            id: string;
            createdAt: Date;
            answer: number;
            assignmentId: string;
            questionId: string;
        }[];
    } & {
        id: string;
        status: string;
        userId: string;
        assessmentId: string;
        assignedAt: Date;
        completedAt: Date | null;
        feedback: string | null;
        feedbackAt: Date | null;
    }>;
    addFeedback(id: string, body: {
        feedback: string;
    }, req: any): Promise<{
        id: string;
        status: string;
        userId: string;
        assessmentId: string;
        assignedAt: Date;
        completedAt: Date | null;
        feedback: string | null;
        feedbackAt: Date | null;
    }>;
    getCompletedAssessments(req: any): Promise<{
        id: string;
        userName: string;
        userEmail: string;
        assessmentTitle: string;
        completedAt: Date;
        scores: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
    }[]>;
    getUserCompletedAssessments(userId: string, req: any): Promise<{
        id: string;
        title: string;
        completedAt: Date;
        scores: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    getOne(id: string, req: any): Promise<{
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
    create(createAssessmentDto: any, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.AssessmentType;
    }>;
    update(id: string, updateAssessmentDto: any, req: any): Promise<{
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
    delete(id: string, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        type: import(".prisma/client").$Enums.AssessmentType;
    }>;
    findAll(req: any): Promise<({
        id: string;
        title: string;
        description: string;
        type: import(".prisma/client").$Enums.AssessmentType;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        isTemplate: boolean;
        questionCount: number;
        _count: {
            assignments: number;
        };
    } | ({
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
    }))[]>;
    assignToUsers(id: string, body: {
        userIds: string[];
    }, req: any): Promise<{
        message: string;
        assignments: {
            id: string;
            status: string;
            userId: string;
            assessmentId: string;
            assignedAt: Date;
            completedAt: Date | null;
            feedback: string | null;
            feedbackAt: Date | null;
        }[];
    }>;
    getAssignments(id: string, req: any): Promise<({
        user: {
            id: string;
            email: string;
            cpf: string;
            cnpj: string;
            name: string;
            userType: import(".prisma/client").$Enums.UserType;
            companyName: string;
        };
    } & {
        id: string;
        status: string;
        userId: string;
        assessmentId: string;
        assignedAt: Date;
        completedAt: Date | null;
        feedback: string | null;
        feedbackAt: Date | null;
    })[]>;
    removeAssignment(id: string, userId: string, req: any): Promise<{
        message: string;
    }>;
    submitAssessment(id: string, body: {
        answers: any[];
    }, req: any): Promise<{
        message: string;
        result: {
            id: string;
            createdAt: Date;
            assignmentId: string;
            scores: import("@prisma/client/runtime/library").JsonValue;
        };
    }>;
    calculateBigFive(assessmentId: string, body: {
        responses: Array<{
            questionId: string;
            value: number;
        }>;
    }, req: any): Promise<{
        traits: {
            description: string;
            trait: string;
            rawScore: number;
            normalizedScore: number;
            facets: import("./big-five-calculator.service").FacetScore[];
            interpretation: string;
        }[];
        recommendations: string[];
        totalQuestions: number;
        answeredQuestions: number;
        completionPercentage: number;
        timestamp: Date;
    }>;
    listTemplates(req: any): Promise<{
        id: string;
        title: string;
        description: string;
        type: import(".prisma/client").$Enums.AssessmentType;
        questionCount: number;
        createdAt: Date;
        isTemplate: boolean;
    }[]>;
    getTemplateDetails(id: string, req: any): Promise<{
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
    cloneTemplate(templateId: string, body: {
        title?: string;
    }, req: any): Promise<{
        id: string;
        title: string;
        description: string;
        type: import(".prisma/client").$Enums.AssessmentType;
        questionCount: number;
        message: string;
    }>;
}

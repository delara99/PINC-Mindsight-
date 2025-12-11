import { PrismaService } from '../prisma/prisma.service';
export declare class InterpretationService {
    private prisma;
    constructor(prisma: PrismaService);
    getInterpretation(traitKey: string, score: number): Promise<{
        text: string;
        category: string;
    }>;
    generateFullReport(scores: Record<string, number>): Promise<any[]>;
}

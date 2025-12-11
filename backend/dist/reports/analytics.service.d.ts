import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    calculateJobFit(candidateScores: Record<string, number>, jobProfileId: string): Promise<number>;
}

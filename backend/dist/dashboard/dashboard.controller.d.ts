import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardController {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(req: any): Promise<{
        activeAssessments: number;
        candidatesInQueue: number;
        onlineUsers: number;
        recentCandidates: {
            name: string;
            role: string;
            date: Date;
            score: string;
            status: string;
        }[];
        usersWithoutCredits: {
            id: string;
            email: string;
            name: string;
        }[];
        creditRequests: ({
            user: {
                email: string;
                name: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.SolicitationStatus;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
        })[];
    }>;
}

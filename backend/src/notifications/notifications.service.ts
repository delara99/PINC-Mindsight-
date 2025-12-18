import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async getAdminCounts() {
        // 1. Devolutivas pendentes
        const pendingFeedbacks = await this.prisma.professionalFeedback.count({
            where: { status: 'PENDING' }
        });

        // 2. Relatórios novos (últimas 48h)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const newReports = await this.prisma.assessmentAssignment.count({
            where: {
                status: 'COMPLETED',
                completedAt: { gte: twoDaysAgo }
            }
        });

        // 3. Conexões pendentes
        const pendingConnections = await this.prisma.connectionRequest.count({
            where: { status: 'PENDING' }
        });

        // 4. Clientes novos (últimas 48h)
        const newClients = await this.prisma.user.count({
            where: {
                createdAt: { gte: twoDaysAgo },
                role: 'MEMBER'
            }
        });

        return {
            devolutivas: pendingFeedbacks,
            relatorios: newReports,
            conexoes: pendingConnections,
            clientes: newClients
        };
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    // Marcar cliente como visualizado
    async markAsViewed(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { viewedByAdmin: true }
        });
    }

    // Marcar relatório como visualizado
    async markReportAsViewed(assignmentId: string) {
        return this.prisma.assessmentAssignment.update({
            where: { id: assignmentId },
            data: { viewedByAdmin: true }
        });
    }
}

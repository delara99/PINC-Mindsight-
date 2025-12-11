import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentService {
    constructor(private prisma: PrismaService) { }

    async create(data: any, tenantId: string) {
        return this.prisma.assessmentModel.create({
            data: {
                ...data,
                tenantId,
            },
        });
    }

    async findAll(tenantId: string) {
        return this.prisma.assessmentModel.findMany({
            where: { tenantId },
            include: {
                questions: true,
                _count: {
                    select: { assignments: true }
                }
            },
        });
    }

    async findOne(id: string, tenantId?: string) {
        return this.prisma.assessmentModel.findFirst({
            where: {
                id,
                ...(tenantId && { tenantId })
            },
            include: { questions: true }
        });
    }

    async update(id: string, data: any, tenantId?: string) {
        // Verify ownership if tenantId is provided
        if (tenantId) {
            const assessment = await this.prisma.assessmentModel.findFirst({
                where: { id, tenantId }
            });
            if (!assessment) {
                throw new Error('Assessment not found or access denied');
            }
        }

        return this.prisma.assessmentModel.update({
            where: { id },
            data,
            include: { questions: true }
        });
    }

    async delete(id: string, tenantId?: string) {
        // Verify ownership if tenantId is provided
        if (tenantId) {
            const assessment = await this.prisma.assessmentModel.findFirst({
                where: { id, tenantId }
            });
            if (!assessment) {
                throw new Error('Assessment not found or access denied');
            }
        }

        // Buscar todos os assignments
        const assignments = await this.prisma.assessmentAssignment.findMany({
            where: { assessmentId: id }
        });

        // Deletar respostas de cada assignment
        for (const assignment of assignments) {
            await this.prisma.assessmentResponse.deleteMany({
                where: { assignmentId: assignment.id }
            });
        }

        // Deletar assignments
        await this.prisma.assessmentAssignment.deleteMany({
            where: { assessmentId: id }
        });

        // Deletar questões
        await this.prisma.question.deleteMany({
            where: { assessmentModelId: id }
        });

        // Deletar avaliação
        return this.prisma.assessmentModel.delete({
            where: { id }
        });
    }
}

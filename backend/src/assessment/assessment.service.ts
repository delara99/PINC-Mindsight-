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

        const { questions, ...assessmentData } = data;

        // Se não tiver questions, atualiza só o básico
        if (!questions) {
             return this.prisma.assessmentModel.update({
                where: { id },
                data: assessmentData,
                include: { questions: true }
            });
        }

        // Se tiver questions, faz gestão inteligente (Diff) dentro de transação
        return this.prisma.$transaction(async (tx) => {
            // 1. Atualizar dados básicos da avaliação
            await tx.assessmentModel.update({
                where: { id },
                data: assessmentData,
            });

            // 2. Gerenciar Questões
            const existingQuestions = await tx.question.findMany({ 
                where: { assessmentModelId: id },
                select: { id: true }
            });
            const existingIds = existingQuestions.map(q => q.id);
            
            // Identificar IDs que chegaram no payload (ignorando 'temp-')
             const incomingIds = questions
                .filter((q: any) => q.id && !q.id.toString().startsWith('temp-'))
                .map((q: any) => q.id);

            // Deletar questões que não estão mais na lista
            const toDelete = existingIds.filter(eid => !incomingIds.includes(eid));
            if (toDelete.length > 0) {
                await tx.question.deleteMany({
                    where: { id: { in: toDelete } }
                });
            }

            // Inserir ou Atualizar questões
            for (const q of questions) {
                // Se for ID temporário ou não existir no banco, cria nova
                if (!q.id || q.id.toString().startsWith('temp-') || !existingIds.includes(q.id)) {
                    await tx.question.create({
                        data: {
                            text: q.text,
                            traitKey: q.traitKey, facetKey: q.facetKey || null,
                            weight: Number(q.weight) || 1, isReverse: q.isReverse || false,
                            assessmentModelId: id
                        }
                    });
                } else {
                    // Se já existe, atualiza
                    await tx.question.update({
                        where: { id: q.id },
                        data: {
                            text: q.text,
                            traitKey: q.traitKey, facetKey: q.facetKey || null,
                            weight: Number(q.weight) || 1, isReverse: q.isReverse || false
                        }
                    });
                }
            }

            // Retorna objeto completo atualizado
            return tx.assessmentModel.findUnique({
                where: { id },
                include: { questions: true }
            });
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

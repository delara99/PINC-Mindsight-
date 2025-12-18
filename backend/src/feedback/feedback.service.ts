import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
    constructor(private prisma: PrismaService) { }

    // Cliente solicita devolutiva
    async createRequest(userId: string, assignmentId: string, phone?: string) {
        // Verificar se assignment existe e pertence ao usuário
        const assignment = await this.prisma.assessmentAssignment.findFirst({
            where: { id: assignmentId, userId },
            include: { result: true }
        });

        if (!assignment) {
            throw new BadRequestException('Avaliação não encontrada ou não pertence a você.');
        }

        if (assignment.status !== 'COMPLETED') {
            throw new BadRequestException('Você precisa completar o inventário antes de solicitar a devolutiva.');
        }

        if (!assignment.result) {
            throw new BadRequestException('Resultado do inventário não disponível.');
        }

        // Verificar se já existe solicitação
        const existing = await this.prisma.professionalFeedback.findFirst({
            where: { assignmentId, userId }
        });

        if (existing) {
            // Se já existe, atualizar o telefone se fornecido
            if (phone) {
                return this.prisma.professionalFeedback.update({
                    where: { id: existing.id },
                    data: { phone },
                    include: {
                        user: { select: { name: true, email: true } },
                        assignment: {
                            include: {
                                assessment: { select: { title: true } },
                                result: true
                            }
                        }
                    }
                });
            }
            return existing;
        }

        // Criar solicitação
        return this.prisma.professionalFeedback.create({
            data: {
                userId,
                assignmentId,
                phone,
                status: 'PENDING'
            },
            include: {
                user: { select: { name: true, email: true } },
                assignment: {
                    include: {
                        assessment: { select: { title: true } },
                        result: true
                    }
                }
            }
        });
    }

    // Cliente verifica status da sua solicitação
    async getMyRequest(userId: string, assignmentId: string) {
        return this.prisma.professionalFeedback.findFirst({
            where: { userId, assignmentId },
            include: {
                assignment: {
                    include: {
                        assessment: { select: { title: true } },
                        result: true
                    }
                }
            }
        });
    }

    // Admin lista todas as solicitações
    async getAllRequests() {
        return this.prisma.professionalFeedback.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                assignment: {
                    include: {
                        assessment: { select: { title: true } },
                        result: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Admin atualiza status
    async updateStatus(id: string, status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED', notes?: string, scheduledAt?: Date) {
        const feedback = await this.prisma.professionalFeedback.findUnique({ where: { id } });
        if (!feedback) throw new NotFoundException('Solicitação não encontrada.');

        return this.prisma.professionalFeedback.update({
            where: { id },
            data: {
                status,
                notes,
                scheduledAt,
                completedAt: status === 'COMPLETED' ? new Date() : undefined
            },
            include: {
                user: { select: { name: true, email: true } },
                assignment: {
                    include: {
                        assessment: { select: { title: true } },
                        result: true
                    }
                }
            }
        });
    }
}

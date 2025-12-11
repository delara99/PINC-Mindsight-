import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssessmentTemplateService {
    constructor(private prisma: PrismaService) { }

    /**
     * Lista templates de avaliação disponíveis
     * Retorna avaliações BIG_FIVE independente do tenant
     */
    async listTemplates() {
        // Buscar todas as avaliações Big Five (podem ser de qualquer tenant)
        // Admins podem ver e clonar para seu próprio tenant
        const templates = await this.prisma.assessmentModel.findMany({
            where: {
                type: 'BIG_FIVE'
            },
            include: {
                questions: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10 // Limitar a 10 templates
        });

        return templates.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            type: t.type,
            questionCount: t.questions.length,
            createdAt: t.createdAt,
            isTemplate: true
        }));
    }

    /**
     * Clona um template de avaliação para um tenant específico
     */
    async cloneTemplate(templateId: string, tenantId: string, customTitle?: string) {
        // Buscar template original com todas as questões
        const template = await this.prisma.assessmentModel.findUnique({
            where: { id: templateId },
            include: {
                questions: true
            }
        });

        if (!template) {
            throw new Error('Template não encontrado');
        }

        // Criar nova avaliação clonada
        const cloned = await this.prisma.assessmentModel.create({
            data: {
                title: customTitle || template.title,
                description: template.description,
                type: template.type,
                tenantId: tenantId,
                // Clonar questões
                questions: {
                    create: template.questions.map(q => ({
                        text: q.text,
                        traitKey: q.traitKey,
                        weight: q.weight
                    }))
                }
            },
            include: {
                questions: true
            }
        });

        return {
            id: cloned.id,
            title: cloned.title,
            description: cloned.description,
            type: cloned.type,
            questionCount: cloned.questions.length,
            message: 'Inventário clonado com sucesso!'
        };
    }

    /**
     * Visualiza detalhes de um template
     */
    async getTemplateDetails(templateId: string) {
        const template = await this.prisma.assessmentModel.findUnique({
            where: { id: templateId },
            include: {
                questions: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!template) {
            throw new Error('Template não encontrado');
        }

        // Agrupar questões por traço
        const questionsByTrait = template.questions.reduce((acc, q) => {
            const trait = q.traitKey?.split('::')[0] || 'Sem Traço';
            if (!acc[trait]) {
                acc[trait] = [];
            }
            acc[trait].push({
                id: q.id,
                text: q.text,
                facet: q.traitKey?.split('::')[1] || '',
                weight: q.weight,
                isInverted: q.text.includes('(INV)')
            });
            return acc;
        }, {} as Record<string, any[]>);

        return {
            id: template.id,
            title: template.title,
            description: template.description,
            type: template.type,
            totalQuestions: template.questions.length,
            traits: Object.keys(questionsByTrait).map(trait => ({
                name: trait,
                questionCount: questionsByTrait[trait].length,
                questions: questionsByTrait[trait]
            }))
        };
    }
}

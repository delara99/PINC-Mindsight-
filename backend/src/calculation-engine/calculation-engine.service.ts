import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalculationEngineService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // FÓRMULAS
    // ============================================

    async getAllFormulas() {
        return this.prisma.calculationFormula.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    }

    async getFormula(id: string) {
        return this.prisma.calculationFormula.findUnique({
            where: { id }
        });
    }

    async updateFormula(id: string, data: any, userId: string) {
        const old = await this.prisma.calculationFormula.findUnique({ where: { id } });

        const updated = await this.prisma.calculationFormula.update({
            where: { id },
            data: {
                formula: data.formula,
                description: data.description,
                example: data.example,
                minValue: data.minValue,
                maxValue: data.maxValue,
                precision: data.precision,
                version: { increment: 1 }
            }
        });

        // Log de auditoria
        await this.createAuditLog('FORMULA', id, 'UPDATE', old, updated, userId, data.reason);

        return updated;
    }

    // ============================================
    // CLASSIFICAÇÕES
    // ============================================

    async getAllClassifications() {
        return this.prisma.calculationClassification.findMany({
            where: { isActive: true },
            orderBy: [{ dimension: 'asc' }, { priority: 'asc' }]
        });
    }

    async getClassificationsByDimension(dimension: string) {
        return this.prisma.calculationClassification.findMany({
            where: { dimension, isActive: true },
            orderBy: { priority: 'asc' }
        });
    }

    async updateClassification(id: string, data: any, userId: string) {
        const old = await this.prisma.calculationClassification.findUnique({ where: { id } });

        const updated = await this.prisma.calculationClassification.update({
            where: { id },
            data: {
                minScore: data.minScore,
                maxScore: data.maxScore,
                label: data.label,
                description: data.description,
                color: data.color
            }
        });

        await this.createAuditLog('CLASSIFICATION', id, 'UPDATE', old, updated, userId, data.reason);

        return updated;
    }

    // ============================================
    // MAPEAMENTO DE QUESTÕES
    // ============================================

    async getAllQuestionMappings() {
        return this.prisma.calculationQuestionMapping.findMany({
            where: { isActive: true },
            orderBy: [{ dimension: 'asc' }, { questionId: 'asc' }]
        });
    }

    async getQuestionMappingsByDimension(dimension: string) {
        return this.prisma.calculationQuestionMapping.findMany({
            where: { dimension, isActive: true },
            orderBy: { questionId: 'asc' }
        });
    }

    async createQuestionMapping(data: any, userId: string) {
        const created = await this.prisma.calculationQuestionMapping.create({
            data: {
                questionId: data.questionId,
                questionText: data.questionText,
                dimension: data.dimension,
                facet: data.facet,
                weight: data.weight || 1.0,
                isReversed: data.isReversed || false,
                description: data.description
            }
        });

        await this.createAuditLog('MAPPING', created.id, 'CREATE', null, created, userId, data.reason);

        return created;
    }

    async updateQuestionMapping(id: string, data: any, userId: string) {
        const old = await this.prisma.calculationQuestionMapping.findUnique({ where: { id } });

        const updated = await this.prisma.calculationQuestionMapping.update({
            where: { id },
            data: {
                dimension: data.dimension,
                facet: data.facet,
                weight: data.weight,
                isReversed: data.isReversed,
                description: data.description
            }
        });

        await this.createAuditLog('MAPPING', id, 'UPDATE', old, updated, userId, data.reason);

        return updated;
    }

    async deleteQuestionMapping(id: string, userId: string) {
        const old = await this.prisma.calculationQuestionMapping.findUnique({ where: { id } });

        await this.prisma.calculationQuestionMapping.update({
            where: { id },
            data: { isActive: false }
        });

        await this.createAuditLog('MAPPING', id, 'DELETE', old, null, userId);

        return { success: true };
    }

    // ============================================
    // SIMULADOR
    // ============================================

    async simulate(name: string, inputs: Record<string, number>, userId?: string) {
        // Simula o cálculo completo passo a passo
        const steps: any[] = [];
        const results: any = {};

        // 1. Normalização
        steps.push({
            step: 1,
            name: 'Normalização de Respostas',
            description: 'Converte respostas 1-6 para 0-100',
            inputs: inputs,
            outputs: {}
        });

        const normalized: Record<string, number> = {};
        Object.entries(inputs).forEach(([qId, value]) => {
            const norm = Math.round(((value - 1) / 5) * 100);
            normalized[qId] = norm;
            steps[0].outputs[qId] = { original: value, normalized: norm };
        });

        // 2. Agrupamento por Facetas (simplificado para demo)
        steps.push({
            step: 2,
            name: 'Agrupamento por Facetas',
            description: 'Agrupa questões por faceta e calcula média',
            facets: {}
        });

        // 3. Agregação de Dimensões
        steps.push({
            step: 3,
            name: 'Cálculo de Dimensões',
            description: 'Média simples das facetas',
            dimensions: {}
        });

        // 4. Classificação
        steps.push({
            step: 4,
            name: 'Classificação de Níveis',
            description: 'Determina nível baseado nos ranges',
            classifications: {}
        });

        // Salvar simulação
        const simulation = await this.prisma.calculationSimulation.create({
            data: {
                name,
                inputs,
                results,
                steps,
                userId
            }
        });

        return {
            id: simulation.id,
            name,
            steps,
            results,
            createdAt: simulation.createdAt
        };
    }

    async getSimulations(userId?: string) {
        const where = userId ? { userId } : {};
        return this.prisma.calculationSimulation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }

    async getSimulation(id: string) {
        return this.prisma.calculationSimulation.findUnique({
            where: { id }
        });
    }

    // ============================================
    // AUDITORIA
    // ============================================

    private async createAuditLog(
        entityType: string,
        entityId: string,
        action: string,
        oldValue: any,
        newValue: any,
        userId: string,
        reason?: string
    ) {
        return this.prisma.calculationConfigAudit.create({
            data: {
                entityType,
                entityId,
                action,
                oldValue: oldValue || undefined,
                newValue: newValue || undefined,
                userId,
                reason
            }
        });
    }

    async getAuditLogs() {
        return this.prisma.calculationConfigAudit.findMany({
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    async getAuditLogsByEntity(entityId: string) {
        return this.prisma.calculationConfigAudit.findMany({
            where: { entityId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
    }

    // ============================================
    // EXPORTAÇÃO/IMPORTAÇÃO
    // ============================================

    async exportConfiguration() {
        const [formulas, classifications, mappings] = await Promise.all([
            this.prisma.calculationFormula.findMany({ where: { isActive: true } }),
            this.prisma.calculationClassification.findMany({ where: { isActive: true } }),
            this.prisma.calculationQuestionMapping.findMany({ where: { isActive: true } })
        ]);

        return {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            formulas,
            classifications,
            mappings
        };
    }

    async importConfiguration(data: any, userId: string) {
        // TODO: Implementar lógica de importação com validação
        throw new Error('Importação ainda não implementada');
    }

    // ============================================
    // DOCUMENTAÇÃO
    // ============================================

    async getDocumentation() {
        const formulas = await this.getAllFormulas();
        const classifications = await this.getAllClassifications();

        return {
            overview: {
                title: 'Motor de Cálculo PINC',
                description: 'Sistema de cálculo de scores psicométricos baseado no Big Five (OCEAN)',
                version: '2.0.0'
            },
            pipeline: [
                {
                    step: 1,
                    name: 'Coleta de Respostas',
                    description: 'Usuário responde 50 questões em escala Likert 1-6'
                },
                {
                    step: 2,
                    name: 'Inversão de Questões Reversas',
                    description: 'Questões marcadas como reversas são invertidas (7 - valor)',
                    formula: formulas.find(f => f.name === 'REVERSE_SCORING_1_6')
                },
                {
                    step: 3,
                    name: 'Normalização',
                    description: 'Converte escala 1-6 para percentual 0-100',
                    formula: formulas.find(f => f.name === 'NORMALIZATION_1_6_TO_0_100')
                },
                {
                    step: 4,
                    name: 'Agregação de Facetas',
                    description: 'Calcula média ponderada das questões de cada faceta',
                    formula: formulas.find(f => f.name === 'FACET_WEIGHTED_AVERAGE')
                },
                {
                    step: 5,
                    name: 'Agregação de Dimensões',
                    description: 'Calcula média simples das facetas de cada dimensão',
                    formula: formulas.find(f => f.name === 'DIMENSION_SIMPLE_AVERAGE')
                },
                {
                    step: 6,
                    name: 'Classificação',
                    description: 'Determina nível (VERY_LOW, LOW, AVERAGE, HIGH, VERY_HIGH)',
                    ranges: classifications.filter(c => c.dimension === 'EXTRAVERSION')
                }
            ],
            dimensions: [
                { key: 'O', name: 'Abertura à Experiência', description: 'Imaginação, criatividade, curiosidade' },
                { key: 'C', name: 'Conscienciosidade', description: 'Organização, disciplina, responsabilidade' },
                { key: 'E', name: 'Extroversão', description: 'Sociabilidade, energia, assertividade' },
                { key: 'A', name: 'Amabilidade', description: 'Empatia, cooperação, confiança' },
                { key: 'N', name: 'Neuroticismo', description: 'Estabilidade emocional, resiliência' }
            ],
            formulas,
            classifications: classifications.reduce((acc, c) => {
                if (!acc[c.dimension]) acc[c.dimension] = [];
                acc[c.dimension].push(c);
                return acc;
            }, {} as Record<string, any[]>)
        };
    }
}

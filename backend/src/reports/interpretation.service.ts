
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InterpretationService {
    constructor(private prisma: PrismaService) { }

    async getInterpretation(traitKey: string, score: number) {
        // Find matching rule
        const rule = await this.prisma.interpretationRule.findFirst({
            where: {
                traitKey,
                minScore: { lte: score },
                maxScore: { gte: score }
            }
        });

        if (rule) {
            return {
                text: rule.text,
                category: rule.category
            };
        }

        return {
            text: 'Interpretação não disponível para este score.',
            category: 'GENERAL'
        };
    }

    async generateFullReport(scores: Record<string, number>) {
        const report = [];

        for (const [trait, score] of Object.entries(scores)) {
            const interpretation = await this.getInterpretation(trait, score);
            report.push({
                trait,
                score,
                ...interpretation
            });
        }

        return report;
    }
}

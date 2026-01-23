
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TalkingToRulesService {
    constructor(private prisma: PrismaService) { }

    // --- CRUD ---

    async findAll() {
        return this.prisma.talkingToRule.findMany({
            orderBy: { priority: 'desc' },
            include: { message: true }
        });
    }

    async create(data: any) {
        // Data should include: name, description, domain, conditions (JSON), messageId (or create new message)
        return this.prisma.talkingToRule.create({
            data: {
                name: data.name,
                description: data.description,
                domain: data.domain,
                priority: data.priority || 1,
                conditions: data.conditions,
                isActive: data.isActive ?? true,
                message: {
                    connect: { id: data.messageId }
                }
            }
        });
    }

    async update(id: string, data: any) {
        return this.prisma.talkingToRule.update({
            where: { id },
            data
        });
    }

    async delete(id: string) {
        return this.prisma.talkingToRule.delete({ where: { id } });
    }

    // --- ENGINE ---

    /**
     * Evaluates a profile against all active rules and returns the matched rules
     * sorted by priority.
     */
    async evaluateProfile(scores: { O: number; C: number; E: number; A: number; N: number }) {
        // 1. Fetch active rules
        const rules = await this.prisma.talkingToRule.findMany({
            where: { isActive: true },
            orderBy: { priority: 'desc' },
            include: { message: true }
        });

        const matches = [];

        for (const rule of rules) {
            if (this.checkConditions(rule.conditions, scores)) {
                matches.push(rule);
            }
        }

        return matches;
    }

    private checkConditions(conditions: any, scores: any): boolean {
        // Conditions format (flexible):
        // {
        //    "scores": { "E": { "min": 50, "max": 100 }, "N": { "max": 30 } },
        //    "custom": "..." 
        // }
        // For now, let's support basic Score Range checks.

        if (!conditions) return true; // No conditions = always matches? Or never? Let's say safe defaults.

        // Check Direct Scores (E, A, C, N, O)
        if (conditions.scores) {
            for (const [trait, range] of Object.entries(conditions.scores)) {
                const val = scores[trait];
                const r = range as any;
                if (val === undefined) continue;

                if (r.min !== undefined && val < r.min) return false;
                if (r.max !== undefined && val > r.max) return false;
            }
        }

        // TODO: Add Facet Logic here later when we have Facet Calculation Service injected/available.
        // For now, the simulation sends O,C,E,A,N. The migration script created facet rules...
        // We need to approximate facets or ignore them for this MVP step if we don't have facet scores.
        // Wait, the "TalkingTO" service calculates facets implicitly in the text generation logic.
        // Ideally, we should receive Facets here too.

        // MVP: If conditions require facets, and we don't have them, we might skip or try to approximate.
        // Let's assume for the Simulation MVP we only check main dimensions or if facets are passed, we check them.

        return true;
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ScoreResult {
    traitKey: string;
    traitName: string;
    score: number;
    normalizedScore: number;
    level: 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH';
    levelLabel?: string;
    interpretation: string;
    facets?: {
        facetKey: string;
        facetName: string;
        score: number;
        rawScore: number;
    }[];
}

@Injectable()
export class ScoreCalculationService {
    constructor(private prisma: PrismaService) { }

    async calculateScores(assignmentId: string): Promise<{
        scores: Record<string, ScoreResult>;
        conceptScores: Record<string, any>;
        subtraitScores: Record<string, any>;
        dichotomyScores: Record<string, any>;
        config: any;
    }> {
        // 1. Fetch Data
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: {
                    include: { question: true }
                },
                config: {
                    include: {
                        traits: {
                            include: { facets: true }
                        }
                    }
                },
                user: { select: { tenantId: true } }
            }
        });

        if (!assignment) throw new Error('Assignment não encontrado');

        // 2. Resolve Config (Fallback Logic)
        let config = assignment.config;
        if (!config) {
            config = await this.prisma.bigFiveConfig.findFirst({
                where: { tenantId: assignment.user.tenantId, isActive: true },
                include: { traits: { include: { facets: true } } }
            });

            if (!config) {
                config = await this.prisma.bigFiveConfig.findFirst({
                    where: { tenantId: assignment.user.tenantId },
                    include: { traits: { include: { facets: true } } },
                    orderBy: { createdAt: 'desc' }
                });
            }
        }

        if (!config) {
            console.warn('[Score Calc] ⚠️ Configuração não encontrada. Usando FALLBACK.');
            config = {
                id: 'fallback',
                name: 'Fallback Config',
                veryLowMax: 20, lowMax: 40, averageMax: 60, highMax: 80, veryHighMax: 100,
                traits: []
            } as any;
        }

        // 3. Setup Helpers & Constants
        const normalizeKey = (k: string): string => {
            if (!k) return '';
            const upper = k.toUpperCase().trim();
            const mapping: Record<string, string> = {
                'EXTROVERSAO': 'EXTRAVERSION',
                'EXTROVERSÃO': 'EXTRAVERSION',
                'AMABILIDADE': 'AGREEABLENESS',
                'CONSCIENCIOSIDADE': 'CONSCIENTIOUSNESS',
                'ESTRUTURA': 'CONSCIENTIOUSNESS',
                'ABERTURA': 'OPENNESS',
                'ABERTURA A EXPERIENCIAS': 'OPENNESS',
                'ABERTURA À EXPERIÊNCIA': 'OPENNESS',
                'NEUROTICISMO': 'NEUROTICISM',
                'ESTABILIDADE': 'NEUROTICISM',
                'ESTABILIDADE EMOCIONAL': 'NEUROTICISM',
                'EMOCIONAL': 'NEUROTICISM'
            };
            return mapping[upper] || upper;
        };

        const mapQuestionTraitToKey = (qt: string, dic: string): string | null => {
            if (!qt && !dic) return null;
            const context = (qt + ' ' + dic).toUpperCase();
            if (context.includes('EXTROVER') || context.includes('INTROVER')) return 'EXTRAVERSION';
            if (context.includes('LOGICO') || context.includes('SENTIMENTAL') || context.includes('COMPETITIV') || context.includes('COLAB')) return 'AGREEABLENESS';
            if (context.includes('ADAPT') || context.includes('ESTRUT') || context.includes('PLAN')) return 'CONSCIENTIOUSNESS';
            if (context.includes('CONCRETO') || context.includes('ABSTRATO') || context.includes('IMAGIN')) return 'OPENNESS';
            if (context.includes('EMOC') || context.includes('RACIONAL') || context.includes('INSTAV') || context.includes('ESTAV')) return 'NEUROTICISM';
            return null;
        };

        const cleanString = (str: string): string => {
            if (!str) return '';
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[()%]/g, "").toLowerCase().trim();
        };

        // 4. Initialize Accumulators
        const scores: Record<string, ScoreResult> = {};
        const configKeyMap: Record<string, string> = {};

        if (config.traits) {
            config.traits.forEach(t => {
                scores[t.traitKey] = {
                    traitKey: t.traitKey,
                    traitName: t.name,
                    score: 0,
                    normalizedScore: 0,
                    level: 'AVERAGE',
                    interpretation: 'Médio',
                    facets: []
                };
                configKeyMap[normalizeKey(t.traitKey)] = t.traitKey;
            });
        }

        const conceptMap = new Map<string, { sum: number, weightSum: number, count: number, originalName: string }>();
        const subtraitMap = new Map<string, { sum: number, weightSum: number, count: number, originalName: string }>();
        const dichotomyMap = new Map<string, { sum: number, weightSum: number, count: number, originalName: string }>();
        const traitTotalPossible: Record<string, number> = {};

        // 5. Process Responses
        assignment.responses.forEach(r => {
            const q = r.question as any;
            if (!q) return;

            let rawVal = (r as any).answer || (r as any).value || 0;
            rawVal = Number(rawVal);
            if (isNaN(rawVal)) rawVal = 3;

            const finalValue = q.isReverse ? (6 - rawVal) : rawVal;
            const weight = q.weight || 1;

            // --- Big Five ---
            let targetKey: string | null = null;
            if (q.traitKey) {
                const norm = normalizeKey(q.traitKey);
                if (configKeyMap[norm]) targetKey = configKeyMap[norm];
            }
            if (!targetKey && (q.questionTrait || q.dichotomy)) {
                const inferred = mapQuestionTraitToKey(q.questionTrait || '', q.dichotomy || '');
                if (inferred && configKeyMap[inferred]) targetKey = configKeyMap[inferred];
            }

            if (targetKey && scores[targetKey]) {
                scores[targetKey].score += finalValue * weight;
                traitTotalPossible[targetKey] = (traitTotalPossible[targetKey] || 0) + (5 * weight);
            }

            // --- TalkingTo ---
            const accumulate = (map: Map<string, any>, key: string, name: string) => {
                if (!key) return;
                const k = cleanString(key);
                if (!map.has(k)) map.set(k, { sum: 0, weightSum: 0, count: 0, originalName: name });
                const entry = map.get(k);
                entry.sum += finalValue * weight;
                entry.weightSum += weight;
                entry.count++;
            };

            if (q.concept) accumulate(conceptMap, q.concept, q.concept);
            if (q.subtrait) accumulate(subtraitMap, q.subtrait, q.subtrait);
            if (q.dichotomy) accumulate(dichotomyMap, q.dichotomy, q.dichotomy);
            // Optionally map questionTrait to dichotomy or subtrait if needed
        });

        // 6. Finalize & Normalize
        Object.keys(scores).forEach(key => {
            const totalPossible = traitTotalPossible[key] || 1;
            const accumulated = scores[key].score;
            let percent = (accumulated / totalPossible) * 100;
            percent = Math.min(100, Math.max(0, percent));

            scores[key].normalizedScore = Math.round(percent);
            scores[key].level = this.determineLevel(percent, config);

            // Text Interpretation
            const traitConfig = config.traits?.find(t => t.traitKey === key);
            scores[key].interpretation = this.getInterpretation(scores[key].level, traitConfig || {
                veryLowText: 'Muito Baixo', lowText: 'Baixo', averageText: 'Médio', highText: 'Alto', veryHighText: 'Muito Alto'
            });

            // Set Label
            let levelLabel = '';
            switch (scores[key].level) {
                case 'VERY_LOW': levelLabel = config.veryLowLabel || 'Muito Baixo'; break;
                case 'LOW': levelLabel = config.lowLabel || 'Baixo'; break;
                case 'AVERAGE': levelLabel = config.averageLabel || 'Médio'; break;
                case 'HIGH': levelLabel = config.highLabel || 'Alto'; break;
                case 'VERY_HIGH': levelLabel = config.veryHighLabel || 'Muito Alto'; break;
            }
            scores[key].levelLabel = levelLabel;
        });

        const processMap = (map: Map<string, any>) => {
            const out: Record<string, any> = {};
            map.forEach((v, k) => {
                const avg = v.weightSum > 0 ? (v.sum / v.weightSum) : 0;
                out[k] = {
                    name: v.originalName,
                    score: avg,
                    normalizedScore: this.normalizeScore(avg),
                    level: this.determineLevel(this.normalizeScore(avg), config)
                };
            });
            return out;
        };

        return {
            scores,
            conceptScores: processMap(conceptMap),
            subtraitScores: processMap(subtraitMap),
            dichotomyScores: processMap(dichotomyMap),
            config
        };
    }

    private normalizeScore(rawScore: number): number {
        if (rawScore < 1) return 0;
        const norm = ((rawScore - 1) / 4) * 100;
        return Math.min(100, Math.max(0, Math.round(norm)));
    }

    private determineLevel(score: number, config: any): 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH' {
        if (score <= config.veryLowMax) return 'VERY_LOW';
        if (score <= config.lowMax) return 'LOW';
        if (score <= config.averageMax) return 'AVERAGE';
        if (score <= config.highMax) return 'HIGH';
        return 'VERY_HIGH';
    }

    private getInterpretation(level: string, trait: any): string {
        switch (level) {
            case 'VERY_LOW': return trait.veryLowText || 'Muito Baixo';
            case 'LOW': return trait.lowText || 'Baixo';
            case 'AVERAGE': return trait.averageText || 'Médio';
            case 'HIGH': return trait.highText || 'Alto';
            case 'VERY_HIGH': return trait.veryHighText || 'Muito Alto';
            default: return trait.averageText || 'Médio';
        }
    }
}

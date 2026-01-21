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
            if (mapping[upper]) return mapping[upper];

            if (upper.includes('EXTROVER') || upper.includes('SOCIAL')) return 'EXTRAVERSION';
            if (upper.includes('AMABIL') || upper.includes('AGRE') || upper.includes('COLAB') || upper.includes('SENTIM')) return 'AGREEABLENESS';
            if (upper.includes('CONSC') || upper.includes('ESTRUT') || upper.includes('ORGANIZ') || upper.includes('PLANEJ')) return 'CONSCIENTIOUSNESS';
            if (upper.includes('ABERT') || upper.includes('OPEN') || upper.includes('IMAGIN') || upper.includes('NOV')) return 'OPENNESS';
            if (upper.includes('ESTAB') || upper.includes('NEUR') || upper.includes('EMOC') || upper.includes('RESIL')) return 'NEUROTICISM';

            return upper;
        };

        const cleanString = (str: string): string => {
            if (!str) return '';
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[()%]/g, "").toLowerCase().trim();
        };

        // 4. Initialize Accumulators
        const configKeyMap: Record<string, string> = {};

        // Structure to accumulate questions PER FACET/SUBTRAIT
        // Logic Phase 1: Aggregate Questions -> Facets
        const facetAccumulator: Record<string, {
            sum: number;
            weightSum: number;
            count: number;
            name: string;
            traitKey: string | null;  // The parent trait key if known
        }> = {};

        // Also track Concepts/Dichotomies for metadata reporting (legacy support)
        const conceptMap = new Map<string, { sum: number, weightSum: number, count: number, originalName: string }>();
        const subtraitMap = new Map<string, { sum: number, weightSum: number, count: number, originalName: string }>();
        const dichotomyMap = new Map<string, { sum: number, weightSum: number, count: number, originalName: string }>();

        // SETUP: Pre-populate facet accumulator from Config to ensure we capture hierarchy
        if (config.traits) {
            config.traits.forEach(t => {
                const nKey = normalizeKey(t.traitKey);
                configKeyMap[nKey] = t.traitKey;

                if (t.facets) {
                    t.facets.forEach(f => {
                        const cleanF = cleanString(f.facetKey);
                        // Store using both CLEAN key (for robust matching) and ORIGINAL key
                        facetAccumulator[cleanF] = { sum: 0, weightSum: 0, count: 0, name: f.name, traitKey: t.traitKey };
                        // Ensure we can lookup by Name too if needed
                        const cleanName = cleanString(f.name);
                        if (cleanName && cleanName !== cleanF) {
                            // Pointer or duplicate entry? Let's just rely on robust key mapping during response processing
                        }
                    });
                }
            });
        }

        // TRADUÇÃO DOS NOMES DE TRAÇOS PARA PORTUGUÊS (Fallback)
        const traitNameTranslation: Record<string, string> = {
            'EXTRAVERSION': 'Extroversão',
            'AGREEABLENESS': 'Amabilidade',
            'CONSCIENTIOUSNESS': 'Conscienciosidade',
            'OPENNESS': 'Abertura à Experiência',
            'NEUROTICISM': 'Estabilidade Emocional'
        };

        // ENSURE ALL BIG 5 KEYS EXIST IN CONFIG MAP
        ['EXTRAVERSION', 'AGREEABLENESS', 'CONSCIENTIOUSNESS', 'OPENNESS', 'NEUROTICISM'].forEach(stdKey => {
            if (!configKeyMap[stdKey]) configKeyMap[stdKey] = stdKey;
        });

        // 5. Process Responses
        assignment.responses.forEach(r => {
            const q = r.question as any;
            if (!q) return;

            // --- 1. VALUE NORMALIZATION (1-6 SCALE) ---
            let rawVal = (r as any).answer || (r as any).value || 0;
            rawVal = Number(rawVal);
            if (isNaN(rawVal) || !isFinite(rawVal)) rawVal = 3.5; // Midpoint 1-6 is 3.5

            // INVERSÃO: Escala 1 a 6. Inverso = 7 - valor.
            const finalValue = q.isReverse ? (7 - rawVal) : rawVal;
            const weight = q.weight || 1;

            if (isNaN(finalValue) || !isFinite(finalValue)) return;


            // --- 2. IDENTIFY HIERARCHY (Trait -> Facet) ---

            // Determine Parent Trait Key
            let traitKey: string | null = null;
            if (q.traitKey) {
                const nKey = normalizeKey(q.traitKey);
                if (configKeyMap[nKey]) traitKey = configKeyMap[nKey];
                else traitKey = nKey; // Fallback to raw if not in config
            }

            // TalkingTo Safe Mapping (If explicit map missing)
            if (!traitKey) {
                const textToSearch = (q.traitKey || q.questionTrait || q.concept || '').toUpperCase();
                if (textToSearch.includes('EXTROVER') || textToSearch.includes('SOCIAL') || textToSearch.includes('FALANTE')) traitKey = 'EXTRAVERSION';
                else if (textToSearch.includes('AMABIL') || textToSearch.includes('AGRE') || textToSearch.includes('COLAB')) traitKey = 'AGREEABLENESS';
                else if (textToSearch.includes('CONSC') || textToSearch.includes('ESTRUT') || textToSearch.includes('ORGANIZ')) traitKey = 'CONSCIENTIOUSNESS';
                else if (textToSearch.includes('ABERT') || textToSearch.includes('OPEN') || textToSearch.includes('IMAGIN')) traitKey = 'OPENNESS';
                else if (textToSearch.includes('ESTAB') || textToSearch.includes('NEUR') || textToSearch.includes('EMOC')) traitKey = 'NEUROTICISM';

                // Normalize to Config Key if possible
                if (traitKey && configKeyMap[traitKey]) traitKey = configKeyMap[traitKey];
            }

            // Determine Facet/Subtrait Key
            // Priorities: facetKey > subtrait > concept
            let facetIdentifier = q.facetKey || q.subtrait || q.concept;
            let facetCleanKey = cleanString(facetIdentifier);

            if (facetCleanKey) {
                // Initialize if not exists
                if (!facetAccumulator[facetCleanKey]) {
                    facetAccumulator[facetCleanKey] = {
                        sum: 0,
                        weightSum: 0,
                        count: 0,
                        name: facetIdentifier, // Use raw name initially
                        traitKey: traitKey // Associate with determined trait
                    };
                } else {
                    // Update trait linkage if we found a strong traitMatch now and it was null before
                    if (traitKey && !facetAccumulator[facetCleanKey].traitKey) {
                        facetAccumulator[facetCleanKey].traitKey = traitKey;
                    }
                }

                // Add to Facet Accumulator (Weighted Average Logic)
                const acc = facetAccumulator[facetCleanKey];
                acc.sum += finalValue * weight;
                acc.weightSum += weight;
                acc.count++;
            }

            // --- Legacy Metadata Maps (Just for reporting, not core calc) ---
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
        });

        // 6. Calculate Facet Scores & Aggregators
        // Structure: Trait -> [FacetScores]
        const traitFacetsMap: Record<string, number[]> = {};
        const finalScores: Record<string, ScoreResult> = {};

        // Initialize Big 5 Slots in FinalScores
        Object.values(configKeyMap).forEach(k => {
            finalScores[k] = {
                traitKey: k,
                traitName: traitNameTranslation[k] || k, // Better defaults needed?
                score: 0,
                normalizedScore: 0,
                level: 'AVERAGE',
                interpretation: '',
                facets: []
            };
            traitFacetsMap[k] = []; // Array to hold Avg Score of each facet
        });

        // 6.1 Process Facets -> Calculate Avg -> Push to Parent Trait
        Object.keys(facetAccumulator).forEach(fKey => {
            const data = facetAccumulator[fKey];
            // Calc Weighted Avg for this Facet
            // Result is on 1-6 scale still
            const facetAvg = data.weightSum > 0 ? (data.sum / data.weightSum) : 0;

            // Normalize (Percentage) for reporting
            const facetNorm = this.normalizeScore(facetAvg);

            // Add this facet's RAW avg to the parent trait list
            if (data.traitKey && finalScores[data.traitKey]) {
                traitFacetsMap[data.traitKey].push(facetNorm); // Pushing NORMALIZED score to average them directly as percentages?
                // Specialist Rule: "O resultado do traço maior deve ser a média simples das pontuações obtidas nos seus respectivos subtraços".
                // If we average the Normalized Scores (0-100), the result is also 0-100. correct.

                // Add to facets list for output
                finalScores[data.traitKey].facets?.push({
                    facetKey: fKey,
                    facetName: data.name,
                    score: facetNorm,
                    rawScore: facetAvg
                });
            } else {
                // Orphaned facet? Check if it belongs to Big 5 via static map
                // Doing late binding if needed, but for now we skip invalid metadata
            }
        });

        // 6.2 Calculate Trait Scores (Simple Average of Facet SCORES)
        Object.keys(finalScores).forEach(tKey => {
            const facetScoresList = traitFacetsMap[tKey];
            let traitFinalPct = 0;

            if (facetScoresList.length > 0) {
                // Rule: Simple Average of Subtraits
                const sum = facetScoresList.reduce((a, b) => a + b, 0);
                traitFinalPct = sum / facetScoresList.length;
            } else {
                // Fallback: If no sub-traits defined/found, use raw question average?
                // In this strict mode, result is 0 if no facets found.
                // However, likely we want to fallback to direct question average if "Facets" concept is missing
                // BUT per instructions "Flexible Questions... Subtrait". Assuming Subtraits ALWAYS exist.
                // If they don't, we should look at 'concept' or 'subtrait' field in questions.
                // If questions have NO grouping, this logic yields 0.

                // Safety: If 0 and we have questions that mapped to this trait but somehow didn't create a facet entry?
                // (Unlikely with Phase 2 logic above)
            }

            traitFinalPct = Math.round(traitFinalPct);

            finalScores[tKey].score = traitFinalPct; // This is actually the % now
            finalScores[tKey].normalizedScore = traitFinalPct;
            finalScores[tKey].level = this.determineLevel(traitFinalPct, config);

            // Config text lookup
            const traitConfig = config.traits?.find((t: any) => t.traitKey === tKey) || {};
            finalScores[tKey].interpretation = this.getInterpretation(finalScores[tKey].level, traitConfig);

            // Label
            let levelLabel = '';
            switch (finalScores[tKey].level) {
                case 'VERY_LOW': levelLabel = config.veryLowLabel || 'Muito Baixo'; break;
                case 'LOW': levelLabel = config.lowLabel || 'Baixo'; break;
                case 'AVERAGE': levelLabel = config.averageLabel || 'Médio'; break;
                case 'HIGH': levelLabel = config.highLabel || 'Alto'; break;
                case 'VERY_HIGH': levelLabel = config.veryHighLabel || 'Muito Alto'; break;
            }
            finalScores[tKey].levelLabel = levelLabel;
        });

        // 7. Auxiliary Outputs (Metadata Scores)
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
            scores: finalScores,
            conceptScores: processMap(conceptMap),
            subtraitScores: processMap(subtraitMap),
            dichotomyScores: processMap(dichotomyMap),
            config
        };
    }

    private normalizeScore(rawScore: number): number {
        // SCALE 1 to 6
        // Min 1, Max 6. Range = 5.
        // Formula: (Val - 1) / 5 * 100

        if (typeof rawScore !== 'number' || isNaN(rawScore) || !isFinite(rawScore)) return 0;
        if (rawScore < 1) rawScore = 1; // Clamp bottom
        if (rawScore > 6) rawScore = 6; // Clamp top? Or allow overflow? Usually clamp.

        const norm = ((rawScore - 1) / 5) * 100;
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

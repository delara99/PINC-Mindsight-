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
        const configKeyMap: Record<string, string> = {}; // Normalized -> Runtime Key

        const facetScores: Record<string, {
            score: number;
            total: number;
            rawScoreSum: number;
            count: number;
            name: string;
            traitKey: string
        }> = {};
        const facetNameMap: Record<string, string> = {};

        // INITIALIZE SCORES FROM CONFIG
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

                if (t.facets) {
                    t.facets.forEach(f => {
                        facetScores[f.facetKey] = {
                            score: 0,
                            total: 0,
                            rawScoreSum: 0,
                            count: 0,
                            name: f.name,
                            traitKey: t.traitKey
                        };
                        const cleanName = cleanString(f.name);
                        if (cleanName) facetNameMap[cleanName] = f.facetKey;
                        facetNameMap[cleanString(f.facetKey)] = f.facetKey;
                    });
                }
            });
        }

        // ENSURE ALL BIG 5 KEYS EXIST (Fallback if config improperly incomplete)
        ['EXTRAVERSION', 'AGREEABLENESS', 'CONSCIENTIOUSNESS', 'OPENNESS', 'NEUROTICISM'].forEach(stdKey => {
            if (!configKeyMap[stdKey]) {
                // If missing, add it to 'scores' using standard key
                scores[stdKey] = {
                    traitKey: stdKey,
                    traitName: stdKey, // Ideally translate but English is minimal safety
                    score: 0,
                    normalizedScore: 0,
                    level: 'AVERAGE',
                    interpretation: 'Médio',
                    facets: []
                };
                configKeyMap[stdKey] = stdKey;
            }
        });

        // 4.1 Concept Mapping Setup
        const conceptTraitMap = new Map<string, string>(); // CleanConcept -> NormalizedTrait

        // Static Mapping for TalkingTo
        const STATIC_CONCEPT_MAP: Record<string, string> = {
            'comunicacao': 'EXTRAVERSION',
            'interacao social': 'EXTRAVERSION',
            'autoridade': 'EXTRAVERSION',
            'orientacao para acao': 'EXTRAVERSION',
            'ouvinte-falante': 'EXTRAVERSION',
            'seletivo-sociavel': 'EXTRAVERSION',
            'contido-afirmativo': 'EXTRAVERSION',
            'reflexivo-ativo': 'EXTRAVERSION',

            'logica': 'AGREEABLENESS',
            'independencia pessoal': 'AGREEABLENESS',
            'competitividade': 'AGREEABLENESS',
            'critico-tolerante': 'AGREEABLENESS',
            'independente-conectado': 'AGREEABLENESS',
            'competitivo-colaborativo': 'AGREEABLENESS',

            'estilo de planejamento': 'CONSCIENTIOUSNESS',
            'disciplina': 'CONSCIENTIOUSNESS',
            'persistencia': 'CONSCIENTIOUSNESS',
            'aventureiro-planejado': 'CONSCIENTIOUSNESS',
            'espontaneo-disciplinado': 'CONSCIENTIOUSNESS',
            'flexivel-persistente': 'CONSCIENTIOUSNESS',

            'imaginacao': 'OPENNESS',
            'intelectualidade': 'OPENNESS',
            'abertura ao novo': 'OPENNESS',
            'realista-imaginativo': 'OPENNESS',
            'pratico-conceitual': 'OPENNESS',
            'conservador-aberto': 'OPENNESS',

            'confianca': 'NEUROTICISM',
            'autoconfianca': 'NEUROTICISM',
            'temperamento': 'NEUROTICISM',
            'controlado': 'NEUROTICISM',
            'inquieto-despreocupado': 'NEUROTICISM',
            'inseguro-autoconfiante': 'NEUROTICISM',
            'irritavel-paciente': 'NEUROTICISM',
            'reativo-controlado': 'NEUROTICISM'
        };

        // Populate map from Static
        Object.entries(STATIC_CONCEPT_MAP).forEach(([k, v]) => {
            conceptTraitMap.set(k, v);
        });


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

            // --- Determine Trait ---
            let targetKey: string | null = null;
            if (q.traitKey) {
                const norm = normalizeKey(q.traitKey);
                if (configKeyMap[norm]) targetKey = configKeyMap[norm];
            }
            if (!targetKey && (q.questionTrait || q.dichotomy)) {
                const inferred = mapQuestionTraitToKey(q.questionTrait || '', q.dichotomy || '');
                if (inferred && configKeyMap[inferred]) targetKey = configKeyMap[inferred];
            }

            // Fallback via Concept/Subtrait Map
            if (!targetKey) {
                if (q.concept) {
                    const norm = conceptTraitMap.get(cleanString(q.concept));
                    if (norm && configKeyMap[norm]) targetKey = configKeyMap[norm];
                }
                if (!targetKey && q.subtrait) {
                    const norm = conceptTraitMap.get(cleanString(q.subtrait));
                    if (norm && configKeyMap[norm]) targetKey = configKeyMap[norm];
                }
            }

            if (targetKey) {
                if (scores[targetKey]) {
                    scores[targetKey].score += finalValue * weight;
                    traitTotalPossible[targetKey] = (traitTotalPossible[targetKey] || 0) + (5 * weight);
                }
                // Dynamic Learning (if question has traitKey, reinforce map)
                // Note: We prioritize Static map for safety, but can add if missing
                // ...
            }

            // --- Facets Logic ---
            let fKey: string | null = q.facetKey || null;
            if (!fKey && q.subtrait) fKey = facetNameMap[cleanString(q.subtrait)] || null;
            if (!fKey && q.concept) fKey = facetNameMap[cleanString(q.concept)] || null;

            if (fKey && facetScores[fKey]) {
                facetScores[fKey].score += finalValue * weight;
                facetScores[fKey].total += (5 * weight);
                facetScores[fKey].rawScoreSum += finalValue;
                facetScores[fKey].count++;
            }

            // --- TalkingTo Accumulation ---
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

        // 6. Finalize & Normalize
        Object.keys(scores).forEach(key => {
            const totalPossible = traitTotalPossible[key] || 1;
            const accumulated = scores[key].score;
            let percent = (accumulated / totalPossible) * 100;
            percent = Math.min(100, Math.max(0, percent));

            scores[key].normalizedScore = Math.round(percent);
            scores[key].level = this.determineLevel(percent, config);

            // Text Interpretation
            const traitConfig = config.traits?.find(t => t.traitKey === key) || {};
            scores[key].interpretation = this.getInterpretation(scores[key].level, traitConfig);

            // Label
            let levelLabel = '';
            switch (scores[key].level) {
                case 'VERY_LOW': levelLabel = config.veryLowLabel || 'Muito Baixo'; break;
                case 'LOW': levelLabel = config.lowLabel || 'Baixo'; break;
                case 'AVERAGE': levelLabel = config.averageLabel || 'Médio'; break;
                case 'HIGH': levelLabel = config.highLabel || 'Alto'; break;
                case 'VERY_HIGH': levelLabel = config.veryHighLabel || 'Muito Alto'; break;
            }
            scores[key].levelLabel = levelLabel;

            // --- Populate Facets from Accumulator ---
            // If explicit facets existed
            const facets = scores[key].facets || [];
            // Try to find matching config trait
            const tConf = config.traits?.find(t => t.traitKey === key);
            if (tConf && tConf.facets) {
                tConf.facets.forEach(f => {
                    const fData = facetScores[f.facetKey];
                    if (fData) {
                        // Check if already in list (it shouldn't be yet)
                        if (!facets.find(x => x.facetKey === f.facetKey)) {
                            let fPct = fData.total > 0 ? (fData.score / fData.total) * 100 : 0;
                            fPct = Math.round(Math.max(0, Math.min(100, fPct)));
                            const fRaw = fData.count > 0 ? (fData.rawScoreSum / fData.count) : 0;
                            facets.push({
                                facetKey: f.facetKey,
                                facetName: f.name,
                                score: fPct,
                                rawScore: fRaw
                            });
                        }
                    }
                });
            }
            scores[key].facets = facets;
        });

        // 7. SAFETY NET: Inject Concepts as Facets
        conceptMap.forEach((val, k) => {
            // Find Normalized Trait for this concept
            const normTrait = conceptTraitMap.get(k);
            if (normTrait) {
                // Find Runtime Trait
                const targetKey = configKeyMap[normTrait];
                if (targetKey && scores[targetKey]) {
                    const s = scores[targetKey];
                    if (!s.facets) s.facets = [];

                    const existing = s.facets.find(f => cleanString(f.facetName) === k || cleanString(f.facetKey) === k);

                    const avg = val.weightSum > 0 ? val.sum / val.weightSum : 0;
                    const norm = this.normalizeScore(avg);
                    const raw = avg;

                    if (existing) {
                        if (existing.score === 0 && existing.rawScore === 0) {
                            existing.score = norm;
                            existing.rawScore = raw;
                        }
                    } else {
                        s.facets.push({
                            facetKey: `concept_${k}`,
                            facetName: val.originalName,
                            score: norm,
                            rawScore: raw
                        });
                    }
                }
            }
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

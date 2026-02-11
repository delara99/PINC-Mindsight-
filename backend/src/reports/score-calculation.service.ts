import { Injectable, Logger } from '@nestjs/common';
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
    private readonly logger = new Logger(ScoreCalculationService.name);

    constructor(private prisma: PrismaService) { }

    async calculateScores(assignmentId: string): Promise<{
        scores: Record<string, ScoreResult>;
        conceptScores: Record<string, any>;
        subtraitScores: Record<string, any>;
        dichotomyScores: Record<string, any>;
        config: any;
    }> {
        this.logger.log(`Calculando scores para assignment: ${assignmentId} usando Motor de Cálculo Dinâmico`);

        // 1. Fetch Assignment & Data
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: true,
                assessment: {
                    include: {
                        questions: {
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }
            }
        });

        if (!assignment) throw new Error('Assignment não encontrado');

        // Mapear UUID da questão para índice sequencial (1 a N)
        // Isso é necessário porque o AssessmentResponse usa UUID (string) mas o Calculation Engine usa sequence ID (int)
        const questionIdToSequence = new Map<string, number>();
        if (assignment.assessment?.questions) {
            assignment.assessment.questions.forEach((q, index) => {
                questionIdToSequence.set(q.id, index + 1);
            });
        }

        // 2. Fetch Calculation Engine Configs (Mappings & Classifications)
        const [mappings, classifications] = await Promise.all([
            this.prisma.calculationQuestionMapping.findMany({
                where: { isActive: true }
            }),
            this.prisma.calculationClassification.findMany({
                where: { isActive: true },
                orderBy: { priority: 'asc' }
            })
        ]);

        if (mappings.length === 0) {
            this.logger.warn('Nenhum mapeamento de questão encontrado no Motor de Cálculo!');
        }

        // 3. Process Responses & Normalize
        const normalizedResponses: Record<string, number> = {}; // QuestionSequence (String key) -> Normalized Value (0-100)

        assignment.responses.forEach(r => {
            const qUUID = r.questionId;
            const qSeq = questionIdToSequence.get(qUUID);

            if (!qSeq) {
                // Se o mapeamento de ID para sequência falhar (ex: questão deletada), ignora
                return;
            }

            // Correção de Tipo: API retorna 'answer', não 'value'
            let rawVal = r.answer || 0;

            // Validação básica de range 1-6
            if (rawVal < 1) rawVal = 1;
            if (rawVal > 6) rawVal = 6;

            const mapping = mappings.find(m => m.questionId === qSeq);

            if (mapping && mapping.isReversed) {
                // Inversão: 7 - valor (para escala 1-6)
                const inverted = 7 - rawVal;
                // Normalização: (val - 1) / 5 * 100
                normalizedResponses[qSeq.toString()] = Math.round(((inverted - 1) / 5) * 100);
            } else {
                // Normalização direta
                normalizedResponses[qSeq.toString()] = Math.round(((rawVal - 1) / 5) * 100);
            }
        });

        // 4. Calculate Facet Scores (Weighted Average)
        interface FacetCalc {
            dimension: string;
            score: number;
            sum: number;
            weightSum: number;
            count: number;
        }
        const facetScores: Record<string, FacetCalc> = {};

        mappings.forEach(mapping => {
            const qSeq = mapping.questionId;
            const normVal = normalizedResponses[qSeq.toString()];

            // Se não tem resposta para esta questão mapeada, ignoramos
            if (normVal === undefined) return;

            const facetKey = `${mapping.dimension}_${mapping.facet}`;

            if (!facetScores[facetKey]) {
                facetScores[facetKey] = {
                    dimension: mapping.dimension,
                    score: 0,
                    sum: 0,
                    weightSum: 0,
                    count: 0
                };
            }

            facetScores[facetKey].sum += normVal * mapping.weight;
            facetScores[facetKey].weightSum += mapping.weight;
            facetScores[facetKey].count++;
        });

        // Finalizar cálculo de facetas (média ponderada)
        Object.keys(facetScores).forEach(key => {
            const f = facetScores[key];
            if (f.weightSum > 0) {
                f.score = Math.round(f.sum / f.weightSum);
            }
        });

        // 5. Calculate Dimension Scores (Simple Average of Facets)
        const dimensionScores: Record<string, number> = {};

        // Agrupar facetas por dimensão
        const facetsByDimension: Record<string, number[]> = {};

        Object.keys(facetScores).forEach(key => {
            const f = facetScores[key];
            if (!facetsByDimension[f.dimension]) {
                facetsByDimension[f.dimension] = [];
            }
            facetsByDimension[f.dimension].push(f.score);
        });

        // Calcular média das facetas para cada dimensão
        Object.keys(facetsByDimension).forEach(dim => {
            const scores = facetsByDimension[dim];
            if (scores.length > 0) {
                const sum = scores.reduce((a, b) => a + b, 0);
                dimensionScores[dim] = Math.round(sum / scores.length);
            } else {
                dimensionScores[dim] = 0;
            }
        });

        // 6. Formatar Saída (Scores + Classificação)
        const finalScores: Record<string, ScoreResult> = {};

        const dimensionNames: Record<string, string> = {
            'O': 'CONCRETO-ABSTRATO',       // Was: Abertura à Experiência
            'C': 'ADAPTÁVEL-ESTRUTURADO',   // Was: Conscienciosidade
            'E': 'INTROVERSÃO-EXTROVERSÃO', // Was: Extroversão
            'A': 'LÓGICO-SENTIMENTAL',      // Was: Amabilidade
            'N': 'EMOÇÃO-RAZÃO'             // Was: Estabilidade Emocional
        };

        const dimensionKeysMap: Record<string, string> = {
            'O': 'OPENNESS',
            'C': 'CONSCIENTIOUSNESS',
            'E': 'EXTRAVERSION',
            'A': 'AGREEABLENESS',
            'N': 'NEUROTICISM'
        };

        Object.keys(dimensionScores).forEach(dimKey => {
            const score = dimensionScores[dimKey];
            // Mapeia O->OPENNESS, etc.
            const fullKey = dimensionKeysMap[dimKey] || dimKey;

            const classification = classifications.find(c =>
                c.dimension === fullKey &&
                score >= c.minScore &&
                score <= c.maxScore
            );

            const level = (classification?.level as any) || 'AVERAGE';
            const label = classification?.label || 'Médio';

            // Recuperar e Limpar Facetas desta dimensão (Deduplicação + Tradução Backend)
            const facetMap = new Map<string, { name: string, scoreSum: number, count: number, rawSum: number }>();

            // Mapeamento DEFINITIVO para Planilha PINC (IPIP Keys -> Planilha Keys)
            const translationMap: Record<string, string> = {
                // EMOÇÃO-RAZÃO (N)
                'anxiety': 'inquieto-despreocupado', 'ansiedade': 'inquieto-despreocupado', 'factors_anxiety': 'inquieto-despreocupado',
                'confidence': 'inquieto-despreocupado', 'confianca': 'inquieto-despreocupado',
                'depression': 'inseguro-autoconfiante', 'depressao': 'inseguro-autoconfiante', 'factors_depression': 'inseguro-autoconfiante',
                'selfconsciousness': 'inseguro-autoconfiante', // Aproximação se usado
                'anger': 'irritável-tranquilo', 'raiva': 'irritável-tranquilo', 'hostility': 'irritável-tranquilo', 'hostilidade': 'irritável-tranquilo', 'factors_angryhostility': 'irritável-tranquilo',
                'impulsiveness': 'reativo-controlado', 'impulsividade': 'reativo-controlado', 'factors_impulsiveness': 'reativo-controlado',
                'vulnerability': 'reativo-controlado', 'vulnerabilidade': 'reativo-controlado', 'factors_vulnerability': 'reativo-controlado',
                'moderation': 'reativo-controlado',

                // INTROVERSÃO-EXTROVERSÃO (E)
                'warmth': 'ouvinte-falante', 'acolhimento': 'ouvinte-falante', 'factors_warmth': 'ouvinte-falante', 'friendliness': 'ouvinte-falante',
                'gregariousness': 'seletivo-interativo', 'gregarismo': 'seletivo-interativo', 'factors_gregariousness': 'seletivo-interativo', 'social': 'seletivo-interativo',
                'assertiveness': 'contido-afirmativo', 'assertividade': 'contido-afirmativo', 'factors_assertiveness': 'contido-afirmativo', 'autoridade': 'contido-afirmativo',
                'activity': 'reflexivo-ativo', 'atividade': 'reflexivo-ativo', 'factors_activity': 'reflexivo-ativo', 'niveldeatividade': 'reflexivo-ativo', 'orientacao': 'reflexivo-ativo',

                // CONCRETO-ABSTRATO (O)
                'fantasy': 'realista-imaginativo', 'fantasia': 'realista-imaginativo', 'factors_fantasy': 'realista-imaginativo', 'imagination': 'realista-imaginativo',
                'aesthetics': 'prático-conceitual', 'estetica': 'prático-conceitual', 'factors_aesthetics': 'prático-conceitual', // Se usado como Proxy
                'intellect': 'prático-conceitual', 'intelecto': 'prático-conceitual', 'ideas': 'prático-conceitual', 'ideias': 'prático-conceitual', 'factors_ideas': 'prático-conceitual',
                'liberalism': 'conservador-aberto', 'liberalismo': 'conservador-aberto', 'values': 'conservador-aberto', 'valores': 'conservador-aberto', 'factors_values': 'conservador-aberto', 'abertura': 'conservador-aberto',
                'feelings': 'sentimentos', 'actions': 'ações', // Sobras IPIP

                // LÓGICO-SENTIMENTAL (A)
                'trust': 'confiança', // Sobra IPIP
                'straightforwardness': 'crítico-tolerante', 'franqueza': 'crítico-tolerante', 'factors_straightforwardness': 'crítico-tolerante', 'morality': 'crítico-tolerante', 'moralidade': 'crítico-tolerante',
                'altruism': 'independente-conectado', 'altruismo': 'independente-conectado', 'factors_altruism': 'independente-conectado',
                'compliance': 'competitivo-colaborativo', 'complacencia': 'competitivo-colaborativo', 'factors_compliance': 'competitivo-colaborativo', 'cooperation': 'competitivo-colaborativo', 'cooperacao': 'competitivo-colaborativo', 'factors_cooperation': 'competitivo-colaborativo',
                'modesty': 'modéstia', 'tendermindedness': 'sensibilidade',

                // ADAPTÁVEL-ESTRUTURADO (C)
                'competence': 'competência', // Sobra?
                'deliberation': 'aventureiro-planejado', 'deliberacao': 'aventureiro-planejado', 'factors_deliberation': 'aventureiro-planejado', 'cautiousness': 'aventureiro-planejado', 'ponderacao': 'aventureiro-planejado',
                'selfdiscipline': 'espontâneo-disciplinado', 'autodisciplina': 'espontâneo-disciplinado', 'factors_selfdiscipline': 'espontâneo-disciplinado', 'disciplina': 'espontâneo-disciplinado',
                'achievementstriving': 'flexível-persistente', 'realizacao': 'flexível-persistente', 'factors_achievementstriving': 'flexível-persistente', 'persistence': 'flexível-persistente', 'persistencia': 'flexível-persistente', 'achievement': 'flexível-persistente',
                'order': 'ordem', 'dutifulness': 'dever'
            };

            Object.keys(facetScores)
                .filter(fk => facetScores[fk].dimension === dimKey)
                .forEach(fk => {
                    const rawNameComp = fk.split('_')[1] || fk; // Ex: O_Fantasia -> Fantasia
                    const nameKey = rawNameComp.toLowerCase().replace(/[^a-z]/g, '');
                    const translatedName = translationMap[nameKey] || rawNameComp; // Fallback para nome original

                    if (!facetMap.has(translatedName)) {
                        facetMap.set(translatedName, {
                            name: translatedName,
                            scoreSum: 0,
                            count: 0,
                            rawSum: 0
                        });
                    }

                    const entry = facetMap.get(translatedName);
                    if (entry) {
                        entry.scoreSum += facetScores[fk].score;
                        entry.rawSum += facetScores[fk].sum;
                        entry.count++;
                    }
                });

            // Gerar lista final única e com média dos duplicados (se houver)
            const relevantFacets = Array.from(facetMap.values()).map(entry => ({
                facetKey: entry.name, // Usamos o nome traduzido como chave para consistência
                facetName: entry.name,
                score: Math.round(entry.scoreSum / entry.count),
                rawScore: Math.round(entry.rawSum / entry.count)
            }));

            finalScores[fullKey] = {
                traitKey: fullKey,
                traitName: dimensionNames[dimKey] || dimKey,
                score: score,
                normalizedScore: score,
                level: level,
                levelLabel: label,
                interpretation: classification?.description || '',
                facets: relevantFacets
            };
        });

        return {
            scores: finalScores,
            conceptScores: {},
            subtraitScores: {},
            dichotomyScores: {},
            config: {
                mappingsCount: mappings.length,
                classificationsCount: classifications.length
            }
        };
    }
}

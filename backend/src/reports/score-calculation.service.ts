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
    private formulaCache: Map<string, any> = new Map();

    constructor(private prisma: PrismaService) { }

    /**
     * Busca fórmulas do banco de dados (com cache)
     * Sistema 100% dinâmico - Admin controla tudo pela interface
     */
    private async getFormula(name: string): Promise<any> {
        if (this.formulaCache.has(name)) {
            return this.formulaCache.get(name);
        }

        const formula = await this.prisma.calculationFormula.findUnique({
            where: { name, isActive: true }
        });

        if (formula) {
            this.formulaCache.set(name, formula);
        }

        return formula;
    }

    /**
     * Aplica mapeamento de valores (1-4 → 0.05, 1, 2, 2.95)
     */
    private applyValueMapping(rawValue: number, formula: any): number {
        if (!formula || !formula.formula.mapping) {
            return rawValue;
        }

        const mapping = formula.formula.mapping;
        return mapping[rawValue] || rawValue;
    }

    /**
     * Aplica inversão (3 - valor ou 7 - valor)
     */
    private applyReverse(value: number, formula: any): number {
        if (!formula) return value;

        const maxScale = formula.formula.maxScale || 3;
        return maxScale - value;
    }

    /**
     * Aplica normalização (valor / divisor * 100)
     */
    private applyNormalization(value: number, formula: any): number {
        if (!formula) return value;

        const divisor = formula.formula.divisor || 3;
        const multiplier = formula.formula.multiplier || 100;
        return (value / divisor) * multiplier;
    }


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
        // SISTEMA DINÂMICO: Busca fórmulas do banco de dados (Admin controla tudo!)
        const normalizedResponses: Record<string, number> = {}; // QuestionSequence (String key) -> Normalized Value (0-100)

        // Carregar fórmulas do banco (uma vez, com cache)
        const valueMappingFormula = await this.getFormula('VALUE_MAPPING_1_4_SPECIALIST');
        const reverseFormula = await this.getFormula('REVERSE_SCORING_1_4_SPECIALIST');
        const normalizationFormula = await this.getFormula('NORMALIZATION_1_4_TO_0_100_SPECIALIST');


        assignment.responses.forEach(r => {
            const qUUID = r.questionId;
            const qSeq = questionIdToSequence.get(qUUID);

            if (!qSeq) {
                // Se o mapeamento de ID para sequência falhar (ex: questão deletada), ignora
                return;
            }

            // Correção de Tipo: API retorna 'answer', não 'value'
            let rawVal = r.answer || 0;

            const mapping = mappings.find(m => m.questionId === qSeq);

            // ============================================================================
            // DETECÇÃO AUTOMÁTICA DE ESCALA (1-4 vs 1-6)
            // ============================================================================
            // Se resposta é 1-4: usa NOVA FÓRMULA (Especialista)
            // Se resposta é 5-6: usa FÓRMULA ANTIGA (compatibilidade)
            // ============================================================================

            if (rawVal >= 1 && rawVal <= 4) {
                // ========================================================================
                // NOVA FÓRMULA (Escala 1-4) - DINÂMICA DO BANCO DE DADOS
                // Admin controla os valores pela interface!
                // ========================================================================

                // Validação de range
                if (rawVal < 1) rawVal = 1;
                if (rawVal > 4) rawVal = 4;

                // 1. Aplicar mapeamento de valores (DINÂMICO - do banco de dados)
                let normalizedValue = this.applyValueMapping(rawVal, valueMappingFormula);

                // 2. Aplicar inversão se necessário (DINÂMICO - do banco de dados)
                if (mapping && mapping.isReversed && reverseFormula) {
                    normalizedValue = this.applyReverse(normalizedValue, reverseFormula);
                }

                // 3. Normalizar para 0-100 (DINÂMICO - do banco de dados)
                if (normalizationFormula) {
                    normalizedResponses[qSeq.toString()] = Math.round(
                        this.applyNormalization(normalizedValue, normalizationFormula)
                    );
                } else {
                    // Fallback se fórmula não existir no banco
                    normalizedResponses[qSeq.toString()] = Math.round((normalizedValue / 3) * 100);
                }

            } else {
                // ========================================================================
                // FÓRMULA ANTIGA (Escala 1-6) - COMPATIBILIDADE COM TESTES ANTIGOS
                // ========================================================================

                // Validação de range
                if (rawVal < 1) rawVal = 1;
                if (rawVal > 6) rawVal = 6;

                if (mapping && mapping.isReversed) {
                    // Inversão: 7 - valor (para escala 1-6)
                    const inverted = 7 - rawVal;
                    // Normalização: (val - 1) / 5 * 100
                    normalizedResponses[qSeq.toString()] = Math.round(((inverted - 1) / 5) * 100);
                } else {
                    // Normalização direta
                    normalizedResponses[qSeq.toString()] = Math.round(((rawVal - 1) / 5) * 100);
                }
            }
        });

        // 4. Calculate Facet Scores (MÉDIA SIMPLES - conforme especificação do especialista)
        interface FacetCalc {
            dimension: string;
            score: number;
            sum: number;
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
                    count: 0
                };
            }

            // MÉDIA SIMPLES: soma valores sem considerar pesos
            facetScores[facetKey].sum += normVal;
            facetScores[facetKey].count++;
        });

        // Finalizar cálculo de facetas (média simples)
        Object.keys(facetScores).forEach(key => {
            const f = facetScores[key];
            if (f.count > 0) {
                f.score = Math.round(f.sum / f.count);
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

        Object.keys(dimensionScores).forEach(dimKey => {
            const score = dimensionScores[dimKey];
            const fullKey = dimKey; // Chave original do Banco (PT) - Ex: CONCRETO-ABSTRATO

            // MAPEAR DE VOLTA PARA INGLÊS (FUZZY MATCHING / PALAVRA-CHAVE)
            // Ignora acentos, hifens e case. Foca na raiz da palavra.
            const k = fullKey.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let englishKey = fullKey; // Fallback

            // Lógica de Detecção Robusta
            if (k.includes('CONCRETO') || k.includes('ABSTRATO') || k.includes('OPENNESS')) englishKey = 'OPENNESS';
            else if (k.includes('ADAPTAVEL') || k.includes('ESTRUTURADO') || k.includes('CONSCIENTIOUSNESS')) englishKey = 'CONSCIENTIOUSNESS';
            else if (k.includes('INTROVERSAO') || k.includes('EXTROVERSAO') || k.includes('EXTRAVERSION')) englishKey = 'EXTRAVERSION';
            else if (k.includes('LOGICO') || k.includes('SENTIMENTAL') || k.includes('AGREEABLENESS')) englishKey = 'AGREEABLENESS';
            else if (k.includes('EMOCAO') || k.includes('RAZAO') || k.includes('NEUROTICISM') || k.includes('ESTABILIDADE')) englishKey = 'NEUROTICISM';

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
            // Inclui TODAS as variações possíveis: inglês, português, com/sem acentos, maiúsculas, etc
            const translationMap: Record<string, string> = {
                // EMOÇÃO-RAZÃO (N)
                'anxiety': 'inquieto-despreocupado', 'ansiedade': 'inquieto-despreocupado', 'factors_anxiety': 'inquieto-despreocupado',
                'confidence': 'inquieto-despreocupado', 'confianca': 'inquieto-despreocupado', 'autoconfianca': 'inseguro-autoconfiante',
                'depression': 'inseguro-autoconfiante', 'depressao': 'inseguro-autoconfiante', 'factors_depression': 'inseguro-autoconfiante',
                'selfconsciousness': 'inseguro-autoconfiante',
                'anger': 'irritável-tranquilo', 'raiva': 'irritável-tranquilo', 'hostility': 'irritável-tranquilo', 'hostilidade': 'irritável-tranquilo', 'factors_angryhostility': 'irritável-tranquilo',
                'impulsiveness': 'reativo-controlado', 'impulsividade': 'reativo-controlado', 'factors_impulsiveness': 'reativo-controlado',
                'vulnerability': 'reativo-controlado', 'vulnerabilidade': 'reativo-controlado', 'factors_vulnerability': 'reativo-controlado',
                'moderation': 'reativo-controlado',

                // INTROVERSÃO-EXTROVERSÃO (E)
                'warmth': 'ouvinte-falante', 'acolhimento': 'ouvinte-falante', 'factors_warmth': 'ouvinte-falante', 'friendliness': 'ouvinte-falante',
                'gregariousness': 'seletivo-interativo', 'gregarismo': 'seletivo-interativo', 'factors_gregariousness': 'seletivo-interativo', 'social': 'seletivo-interativo',
                'assertiveness': 'contido-afirmativo', 'assertividade': 'contido-afirmativo', 'factors_assertiveness': 'contido-afirmativo', 'autoridade': 'contido-afirmativo',
                'activity': 'reflexivo-ativo', 'atividade': 'reflexivo-ativo', 'factors_activity': 'reflexivo-ativo', 'niveldeatividade': 'reflexivo-ativo', 'orientacao': 'reflexivo-ativo',
                'excitement': 'reflexivo-ativo', 'emocoes': 'reflexivo-ativo', 'buscadeemocoes': 'reflexivo-ativo',
                'cheerfulness': 'ouvinte-falante', 'alegria': 'ouvinte-falante',

                // CONCRETO-ABSTRATO (O)
                'fantasy': 'realista-imaginativo', 'fantasia': 'realista-imaginativo', 'factors_fantasy': 'realista-imaginativo', 'imagination': 'realista-imaginativo', 'imaginacao': 'realista-imaginativo',
                'aesthetics': 'prático-conceitual', 'estetica': 'prático-conceitual', 'factors_aesthetics': 'prático-conceitual',
                'intellect': 'prático-conceitual', 'intelecto': 'prático-conceitual', 'ideas': 'prático-conceitual', 'ideias': 'prático-conceitual', 'factors_ideas': 'prático-conceitual',
                'liberalism': 'conservador-aberto', 'liberalismo': 'conservador-aberto', 'values': 'conservador-aberto', 'valores': 'conservador-aberto', 'factors_values': 'conservador-aberto', 'abertura': 'conservador-aberto',
                'feelings': 'conservador-aberto', 'sentimentos': 'conservador-aberto', 'actions': 'realista-imaginativo', 'acoes': 'realista-imaginativo',
                'opinioes': 'conservador-aberto', 'opiniao': 'conservador-aberto',

                // LÓGICO-SENTIMENTAL (A)
                'trust': 'crítico-tolerante',
                'straightforwardness': 'crítico-tolerante', 'franqueza': 'crítico-tolerante', 'factors_straightforwardness': 'crítico-tolerante', 'morality': 'crítico-tolerante', 'moralidade': 'crítico-tolerante',
                'altruism': 'independente-conectado', 'altruismo': 'independente-conectado', 'factors_altruism': 'independente-conectado',
                'compliance': 'competitivo-colaborativo', 'complacencia': 'competitivo-colaborativo', 'factors_compliance': 'competitivo-colaborativo', 'cooperation': 'competitivo-colaborativo', 'cooperacao': 'competitivo-colaborativo', 'factors_cooperation': 'competitivo-colaborativo',
                'modesty': 'independente-conectado', 'modestia': 'independente-conectado', 'tendermindedness': 'independente-conectado', 'sensibilidade': 'independente-conectado',
                'sympathy': 'independente-conectado', 'simpatia': 'independente-conectado',

                // ADAPTÁVEL-ESTRUTURADO (C)
                'competence': 'aventureiro-planejado', 'competencia': 'aventureiro-planejado',
                'deliberation': 'aventureiro-planejado', 'deliberacao': 'aventureiro-planejado', 'factors_deliberation': 'aventureiro-planejado', 'cautiousness': 'aventureiro-planejado', 'ponderacao': 'aventureiro-planejado',
                'selfdiscipline': 'espontâneo-disciplinado', 'autodisciplina': 'espontâneo-disciplinado', 'factors_selfdiscipline': 'espontâneo-disciplinado', 'disciplina': 'espontâneo-disciplinado',
                'achievementstriving': 'flexível-persistente', 'realizacao': 'flexível-persistente', 'factors_achievementstriving': 'flexível-persistente', 'persistence': 'flexível-persistente', 'persistencia': 'flexível-persistente', 'achievement': 'flexível-persistente',
                'order': 'espontâneo-disciplinado', 'ordem': 'espontâneo-disciplinado', 'dutifulness': 'aventureiro-planejado', 'dever': 'aventureiro-planejado',
                'selfeffic': 'flexível-persistente', 'autoeficacia': 'flexível-persistente'
            };

            Object.keys(facetScores)
                .filter(fk => facetScores[fk].dimension === dimKey)
                .forEach(fk => {
                    const rawNameComp = fk.split('_')[1] || fk; // Ex: O_Fantasia -> Fantasia
                    const nameKey = rawNameComp.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, '');
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
            // APENAS POLOS SEPARADOS - Elimina duplicação
            const relevantFacets = Array.from(facetMap.values()).flatMap(entry => {
                const compositeScore = Math.round(entry.scoreSum / entry.count);
                const compositeRawScore = Math.round(entry.rawSum / entry.count);

                // Separar em polos individuais para TalkingTO
                // Ex: "ouvinte-falante" → "ouvinte" (score) + "falante" (100-score)
                const poles = entry.name.split('-');
                if (poles.length === 2) {
                    const leftPole = {
                        facetKey: poles[0].trim(),
                        facetName: poles[0].trim(),
                        score: compositeScore,
                        rawScore: compositeRawScore
                    };
                    const rightPole = {
                        facetKey: poles[1].trim(),
                        facetName: poles[1].trim(),
                        score: 100 - compositeScore, // Polo oposto
                        rawScore: compositeRawScore
                    };
                    return [leftPole, rightPole]; // APENAS POLOS, SEM COMPOSTO
                }

                // Se não tiver hífen, salva como está (fallback)
                return [{
                    facetKey: entry.name,
                    facetName: entry.name,
                    score: compositeScore,
                    rawScore: compositeRawScore
                }];
            });

            finalScores[englishKey] = {
                traitKey: englishKey,
                traitName: fullKey, // Nome em Português para exibição
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

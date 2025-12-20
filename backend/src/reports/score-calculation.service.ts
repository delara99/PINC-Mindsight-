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
        config: any;
    }> {
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
                user: { select: { tenantId: true } } // Necessário para buscar config fallback
            }
        });

        if (!assignment) throw new Error('Assignment não encontrado');

        // Configuração Ativa
        let config = assignment.config;
        if (!config) {
            config = await this.prisma.bigFiveConfig.findFirst({
                where: {
                    tenantId: assignment.user.tenantId,
                    isActive: true
                },
                include: {
                    traits: {
                        include: { facets: true }
                    }
                }
            });

            // FALLBACK: se não tiver ativa, pega QUALQUER config do tenant
            if (!config) {
                config = await this.prisma.bigFiveConfig.findFirst({
                    where: {
                        tenantId: assignment.user.tenantId
                    },
                    include: {
                        traits: {
                            include: { facets: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            }
        }

        if (!config) throw new Error('Configuração Big Five não encontrada.');

        const scores: Record<string, ScoreResult> = {};

        // 1. Agrupar Respostas (Itens) por Traço e Faceta
        // Mapa: TraitKey -> FacetKey -> { sum: number, weightSum: number, count: number }
        const calculationMap = new Map<string, Map<string, { sum: number, weightSum: number, count: number }>>();

        // Mapa temporário para itens sem faceta (diretos no traço)
        const directTraitItems = new Map<string, { sum: number, weightSum: number, count: number }>();

        // Pré-processar Traits para facilitar lookup
        const activeTraits = config.traits.filter(t => t.isActive !== false); // Default true
        const traitLookup = new Map<string, any>(); // Key/Name -> TraitConfig

        for (const t of activeTraits) {
            const cleanKey = this.cleanString(t.traitKey);
            traitLookup.set(cleanKey, t);
            traitLookup.set(this.cleanString(t.name), t);

            // Inicializar mapas
            calculationMap.set(t.id, new Map<string, any>());
            directTraitItems.set(t.id, { sum: 0, weightSum: 0, count: 0 });

            // Inicializar facetas
            if (t.facets) {
                for (const f of t.facets) {
                    if (f.isActive === false) continue;
                    calculationMap.get(t.id).set(f.id, { sum: 0, weightSum: 0, count: 0 });
                }
            }
        }

        // 2. Processar Respostas
        for (const response of assignment.responses) {
            const q = response.question;
            const answer = typeof response.answer === 'number' ? response.answer : Number(response.answer) || 3;

            // Inversão e Peso (Lógica do Painel)
            // Se isReverse for true, inverte escala 1-5 (1->5, 2->4, 3->3, 4->2, 5->1)
            // Fórmula: 6 - answer
            const finalValue = (q.isReverse) ? (6 - answer) : answer;
            const weight = q.weight || 1.0;

            // Identificar Traço e Faceta
            // Tenta match explícito (facetKey) primeiro, depois traitKey
            let targetTrait: any = null;
            let targetFacet: any = null;

            // Match via facetKey na questão (novo campo) ou traitKey composto "Trait::Facet"
            const qTraitKey = q.traitKey || '';
            const qFacetKey = q.facetKey || '';
            const parts = qTraitKey.split('::');

            // Tentar identificar o Traço
            if (traitLookup.has(this.cleanString(parts[0]))) {
                targetTrait = traitLookup.get(this.cleanString(parts[0]));
            } else if (traitLookup.has(this.cleanString(qTraitKey))) {
                targetTrait = traitLookup.get(this.cleanString(qTraitKey));
            }
            // Fallback Legacy (Amabilidade no DB vs agreeableness na pergunta)
            else {
                const legacyMap: Record<string, string> = {
                    'amabilidade': 'agreeableness',
                    'conscienciosidade': 'conscientiousness',
                    'extroversao': 'extraversion',
                    'abertura a experiencia': 'openness',
                    'estabilidade emocional': 'neuroticismo',
                    'neuroticismo': 'neuroticism'
                };
                const mapped = legacyMap[this.cleanString(parts[0])] || legacyMap[this.cleanString(qTraitKey)];
                if (mapped && traitLookup.has(this.cleanString(mapped))) {
                    targetTrait = traitLookup.get(this.cleanString(mapped));
                }
            }

            if (!targetTrait) continue; // Item órfão ou traço inativo

            // Tentar identificar a Faceta dentro do Traço encontrado
            if (targetTrait.facets && targetTrait.facets.length > 0) {
                const facets = targetTrait.facets;
                // 1. Match exato facetKey
                targetFacet = facets.find(f => f.isActive !== false && (
                    this.cleanString(f.facetKey) === this.cleanString(qFacetKey) ||
                    this.cleanString(f.facetKey) === this.cleanString(parts[1]) ||
                    this.cleanString(f.name) === this.cleanString(parts[1])
                ));

                // 2. Match Fuzzy (Aliases) se não achou
                if (!targetFacet && parts.length > 1) {
                    // Usar aliases hardcoded APENAS como fallback seguro
                    // ... (Manter lógica de aliases existente se necessário)
                }
            }

            // Acumular valores
            if (targetFacet) {
                const fData = calculationMap.get(targetTrait.id).get(targetFacet.id);
                if (fData) {
                    fData.sum += finalValue * weight;
                    fData.weightSum += weight;
                    fData.count++;
                }
            } else {
                // Item do Traço sem Faceta específica
                const tData = directTraitItems.get(targetTrait.id);
                tData.sum += finalValue * weight;
                tData.weightSum += weight;
                tData.count++;
            }
        }

        // 3. Calcular Média das Facetas e do Traço Final
        for (const trait of activeTraits) {
            const facetsData = calculationMap.get(trait.id);
            const directData = directTraitItems.get(trait.id);

            const facetResults = [];
            let traitSum = 0;
            let traitWeightSum = 0;

            // Calcular score de cada Faceta e somar ao Traço
            if (trait.facets) {
                for (const facet of trait.facets) {
                    if (facet.isActive === false) continue;

                    const fData = facetsData.get(facet.id);
                    let fScoreRaw = 0;

                    if (fData && fData.weightSum > 0) {
                        fScoreRaw = fData.sum / fData.weightSum;
                    }

                    // Score Normalizado da Faceta (0-100)
                    const fScoreNorm = this.normalizeScore(fScoreRaw);

                    // Adicionar ao resultado
                    facetResults.push({
                        facetKey: facet.facetKey,
                        facetName: facet.name,
                        score: fScoreNorm,
                        rawScore: fScoreRaw
                    });

                    // Ponderar a Faceta para o Traço
                    // "Traço = média ponderada das facetas"
                    // Se a faceta não teve respostas (score 0), ela entra na média?? 
                    // Em Big Five rigoroso: Sim, puxa pra baixo. 
                    // Em SaaS resiliente: Ignora? 
                    // Vou incluir se tiver facet.weight > 0.
                    // ATENÇÃO: Se fScoreRaw for 0 pq nao teve perguntas, é injusto baixar o traço.
                    // Vou considerar apenas facetas que tiveram itens OU assumir score neutro (3)?
                    // Melhor: Ignorar facetas sem dados para não distorcer.
                    if (fData && fData.count > 0) {
                        traitSum += fScoreRaw * (facet.weight || 1.0);
                        traitWeightSum += (facet.weight || 1.0);
                    }
                }
            }

            // Considerar Itens Diretos (sem Faceta) no cálculo do Traço
            // Tratamos o conjunto de itens diretos como uma "Faceta Virtual"
            if (directData && directData.count > 0) {
                const directScore = directData.sum / directData.weightSum;
                // Peso dessa parte? Arbitrário ou proporcional? 
                // Vamos dar peso 1.0 para o "resto" das perguntas.
                traitSum += directScore * 1.0;
                traitWeightSum += 1.0;
            }

            // Score Final do Traço
            let traitFinalRaw = 0;
            if (traitWeightSum > 0) {
                traitFinalRaw = traitSum / traitWeightSum;
            }

            const normalizedScore = this.normalizeScore(traitFinalRaw);
            const level = this.determineLevel(normalizedScore, config);
            const interpretation = this.getInterpretation(level, trait);

            // Labels Customizados (Config)
            let levelLabel = '';
            switch (level) {
                case 'VERY_LOW': levelLabel = config.veryLowLabel || 'Muito Baixo'; break;
                case 'LOW': levelLabel = config.lowLabel || 'Baixo'; break;
                case 'AVERAGE': levelLabel = config.averageLabel || 'Médio'; break;
                case 'HIGH': levelLabel = config.highLabel || 'Alto'; break;
                case 'VERY_HIGH': levelLabel = config.veryHighLabel || 'Muito Alto'; break;
            }

            scores[trait.traitKey] = {
                traitKey: trait.traitKey,
                traitName: trait.name,
                score: traitFinalRaw,
                normalizedScore: normalizedScore,
                level: level,
                levelLabel: levelLabel, // Novo campo (adicionar na Interface ScoreResult se TS reclamar, mas como é JS runtime passa, depois ajusto interface)
                interpretation: interpretation,
                facets: facetResults
            };
        }

        return { scores, config };
    }

    private cleanString(str: string): string {
        if (!str) return '';
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .replace(/[()%]/g, "") // Remove parênteses e porcentagem
            .toLowerCase()
            .trim();
    }

    private normalizeScore(rawScore: number): number {
        // Escala 1 a 5 -> 0 a 100
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
            case 'VERY_LOW': return trait.veryLowText;
            case 'LOW': return trait.lowText;
            case 'AVERAGE': return trait.averageText;
            case 'HIGH': return trait.highText;
            case 'VERY_HIGH': return trait.veryHighText;
            default: return trait.averageText;
        }
    }
}

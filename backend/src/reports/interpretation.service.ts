import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { TalkingToService } from '../talking-to/talking-to.service';

@Injectable()
export class InterpretationService {
    constructor(
        private prisma: PrismaService,
        private talkingToService: TalkingToService
    ) { }

    /**
     * Gera relatório completo baseado em scores calculados e config
     */
    async generateFullReport(assignmentId: string, tenantId: string, configId?: string) {
        // Se configId for fornecido, busca especificamente ela (usada no cálculo)
        // Se não, busca a configuração ativa do tenant (fallback)
        const whereClause = configId
            ? { id: configId }
            : { tenantId: tenantId, isActive: true };

        // SOLUÇÃO DEFINITIVA: Se não achar config específica, busca QUALQUER config disponível
        let config = await this.prisma.bigFiveConfig.findFirst({
            where: whereClause,
            include: {
                interpretativeTexts: true,
                traits: {
                    include: {
                        facets: true
                    }
                }
            }
        });

        // Fallback 1: Se não achou, tenta buscar qualquer config ativa de qualquer tenant
        if (!config) {
            console.warn('[generateFullReport] Config específica não encontrada. Buscando qualquer config ativa...');
            config = await this.prisma.bigFiveConfig.findFirst({
                where: { isActive: true },
                include: {
                    interpretativeTexts: true,
                    traits: { include: { facets: true } }
                }
            });
        }

        // Fallback 2: Se ainda não achou, pega QUALQUER config do sistema
        if (!config) {
            console.warn('[generateFullReport] Nenhuma config ativa. Buscando primeira config disponível...');
            config = await this.prisma.bigFiveConfig.findFirst({
                include: {
                    interpretativeTexts: true,
                    traits: { include: { facets: true } }
                }
            });
        }

        // Se mesmo assim não achar, cria erro descritivo
        if (!config) {
            throw new Error('CRÍTICO: Nenhuma configuração Big Five existe no sistema. Execute o seed.');
        }

        // Buscar assignment com respostas
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: {
                    include: {
                        question: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!assignment) {
            throw new Error('Assignment não encontrado');
        }

        // Agrupar respostas por trait
        const responsesByTrait = this.groupResponsesByTrait(assignment.responses);

        const report = {
            userName: assignment.user.name || assignment.user.email,
            completedAt: assignment.completedAt,
            config: {
                name: config.name,
                primaryColor: config.primaryColor,
                companyLogo: config.companyLogo,
                reportHeader: config.reportHeader,
                reportFooter: config.reportFooter
            },
            traits: [] as any[]
        };

        // Gerar análise para cada trait
        for (const trait of config.traits) {
            let traitResponses = responsesByTrait[trait.traitKey];

            // FALLBACK ROBUSTO DE MATCHING DE RESPOSTAS (PT <-> EN)
            if (!traitResponses || traitResponses.length === 0) {
                const key = trait.traitKey.toUpperCase();

                // Mapa de equivalências bidirecional
                const equivalents: Record<string, string[]> = {
                    'OPENNESS': ['ABERTURA', 'MENTALIDADE', 'OPEN', 'FATOR_O', 'FACTOR_O', 'FATOR_V', 'FACTOR_V', 'INTELLECT', 'IMAGINATION'],
                    'ABERTURA': ['OPENNESS', 'MENTALIDADE', 'OPEN'],
                    'MENTALIDADE': ['OPENNESS', 'ABERTURA', 'OPEN'],

                    'CONSCIENTIOUSNESS': ['CONSCIENCIOSIDADE', 'ESTRUTURA', 'ORGANIZACAO', 'TRABALHO', 'CONSC', 'FATOR_C', 'FACTOR_C', 'FATOR_III', 'FACTOR_III'],
                    'CONSCIENCIOSIDADE': ['CONSCIENTIOUSNESS', 'ESTRUTURA', 'ORGANIZACAO', 'TRABALHO'],
                    'ESTRUTURA': ['CONSCIENTIOUSNESS', 'CONSCIENCIOSIDADE', 'ORGANIZACAO', 'TRABALHO'],

                    'EXTRAVERSION': ['EXTROVERSAO', 'ENERGIA', 'SOCIAL', 'EXTRA', 'FATOR_E', 'FACTOR_E', 'FATOR_I', 'FACTOR_I'],
                    'EXTROVERSAO': ['EXTRAVERSION', 'ENERGIA', 'SOCIAL'],
                    'ENERGIA': ['EXTRAVERSION', 'EXTROVERSAO', 'SOCIAL'],

                    'AGREEABLENESS': ['AMABILIDADE', 'AGRADABILIDADE', 'RELACIONAL', 'AGREE', 'FATOR_A', 'FACTOR_A', 'FATOR_II', 'FACTOR_II'],
                    'AMABILIDADE': ['AGREEABLENESS', 'AGRADABILIDADE', 'RELACIONAL'],
                    'RELACIONAL': ['AGREEABLENESS', 'AMABILIDADE', 'AGRADABILIDADE'],

                    'NEUROTICISM': ['NEUROTICISMO', 'ESTABILIDADE', 'RESILIENCIA', 'EMOCIONAL', 'NEURO', 'FATOR_N', 'FACTOR_N', 'FATOR_IV', 'FACTOR_IV'],
                    'NEUROTICISMO': ['NEUROTICISM', 'ESTABILIDADE', 'RESILIENCIA', 'EMOCIONAL'],
                    'ESTABILIDADE': ['NEUROTICISM', 'NEUROTICISMO', 'RESILIENCIA', 'EMOCIONAL']
                };

                // Tenta encontrar em qualquer chave equivalente que tenha respostas
                const aliasList = equivalents[key] || [];
                // Adiciona heurística genérica (includes)
                const allKeys = Object.keys(responsesByTrait);

                // 1. Busca direta nos equivalentes
                for (const alias of aliasList) {
                    if (responsesByTrait[alias]?.length > 0) {
                        traitResponses = responsesByTrait[alias];
                        console.log(`[InterpretationService] Match por alias: ${trait.traitKey} -> ${alias}`);
                        break;
                    }
                }

                // 2. Busca por includes (fallback final)
                if (!traitResponses) {
                    const match = allKeys.find(k => k.toUpperCase().includes(key.substring(0, 4)) || key.substring(0, 4).includes(k.toUpperCase()));
                    if (match) {
                        traitResponses = responsesByTrait[match];
                        console.log(`[InterpretationService] Match por includes: ${trait.traitKey} -> ${match}`);
                    }
                }
            }

            traitResponses = traitResponses || [];

            // Calcular score
            const rawScore = this.calculateScore(traitResponses, trait.weight);
            const normalizedScore = this.normalizeScore(rawScore);

            // Determinar nível
            const level = this.determineLevel(normalizedScore, config);

            // Obter interpretação
            const interpretation = this.getInterpretation(level, trait);

            // Calcular facetas
            const facets = trait.facets.map(facet => {
                const facetResponses = traitResponses.filter(r => {
                    try {
                        const metadata = JSON.parse(r.question.metadata as string);
                        return metadata.facet === facet.facetKey;
                    } catch {
                        return false;
                    }
                });

                const score = this.calculateScore(facetResponses, facet.weight);
                return {
                    name: facet.name,
                    score: this.normalizeScore(score),
                    description: facet.description
                };
            });


            // Mapear Level para Enum
            const levelMap: Record<string, string> = {
                'Muito Baixo': 'VERY_LOW',
                'Baixo': 'LOW',
                'Médio': 'AVERAGE',
                'Alto': 'HIGH',
                'Muito Alto': 'VERY_HIGH'
            };
            const rangeEnum = levelMap[level] || 'AVERAGE';

            // Filtrar textos da config específica
            // @ts-ignore
            let relevantTexts = config.interpretativeTexts ? config.interpretativeTexts.filter((t: any) =>
                t.traitKey === trait.traitKey && t.scoreRange === rangeEnum
            ) : [];

            console.log(`[InterpretationService] Buscando textos para ${trait.traitKey} - ${rangeEnum}`);
            console.log(`[InterpretationService] Config ID: ${config.id}, Tenant: ${tenantId}`);
            console.log(`[InterpretationService] Textos na config: ${config.interpretativeTexts?.length || 0}`);
            console.log(`[InterpretationService] Textos relevantes encontrados: ${relevantTexts.length}`);

            // FALLBACK 1: Se não achou textos na config atual, busca de QUALQUER config do MESMO TENANT
            if (!relevantTexts || relevantTexts.length === 0) {
                console.warn(`[InterpretationService] ⚠️ Config ${config.id} não tem textos para ${trait.traitKey} - ${rangeEnum}`);
                console.log(`[InterpretationService] Tentando buscar de qualquer config do tenant ${tenantId}...`);

                // Buscar qualquer config ativa do tenant que tenha esses textos
                const tenantConfig = await this.prisma.bigFiveConfig.findFirst({
                    where: {
                        tenantId: tenantId,
                        interpretativeTexts: {
                            some: {
                                traitKey: trait.traitKey,
                                scoreRange: rangeEnum
                            }
                        }
                    },
                    include: {
                        interpretativeTexts: {
                            where: {
                                traitKey: trait.traitKey,
                                scoreRange: rangeEnum
                            }
                        }
                    }
                });

                if (tenantConfig && tenantConfig.interpretativeTexts) {
                    relevantTexts = tenantConfig.interpretativeTexts;
                    console.log(`[InterpretationService] ✅ Encontrados ${relevantTexts.length} textos no tenant (Config: ${tenantConfig.id})`);
                } else {
                    // FALLBACK 2: BUSCA EMERGENCIAL - Buscar DIRETAMENTE no banco sem filtro de tenant/config
                    console.warn(`[InterpretationService] ⚠️ Nenhum texto no tenant ${tenantId}`);
                    console.log(`[InterpretationService] 🚨 BUSCA EMERGENCIAL: Procurando QUALQUER texto no banco...`);

                    relevantTexts = await this.prisma.bigFiveInterpretativeText.findMany({
                        where: {
                            traitKey: trait.traitKey,
                            scoreRange: rangeEnum
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 10
                    });

                    console.log(`[InterpretationService] 🚨 Busca emergencial retornou ${relevantTexts.length} textos`);

                    if (!relevantTexts || relevantTexts.length === 0) {
                        // FALLBACK 3: Universal (seed/padrão)
                        console.warn(`[InterpretationService] ⚠️ NENHUM texto encontrado no banco!`);
                        console.log(`[InterpretationService] Usando fallback universal (seed)...`);
                        relevantTexts = await this.getFallbackTexts(trait.traitKey, rangeEnum);
                        console.log(`[InterpretationService] Fallback retornou ${relevantTexts.length} textos`);
                    }
                }
            }

            // LOG FINAL dos textos encontrados
            console.log(`[InterpretationService] 📝 Textos finais para ${trait.traitKey}:`, {
                total: relevantTexts.length,
                categories: relevantTexts.map((t: any) => t.category),
                preview: relevantTexts.map((t: any) => ({
                    category: t.category,
                    textPreview: t.text?.substring(0, 50) + '...'
                }))
            });

            // Montar customTexts
            const customTexts = {
                summary: relevantTexts.find((t: any) => t.category === 'SUMMARY')?.text,
                practicalImpact: relevantTexts.filter((t: any) => t.category === 'PRACTICAL_IMPACT').map((t: any) => ({ context: t.context, text: t.text })),
                expertSynthesis: relevantTexts.find((t: any) => t.category === 'EXPERT_SYNTHESIS')?.text,
                expertHypothesis: relevantTexts.filter((t: any) => t.category === 'EXPERT_HYPOTHESIS').map((t: any) => ({ type: t.context, text: t.text }))
            };

            // LOG dos customTexts gerados
            console.log(`[InterpretationService] 📄 CustomTexts gerados para ${trait.traitKey}:`, {
                summary: customTexts.summary ? `${customTexts.summary.substring(0, 60)}...` : 'UNDEFINED',
                practicalImpactCount: customTexts.practicalImpact.length,
                expertSynthesis: customTexts.expertSynthesis ? `${customTexts.expertSynthesis.substring(0, 60)}...` : 'UNDEFINED',
                expertHypothesisCount: customTexts.expertHypothesis.length
            });

            report.traits.push({
                key: trait.traitKey,
                name: trait.name,
                icon: trait.icon,
                description: trait.description,
                score: normalizedScore,
                level: level,
                interpretation: interpretation,
                facets: facets,
                customTexts: customTexts,
            });
        }

        // --- INTEGRAÇÃO TALKING TO ---
        // Extrair scores calculados para alimentar o novo motor
        const facetsMap: any = {};
        report.traits.forEach(t => {
            if (t.facets) {
                facetsMap[t.key] = t.facets;
            }
        });

        // Helper para normalizar busca de key com suporte a PT/EN
        const findTraitScore = (keys: string[]) => {
            const trait = report.traits.find(t => {
                const k = (t.key || '').toUpperCase();
                return keys.some(search => k === search || k.includes(search));
            });
            return trait ? trait.score : 50;
        };

        const scores = {
            O: findTraitScore(['OPEN', 'ABERTURA', 'MENTALIDADE']),
            C: findTraitScore(['CONSC', 'ESTRUTURA', 'ORGANIZACAO', 'TRABALHO']),
            E: findTraitScore(['EXTRA', 'ENERGIA', 'SOCIAL', 'EXTRO']),
            A: findTraitScore(['AGREE', 'AMABILIDADE', 'RELACIONAL', 'AGRAD']),
            N: findTraitScore(['NEURO', 'ESTABILIDADE', 'RESILIENCIA', 'EMOCIONAL']),
            facets: facetsMap
        };

        const talkingToAnalysis = await this.talkingToService.analyzeProfile(scores);

        return {
            ...report,
            talkingToAnalysis
        };
    }

    /**
     * Agrupa respostas por trait
     */
    private groupResponsesByTrait(responses: any[]): Record<string, any[]> {
        const grouped: Record<string, any[]> = {};

        for (const response of responses) {
            if (!response.question.metadata) continue;

            try {
                const metadata = typeof response.question.metadata === 'string'
                    ? JSON.parse(response.question.metadata)
                    : response.question.metadata;

                // Tenta varias chaves possíveis
                const traitKey = metadata.trait ||
                    metadata.dimension ||
                    metadata.factor ||
                    metadata.category ||
                    metadata.domain ||
                    metadata.traitKey;

                if (!traitKey) continue;

                // Normaliza chave para facilitar matching
                // Mantemos case original na chave do objeto, mas o FuzzyMatch vai lidar com isso depois
                if (!grouped[traitKey]) {
                    grouped[traitKey] = [];
                }

                grouped[traitKey].push(response);
            } catch (e) {
                console.error('Erro ao parsear metadata:', e);
            }
        }

        return grouped;
    }

    /**
     * Calcula score médio
     */
    private calculateScore(responses: any[], weight: number = 1.0): number {
        if (responses.length === 0) return 0;

        const sum = responses.reduce((acc, r) => {
            const value = this.convertResponseToNumber(r.response);
            return acc + value;
        }, 0);

        return (sum / responses.length) * weight;
    }

    /**
     * Converte resposta para número
     */
    private convertResponseToNumber(response: string): number {
        if (!isNaN(Number(response))) {
            return Number(response);
        }

        const mapping: Record<string, number> = {
            'discordo_totalmente': 1,
            'discordo_parcialmente': 2,
            'discordo': 2,
            'neutro': 3,
            'indiferente': 3,
            'concordo': 4,
            'concordo_parcialmente': 4,
            'concordo_totalmente': 5,
        };

        return mapping[response.toLowerCase()] || 3;
    }

    /**
     * Normaliza para 0-100
     */
    private normalizeScore(rawScore: number): number {
        return Math.round(((rawScore - 1) / 4) * 100);
    }

    /**
     * Determina nível baseado na config
     */
    private determineLevel(score: number, config: any): string {
        if (score <= config.veryLowMax) return 'Muito Baixo';
        if (score <= config.lowMax) return 'Baixo';
        if (score <= config.averageMax) return 'Médio';
        if (score <= config.highMax) return 'Alto';
        return 'Muito Alto';
    }

    /**
     * Obtém interpretação
     */
    private getInterpretation(level: string, trait: any): string {
        switch (level) {
            case 'Muito Baixo':
                return trait.veryLowText;
            case 'Baixo':
                return trait.lowText;
            case 'Médio':
                return trait.averageText;
            case 'Alto':
                return trait.highText;
            case 'Muito Alto':
                return trait.veryHighText;
            default:
                return trait.averageText;
        }
    }

    /**
     * Fallback Universal: Busca textos de QUALQUER config do sistema
     * Usado quando a config específica não tem textos preenchidos
     */
    private async getFallbackTexts(traitKey: string, scoreRange: string) {
        console.log(`[FALLBACK] Buscando textos universais para ${traitKey} - ${scoreRange}`);

        const fallbackTexts = await this.prisma.bigFiveInterpretativeText.findMany({
            where: {
                traitKey: traitKey,
                scoreRange: scoreRange
            },
            take: 10 // Pega até 10 textos (suficiente para todas as categorias)
        });

        console.log(`[FALLBACK] Encontrados ${fallbackTexts.length} textos universais`);
        return fallbackTexts;
    }
}

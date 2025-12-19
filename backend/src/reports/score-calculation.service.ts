import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ScoreResult {
    traitKey: string;
    traitName: string;
    score: number;
    normalizedScore: number; // 0-100
    level: 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH';
    interpretation: string;
    facets?: {
        facetKey: string;
        facetName: string;
        score: number;
    }[];
}

@Injectable()
export class ScoreCalculationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calcula os scores de um assignment baseado nas respostas e na configuração ativa
     */
    async calculateScores(assignmentId: string): Promise<{
        scores: Record<string, ScoreResult>;
        config: any;
    }> {
        // Buscar assignment com respostas e config
        const assignment = await this.prisma.assessmentAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                responses: {
                    include: {
                        question: true
                    }
                },
                config: {
                    include: {
                        traits: {
                            include: {
                                facets: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        tenantId: true
                    }
                }
            }
        });

        if (!assignment) {
            throw new Error('Assignment não encontrado');
        }

        // Se não tem config vinculada, buscar a ativa do tenant
        let config = assignment.config;
        if (!config) {
            config = await this.prisma.bigFiveConfig.findFirst({
                where: {
                    tenantId: assignment.user.tenantId,
                    isActive: true
                },
                include: {
                    traits: {
                        include: {
                            facets: true
                        }
                    }
                }
            });
        }

        if (!config) {
            throw new Error('Configuração Big Five não encontrada para este tenant');
        }

        // Agrupar respostas por trait
        const responsesByTrait = this.groupResponsesByTrait(assignment.responses);

        const scores: Record<string, ScoreResult> = {};

        // Calcular score para cada trait
        for (const trait of config.traits) {
            const traitResponses = responsesByTrait[trait.traitKey] || [];

            // Calcular score bruto (média das respostas)
            const rawScore = this.calculateRawScore(traitResponses, trait.weight);

            // Normalizar para 0-100
            const normalizedScore = this.normalizeScore(rawScore);

            // Determinar nível baseado nas faixas da config
            const level = this.determineLevel(normalizedScore, config);

            // Obter interpretação
            const interpretation = this.getInterpretation(level, trait);

            // Calcular scores de facetas
            const facets = trait.facets.map((facet, idx) => {
                // Filtrar respostas que correspondem a esta faceta
                // A traitKey da questão vem como "Trait::Facet" (ex: "Amabilidade::Modéstia")
                // OU verificar se temos mapeamento de nome da faceta
                const facetResponses = traitResponses.filter(r => {
                    if (!r.question.traitKey) return false;

                    const parts = r.question.traitKey.split('::');
                    if (parts.length < 2) return false;

                    const facetNameFromQuestion = parts[1].trim();

                    // Helper para normalizar strings (remover acentos e lowercase)
                    const cleanString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

                    // Mapa de Aliases (Perguntas -> Config)
                    const facetAliases: Record<string, string[]> = {
                        // Neuroticismo
                        'ansiedade': ['controle de ansiedade', 'preocupacao'],
                        'raiva': ['controle de humor', 'irritabilidade', 'hostilidade'],
                        'autoconsciencia': ['confianca em si mesmo', 'timidez', 'autocritica'],
                        'depressao': ['tristeza', 'desanimo'],
                        'vulnerabilidade': ['resiliencia a criticas', 'gestao de estresse'],

                        // Extroversão
                        'gregarismo': ['sociabilidade', 'interacao social'],
                        'assertividade': ['lideranca', 'dominancia'],
                        'nivel de atividade': ['energia e atividade', 'ritmo'],
                        'busca de emocoes': ['busca por emocoes positivas', 'aventura'],
                        'emocoes positivas': ['otimismo', 'alegria'],

                        // Abertura
                        'imaginacao': ['criatividade', 'fantasia'],
                        'interesses artisticos': ['sensibilidade estetica', 'arte'],
                        'emotividade': ['sentimentos', 'consciencia emocional'],
                        'ideias': ['curiosidade intelectual', 'intelecto'],
                        'valores': ['abertura para mudancas', 'abertura cultural', 'liberalismo'],

                        // Amabilidade
                        'confianca': ['fe nos outros'],
                        'moralidade': ['modestia', 'franqueza', 'retidao'],
                        'altruismo': ['generosidade'],
                        'cooperacao': ['condescendencia', 'acordo'],
                        'modestia': ['humildade'],
                        'sensibilidade': ['empatia', 'ternura'],

                        // Conscienciosidade
                        'autoeficacia': ['autodisciplina', 'competencia'],
                        'organizacao': ['ordem', 'meticulosidade'],
                        'senso de dever': ['responsabilidade', 'dever'],
                        'esforco por realizacao': ['orientacao para objetivos', 'ambicao'],
                        'autodisciplina': ['persistencia']
                    };

                    const qNameClean = cleanString(facetNameFromQuestion);
                    const cNameClean = cleanString(facet.name);

                    // 1. Tentativa de Match Exato
                    let match = qNameClean === cNameClean;

                    // 2. Tentativa por Alias (se não tiver match exato)
                    if (!match && facetAliases[cNameClean]) {
                        match = facetAliases[cNameClean].includes(qNameClean);
                    }

                    // 3. Tentativa Inversa
                    if (!match && facetAliases[qNameClean]) {
                        match = facetAliases[qNameClean].includes(cNameClean);
                    }

                    if (!match && idx === 0 && r === traitResponses[0]) {
                        console.log(`[Facet Debug] Comparando: '${facetNameFromQuestion}' (Clean: ${cleanString(facetNameFromQuestion)}) vs '${facet.name}' (Clean: ${cleanString(facet.name)}) -> Match? ${match}`);
                    }

                    return match;
                });

                const facetScore = this.calculateRawScore(facetResponses, facet.weight);
                const normalizedFacetScore = this.normalizeScore(facetScore);

                if (facetScore === 0) {
                    console.warn(`[Facet Warning] Score zerado para faceta: ${facet.name} (Tentou casar com nomes das questões)`);
                }

                return {
                    facetKey: facet.facetKey,
                    facetName: facet.name,
                    score: normalizedFacetScore
                };
            });

            scores[trait.traitKey] = {
                traitKey: trait.traitKey,
                traitName: trait.name,
                score: rawScore,
                normalizedScore,
                level,
                interpretation,
                facets
            };
        }

        return { scores, config };
    }

    /**
     * Agrupa respostas por trait key
     */
    private groupResponsesByTrait(responses: any[]): Record<string, any[]> {
        console.log('[groupResponsesByTrait] Total de respostas:', responses.length);
        const grouped: Record<string, any[]> = {};

        // Mapeamento de nomes em português para keys em inglês
        const traitNameToKey: Record<string, string> = {
            'Amabilidade': 'AGREEABLENESS',
            'Conscienciosidade': 'CONSCIENTIOUSNESS',
            'Extroversão': 'EXTRAVERSION',
            'Abertura à Experiência': 'OPENNESS',
            'Estabilidade Emocional': 'NEUROTICISM'
        };

        for (const response of responses) {
            // As questões têm traitKey no formato "Trait::Facet"
            const fullTraitKey = response.question.traitKey;

            // LOG: Primeira questão para debug
            if (Object.keys(grouped).length === 0) {
                console.log('[groupResponsesByTrait] Exemplo de questão:', {
                    questionId: response.question.id,
                    questionText: response.question.text?.substring(0, 50),
                    traitKey: response.question.traitKey,
                    answer: response.answer,
                    hasMetadata: !!response.question.metadata
                });
            }

            if (!fullTraitKey) {
                console.warn('Questão sem traitKey:', response.question.id);
                continue;
            }

            // Extrair apenas o nome do trait (antes de "::")
            const traitName = fullTraitKey.split('::')[0];

            // Converter nome português para key em inglês
            const traitKey = traitNameToKey[traitName];

            if (!traitKey) {
                console.warn('Trait não reconhecido:', traitName, 'de:', fullTraitKey);
                continue;
            }

            if (!grouped[traitKey]) {
                grouped[traitKey] = [];
            }

            grouped[traitKey].push(response);
        }

        console.log('[groupResponsesByTrait] Traits encontradas:', Object.keys(grouped));
        console.log('[groupResponsesByTrait] Respostas por trait:',
            Object.entries(grouped).map(([k, v]) => ({ trait: k, count: v.length }))
        );

        return grouped;
    }

    /**
     * Calcula score bruto (média ponderada)
     */
    private calculateRawScore(responses: any[], weight: number = 1.0): number {
        if (responses.length === 0) return 0;

        const sum = responses.reduce((acc, r) => {
            // A resposta está no campo 'answer' (número 1-5)
            const value = r.answer || 3; // fallback para neutro se não houver resposta
            return acc + value;
        }, 0);

        const average = sum / responses.length;
        return average * weight;
    }

    /**
     * Converte resposta em número
     */
    private convertResponseToNumber(response: string): number {
        // Se já é número, retorna
        if (!isNaN(Number(response))) {
            return Number(response);
        }

        // Mapear respostas textuais para números
        const mapping: Record<string, number> = {
            'discordo_totalmente': 1,
            'discordo': 2,
            'neutro': 3,
            'concordo': 4,
            'concordo_totalmente': 5,
            // Adicionar outros mapeamentos conforme necessário
        };

        return mapping[response.toLowerCase()] || 3;
    }

    /**
     * Normaliza score para escala 0-100
     */
    private normalizeScore(rawScore: number): number {
        // Assumindo que rawScore vem de escala 1-5
        // Converter para 0-100
        return Math.round(((rawScore - 1) / 4) * 100);
    }

    /**
     * Determina o nível baseado nas faixas da config
     */
    private determineLevel(score: number, config: any): 'VERY_LOW' | 'LOW' | 'AVERAGE' | 'HIGH' | 'VERY_HIGH' {
        if (score <= config.veryLowMax) return 'VERY_LOW';
        if (score <= config.lowMax) return 'LOW';
        if (score <= config.averageMax) return 'AVERAGE';
        if (score <= config.highMax) return 'HIGH';
        return 'VERY_HIGH';
    }

    /**
     * Obtém interpretação textual baseada no nível
     */
    private getInterpretation(level: string, trait: any): string {
        switch (level) {
            case 'VERY_LOW':
                return trait.veryLowText;
            case 'LOW':
                return trait.lowText;
            case 'AVERAGE':
                return trait.averageText;
            case 'HIGH':
                return trait.highText;
            case 'VERY_HIGH':
                return trait.veryHighText;
            default:
                return trait.averageText;
        }
    }
}

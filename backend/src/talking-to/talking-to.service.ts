import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TalkingToInput {
    O: number; // Abertura
    C: number; // Estrutura (Conscienciosidade)
    E: number; // Extroversão
    A: number; // Agradabilidade
    N: number; // Estabilidade (Inverso de Neuroticismo)
    facets?: {
        EXTRAVERSION?: any[];
        AGREEABLENESS?: any[];
        CONSCIENTIOUSNESS?: any[];
        OPENNESS?: any[];
        NEUROTICISM?: any[];
        [key: string]: any;
    };
}

export interface TalkingToDimensionResult {
    traitKey: string; // Adicionado para merge
    dimension: string;
    classification: 'BAIXO' | 'FLEX' | 'ALTO';
    labels: string[];
    needs: {
        primary: string;
        environment: string;
        risk: string;
    };
    text_interpretation: string;
}

export interface TalkingToAnalysisResult {
    profile_summary: {
        archetype_name: string;
        dominant_traits: string[];
    };
    talkingto_analysis: TalkingToDimensionResult[];
    executive_summary: {
        strengths: string[];
        watch_outs: string[];
    };
}

@Injectable()
export class TalkingToService {
    constructor(private readonly prisma: PrismaService) { }

    // --- REPOSITORY HELPER (AUTO-SEEDING) ---
    private async getText(key: string, group: string, defaultContent: string, description?: string): Promise<string> {
        // Upsert garante que não haverá erro de "Unique constraint" se dois requests baterem ao mesmo tempo
        try {
            // Primeiro tenta buscar (mais rápido que upsert se já existir cacheado pelo prisma)
            const existing = await this.prisma.talkingToMessage.findUnique({ where: { key } });
            if (existing) return existing.content;

            const result = await this.prisma.talkingToMessage.upsert({
                where: { key },
                update: {}, // Se existe, não muda nada (usa o que tá no banco, que pode ter sido editado pelo Admin)
                create: {
                    key,
                    group,
                    description,
                    content: defaultContent
                }
            });
            return result.content;
        } catch (e) {
            console.error(`Erro crítico no getText [${key}]:`, e);
            return defaultContent; // Fallback extremo
        }
    }


    // Cache simples para evitar bater no banco em toda requisição de simulação
    private structureCache: any = null;
    private lastCacheUpdate: number = 0;
    private readonly CACHE_TTL = 1000 * 60 * 5; // 5 minutos

    private async getStructure() {
        if (this.structureCache && (Date.now() - this.lastCacheUpdate < this.CACHE_TTL)) {
            return this.structureCache;
        }

        const dimensions = await this.prisma.talkingToDimension.findMany({
            include: {
                facets: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        // Mapa para busca rápida: { "EXTRAVERSION": { ...dim, facets: [...] } }
        const map: Record<string, any> = {};
        for (const d of dimensions) {
            // Normalizar chaves para maiúsculo (garantia)
            const key = this.mapShortKeyToLong(d.key);
            map[key] = d;
        }

        this.structureCache = map;
        this.lastCacheUpdate = Date.now();
        return map;
    }

    // Mapeia chaves curtas (E, N, A) para longas usadas no input
    private mapShortKeyToLong(key: string): string {
        const map: Record<string, string> = {
            'E': 'EXTRAVERSION',
            'A': 'AGREEABLENESS',
            'C': 'CONSCIENTIOUSNESS',
            'O': 'OPENNESS',
            'N': 'NEUROTICISM' // Cuidado: Input N geralmente é Neuroticismo
        };
        return map[key] || key;
    }

    private async generateFineTunedNarrative(traitKey: string, score: number, facets?: any[]): Promise<{ text: string | null, labels: string[] }> {
        const structure = await this.getStructure();
        const dimConfig = structure[traitKey];
        const facetLabels: string[] = [];

        if (!dimConfig || !dimConfig.facets || dimConfig.facets.length === 0) {
            // Se não tem configuração no banco, não gera narrativa fina
            return { text: null, labels: [] };
        }

        // Se facets vierem no input, usamos.
        if (facets && facets.length > 0) {
            dimConfig.facets.forEach((dbFacet: any, idx: number) => {
                const inputFacet = facets[idx];
                if (inputFacet) {
                    const val = inputFacet.score;
                    // Lógica: < 50 = Low Label, >= 50 = High Label
                    const label = val >= 50 ? dbFacet.facetHigh : dbFacet.facetLow;
                    if (label) facetLabels.push(label);
                }
            });

            if (facetLabels.length > 0) {
                // Montar chave de busca: EXTRAVERSION_FALANTE_INTERATIVO...
                const signature = facetLabels
                    .map(l => l.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
                    .join('_')
                    .toUpperCase();

                const msgKey = `${traitKey}_${signature}`;
                const message = await this.prisma.talkingToMessage.findUnique({
                    where: { key: msgKey }
                });

                if (message) {
                    return { text: message.content, labels: facetLabels };
                } else {
                    return { text: null, labels: facetLabels };
                }
            }
        }
        return { text: null, labels: facetLabels };
    }

    // --- MAIN ENTRY POINT ---
    async analyzeProfile(scores: TalkingToInput): Promise<TalkingToAnalysisResult> {
        try {
            // Sanitize Inputs (NaN/Null protection)
            const safeScores = {
                E: Number(scores.E) || 50,
                A: Number(scores.A) || 50,
                C: Number(scores.C) || 50,
                O: Number(scores.O) || 50,
                N: Number(scores.N) || 50,
            };

            const dimensions: TalkingToDimensionResult[] = [];
            const strengths: string[] = [];
            const watchOuts: string[] = [];
            const dominantTraits: string[] = [];

            // 1. Analisar cada dimensão
            dimensions.push(await this.analyzeExtroversion(safeScores.E, scores.facets?.EXTRAVERSION));
            dimensions.push(await this.analyzeAgreeableness(safeScores.A, scores.facets?.AGREEABLENESS));
            dimensions.push(await this.analyzeStructure(safeScores.C, scores.facets?.CONSCIENTIOUSNESS));
            dimensions.push(await this.analyzeOpenness(safeScores.O, scores.facets?.OPENNESS));
            dimensions.push(await this.analyzeStability(safeScores.N, scores.facets?.NEUROTICISM));

            // 2. Definir Pontos Fortes e Atenção (Usando Templates do Banco)
            // Templates Default
            const tplHigh = await this.getText('TEMPLATE_STRENGTH_HIGH', 'TEMPLATES', 'Alta capacidade de {dimension} ({labels})', 'Template para ponto forte (Alto)');
            const tplLow = await this.getText('TEMPLATE_WATCHOUT_LOW', 'TEMPLATES', 'Atenção para {dimension} reduzida ({labels})', 'Template para ponto de atenção (Baixo)');
            const tplFlex = await this.getText('TEMPLATE_STRENGTH_FLEX', 'TEMPLATES', 'Equilíbrio e adaptabilidade em {dimension}', 'Template para ponto forte (Flex)');

            dimensions.forEach(d => {
                const labelsStr = d.labels.join(', ');
                if (d.classification === 'ALTO') {
                    dominantTraits.push(d.dimension);
                    strengths.push(tplHigh.replace('{dimension}', d.dimension).replace('{labels}', labelsStr));
                } else if (d.classification === 'BAIXO') {
                    watchOuts.push(tplLow.replace('{dimension}', d.dimension).replace('{labels}', labelsStr));
                } else {
                    // FLEX / EQUILIBRADO
                    strengths.push(tplFlex.replace('{dimension}', d.dimension));
                }
            });

            // 3. Gerar Nome do Arquétipo
            const archetype = this.generateArchetypeName(dominantTraits);

            return {
                profile_summary: {
                    archetype_name: archetype,
                    dominant_traits: dominantTraits
                },
                talkingto_analysis: dimensions,
                executive_summary: {
                    strengths: strengths,
                    watch_outs: watchOuts
                }
            };
        } catch (error) {
            console.error('CRITICAL ERROR in analyzeProfile:', error);
            throw new Error(`Falha ao processar simulação: ${error.message}`);
        }
    }

    // --- CLASSIFICATION LOGIC (0-35, 36-64, 65-100) ---
    private classify(score: number): 'BAIXO' | 'FLEX' | 'ALTO' {
        if (score <= 35) return 'BAIXO';
        if (score <= 64) return 'FLEX';
        return 'ALTO';
    }

    // --- DIMENSION ANALYZERS ---

    // 1. EXTROVERSÃO (Energia Social)
    private async analyzeExtroversion(score: number, facets?: any[]): Promise<TalkingToDimensionResult> {
        const classification = this.classify(score);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') {
            labels = ['Ouvinte', 'Seletivo', 'Contido', 'Reflexivo'];
            needs = {
                primary: await this.getText('EXTRAVERSION_LOW_NEEDS_PRIMARY', 'NEEDS', 'Espaço para reflexão e interações profundas (1 a 1).'),
                environment: await this.getText('EXTRAVERSION_LOW_NEEDS_ENVIRONMENT', 'NEEDS', 'Ambientes calmos, sem excesso de estímulos sonoros.'),
                risk: await this.getText('EXTRAVERSION_LOW_NEEDS_RISK', 'NEEDS', 'Exposição social forçada e constante drena sua bateria.')
            };
            text = await this.getText('EXTRAVERSION_LOW', 'DIMENSION', 'Você tem um perfil Ouvinte e Seletivo. Prefere observar antes de interagir e valoriza conexões profundas em vez de extensas. Ambientes muito ruidosos podem te cansar.', 'Extroversão Baixa');
        } else if (classification === 'ALTO') {
            labels = ['Falante', 'Interativo', 'Afirmativo', 'Ativo'];
            needs = {
                primary: await this.getText('EXTRAVERSION_HIGH_NEEDS_PRIMARY', 'NEEDS', 'Socialização, palco e oportunidade de interação.'),
                environment: await this.getText('EXTRAVERSION_HIGH_NEEDS_ENVIRONMENT', 'NEEDS', 'Animados, estimulantes, onde possa se conectar.'),
                risk: await this.getText('EXTRAVERSION_HIGH_NEEDS_RISK', 'NEEDS', 'O isolamento e o silêncio excessivo drenam sua energia.')
            };
            text = await this.getText('EXTRAVERSION_HIGH', 'DIMENSION', 'Você tem um perfil Falante e Interativo. Sente-se energizado ao trocar ideias com pessoas e ser o centro das atenções. O silêncio prolongado pode ser desafiador para você.', 'Extroversão Alta');
        } else {
            labels = ['Ambivalente Social', 'Adaptável'];
            needs = {
                primary: await this.getText('EXTRAVERSION_AVG_NEEDS_PRIMARY', 'NEEDS', 'Equilíbrio entre tempo social e tempo sozinho.'),
                environment: await this.getText('EXTRAVERSION_AVG_NEEDS_ENVIRONMENT', 'NEEDS', 'Flexível, que permita momentos de foco e momentos de troca.'),
                risk: await this.getText('EXTRAVERSION_AVG_NEEDS_RISK', 'NEEDS', 'Extremos (muito isolamento ou muita festa) causam desconforto.')
            };
            text = await this.getText('EXTRAVERSION_AVG', 'DIMENSION', 'Você é um Diplomata Social (Flex). Transita bem entre ouvir e falar, adaptando sua energia ao contexto. Sabe ser o centro das atenções quando necessário, mas também aprecia o silêncio.', 'Extroversão Média');
        }

        const fineTuned = await this.generateFineTunedNarrative('EXTRAVERSION', score, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
            traitKey: 'EXTRAVERSION',
            dimension: 'Energia Social (Extroversão)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    // 2. AGRADABILIDADE (Lógica vs Sentimento)
    private async analyzeAgreeableness(score: number, facets?: any[]): Promise<TalkingToDimensionResult> {
        const classification = this.classify(score);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') {
            labels = ['Crítico', 'Independente', 'Competitivo'];
            needs = {
                primary: await this.getText('AGREEABLENESS_LOW_NEEDS_PRIMARY', 'NEEDS', 'Autonomia, objetividade e foco em resultados.'),
                environment: await this.getText('AGREEABLENESS_LOW_NEEDS_ENVIRONMENT', 'NEEDS', 'Ambientes competitivos, diretos e sem rodeios emocionais.'),
                risk: await this.getText('AGREEABLENESS_LOW_NEEDS_RISK', 'NEEDS', 'Pode ser percebido como ríspido ou insensível em feedbacks.')
            };
            text = await this.getText('AGREEABLENESS_LOW', 'DIMENSION', 'Você adota uma postura Crítica e Independente. Prioriza a lógica e os fatos sobre os sentimentos alheios na tomada de decisão. É direto e focado em resolver problemas, custe o que custar.', 'Agradabilidade Baixa');
        } else if (classification === 'ALTO') {
            labels = ['Tolerante', 'Conectado', 'Colaborativo'];
            needs = {
                primary: await this.getText('AGREEABLENESS_HIGH_NEEDS_PRIMARY', 'NEEDS', 'Harmonia, aceitação social e colaboração.'),
                environment: await this.getText('AGREEABLENESS_HIGH_NEEDS_ENVIRONMENT', 'NEEDS', 'Cooperativos, acolhedores e com valores humanos fortes.'),
                risk: await this.getText('AGREEABLENESS_HIGH_NEEDS_RISK', 'NEEDS', 'Dificuldade em dizer não e em lidar com conflitos diretos.')
            };
            text = await this.getText('AGREEABLENESS_HIGH', 'DIMENSION', 'Você é Tolerante e Colaborativo. A harmonia do grupo é sua prioridade. Você tende a ceder para evitar conflitos e se preocupa genuinamente com o bem-estar das pessoas ao seu redor.', 'Agradabilidade Alta');
        } else {
            labels = ['Diplomata Situacional', 'Negociador'];
            needs = {
                primary: await this.getText('AGREEABLENESS_AVG_NEEDS_PRIMARY', 'NEEDS', 'Justiça e reciprocidade nas relações.'),
                environment: await this.getText('AGREEABLENESS_AVG_NEEDS_ENVIRONMENT', 'NEEDS', 'Onde possa balancear competição e cooperação.'),
                risk: await this.getText('AGREEABLENESS_AVG_NEEDS_RISK', 'NEEDS', 'Pode oscilar entre ser duro demais ou brando demais dependendo do dia.')
            };
            text = await this.getText('AGREEABLENESS_AVG', 'DIMENSION', 'Você é um Diplomata Situacional. Sabe ser empático, mas não deixa que isso prejudique seus objetivos. Equilibra bem a necessidade de resultados com a manutenção de bons relacionamentos.', 'Agradabilidade Média');
        }

        const fineTuned = await this.generateFineTunedNarrative('AGREEABLENESS', score, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
            traitKey: 'AGREEABLENESS',
            dimension: 'Estilo Relacional (Agradabilidade)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    // 3. ESTRUTURA (Conscienciosidade)
    private async analyzeStructure(score: number, facets?: any[]): Promise<TalkingToDimensionResult> {
        const classification = this.classify(score);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') {
            labels = ['Aventureiro', 'Espontâneo', 'Flexível'];
            needs = {
                primary: await this.getText('CONSCIENTIOUSNESS_LOW_NEEDS_PRIMARY', 'NEEDS', 'Liberdade, variedade e pouca rotina repetitiva.'),
                environment: await this.getText('CONSCIENTIOUSNESS_LOW_NEEDS_ENVIRONMENT', 'NEEDS', 'Dinâmicos, onde a improvisação é valorizada e as regras são poucas.'),
                risk: await this.getText('CONSCIENTIOUSNESS_LOW_NEEDS_RISK', 'NEEDS', 'Microgerenciamento e tarefas burocráticas matam sua motivação.')
            };
            text = await this.getText('CONSCIENTIOUSNESS_LOW', 'DIMENSION', 'Você é Aventureiro e Espontâneo. Prefere lidar com o fluxo do momento a seguir planos rígidos. Sua força está na improvisação e adaptação rápida a mudanças, mas pode ter dificuldade com prazos longos.', 'Estrutura Baixa');
        } else if (classification === 'ALTO') {
            labels = ['Planejado', 'Disciplinado', 'Persistente'];
            needs = {
                primary: await this.getText('CONSCIENTIOUSNESS_HIGH_NEEDS_PRIMARY', 'NEEDS', 'Clareza de papéis, processos definidos e previsibilidade.'),
                environment: await this.getText('CONSCIENTIOUSNESS_HIGH_NEEDS_ENVIRONMENT', 'NEEDS', 'Organizado, onde a dedicação e o cumprimento de responsabilidades são valorizados.'),
                risk: await this.getText('CONSCIENTIOUSNESS_HIGH_NEEDS_RISK', 'NEEDS', 'Ambientes caóticos ou com mudanças de escopo constantes sem aviso geram ansiedade.')
            };
            text = await this.getText('CONSCIENTIOUSNESS_HIGH', 'DIMENSION', 'Você é Planejado e Disciplinado. Gosta de ordem, regras claras e de terminar o que começa. A previsibilidade te dá segurança e você é excelente em entregar resultados consistentes.', 'Estrutura Alta');
        } else {
            labels = ['Organizado Flexível', 'Pragmático'];
            needs = {
                primary: await this.getText('CONSCIENTIOUSNESS_AVG_NEEDS_PRIMARY', 'NEEDS', 'Metas claras, mas com liberdade de execução.'),
                environment: await this.getText('CONSCIENTIOUSNESS_AVG_NEEDS_ENVIRONMENT', 'NEEDS', 'Estruturado mas aberto a novas formas de fazer.'),
                risk: await this.getText('CONSCIENTIOUSNESS_AVG_NEEDS_RISK', 'NEEDS', 'Excesso de rigidez ou de caos.')
            };
            text = await this.getText('CONSCIENTIOUSNESS_AVG', 'DIMENSION', 'Você é Organizado Flexível. Mantém uma estrutura mínima para funcionar, mas não se prende a ela se a situação exigir mudança. Sabe planejar, mas também sabe improvisar.', 'Estrutura Média');
        }

        const fineTuned = await this.generateFineTunedNarrative('CONSCIENTIOUSNESS', score, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
            traitKey: 'CONSCIENTIOUSNESS',
            dimension: 'Estilo de Trabalho (Estrutura)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    // 4. ABERTURA (Mentalidade)
    private async analyzeOpenness(score: number, facets?: any[]): Promise<TalkingToDimensionResult> {
        const classification = this.classify(score);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') {
            labels = ['Realista', 'Prático', 'Conservador'];
            needs = {
                primary: await this.getText('OPENNESS_LOW_NEEDS_PRIMARY', 'NEEDS', 'Fatos concretos, utilidade prática e tradição.'),
                environment: await this.getText('OPENNESS_LOW_NEEDS_ENVIRONMENT', 'NEEDS', 'Estáveis, onde o histórico é respeitado.'),
                risk: await this.getText('OPENNESS_LOW_NEEDS_RISK', 'NEEDS', 'Mudanças bruscas sem justificativa prática geram resistência.')
            };
            text = await this.getText('OPENNESS_LOW', 'DIMENSION', 'Você é Realista e Prático. Prefere o concreto ao abstrato, o testado ao novo. Sua abordagem é "pé no chão" e você valoriza a experiência acumulada e soluções que funcionam no mundo real.', 'Abertura Baixa');
        } else if (classification === 'ALTO') {
            labels = ['Imaginativo', 'Conceitual', 'Aberto ao Novo'];
            needs = {
                primary: await this.getText('OPENNESS_HIGH_NEEDS_PRIMARY', 'NEEDS', 'Novidade, estímulo intelectual e liberdade criativa.'),
                environment: await this.getText('OPENNESS_HIGH_NEEDS_ENVIRONMENT', 'NEEDS', 'Inovadores, onde ideias "fora da caixa" são bem-vindas.'),
                risk: await this.getText('OPENNESS_HIGH_NEEDS_RISK', 'NEEDS', 'Rotina monótona e repetição sem aprendizado.')
            };
            text = await this.getText('OPENNESS_HIGH', 'DIMENSION', 'Você é Imaginativo e Conceitual. É movido pela curiosidade e pela possibilidade de explorar o desconhecido. Gosta de teorias, arte e ideias complexas, buscando sempre inovar.', 'Abertura Alta');
        } else {
            labels = ['Pragmático Inovador', 'Curioso Focado'];
            needs = {
                primary: await this.getText('OPENNESS_AVG_NEEDS_PRIMARY', 'NEEDS', 'Inovação com propósito prático.'),
                environment: await this.getText('OPENNESS_AVG_NEEDS_ENVIRONMENT', 'NEEDS', 'Que permita melhorias incrementais.'),
                risk: await this.getText('OPENNESS_AVG_NEEDS_RISK', 'NEEDS', 'Teorias sem aplicação ou estagnação total.')
            };
            text = await this.getText('OPENNESS_AVG', 'DIMENSION', 'Você é um Pragmático Inovador. Tem curiosidade para o novo, mas precisa ver utilidade. Aceita mudanças se entender o benefício prático delas.', 'Abertura Média');
        }

        const fineTuned = await this.generateFineTunedNarrative('OPENNESS', score, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
            traitKey: 'OPENNESS',
            dimension: 'Mentalidade (Abertura)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    // 5. ESTABILIDADE (Neuroticismo Invertido)
    private async analyzeStability(neuroticismScore: number, facets?: any[]): Promise<TalkingToDimensionResult> {
        const stabilityScore = 100 - neuroticismScore;
        const classification = this.classify(stabilityScore);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') { // Alto Neuroticismo
            labels = ['Inquieto', 'Reativo', 'Intenso'];
            needs = {
                primary: await this.getText('NEUROTICISM_HIGH_NEEDS_PRIMARY', 'NEEDS', 'Segurança psicológica e previsibilidade emocional.'),
                environment: await this.getText('NEUROTICISM_HIGH_NEEDS_ENVIRONMENT', 'NEEDS', 'Ambientes calmos, previsíveis e com suporte emocional disponível.'),
                risk: await this.getText('NEUROTICISM_HIGH_NEEDS_RISK', 'NEEDS', 'Críticas duras ou surpresas negativas podem paralisar sua performance.')
            };
            text = await this.getText('NEUROTICISM_HIGH', 'DIMENSION', 'Você tende a ser Inquieto e Reativo. Sente as emoções com intensidade e pode se preocupar excessivamente com problemas futuros. É muito vigilante a riscos, mas precisa de segurança para performar bem.', 'Estabilidade Baixa (Alto Neuroticismo)');
        } else if (classification === 'ALTO') { // Baixo Neuroticismo
            labels = ['Autoconfiante', 'Resiliente', 'Controlado'];
            needs = {
                primary: await this.getText('NEUROTICISM_LOW_NEEDS_PRIMARY', 'NEEDS', 'Desafios de alta pressão e autonomia para gerenciar crises.'),
                environment: await this.getText('NEUROTICISM_LOW_NEEDS_ENVIRONMENT', 'NEEDS', 'Podem ser caóticos ou de alta pressão; você aguenta bem.'),
                risk: await this.getText('NEUROTICISM_LOW_NEEDS_RISK', 'NEEDS', 'Pode subestimar riscos ou parecer frio diante da dor alheia.')
            };
            text = await this.getText('NEUROTICISM_LOW', 'DIMENSION', 'Você é Resiliente e Autoconfiante. Mantém a calma mesmo sob pressão intensa. Dificilmente se abala com críticas ou cenários negativos, agindo como um porto seguro para a equipe.', 'Estabilidade Alta (Baixo Neuroticismo)');
        } else {
            labels = ['Responsivo', 'Equilibrado'];
            needs = {
                primary: await this.getText('NEUROTICISM_AVG_NEEDS_PRIMARY', 'NEEDS', 'Feedback construtivo regular.'),
                environment: await this.getText('NEUROTICISM_AVG_NEEDS_ENVIRONMENT', 'NEEDS', 'Equilibrado.'),
                risk: await this.getText('NEUROTICISM_AVG_NEEDS_RISK', 'NEEDS', 'Estresse acumulado a longo prazo.')
            };
            text = await this.getText('NEUROTICISM_AVG', 'DIMENSION', 'Você é Emocionalmente Responsivo. Sente o estresse quando ele surge, mas consegue se recuperar relativamente rápido. Não é nem uma pedra de gelo, nem um vulcão.', 'Estabilidade Média');
        }

        const fineTuned = await this.generateFineTunedNarrative('NEUROTICISM', neuroticismScore, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
            traitKey: 'NEUROTICISM',
            dimension: 'Resiliência (Estabilidade)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    // --- SEEDING UTILITY ---
    async seedAllDefinitions() {
        return 0;
    }

    // --- CROSSINGS RETRIEVAL ---
    async getCrossingsForAnalysis(dimensions: TalkingToDimensionResult[]) {
        const crossings = [];

        for (const dim of dimensions) {
            // Tenta encontrar match para QUALQUER um dos labels do usuário
            // Isso previne que labels customizados (Fine Tuning) ou secundários quebrem a feature
            let matches: any[] = [];
            let matchedLabel = '';

            for (const label of dim.labels) {
                const normalizedLabel = label.toLowerCase();
                const found = await this.prisma.talkingToCrossing.findMany({
                    where: {
                        subtraitA: normalizedLabel,
                        isActive: true
                    }
                });

                if (found.length > 0) {
                    matches = found;
                    matchedLabel = label; // Usa o Display Name original (Title Case)
                    break; // Achou match, para de procurar. Prioridade é a ordem do array labels.
                }
            }

            if (matches.length > 0) {
                crossings.push({
                    dimension: dim.dimension,
                    traitKey: dim.traitKey,
                    userSubtrait: matchedLabel,
                    interactions: matches.map(m => ({
                        targetSubtrait: m.subtraitB,
                        text: m.text,
                        id: m.id
                    }))
                });
            } else if (dim.classification === 'FLEX') {
                // FALLBACK PARA PERFIS MEDIANOS (FLEX)
                // Se não tem conflito específico mapeado, assume-se que é adaptável.
                crossings.push({
                    dimension: dim.dimension,
                    traitKey: dim.traitKey,
                    userSubtrait: dim.labels[0],
                    interactions: [{
                        targetSubtrait: 'Interação Geral',
                        text: 'É pouco provável que esse subtraço crie desafios relacionais, dada sua flexibilidade em transitar entre os extremos.',
                        id: `flex_${dim.traitKey}`
                    }]
                });
            }
        }

        return crossings;
    }

    // --- COMPARISON LOGIC ---
    analyzeRelationship(myScores: TalkingToInput, partnerScores: TalkingToInput): any[] {
        const dimensions = [
            { key: 'E', name: 'Energia Social (Extroversão)', trait: 'EXTRAVERSION' },
            { key: 'A', name: 'Estilo Relacional (Agradabilidade)', trait: 'AGREEABLENESS' },
            { key: 'C', name: 'Estilo de Trabalho (Estrutura)', trait: 'CONSCIENTIOUSNESS' },
            { key: 'O', name: 'Mentalidade (Abertura)', trait: 'OPENNESS' },
            { key: 'N', name: 'Resiliência (Estabilidade)', trait: 'NEUROTICISM' }
        ];

        return dimensions.map(dim => {
            let myScore = (myScores as any)[dim.key];
            let partnerScore = (partnerScores as any)[dim.key];

            const diff = myScore - partnerScore;
            const absDiff = Math.abs(diff);

            let insight = "";
            let implication = "";

            if (absDiff < 15) {
                insight = "Vocês são muito parecidos neste aspecto.";
                implication = "Essa similaridade facilita a compreensão mútua, pois tendem a reagir de maneira semelhante. O risco é a falta de complementaridade (pontos cegos compartilhados).";
            }
            else if (absDiff < 30) {
                insight = "Vocês possuem estilos complementares com algumas diferenças.";
                if (diff > 0) implication = "Você tende a ser mais intenso neste traço, enquanto seu parceiro é mais moderado. Isso pode gerar um equilíbrio saudável.";
                else implication = "Seu parceiro tende a liderar neste aspecto, enquanto você adota uma postura mais moderada.";
            }
            else {
                insight = "Vocês são opostos neste traço.";
                implication = "Essa diferença gera grande complementaridade, mas exige paciência. O que é natural para um, pode ser exaustivo para o outro. É o maior ponto de aprendizado da relação.";
            }

            return {
                key: dim.key,
                traitKey: dim.trait,
                dimension: dim.name,
                similarity: absDiff < 15 ? 'HIGH' : absDiff < 30 ? 'MEDIUM' : 'LOW',
                insight,
                implication,
                diff
            };
        });
    }

    private generateArchetypeName(traits: string[]): string {
        const map: Record<string, string> = {
            'Energia Social (Extroversão)': 'Comunicador',
            'Estilo Relacional (Agradabilidade)': 'Mediador',
            'Estilo de Trabalho (Estrutura)': 'Executor',
            'Mentalidade (Abertura)': 'Visionário',
            'Resiliência (Estabilidade)': 'Porto Seguro'
        };

        if (!traits || traits.length === 0) return "Perfil Equilibrado";

        // Pega o primeiro trait dominante como principal
        const primary = map[traits[0]] || traits[0];

        if (traits.length === 1) return `O ${primary}`;

        // Se tiver mais de um, combina os dois primeiros
        const secondary = map[traits[1]] || traits[1];

        // Exemplo: "Comunicador Visionário"
        return `${primary} ${secondary}`;
    }
}

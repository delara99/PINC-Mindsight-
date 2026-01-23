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
            // Se não tem configuração no banco, não gera narrativa fina (ou fallback legado se desejado)
            return { text: null, labels: [] };
        }

        // Se facets vierem no input, usamos.
        if (facets && facets.length > 0) {
            // Iterar sobre as facetas DO BANCO para garantir ordem correta
            // Assume-se que o array input `facets` está alinhado ou mapeável.
            // Para simplificar: O input hoje é um array ordenado de scores.
            // O banco também tem facetas. Precisamos casar.
            // Se o input não tem metadados de qual faceta é qual, assumimos a ordem do banco ou do excel padrão.
            // O ideal seria o input vir com keys. Como vem array simples [ {score: 10}, {score: 90} ], é posicional.

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
                // IMPORTANTE: A ordem dos labels influencia a chave.
                const signature = facetLabels.join('_').toUpperCase(); // Padronizar caixa alta

                // Buscar texto no Banco (TalkingToMessage)
                // Chave esperada: TRAIT_LABEL1_LABEL2...
                const msgKey = `${traitKey}_${signature}`;

                // Tentar buscar:
                const message = await this.prisma.talkingToMessage.findUnique({
                    where: { key: msgKey }
                });

                if (message) {
                    return { text: message.content, labels: facetLabels };
                } else {
                    // Fallback: Tenta criar/logar ou apenas retornar os labels calculados.
                    // Para o admin saber que falta texto, pode ser útil retornar um placeholder ou null.
                    // Se não achou texto exato, retorna só os labels.
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

            // 1. Analisar cada dimensão (Safe Calls)
            dimensions.push(await this.analyzeExtroversion(safeScores.E, scores.facets?.EXTRAVERSION));
            dimensions.push(await this.analyzeAgreeableness(safeScores.A, scores.facets?.AGREEABLENESS));
            dimensions.push(await this.analyzeStructure(safeScores.C, scores.facets?.CONSCIENTIOUSNESS));
            dimensions.push(await this.analyzeOpenness(safeScores.O, scores.facets?.OPENNESS));
            dimensions.push(await this.analyzeStability(safeScores.N, scores.facets?.NEUROTICISM));

            // 2. Definir Pontos Fortes e Atenção (Lógica Simples baseada em extremos)
            dimensions.forEach(d => {
                if (d.classification === 'ALTO') {
                    dominantTraits.push(d.dimension);
                    strengths.push(`Alta capacidade de ${d.dimension} (${d.labels.join(', ')})`);
                } else if (d.classification === 'BAIXO') {
                    watchOuts.push(`Atenção para ${d.dimension} reduzida (${d.labels.join(', ')})`);
                } else {
                    // FLEX / EQUILIBRADO
                    strengths.push(`Equilíbrio e adaptabilidade em ${d.dimension}`);
                }
            });

            // 3. Gerar Nome do Arquétipo (Combinatória simples dos top 2 dominantes)
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

        // Default Logic
        if (classification === 'BAIXO') {
            labels = ['Ouvinte', 'Seletivo', 'Contido', 'Reflexivo'];
            needs = {
                primary: 'Espaço para reflexão e interações profundas (1 a 1).',
                environment: 'Ambientes calmos, sem excesso de estímulos sonoros.',
                risk: 'Exposição social forçada e constante drena sua bateria.'
            };
            text = await this.getText(
                'EXTRAVERSION_LOW', 'DIMENSION',
                'Você tem um perfil Ouvinte e Seletivo. Prefere observar antes de interagir e valoriza conexões profundas em vez de extensas. Ambientes muito ruidosos podem te cansar.',
                'Extroversão Baixa'
            );
        } else if (classification === 'ALTO') {
            labels = ['Falante', 'Interativo', 'Afirmativo', 'Ativo'];
            needs = {
                primary: 'Socialização, palco e oportunidade de interação.',
                environment: 'Animados, estimulantes, onde possa se conectar.',
                risk: 'O isolamento e o silêncio excessivo drenam sua energia.'
            };
            text = await this.getText(
                'EXTRAVERSION_HIGH', 'DIMENSION',
                'Você tem um perfil Falante e Interativo. Sente-se energizado ao trocar ideias com pessoas e ser o centro das atenções. O silêncio prolongado pode ser desafiador para você.',
                'Extroversão Alta'
            );
        } else {
            labels = ['Ambivalente Social', 'Adaptável'];
            needs = {
                primary: 'Equilíbrio entre tempo social e tempo sozinho.',
                environment: 'Flexível, que permita momentos de foco e momentos de troca.',
                risk: 'Extremos (muito isolamento ou muita festa) causam desconforto.'
            };
            text = await this.getText(
                'EXTRAVERSION_AVG', 'DIMENSION',
                'Você é um Diplomata Social (Flex). Transita bem entre ouvir e falar, adaptando sua energia ao contexto. Sabe ser o centro das atenções quando necessário, mas também aprecia o silêncio.',
                'Extroversão Média'
            );
        }

        // Fine-Tuned Override
        const fineTuned = await this.generateFineTunedNarrative('EXTRAVERSION', score, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
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
                primary: 'Autonomia, objetividade e foco em resultados.',
                environment: 'Ambientes competitivos, diretos e sem rodeios emocionais.',
                risk: 'Pode ser percebido como ríspido ou insensível em feedbacks.'
            };
            text = await this.getText(
                'AGREEABLENESS_LOW', 'DIMENSION',
                'Você adota uma postura Crítica e Independente. Prioriza a lógica e os fatos sobre os sentimentos alheios na tomada de decisão. É direto e focado em resolver problemas, custe o que custar.',
                'Agradabilidade Baixa'
            );
        } else if (classification === 'ALTO') {
            labels = ['Tolerante', 'Conectado', 'Colaborativo'];
            needs = {
                primary: 'Harmonia, aceitação social e colaboração.',
                environment: 'Cooperativos, acolhedores e com valores humanos fortes.',
                risk: 'Dificuldade em dizer não e em lidar com conflitos diretos.'
            };
            text = await this.getText(
                'AGREEABLENESS_HIGH', 'DIMENSION',
                'Você é Tolerante e Colaborativo. A harmonia do grupo é sua prioridade. Você tende a ceder para evitar conflitos e se preocupa genuinamente com o bem-estar das pessoas ao seu redor.',
                'Agradabilidade Alta'
            );
        } else {
            labels = ['Diplomata Situacional', 'Negociador'];
            needs = {
                primary: 'Justiça e reciprocidade nas relações.',
                environment: 'Onde possa balancear competição e cooperação.',
                risk: 'Pode oscilar entre ser duro demais ou brando demais dependendo do dia.'
            };
            text = await this.getText(
                'AGREEABLENESS_AVG', 'DIMENSION',
                'Você é um Diplomata Situacional. Sabe ser empático, mas não deixa que isso prejudique seus objetivos. Equilibra bem a necessidade de resultados com a manutenção de bons relacionamentos.',
                'Agradabilidade Média'
            );
        }

        const fineTuned = await this.generateFineTunedNarrative('AGREEABLENESS', score, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
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
                primary: 'Liberdade, variedade e pouca rotina repetitiva.',
                environment: 'Dinâmicos, onde a improvisação é valorizada e as regras são poucas.',
                risk: 'Microgerenciamento e tarefas burocráticas matam sua motivação.'
            };
            text = await this.getText(
                'CONSCIENTIOUSNESS_LOW', 'DIMENSION',
                'Você é Aventureiro e Espontâneo. Prefere lidar com o fluxo do momento a seguir planos rígidos. Sua força está na improvisação e adaptação rápida a mudanças, mas pode ter dificuldade com prazos longos.',
                'Estrutura Baixa'
            );
        } else if (classification === 'ALTO') {
            labels = ['Planejado', 'Disciplinado', 'Persistente'];
            needs = {
                primary: 'Clareza de papéis, processos definidos e previsibilidade.',
                environment: 'Organizado, onde a dedicação e o cumprimento de responsabilidades são valorizados.',
                risk: 'Ambientes caóticos ou com mudanças de escopo constantes sem aviso geram ansiedade.'
            };
            text = await this.getText(
                'CONSCIENTIOUSNESS_HIGH', 'DIMENSION',
                'Você é Planejado e Disciplinado. Gosta de ordem, regras claras e de terminar o que começa. A previsibilidade te dá segurança e você é excelente em entregar resultados consistentes.',
                'Estrutura Alta'
            );
        } else {
            labels = ['Organizado Flexível', 'Pragmático'];
            needs = {
                primary: 'Metas claras, mas com liberdade de execução.',
                environment: 'Estruturado mas aberto a novas formas de fazer.',
                risk: 'Excesso de rigidez ou de caos.'
            };
            text = await this.getText(
                'CONSCIENTIOUSNESS_AVG', 'DIMENSION',
                'Você é Organizado Flexível. Mantém uma estrutura mínima para funcionar, mas não se prende a ela se a situação exigir mudança. Sabe planejar, mas também sabe improvisar.',
                'Estrutura Média'
            );
        }

        const fineTuned = await this.generateFineTunedNarrative('CONSCIENTIOUSNESS', score, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }


        return {
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
                primary: 'Fatos concretos, utilidade prática e tradição.',
                environment: 'Estáveis, onde o histórico é respeitado.',
                risk: 'Mudanças bruscas sem justificativa prática geram resistência.'
            };
            text = await this.getText(
                'OPENNESS_LOW', 'DIMENSION',
                'Você é Realista e Prático. Prefere o concreto ao abstrato, o testado ao novo. Sua abordagem é "pé no chão" e você valoriza a experiência acumulada e soluções que funcionam no mundo real.',
                'Abertura Baixa'
            );
        } else if (classification === 'ALTO') {
            labels = ['Imaginativo', 'Conceitual', 'Aberto ao Novo'];
            needs = {
                primary: 'Novidade, estímulo intelectual e liberdade criativa.',
                environment: 'Inovadores, onde ideias "fora da caixa" são bem-vindas.',
                risk: 'Rotina monótona e repetição sem aprendizado.'
            };
            text = await this.getText(
                'OPENNESS_HIGH', 'DIMENSION',
                'Você é Imaginativo e Conceitual. É movido pela curiosidade e pela possibilidade de explorar o desconhecido. Gosta de teorias, arte e ideias complexas, buscando sempre inovar.',
                'Abertura Alta'
            );
        } else {
            labels = ['Pragmático Inovador', 'Curioso Focado'];
            needs = {
                primary: 'Inovação com propósito prático.',
                environment: 'Que permita melhorias incrementais.',
                risk: 'Teorias sem aplicação ou estagnação total.'
            };
            text = await this.getText(
                'OPENNESS_AVG', 'DIMENSION',
                'Você é um Pragmático Inovador. Tem curiosidade para o novo, mas precisa ver utilidade. Aceita mudanças se entender o benefício prático delas.',
                'Abertura Média'
            );
        }

        const fineTuned = await this.generateFineTunedNarrative('OPENNESS', score, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
            dimension: 'Mentalidade (Abertura)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    // 5. ESTABILIDADE (Neuroticismo Invertido, ou seja, Alto Score = Alta Estabilidade)
    private async analyzeStability(neuroticismScore: number, facets?: any[]): Promise<TalkingToDimensionResult> {
        // CONVENÇÃO: Input é Neuroticismo (0=Zen, 100=Pânico).
        // TalkingTo quer "Estabilidade" (0=Pânico, 100=Zen).
        const stabilityScore = 100 - neuroticismScore; // Inversão para facilitar a lógica de "Quanto maior, melhor a estabilidade"

        const classification = this.classify(stabilityScore);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') {
            // Baixa Estabilidade (Alto Neuroticismo)
            labels = ['Inquieto', 'Reativo', 'Intenso'];
            needs = {
                primary: 'Segurança psicológica e previsibilidade emocional.',
                environment: 'Ambientes calmos, previsíveis e com suporte emocional disponível.',
                risk: 'Críticas duras ou surpresas negativas podem paralisar sua performance.'
            };
            text = await this.getText(
                'NEUROTICISM_HIGH', 'DIMENSION',
                'Você tende a ser Inquieto e Reativo. Sente as emoções com intensidade e pode se preocupar excessivamente com problemas futuros. É muito vigilante a riscos, mas precisa de segurança para performar bem.',
                'Estabilidade Baixa (Alto Neuroticismo)'
            );
        } else if (classification === 'ALTO') {
            // Alta Estabilidade (Baixo Neuroticismo)
            labels = ['Resiliente', 'Autoconfiante', 'Controlado'];
            needs = {
                primary: 'Desafios de alta pressão e autonomia para gerenciar crises.',
                environment: 'Podem ser caóticos ou de alta pressão; você aguenta bem.',
                risk: 'Pode subestimar riscos ou parecer frio diante da dor alheia.'
            };
            text = await this.getText(
                'NEUROTICISM_LOW', 'DIMENSION',
                'Você é Resiliente e Autoconfiante. Mantém a calma mesmo sob pressão intensa. Dificilmente se abala com críticas ou cenários negativos, agindo como um porto seguro para a equipe.',
                'Estabilidade Alta (Baixo Neuroticismo)'
            );
        } else {
            labels = ['Responsivo', 'Equilibrado'];
            needs = {
                primary: 'Feedback construtivo regular.',
                environment: 'Equilibrado.',
                risk: 'Estresse acumulado a longo prazo.'
            };
            text = await this.getText(
                'NEUROTICISM_AVG', 'DIMENSION',
                'Você é Emocionalmente Responsivo. Sente o estresse quando ele surge, mas consegue se recuperar relativamente rápido. Não é nem uma pedra de gelo, nem um vulcão.',
                'Estabilidade Média'
            );
        }

        // Pass RAW Score (Neuroticism) to fine-tuned generator because dictionary keys (INQUIETO...)
        // are aligned with High Neuroticism = Inquieto.
        const fineTuned = await this.generateFineTunedNarrative('NEUROTICISM', neuroticismScore, facets);
        if (fineTuned.text) {
            text = fineTuned.text;
            labels = fineTuned.labels.length > 0 ? fineTuned.labels : labels;
        }

        return {
            dimension: 'Resiliência (Estabilidade)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    // --- SEEDING UTILITY ---
    // Chamado pelo Controller para garantir que a estrutura básica exista
    async seedAllDefinitions() {
        // Como movemos a lógica para ser dinâmica, não temos mais o objeto hardcoded FINETUNED_TEXTS aqui.
        // A responsabilidade de popular o banco inicial agora deve ser de um script de migração ou seed dedicado.
        // Entretanto, para manter a compatibilidade com o botão "Restaurar Padrão" do frontend,
        // podemos implementar aqui uma lógica que restaura os valores 'de fábrica' se quisermos,
        // mas idealmente isso viria de um arquivo JSON ou similar.

        // Por enquanto, retoar 0 para não quebrar a API.
        return 0;
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

            // Invert N for Stability calculation logic if needed, but here we compare raw traits mostly 
            // EXCEPT for N where high score = Low Stability. Let's keep raw for logic but invert for display if needed.

            const diff = myScore - partnerScore;
            const absDiff = Math.abs(diff);

            let insight = "";
            let implication = "";

            // LOW DIFFERENCE
            if (absDiff < 15) {
                insight = "Vocês são muito parecidos neste aspecto.";
                implication = "Essa similaridade facilita a compreensão mútua, pois tendem a reagir de maneira semelhante. O risco é a falta de complementaridade (pontos cegos compartilhados).";
            }
            // MEDIUM DIFFERENCE
            else if (absDiff < 30) {
                insight = "Vocês possuem estilos complementares com algumas diferenças.";
                if (diff > 0) implication = "Você tende a ser mais intenso neste traço, enquanto seu parceiro é mais moderado. Isso pode gerar um equilíbrio saudável.";
                else implication = "Seu parceiro tende a liderar neste aspecto, enquanto você adota uma postura mais moderada.";
            }
            // HIGH DIFFERENCE
            else {
                insight = "Vocês são opostos neste traço.";
                implication = "Essa diferença gera grande complementaridade, mas exige paciência. O que é natural para um, pode ser exaustivo para o outro. É o maior ponto de aprendizado da relação.";
            }

            return {
                dimension: dim.name,
                similarity: absDiff < 15 ? 'HIGH' : absDiff < 30 ? 'MEDIUM' : 'LOW',
                insight,
                implication,
                diff
            };
        });
    }

    private generateArchetypeName(traits: string[]): string {
        const t1 = traits[0] ? traits[0].split(' ')[0] : 'Generalista';
        const t2 = traits[1] ? traits[1].split(' ')[0] : 'Adaptável';
        // return `O ${t1} ${t2}`; // Ex: O Energia Mentalidade
        // Melhorar isso: precisamos de nomes legais para os traços.
        // Vou deixar genérico por enquanto: "O Estrategista Dinâmico"
        // Isso requer uma tabela combinatória gigante de 25 pares.
        // Vou retornar uma string placeholder funcional.
        return "Arquétipo TalkingTo (Beta)";
    }
}

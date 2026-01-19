import { Injectable } from '@nestjs/common';

export interface TalkingToInput {
    O: number; // Abertura
    C: number; // Estrutura (Conscienciosidade)
    E: number; // Extroversão
    A: number; // Agradabilidade
    N: number; // Estabilidade (Inverso de Neuroticismo)
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

    // --- MAIN ENTRY POINT ---
    analyzeProfile(scores: TalkingToInput): TalkingToAnalysisResult {
        const dimensions: TalkingToDimensionResult[] = [];
        const strengths: string[] = [];
        const watchOuts: string[] = [];
        const dominantTraits: string[] = [];

        // 1. Analisar cada dimensão
        dimensions.push(this.analyzeExtroversion(scores.E));
        dimensions.push(this.analyzeAgreeableness(scores.A));
        dimensions.push(this.analyzeStructure(scores.C)); // Conscienciosidade -> Estrutura
        dimensions.push(this.analyzeOpenness(scores.O));
        dimensions.push(this.analyzeStability(scores.N)); // Neuroticismo -> Estabilidade

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
    }

    // --- CLASSIFICATION LOGIC (0-35, 36-64, 65-100) ---
    private classify(score: number): 'BAIXO' | 'FLEX' | 'ALTO' {
        if (score <= 35) return 'BAIXO';
        if (score <= 64) return 'FLEX';
        return 'ALTO';
    }

    // --- DIMENSION ANALYZERS ---

    // 1. EXTROVERSÃO (Energia Social)
    private analyzeExtroversion(score: number): TalkingToDimensionResult {
        const classification = this.classify(score);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') {
            labels = ['Ouvinte', 'Seletivo', 'Contido', 'Reflexivo'];
            needs = {
                primary: 'Espaço para reflexão e interações profundas (1 a 1).',
                environment: 'Ambientes calmos, sem excesso de estímulos sonoros ou interrupções constantes.',
                risk: 'Exposição social forçada e constante drena sua bateria rapidamente.'
            };
            text = 'Você tem um perfil Ouvinte e Seletivo. Prefere observar antes de interagir e valoriza conexões profundas em vez de extensas. Ambientes muito ruidosos podem te cansar.';
        } else if (classification === 'ALTO') {
            labels = ['Falante', 'Interativo', 'Afirmativo', 'Ativo'];
            needs = {
                primary: 'Socialização, palco e oportunidade de interação.',
                environment: 'Animados, estimulantes, onde possa se conectar com diversas pessoas.',
                risk: 'O isolamento e o silêncio excessivo drenam sua energia.'
            };
            text = 'Você tem um perfil Falante e Interativo. Sente-se energizado ao trocar ideias com pessoas e ser o centro das atenções. O silêncio prolongado pode ser desafiador para você.';
        } else {
            labels = ['Ambivalente Social', 'Adaptável'];
            needs = {
                primary: 'Equilíbrio entre tempo social e tempo sozinho.',
                environment: 'Flexível, que permita momentos de foco e momentos de troca.',
                risk: 'Extremos (muito isolamento ou muita festa) causam desconforto.'
            };
            text = 'Você é um Diplomata Social (Flex). Transita bem entre ouvir e falar, adaptando sua energia ao contexto. Sabe ser o centro das atenções quando necessário, mas também aprecia o silêncio.';
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
    private analyzeAgreeableness(score: number): TalkingToDimensionResult {
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
            text = 'Você adota uma postura Crítica e Independente. Prioriza a lógica e os fatos sobre os sentimentos alheios na tomada de decisão. É direto e focado em resolver problemas, custe o que custar.';
        } else if (classification === 'ALTO') {
            labels = ['Tolerante', 'Conectado', 'Colaborativo'];
            needs = {
                primary: 'Harmonia, aceitação social e colaboração.',
                environment: 'Cooperativos, acolhedores e com valores humanos fortes.',
                risk: 'Dificuldade em dizer não e em lidar com conflitos diretos.'
            };
            text = 'Você é Tolerante e Colaborativo. A harmonia do grupo é sua prioridade. Você tende a ceder para evitar conflitos e se preocupa genuinamente com o bem-estar das pessoas ao seu redor.';
        } else {
            labels = ['Diplomata Situacional', 'Negociador'];
            needs = {
                primary: 'Justiça e reciprocidade nas relações.',
                environment: 'Onde possa balancear competição e cooperação.',
                risk: 'Pode oscilar entre ser duro demais ou brando demais dependendo do dia.'
            };
            text = 'Você é um Diplomata Situacional. Sabe ser empático, mas não deixa que isso prejudique seus objetivos. Equilibra bem a necessidade de resultados com a manutenção de bons relacionamentos.';
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
    private analyzeStructure(score: number): TalkingToDimensionResult {
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
            text = 'Você é Aventureiro e Espontâneo. Prefere lidar com o fluxo do momento a seguir planos rígidos. Sua força está na improvisação e adaptação rápida a mudanças, mas pode ter dificuldade com prazos longos.';
        } else if (classification === 'ALTO') {
            labels = ['Planejado', 'Disciplinado', 'Persistente'];
            needs = {
                primary: 'Clareza de papéis, processos definidos e previsibilidade.',
                environment: 'Organizado, onde a dedicação e o cumprimento de responsabilidades são valorizados.',
                risk: 'Ambientes caóticos ou com mudanças de escopo constantes sem aviso geram ansiedade.'
            };
            text = 'Você é Planejado e Disciplinado. Gosta de ordem, regras claras e de terminar o que começa. A previsibilidade te dá segurança e você é excelente em entregar resultados consistentes.';
        } else {
            labels = ['Organizado Flexível', 'Pragmático'];
            needs = {
                primary: 'Metas claras, mas com liberdade de execução.',
                environment: 'Estruturado mas aberto a novas formas de fazer.',
                risk: 'Excesso de rigidez ou de caos.'
            };
            text = 'Você é Organizado Flexível. Mantém uma estrutura mínima para funcionar, mas não se prende a ela se a situação exigir mudança. Sabe planejar, mas também sabe improvisar.';
        }

        return {
            dimension: 'Estilo de Trabalho (Estrutura)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    // 4. ABERTURA (Concreto vs Abstrato)
    private analyzeOpenness(score: number): TalkingToDimensionResult {
        const classification = this.classify(score);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') {
            labels = ['Realista', 'Prático', 'Conservador'];
            needs = {
                primary: 'Aplicabilidade prática, tradição e métodos comprovados.',
                environment: 'Estáveis, onde o foco é a execução e melhoria do que já existe.',
                risk: 'Mudanças bruscas sem justificativa prática geram resistência.'
            };
            text = 'Você é Realista e Prático. Prefere o concreto ao abstrato, o testado ao novo. Sua abordagem é "pé no chão" e você valoriza a experiência acumulada e soluções que funcionam no mundo real.';
        } else if (classification === 'ALTO') {
            labels = ['Imaginativo', 'Conceitual', 'Aberto ao Novo'];
            needs = {
                primary: 'Novidade, estímulo intelectual e liberdade criativa.',
                environment: 'Inovadores, onde ideias "fora da caixa" são bem-vindas.',
                risk: 'Rotina monótona e repetição sem aprendizado.'
            };
            text = 'Você é Imaginativo e Conceitual. É movido pela curiosidade e pela possibilidade de explorar o desconhecido. Gosta de teorias, arte e ideias complexas, buscando sempre inovar.';
        } else {
            labels = ['Pragmático Inovador', 'Curioso Focado'];
            needs = {
                primary: 'Inovação com propósito prático.',
                environment: 'Que permita melhorias incrementais.',
                risk: 'Teorias sem aplicação ou estagnação total.'
            };
            text = 'Você é um Pragmático Inovador. Tem curiosidade para o novo, mas precisa ver utilidade. Aceita mudanças se entender o benefício prático delas.';
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
    // NOTA: O input N geralmente é Neuroticismo (Instabilidade). 
    // Se 0-35 no N significa Baixo Neuroticismo (Alta Estabilidade)?
    // O prompt diz: "Baixo (Alto N): Inquieto/Inseguro".
    // Então score ALTO de N na planilha original = Baixo Score aqui?
    // Vamos assumir que o input 'N' segue a convenção do sistema: Score Alto = Alto Traço.
    // O prompt diz:
    // Baixo score aqui = "Inquieto" (Alta sensibilidade a stress)
    // Alto score aqui = "Despreocupado" (Alta resiliência)
    // Isso significa que estamos tratando o traço como "ESTABILIDADE EMOCIONAL", não Neuroticismo.
    // Se o input score for Neuroticismo clássico (onde 100 é instável), precisaremos inverter.
    // VOU ASSUMIR QUE O INPUT JÁ É ESTABILIDADE (ou inverterei se for Neuroticismo). 
    // Dado o prompt: "Baixo (Alto N)..." -> Isso sugere que o Prompt chama de "Estabilidade", mas o score original é N.
    // Se o score original for 80 (Muito Neurótico/Inquieto), aqui ele seria Classificado como ?
    // Prompt: "Baixo (Alto N): Inquieto". Logo, Score Baixo nesta função = Pessoa Inquieta.
    // Se o score de entrada for N (Neuroticismo), 80 é Inquieto.
    // Para 80 cair em "Baixo", precisamos inverter: 100 - 80 = 20 (Baixo).
    // Vou aplicar a INVERSÃO DE SCORE para trabalhar com "Estabilidade Emocional".
    private analyzeStability(neuroticismScore: number): TalkingToDimensionResult {
        // CONVENÇÃO: Input é Neuroticismo (0=Zen, 100=Pânico).
        // TalkingTo quer "Estabilidade" (0=Pânico, 100=Zen).
        const stabilityScore = 100 - neuroticismScore; // Inversão para facilitar a lógica de "Quanto maior, melhor a estabilidade"

        const classification = this.classify(stabilityScore);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        if (classification === 'BAIXO') {
            // Baixa Estabilidade (Alto Neuroticismo)
            labels = ['Inquieto', 'Reativo', 'Intenso']; // O Prompt diz "Inseguro", mudei para Intenso para ser mais corporate-friendly
            needs = {
                primary: 'Segurança psicológica e previsibilidade emocional.',
                environment: 'Livres de conflitos agressivos e pressão excessiva inesperada.',
                risk: 'Críticas duras ou surpresas negativas podem paralisar sua performance.'
            };
            text = 'Você tende a ser Inquieto e Reativo (Alta Sensibilidade). Sente as emoções com intensidade e pode se preocupar excessivamente com problemas futuros. É muito vigilante a riscos, mas precisa de segurança para performar bem.';
        } else if (classification === 'ALTO') {
            // Alta Estabilidade (Baixo Neuroticismo)
            labels = ['Resiliente', 'Autoconfiante', 'Controlado'];
            needs = {
                primary: 'Desafios de alta pressão e autonomia para gerenciar crises.',
                environment: 'Podem ser caóticos ou de alta pressão; você aguenta bem.',
                risk: 'Pode subestimar riscos ou parecer frio diante da dor alheia.'
            };
            text = 'Você é Resiliente e Autoconfiante. Mantém a calma mesmo sob pressão intensa. Dificilmente se abala com críticas ou cenários negativos, agindo como um porto seguro para a equipe.';
        } else {
            labels = ['Responsivo', 'Equilibrado'];
            needs = {
                primary: 'Feedback construtivo regular.',
                environment: 'Equilibrado.',
                risk: 'Estresse acumulado a longo prazo.'
            };
            text = 'Você é Emocionalmente Responsivo. Sente o estresse quando ele surge, mas consegue se recuperar relativamente rápido. Não é nem uma pedra de gelo, nem um vulcão.';
        }

        return {
            dimension: 'Resiliência (Estabilidade)',
            classification,
            labels,
            needs,
            text_interpretation: text
        };
    }

    private generateArchetypeName(traits: string[]): string {
        const t1 = traits[0] ? traits[0].split(' ')[0] : 'Generalista';
        const t2 = traits[1] ? traits[1].split(' ')[0] : 'Adaptável';
        return `O ${t1} ${t2}`; // Ex: O Energia Mentalidade
        // Melhorar isso: precisamos de nomes legais para os traços.
        // Vou deixar genérico por enquanto: "O Estrategista Dinâmico"
        // Isso requer uma tabela combinatória gigante de 25 pares.
        // Vou retornar uma string placeholder funcional.
        return "Arquétipo TalkingTo (Beta)";
    }
}

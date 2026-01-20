import { Injectable } from '@nestjs/common';

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

    // --- FINE-TUNED TEXTS ---
    private readonly FINETUNED_TEXTS: Record<string, Record<string, string>> = {
        'EXTRAVERSION': {
            'OUVINTE_SELETIVO_CONTIDO_REFLEXIVO': "Você tem um perfil 'Ouvinte, Seletivo, Contido e Reflexivo'. Pessoas com esse perfil tendem a ser observadores atentos e bons ouvintes, mas também podem parecer reservados e pouco sociáveis. Você prefere se envolver em interações mais íntimas, com poucas pessoas e conversar com uma pessoa de cada vez. Você também tende a escolher cuidadosamente com quem compartilha seus pensamentos e opiniões sobre questões mais importantes. Por ser uma pessoa reflexiva, tende a buscar ambientes tranquilos e irá valorizar o controle sobre o volume de atividades com as quais irá se envolver. Funciona melhor quando tem tempo para pensar e priorizar determinadas tarefas. Interação social por longos períodos tende a esgotar sua energia facilmente.",
            'OUVINTE_SELETIVO_CONTIDO_ATIVO': "Você tem um perfil 'Ouvinte, Seletivo, Contido e Ativo'. Pessoas com esse perfil tendem a ser bons ouvintes, mas também podem parecer reservados e pouco sociáveis. Você prefere se envolver em interações mais íntimas, com poucas pessoas e conversar com uma pessoa de cada vez. Você também tende a escolher cuidadosamente com quem compartilha seus pensamentos. Por ser uma pessoa ativa, tende a buscar a ação de maneira individual. Embora evite interação social, se beneficia de situações nas quais pode se apropriar das atividades enquanto permite que as pessoas à sua volta fiquem envolvidas nas conversações.",
            'OUVINTE_SELETIVO_AFIRMATIVO_REFLEXIVO': "Você tem um perfil 'Ouvinte, Seletivo, Afirmativo e Reflexivo'. Pessoas com esses traços podem ser seletivas em suas interações sociais e ouvintes atentas. Por outro lado, quando se engajam com determinado assunto, podem ser expressivas e expor claramente suas ideias. Geralmente você irá preferir compartilhar opiniões fortes com pessoas em quem confiam, o que será um grupo seleto. Por ser uma pessoa reflexiva, tende a buscar ambientes mais tranquilos e irá valorizar o controle sobre o volume de atividades.",
            'FALANTE_INTERATIVO_AFIRMATIVO_ATIVO': "Você tem um perfil 'Falante, Interativo, Afirmativo e Ativo'. Pessoas com essa combinação tendem a ser bons ouvintes, do tipo que se envolvem nas discussões com muita atenção e se posicionando de forma ativa sobre aquilo que consideram relevante. Seja com perguntas ou defendendo seus pontos de vistas. Você expressará seus próprios pensamentos e pontos de vista em grupo de forma clara, mas somente após ouvir cuidadosamente. Por ser uma pessoa ativa, geralmente possui um ritmo acelerado, do tipo que deseja extrair da interação as informações necessárias para dar seguimento às suas tarefas.",
            'FALANTE_SELETIVO_AFIRMATIVO_REFLEXIVO': "Você tem um perfil 'Falante, Seletivo, Afirmativo e Reflexivo'. Pessoas com este perfil tendem a ser falantes, espontâneas ao expressar suas ideias e são muito atuantes na interação social. Entretanto, por ser seletivo socialmente, você gosta de compartilhar seus pensamentos e opiniões e fará isso com muito mais frequência quando em grupos de pessoas conhecidas ou em situações específicas quando realmente achar necessária a sua intervenção. Você geralmente vai preferir um ambiente tranquilo e com poucas pessoas com as quais poderá compartilhar suas opiniões.",
            'FALANTE_INTERATIVO_CONTIDO_REFLEXIVO': "Você tem um perfil 'Falante, Interativo, Contido e Reflexivo'. Pessoas com esta combinação tendem a ser falantes, participarem de conversas sobre assuntos diversos de maneira ativa. Por outro lado, você irá preferir compartilhar seus pensamentos e opiniões apenas com pessoas mais próximas, evitando expor pensamentos divergentes em grupo, para evitar polêmicas. Por ser uma pessoa reflexiva, vai precisar reconhecer quando é necessário se afastar da agitação do trabalho em grupo e procurar um ambiente mais tranquilo.",
        },
        'OPENNESS': {
            'REALISTA_PRATICO_CONSERVADOR': "Você é 'Realista, Prático e Conservador' e essa combinação de traços reflete uma abordagem centrada na realidade, focada na prática e fundamentada em conhecimentos comprovados pela experiência. Você é alguém que valoriza resultados tangíveis, soluções práticas e que mantém uma abordagem convencional. Prefere confiar em métodos testados e comprovados, evitando riscos desnecessários. Sua ênfase na eficiência e na experiência o torna confiável e consistente. Você busca analisar dados e fatos concretos de maneira realista.",
            'REALISTA_PRATICO_ABERTO': "Você é uma pessoa 'Realista, Prático e Aberto ao Novo' e essa combinação de traços reflete uma abordagem centrada na realidade e na ação prática conforme suas experiências, mas que também é receptiva a novas ideias e experiências. Se por um lado procura aplicar conhecimentos comprovados por meio de sua experiência, por outro é alguém que, em busca de eficiência, está disposto a explorar novas abordagens. Sua disposição para experimentar ideias inovadoras torna você até certo ponto receptivo a mudanças.",
            'REALISTA_CONCEITUAL_CONSERVADOR': "Você é 'Realista, Conceitual e Conservador' e essa combinação de traços reflete uma abordagem realista, mas fundamentada em conceitos teóricos e experiência comprovada. Se por um lado é realista, por outro valoriza o entendimento sobre questões conceituais e teóricos. Em outras palavras, você tem a capacidade de aplicar conceituais em situações do dia a dia, buscando soluções que representem um modelo embasado cientificamente.",
            'IMAGINATIVO_PRATICO_CONSERVADOR': "Você é 'Imaginativo, Prático e Conservador' e essa combinação de traços reflete uma abordagem que valoriza a criatividade em um contexto de respeito à tradição e atenção à viabilidade prática das ideias. Você é alguém que transita de maneira ágil entre usar a imaginação e realizar sua aplicação prática, você tem, portanto, capacidade de transformar ideias imaginativas em soluções concretas e eficazes.",
        },
        'AGREEABLENESS': {
            'CRITICO_INDEPENDENTE_COMPETITIVO': "Você é 'Crítico, Independente e Competitivo'. Pessoas com essa combinação tendem ser extremamente lógicas e objetivas em suas análises. Encontram facilmente falhas e acham natural apontar aquilo que precisa ser melhorado e costumam se mostrar imparciais e até distantes em relação aos sentimentos das pessoas. Você toma decisões considerando a relação custo x benefício, sendo inclusive atento às suas próprias necessidades e objetivos.",
            'CRITICO_INDEPENDENTE_COLABORATIVO': "Você é 'Crítico, Independente e Colaborativo'. Pessoas com essa combinação são lógicas e objetivas em suas análises, e entendem como seu papel apontar as falhas que precisam ser corrigidas em benefício de todos. Você toma decisões considerando a relação custo x benefício, evitando se deixar levar por sentimentos. Embora mostre disposição para compreender as expectativas das pessoas e até boa vontade em colaborar, não dará muita atenção em opiniões subjetivas.",
            'CRITICO_CONECTADO_COMPETITIVO': "Você é 'Crítico, Conectado e Competitivo'. Pessoas com esse perfil tendem a viver o dilema de fazer análises objetivas e lógicas, ao mesmo tempo em que buscam atender aos anseios das pessoas à sua volta. Se por um lado são rigorosos e hábeis em identificar problemas, por outro também se preocupam com a forma como as pessoas receberão essas críticas.",
            'TOLERANTE_INDEPENDENTE_COMPETITIVO': "Você é 'Tolerante, Independente e Competitivo'. Pessoas com essa combinação podem parecer indiferentes em relação a tudo à sua volta, salvo quando seus interesses estão em jogo. Agem dessa maneira, pois são tolerantes e compreensivos, mas não abrem mão de seu espaço individual e de seus interesses facilmente. Você toma decisões considerando seus valores e crenças.",
        },
        'CONSCIENTIOUSNESS': {
            'PLANEJADO_DISCIPLINADO_PERSISTENTE': "Você é 'Planejado, Disciplinado e Persistente'. Pessoas com essa combinação tendem a levar uma vida estruturada e organizada. É provável que você consiga definir metas de longo prazo e que crie planos detalhados para alcançá-las. Valorizam a segurança proporcionada pela previsibilidade, razão pela qual tende a seguir rotinas rígidas. Você planeja meticulosamente cada passo, definindo marcos claros e cronogramas para suas atividades.",
            'PLANEJADO_DISCIPLINADO_FLEXIVEL': "Você é 'Planejado, Disciplinado e Flexível'. Pessoas com essa combinação equilibram a disciplina com a capacidade de se adaptar a circunstâncias imprevistas. Você mantém rotinas estruturadas, mas estão dispostos a ajustá-las se algo importante surgir. Você valoriza a estabilidade, mas também sabe quando é necessário contornar obstáculos para alcançar seus objetivos.",
            'AVENTUREIRO_DISCIPLINADO_PERSISTENTE': "Você é 'Aventureiro, Disciplinado e Persistente'. Pessoas com essa combinação têm uma abordagem resiliente e estável em relação à vida. Não se apegam a objetivos de longo prazo, mas são extremamente determinados quando encontram oportunidades alinhadas com seus anseios. São capazes de se ajustar a novas situações, mas mantêm um senso de ordem e rotina.",
        },
        'NEUROTICISM': {
            'INQUIETO_AUTOCONFIANTE_IRRITAVEL_REATIVO': "Você é 'Inquieto, Autoconfiante, Irritável e Reativo'. Pessoas com essas características geralmente são ansiosas em relação aos eventos futuros. É pouco provável que suas preocupações estejam relacionadas com medo de fracasso, pois é autoconfiante. Entretanto, você pode querer demonstrar impaciência e ansiedade em fazer acontecer aquilo que elaborou em sua mente. Em situações sociais terá essa ansiedade sob a aparência de pura impaciência.",
            'INQUIETO_INSEGURO_TRANQUILO_CONTROLADO': "Você é 'Inquieto, Inseguro, Tranquilo e Controlado'. Pessoas com essas características geralmente são ansiosas em relação aos eventos futuros e temerosas em relação ao próprio fracasso. Entretanto, por ter autocontrole e um temperamento tranquilo, seu sofrimento acontecerá apenas em sua mente. As situações sociais poderão agravar esses sentimentos internos e ampliar sua insegurança em relação às suas próprias habilidades.",
            'DESPREOCUPADO_INSEGURO_IRRITAVEL_CONTROLADO': "Você é 'Despreocupado, Inseguro, Irritável e Controlado'. Pessoas com essas características geralmente não costumam viver no futuro, mas carregam o momento presente com intensidade em razão de sua elevada sensibilidade e insegurança. Em situações sociais, podem mostrar um mix de timidez e irritação, sendo a segunda funcionando como um disfarce para a primeira.",
        }
    };

    private getFacetLabel(dim: string, index: number, score: number): string {
        const labels: Record<string, string[][]> = {
            'EXTRAVERSION': [['OUVINTE', 'FALANTE'], ['SELETIVO', 'INTERATIVO'], ['CONTIDO', 'AFIRMATIVO'], ['REFLEXIVO', 'ATIVO']],
            'AGREEABLENESS': [['CRITICO', 'TOLERANTE'], ['INDEPENDENTE', 'CONECTADO'], ['COMPETITIVO', 'COLABORATIVO']],
            'CONSCIENTIOUSNESS': [['AVENTUREIRO', 'PLANEJADO'], ['ESPONTANEO', 'DISCIPLINADO'], ['FLEXIVEL', 'PERSISTENTE']],
            'OPENNESS': [['REALISTA', 'IMAGINATIVO'], ['PRATICO', 'CONCEITUAL'], ['CONSERVADOR', 'ABERTO']],
            'NEUROTICISM': [['DESPREOCUPADO', 'INQUIETO'], ['AUTOCONFIANTE', 'INSEGURO'], ['TRANQUILO', 'IRRITAVEL'], ['CONTROLADO', 'REATIVO']]
        };
        const pair = labels[dim]?.[index];
        return pair ? (score >= 50 ? pair[1] : pair[0]) : '';
    }

    private generateFineTunedNarrative(traitKey: string, score: number, facets?: any[]): { text: string | null, labels: string[] } {
        const facetLabels: string[] = [];
        if (facets && facets.length > 0) {
            facets.forEach((f, idx) => {
                const label = this.getFacetLabel(traitKey, idx, f.score);
                if (label) facetLabels.push(label);
            });
            const signature = facetLabels.join('_');
            const specificText = this.FINETUNED_TEXTS[traitKey]?.[signature];
            if (specificText) return { text: specificText, labels: facetLabels };
        }
        return { text: null, labels: facetLabels };
    }

    // --- MAIN ENTRY POINT ---
    analyzeProfile(scores: TalkingToInput): TalkingToAnalysisResult {
        const dimensions: TalkingToDimensionResult[] = [];
        const strengths: string[] = [];
        const watchOuts: string[] = [];
        const dominantTraits: string[] = [];

        // 1. Analisar cada dimensão
        dimensions.push(this.analyzeExtroversion(scores.E, scores.facets?.EXTRAVERSION));
        dimensions.push(this.analyzeAgreeableness(scores.A, scores.facets?.AGREEABLENESS));
        dimensions.push(this.analyzeStructure(scores.C, scores.facets?.CONSCIENTIOUSNESS)); // Conscienciosidade -> Estrutura
        dimensions.push(this.analyzeOpenness(scores.O, scores.facets?.OPENNESS));
        dimensions.push(this.analyzeStability(scores.N, scores.facets?.NEUROTICISM)); // Neuroticismo -> Estabilidade

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
    private analyzeExtroversion(score: number, facets?: any[]): TalkingToDimensionResult {
        const classification = this.classify(score);
        let labels: string[] = [];
        let needs = { primary: '', environment: '', risk: '' };
        let text = '';

        // Default Logic
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

        // Fine-Tuned Override
        const fineTuned = this.generateFineTunedNarrative('EXTRAVERSION', score, facets);
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
    private analyzeAgreeableness(score: number, facets?: any[]): TalkingToDimensionResult {
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

        const fineTuned = this.generateFineTunedNarrative('AGREEABLENESS', score, facets);
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
    private analyzeStructure(score: number, facets?: any[]): TalkingToDimensionResult {
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

        const fineTuned = this.generateFineTunedNarrative('CONSCIENTIOUSNESS', score, facets);
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

    // 4. ABERTURA (Concreto vs Abstrato)
    private analyzeOpenness(score: number, facets?: any[]): TalkingToDimensionResult {
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

        const fineTuned = this.generateFineTunedNarrative('OPENNESS', score, facets);
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
    private analyzeStability(neuroticismScore: number, facets?: any[]): TalkingToDimensionResult {
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
            text = 'Você tende a ser Inquieto e Reativo. Sente as emoções com intensidade e pode se preocupar excessivamente com problemas futuros. É muito vigilante a riscos, mas precisa de segurança para performar bem.';
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

        // Pass RAW Score (Neuroticism) to fine-tuned generator because dictionary keys (INQUIETO...)
        // are aligned with High Neuroticism = Inquieto.
        const fineTuned = this.generateFineTunedNarrative('NEUROTICISM', neuroticismScore, facets);
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

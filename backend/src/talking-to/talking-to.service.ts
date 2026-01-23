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


    // --- FINE-TUNED TEXTS ---
    private readonly FINETUNED_TEXTS: Record<string, Record<string, string>> = {
        'EXTRAVERSION': {
            'OUVINTE_SELETIVO_CONTIDO_REFLEXIVO': "Você tem um perfil 'Ouvinte, Seletivo, Contido e Reflexivo'. Pessoas com esse perfil tendem a ser observadores atentos e bons ouvintes, mas também podem parecer reservados e pouco sociáveis. Você prefere se envolver em interações mais íntimas, com poucas pessoas e conversar com uma pessoa de cada vez. Você também tende a escolher cuidadosamente com quem compartilha seus pensamentos e opiniões sobre questões mais importantes. Por ser uma pessoa reflexiva, tende a buscar ambientes tranquilos e irá valorizar o controle sobre o volume de atividades com as quais irá se envolver. Funciona melhor quando tem tempo para pensar e priorizar determinadas tarefas. Interação social por longos períodos tende a esgotar sua energia facilmente.",
            'OUVINTE_SELETIVO_CONTIDO_ATIVO': "Você tem um perfil 'Ouvinte, Seletivo, Contido e Ativo'. Pessoas com esse perfil tendem a ser bons ouvintes, mas também podem parecer reservados e pouco sociáveis. Você prefere se envolver em interações mais íntimas, com poucas pessoas e conversar com uma pessoa de cada vez. Você também tende a escolher cuidadosamente com quem compartilha seus pensamentos. Por ser uma pessoa ativa, tende a buscar a ação de maneira individual. Embora evite interação social, se beneficia de situações nas quais pode se apropriar das atividades enquanto permite que as pessoas à sua volta fiquem envolvidas nas conversações.",
            'OUVINTE_SELETIVO_AFIRMATIVO_REFLEXIVO': "Você tem um perfil 'Ouvinte, Seletivo, Afirmativo e Reflexivo'. Pessoas com esses traços podem ser seletivas em suas interações sociais e ouvintes atentas. Por outro lado, quando se engajam com determinado assunto, podem ser expressivas e expor claramente suas ideias. Geralmente você irá preferir compartilhar opiniões fortes com pessoas em quem confiam, o que será um grupo seleto. Por ser uma pessoa reflexiva, tende a buscar ambientes mais tranquilos e irá valorizar o controle sobre o volume de atividades.",
            'OUVINTE_SELETIVO_AFIRMATIVO_ATIVO': "Você tem um perfil 'Ouvinte, Seletivo, Afirmativo e Ativo'. Pessoas com esses traços podem ser seletivas em suas interações sociais, e ouvintes atentas. Por outro lado, quando se engajam com determinado assunto, podem ser expressivos e expor claramente suas ideias. Geralmente você irá preferir compartilhar opiniões fortes com pessoas em quem confiam, o que será um grupo seleto. Por ser uma pessoa ativa, tende a ser proativo, mas fará isso de maneira discreta. Embora evite interação social, se beneficia de situações nas quais pode se apropriar das atividades enquanto permite que as pessoas fiquem envolvidas nas conversações. Utilizará seu estilo afirmativo para dar um direcionamento às pessoas e para esclarecer quais atividades deseja assumir para si.",
            'OUVINTE_INTERATIVO_CONTIDO_REFLEXIVO': "Você tem um perfil 'Ouvinte, Interativo, Contido e Reflexivo'. Pessoas com essa combinação tendem a ser bons ouvintes, do tipo que se envolvem nas discussões falando pouco, mas eventualmente com perguntas pontuais que deixarão claro seu interesse, embora permaneçam introvertidos e evitem expressar seus próprios pensamentos e pontos de vista. Você provavelmente se fará presente em grupos, mas será mais contido em relação a expressar suas próprias opiniões. Por ser uma pessoa reflexiva, geralmente possui um ritmo próprio e deseja fazer as coisas em seu próprio tempo. Em contrapartida, tende a se sentir estimulado quando tem a oportunidade de interagir com as pessoas. Deste modo, embora procure socializar e aprecie participar de conversações em grupo, funciona melhor quando tem tempo para pensar e priorizar determinadas tarefas. Interação social por longos períodos pode esgotar sua energia, é importante administrar isso.",
            'OUVINTE_INTERATIVO_CONTIDO_ATIVO': "Você tem um perfil 'Ouvinte, Interativo, Contido e Ativo'. Pessoas com essa combinação tendem a ser bons ouvintes, do tipo que se envolvem nas discussões falando pouco, mas eventualmente com perguntas pontuais que deixarão claro seu interesse, embora permaneçam introvertidos e evitem expressar seus próprios pensamentos e pontos de vista. Você provavelmente se fará presente em grupos, mas será mais contido em relação a expressar suas próprias opiniões. Por ser uma pessoa ativa, você se sente estimulado quando tem a oportunidade de interagir com as pessoas. Funciona melhor quando se enxergam cercado de pessoas e envolvido diretamente com a ação. Embora seja discreto e fale pouco, é importante evitar longos períodos sozinho. Estar em grupo lhe faz bem.",
            'OUVINTE_INTERATIVO_AFIRMATIVO_REFLEXIVO': "Você tem um perfil 'Ouvinte, Interativo, Afirmativo e Reflexivo'. Pessoas com essa combinação tendem a ser bons ouvintes, do tipo que se envolvem nas discussões falando sobre aquilo que consideram relevante, fazendo questionamentos para melhor compreender os assuntos de seu interesse. Você expressará seus próprios pensamentos e pontos de vista em grupo sem rodeios, mas somente quando achar necessário fazer contrapontos. Por ser uma pessoa reflexiva, geralmente possui um ritmo próprio e deseja fazer as coisas em seu próprio tempo. Em contrapartida, tende a se sentir estimulado quando tem a oportunidade de interagir com as pessoas. Deste modo, embora aprecie participar de conversações em grupo, funciona melhor quando consegue intercalar momentos de interação com ocasiões nas quais possa pensar e priorizar determinadas tarefas.",
            'OUVINTE_INTERATIVO_AFIRMATIVO_ATIVO': "Você tem um perfil 'Ouvinte, Interativo, Afirmativo e Ativo'. Pessoas com essa combinação tendem a ser bons ouvintes, do tipo que se envolvem nas discussões falando pouco, mas eventualmente fazendo questionamentos para melhor compreender os assuntos de seu interesse. Você expressará seus próprios pensamentos e pontos de vista em grupo de forma clara, mas somente após ouvir cuidadosamente sobre o tema da discussão. Por ser uma pessoa ativa, geralmente possui um ritmo acelerado, do tipo que deseja extrair da interação as informações necessárias para dar seguimento às suas tarefas. Deste modo, é provável que procure ser participativo, mas um tanto diretivo a fim de esclarecer aquilo que considera necessário para prosseguir com as ações necessárias.",
            'FALANTE_SELETIVO_CONTIDO_REFLEXIVO': "Você tem um perfil 'Falante, Seletivo, Contido e Reflexivo'. Pessoas com esse perfil tendem a passar a maior parte do tempo com um comportamento silencioso e discreto. Entretanto, em conversas um a um ou com pessoas conhecidas podem surpreender falando bastante sobre diversos assuntos. Você prefere se envolver em interações mais íntimas, com poucas pessoas e conversar com uma pessoa de cada vez. Você também tende a escolher cuidadosamente com quem compartilha seus pensamentos e opiniões sobre questões mais importantes, mas quando encontra pessoas de confiança pode ser bastante expressivo. Por ser uma pessoa reflexiva, tende a buscar ambientes tranquilos e irá valorizar o controle sobre o volume de atividades com as quais irá se envolver. Funciona melhor quando tem tempo para pensar e priorizar determinadas tarefas. Interação social por longos períodos tende a esgotar sua energia facilmente.",
            'FALANTE_SELETIVO_CONTIDO_ATIVO': "Você tem um perfil 'Falante, Seletivo, Contido e Ativo'. Pessoas com esse perfil tendem a passar a maior parte do tempo com um comportamento silencioso e discreto. Entretanto, em conversas um a um ou com pessoas conhecidas podem surpreender falando bastante sobre diversos assuntos. Você prefere se envolver em interações mais íntimas, com poucas pessoas e conversar com uma pessoa de cada vez. Você também tende a escolher cuidadosamente com quem compartilha seus pensamentos e opiniões sobre questões mais importantes, mas quando encontra pessoas de confiança pode ser bastante comunicativo. Por ser uma pessoa ativa, tende a focar sua energia no cumprimento de suas tarefas sem dar muita atenção ao que se passa à sua volta.",
            'FALANTE_SELETIVO_AFIRMATIVO_REFLEXIVO': "Você tem um perfil 'Falante, Seletivo, Afirmativo e Reflexivo'. Pessoas com este perfil tendem a ser falantes, espontâneas ao expressar suas ideias e são muito atuantes na interação social. Entretanto, por ser seletivo socialmente, você gosta de compartilhar seus pensamentos e opiniões e fará isso com muito mais frequência quando em grupos de pessoas conhecidas ou em situações específicas quando realmente achar necessária a sua intervenção. Você geralmente vai preferir um ambiente tranquilo e com poucas pessoas com as quais poderá compartilhar suas opiniões.",
            'FALANTE_SELETIVO_AFIRMATIVO_ATIVO': "Você tem um perfil 'Falante, Seletivo, Afirmativo e Ativo'. Pessoas com este perfil tendem a ser falantes, espontâneas ao expressar suas ideias e são muito atuantes na interação social. Entretanto, por ser seletivo socialmente, você tende a escolher os grupos de pessoas com as quais se sente mais à vontade para ser mais falante e comunicativo. Você normalmente vai preferir um ambiente agitado, com momentos de socialização, algo que costuma ser estimulante. Embora consiga sustentar sua energia em ambientes assim por longos períodos, o fato de ser seletivo socialmente poderá fazê-lo se \"cansar\" das pessoas, não das tarefas.",
            'FALANTE_INTERATIVO_CONTIDO_REFLEXIVO': "Você tem um perfil 'Falante, Interativo, Contido e Reflexivo'. Pessoas com esta combinação tendem a ser falantes, participarem de conversas sobre assuntos diversos de maneira ativa. Por outro lado, você irá preferir compartilhar seus pensamentos e opiniões apenas com pessoas mais próximas, evitando expor pensamentos divergentes em grupo, para evitar polêmicas. Por ser uma pessoa reflexiva, vai precisar reconhecer quando é necessário se afastar da agitação do trabalho em grupo e procurar um ambiente mais tranquilo.",
            'FALANTE_INTERATIVO_CONTIDO_ATIVO': "Você tem um perfil 'Falante, Interativo, Contido e Ativo'. Pessoas com este perfil tendem a ser falantes, participarem de conversas sobre assuntos diversos de maneira ativa e cheia de energia. Por outro lado, você irá preferir compartilhar seus pensamentos e opiniões apenas com pessoas mais próximas, em quem confie. No grupo, vai preferir não tomar partido, especialmente diante de temas polêmicos. Por ser uma pessoa ativa, irá encontrar na agitação do trabalho em grupo um ambiente que será energizante para você. Você funciona bem trabalhando sob demanda e dividirá sua energia entre tarefas e momentos para socializar, algo que também é importante para você.",
            'FALANTE_INTERATIVO_AFIRMATIVO_REFLEXIVO': "Você tem um perfil 'Falante, Interativo, Afirmativo e Reflexivo'. Pessoas com este perfil tendem a ser falantes, espontâneas ao expressar suas ideias e são muito atuantes na interação social. Você gosta de compartilhar seus pensamentos e opiniões e fará isso sem rodeios, independentemente da platéia. Você irá encontrar na agitação do trabalho em grupo um ambiente que em um primeiro momento envolvente para você. Entretanto, como apresenta uma necessidade de reflexão, pode ver sua energia e produtividade cair caso permaneça em ambientes agitados por longos períodos. É importante que reconheça os momentos nos quais é importante tirar um tempo para reflexão.",
            'FALANTE_INTERATIVO_AFIRMATIVO_ATIVO': "Você tem um perfil 'Falante, Interativo, Afirmativo e Ativo'. Pessoas com essa combinação tendem a ser bons ouvintes, do tipo que se envolvem nas discussões com muita atenção e se posicionando de forma ativa sobre aquilo que consideram relevante. Seja com perguntas ou defendendo seus pontos de vistas. Você expressará seus próprios pensamentos e pontos de vista em grupo de forma clara, mas somente após ouvir cuidadosamente. Por ser uma pessoa ativa, geralmente possui um ritmo acelerado, do tipo que deseja extrair da interação as informações necessárias para dar seguimento às suas tarefas.",
        },
        'OPENNESS': {
            'REALISTA_PRATICO_CONSERVADOR': "Você é 'Realista, Prático e Conservador' e essa combinação de traços reflete uma abordagem centrada na realidade, focada na prática e fundamentada em conhecimentos comprovados pela experiência. Você é alguém que valoriza resultados tangíveis, soluções práticas e que mantém uma abordagem convencional. Prefere confiar em métodos testados e comprovados, evitando riscos desnecessários. Sua ênfase na eficiência e na experiência o torna confiável e consistente. Você busca analisar dados e fatos concretos de maneira realista.",
            'REALISTA_PRATICO_ABERTO': "Você é uma pessoa 'Realista, Prático e Aberto ao Novo' e essa combinação de traços reflete uma abordagem centrada na realidade e na ação prática conforme suas experiências, mas que também é receptiva a novas ideias e experiências. Se por um lado procura aplicar conhecimentos comprovados por meio de sua experiência, por outro é alguém que, em busca de eficiência, está disposta a explorar novas abordagens. Sua disposição para experimentar ideias inovadoras, torna você até certo ponto receptivo a mudanças. Você costuma mostrar disposição para buscar soluções novas, mas não sem antes pesquisar se já foram utilizadas e quais resultados foram alcançados, pois confia em dados e fatos concretos. Ao equilibrar o realismo e se manter aberto ao novo, você consegue obter informações sobre tudo que existe de novo, considerando essas ideias bem vindas, mas fará isso de modo criterioso, com base em resultados tangíveis e ponderando sobre a viabilidade prática no contexto específico onde está inserido. Deste modo, sua capacidade de equilibrar eficiência e inovação o torna valioso em ambientes que permanecem receptivos à mudança, sem abrir mão de alcançar resultados viáveis.",
            'REALISTA_CONCEITUAL_CONSERVADOR': "Você é 'Realista, Conceitual e Conservador' e essa combinação de traços reflete uma abordagem realista, mas fundamentada em conceitos teóricos e experiência comprovada. Se por um lado é realista, por outro valoriza o entendimento sobre questões conceituais e teóricos. Em outras palavras, você tem a capacidade de aplicar conceituais em situações do dia a dia, buscando soluções que representem um modelo embasado cientificamente. Sua confiança na experiência o torna adepto do método científico de validação de conceitos por meio de experimentação. Ao equilibrar o realismo e interesse em conceitos, você consegue aplicar ideias teóricas no mundo real. Você é capaz de inovar dentro dos limites das tradições estabelecidas, de maneira até certo ponto conservadora. Sua capacidade de trazer teorias abstratas para o mundo real e concreto, o torna contribuinte valioso em ambientes que buscam trazer aprimoramentos de maneira embasada e respeitando tudo aquilo que funciona e os próprios valores culturais do contexto onde está inserido.",
            'REALISTA_CONCEITUAL_ABERTO': "Você é 'Realista, Conceitual e Aberto ao Novo' e essa combinação de traços reflete uma pessoa que é aberta a novas experiências, mas com uma abordagem realista. Embora seja 'pés no chão', aprecia aprofundar seus conhecimentos estudando sobre conceitos e teorias e valoriza a criatividade. Você tem a capacidade de trazer abordagens teóricas para uma análise de como se aplicariam na realidade presente, ao mesmo tempo em que está disposto a experimentar novas perspectivas. Além disso, ao equilibrar o realismo e novos conceitos, você consegue separar teorias críticas de conceitos comprovados com facilidade. Deste modo, você é capaz de identificar a utilidade dessas ideias teóricas e sua aplicação na realidade presente, ao passo que ainda se mantém uma pessoa aberta a novas experiências. Essas características torna você alguém valioso em ambientes que buscam tanto a eficiência quanto a inovação.",
            'IMAGINATIVO_PRATICO_CONSERVADOR': "Você é 'Imaginativo, Prático e Conservador' e essa combinação de traços reflete uma abordagem que valoriza a criatividade em um contexto de respeito à tradição e atenção à viabilidade prática das ideias. Você é alguém que transita de maneira ágil entre usar a imaginação e realizar sua aplicação prática, você tem, portanto, capacidade de transformar ideias imaginativas em soluções concretas e eficazes. Ao equilibrar a imaginação e a abordagem prática, você consegue aplicar ideias criativas de maneira eficiente e em conformidade com a expectativa do meio onde está inserido, tornando pessoas como você verdadeiros ativos valiosos em ambientes que buscam equilibrar inovação com a busca pela realização de resultados tangíveis respeitando aquilo que é valorizado pelas pessoas do meio.",
            'IMAGINATIVO_PRATICO_ABERTO': "Você é 'Imaginativo, Prático e Aberto ao Novo' e essa combinação de traços reflete uma abordagem criativa e disposta a explorar novas ideias e experiências, mas com uma necessidade de experimentar na prática. Você é alguém que tem imaginação fértil e que sabe lidar com pensamentos abstratos. Entretanto, tem uma tendência natural a pensar em como aplicar essas ideias na prática, mesmo quando se trata de novas perspectivas e abordagens pouco convencionais. Ao equilibrar a imaginação e a abordagem prática, você provavelmente consegue fazer associação entre ideias criativas e ponderar sobre a forma como será possível implementá-las. Você tem potencial para atuar como agente de inovação, pois ao mesmo tempo que é impulsionado pela criatividade e pela busca por novas perspectivas, deseja enxergar na prática os efeitos e resultados de suas ideias. Isso torna você uma pessoa valiosa para conduzir processos de inovação.",
            'IMAGINATIVO_CONCEITUAL_CONSERVADOR': "Você é 'Imaginativo, Conceitual e Conservador' e essa combinação de traços reflete uma abordagem criativa, que é ancorada pelo respeito àquilo que a experiência comprovadamente validou. Ao equilibrar a imaginação e a abordagem conceitual, você revela ter potencial para buscar inovação, justamente porque além de ter uma tendência natural a pensar de maneira criativa, também é curioso por compreender como as coisas funcionam por meio de modelos teóricos e conceituais. Por outro lado, a forma como irá conduzir a implementação dessas novas abordagens, revela ser conservadora, ou seja, é adepto de mudanças calculadas de modo que não gerem desconforto para si mesmo e todos aqueles que possuem maior apego a modelos tradicionais. Essas habilidades tornam você um ativo valioso em ambientes que valorizam a criatividade, mas que desejam respeito à tradição e mudanças gradativas.",
            'IMAGINATIVO_CONCEITUAL_ABERTO': "Você é 'Imaginativo, Conceitual e Aberto ao Novo' e essa combinação de traços reflete uma abordagem bastante criativa e teórica, que é impulsionada por uma disposição em explorar novas ideias e experiências. Você tem uma tendência natural a pensar de maneira inovadora e a buscar novas perspectivas, sempre receptivo a abordagens não convencionais. Você é impulsionado pelo novo, que funciona como combustível para sua criatividade. Ao equilibrar a imaginação e a abordagem teórica, você consegue fazer associação entre diferentes conceitos o que amplia sua capacidade de aprendizado e o ajuda a enxergar inúmeras possibilidades e, portanto, também simplifica seu potencial criativo. Essa sua capacidade torna você uma pessoa valiosa em ambientes que buscam a inovação e a exploração de novas ideias de modo constante.",
        },
        'AGREEABLENESS': {
            'CRITICO_INDEPENDENTE_COMPETITIVO': "Você é 'Crítico, Independente e Competitivo'. Pessoas com essa combinação tendem ser extremamente lógicas e objetivas em suas análises. Encontram facilmente falhas e acham natural apontar aquilo que precisa ser melhorado e costumam se mostrar imparciais e até distantes em relação aos sentimentos das pessoas. Você toma decisões considerando a relação custo x benefício, sendo inclusive atento às suas próprias necessidades e objetivos. Você pesa as opções de forma impessoal, evitando a influência de sentimentos ou a opinião das pessoas, que podem ter maior peso na medida em que se mostrem mais ou menos competentes e capazes de argumentar com lógica. Quando você está diante de erros, costuma ser direto e objetivo e, quando confrontado, quase nunca leva a crítica para o lado pessoal. Buscam priorizadamente a eficiência. Na atuação em grupo, você valoriza sua autonomia e o respeito à própria individualidade e sabe respeitar as figuras de autoridade. Prefere realizar as tarefas que lhes competem de forma autônoma aplicando suas habilidades. Pode resistir a seguir ou se conformar com normas de grupo que não lhe pareçam razoáveis, o que pode levar a desafios de colaboração. Quando negocia, você tem clareza em relação às vantagens pessoais que deseja, assim como sobre os resultados que almeja, o que o torna pronto para competir e defender seus interesses. Espero que o outro faça da mesma forma, pois acredita que cada um deva ser responsável por seus próprios interesses.",
            'CRITICO_INDEPENDENTE_COLABORATIVO': "Você é 'Crítico, Independente e Colaborativo'. Pessoas com essa combinação são lógicas e objetivas em suas análises, e entendem como seu papel apontar as falhas que precisam ser corrigidas em benefício de todos que são parte da situação, pois podem surpreender por sua disposição em contribuir com as pessoas. Você toma decisões considerando a relação custo x benefício, evitando se deixar levar por sentimentos. Embora mostre disposição para compreender as expectativas das pessoas e até boa vontade em colaborar, não dará muita atenção em opiniões subjetivas ou necessidades relacionadas a sentimentos. Quando confrontado com erros, você é direto e objetivo, raramente encarando críticas como algo pessoal. Busca prioritariamente a eficiência, especialmente quando o resultado alcançado traz benefícios para todos envolvidos. Na atuação em grupo, considera fundamental que sua autonomia e individualidade seja respeitada, ao mesmo tempo em que valoriza a cooperação. Por essa razão, mostra boa vontade em ajudar as pessoas. Em negociações, você busca soluções que beneficiem a todos, mas faz isso com uma visão impessoal, ou seja, não o faz como gesto de apreciação ou sensibilidade, mas é movido por um senso de justiça imparcial, sendo esse o espírito que deseja das pessoas também.",
            'CRITICO_CONECTADO_COMPETITIVO': "Você é 'Crítico, Conectado e Competitivo'. Pessoas com essa combinação tendem a viver o dilema de fazer análises objetivas e lógicas, ao mesmo tempo em que buscam atender aos anseios das pessoas à sua volta. Se por um lado são rigorosos e hábeis em identificar problemas, por outro também se preocupam com a forma como as pessoas receberão essas críticas. Você toma decisões considerando não apenas a relação custo x benefício, mas se preocupa com os impactos de suas decisões sobre aqueles com os quais possui laços de afeto. Quando é preciso lidar com erros, você acha mais fácil abordá-los de forma direta e objetiva, porém, com pessoas próximas, é provável que fique desconfortável ao perceber que pode desagradá-las, e isso fará você algumas vezes evitar a crítica direta. Na atuação em grupo, mesmo sendo uma pessoa mais lógica, esforça-se para compreender os anseios das pessoas, pois valoriza a sensação de pertencimento. Você tende a buscar essa aceitação, mas como também é competitivo, assumir um papel de representante dos interesses do grupo pode ser a solução. Ao negociar, tende a ser competitivo, entretanto, pode se sentir em um impasse entre ter seus interesses atendidos pagando o preço da impopularidade ou prevalecer e ter que lidar com o desconforto da reprovação social. Por essa razão, é mais provável que se esforce para evitar confrontos diretos.",
            'CRITICO_CONECTADO_COLABORATIVO': "Você é 'Crítico, Conectado e Colaborativo'. Pessoas com essa combinação tendem a ser rigorosos em suas análises, sendo hábeis em identificar falhas. Por outro lado, é o tipo de pessoa que cultiva e valoriza o sentimento de pertencimento e atuação colaborativa. Você se sente mais seguro quando utiliza a lógica para tomar decisões, mas não sem antes ouvir as pessoas envolvidas e considerar os desdobramentos de suas decisões sobre elas. Pode ser difícil, entretanto, avaliar questões mais sujeitas e sentimentos que você pode considerar desproporcionais, o que fará você ser muito questionador em busca de compreensão e também tentar se justificar com certa frequência em relação às suas escolhas. Na atuação em grupo, você provavelmente se mostrará envolvido com as pessoas e tarefas e mostrará um espírito colaborativo. Você irá valorizar a harmonia do grupo e se esforçar para criar um ambiente de apoio e cooperação, mas utilizará seu lado lógico para fazer perguntas nem sempre agradáveis para apontar aquilo que precisa ser melhorado. Ser compreendido pelas pessoas é, portanto, algo importante para você, pois só assim se sentirá à vontade para que suas análises e questionamentos sejam recebidos como forma de apoio à melhoria e não como uma crítica não construtiva. Ao negociar, irá priorizar a manutenção de relações positivas. Estará disposto a ceder e colaborar para alcançar acordos mutuamente benéficos.",
            'TOLERANTE_INDEPENDENTE_COMPETITIVO': "Você é 'Tolerante, Independente e Competitivo'. Pessoas com essa combinação podem parecer indiferentes em relação a tudo à sua volta, salvo quando seus interesses estão em jogo. Agem dessa maneira, pois são tolerantes e compreensivos, mas não abrem mão de seu espaço individual e de seus interesses facilmente. Você toma decisões considerando seus valores e crenças e de modo indiferente a protestos daqueles que discordem de suas opiniões e posicionamentos. É o tipo de pessoa bastante tolerante em relação às escolhas das outras pessoas e que, nesse mesmo sentido, não gosta de interferência externa com \"suas coisas\". Você acredita que cada pessoa é que deva ficar preocupada com suas próprias falhas e expectativas. Na atuação em grupo, você levará em consideração o impacto das ações nos seus próprios sentimentos, do mesmo modo em que será hábil para compreender o que o outro está sentindo e respeitar isso. A incompatibilidade entre crenças e valores, provavelmente gerará um certo afastamento do grupo de sua parte. Você tende a se afastar diante de divergências, mas saberá defender seus pontos de vista se seu espaço for ameaçado. Ao negociar poderá apresentar posturas bem distintas, dependendo do que está em jogo. Quando estiver lidando com algo que não considera importante, mostrará muita disponibilidade para conceder. Entretanto, será uma pessoa competitiva quando questões relevantes para você estiverem em jogo, e não estamos necessariamente considerando apenas coisas tangíveis.",
            'TOLERANTE_INDEPENDENTE_COLABORATIVO': "Você é 'Tolerante, Independente e Colaborativo'. Pessoas com essa combinação tendem a ser agradáveis na convivência e guardar um \"ar de mistério\", pois embora sejam tolerantes, disponíveis para colaborar e apreciem o sentimento de construção em grupo, por outro preservam sua autonomia e irão estabelecer vínculos com poucas pessoas, raramente farão questão de fazer parte de grupos sociais. Ao tomar decisões, você irá considerar seus valores e crenças, assim como o impacto de suas decisões nas pessoas no contexto em que isso fizer sentido. É provável que pouquíssimas pessoas, aquelas que realmente você admira, tenham um espaço reservado no qual a opinião delas é muito importante para você. Nesse mesmo sentido, é provável que só manifeste suas opiniões mais críticas ou forneça conselhos para aqueles realmente possuem um vínculo mais próximo com você. Na atuação em grupo, você irá considerar as perspectivas e contextos das pessoas envolvidas e apresentará um espírito colaborativo. É provável que busque o consenso para todas medidas que tenham impacto coletivo. Para você ser compreendido é mais importante do que ser incluído. Ao negociar, irá buscar soluções que beneficiem a todos. Embora valorizem a colaboração, também podem defender seus interesses individuais de maneira estratégica. É possível inclusive que quando não enxerga reciprocidade em relação à disposição em colaborar, prefira se afastar do grupo, ao invés de adotar uma postura combativa.",
            'TOLERANTE_CONECTADO_COMPETITIVO': "Você é 'Tolerante, Conectado e Competitivo'. Pessoas com essa combinação procuram ser empáticas e compreender as razões das pessoas à sua volta, pois valorizam o sentimento de serem compreendidas e de pertencer a grupos sociais. Querem fazer parte do grupo. Ao tomar decisões, você irá considerar tanto os seus sentimentos como aqueles das pessoas à sua volta. Entretanto, não abrirá mão facilmente daquilo que acredita ser o melhor para você e para as pessoas, e se esforçará para convencer seu entorno de seguir conforme seu entendimento. Na atuação em grupo, irá valorizar a tolerância e o respeito às diferenças e buscará estabelecer vínculos e proximidade com todos. Não costuma apontar erros, pelo contrário, respeita inclusive as diferentes formas de agir de cada um e, por isso, pode ficar incomodado quando o outro aponta suas falhas, situações nas quais fatalmente irá contra-argumentar. Ao negociar, pessoas como você que busca aceitação, mas são competitivos, podem se esforçar para demonstrar suas habilidades ao grupo, buscando reconhecimento e validação a fim de que por meio desse reconhecimento possam ampliar sua influência e satisfazer suas necessidades e interesses sem provocar rejeição.",
            'TOLERANTE_CONECTADO_COLABORATIVO': "Você é 'Tolerante, Conectado e Colaborativo'. Pessoas com essa combinação tendem a ser realmente compreensivas. Irão mostrar tolerância tanto em relação às diferenças interpessoais, como em relação a eventuais falhas e erros, pois procurarão entender as circunstâncias e ajudar a resolver problemas, minimizando o impacto nas relações. Ao tomar decisões certamente você pesará os seus sentimentos e os sentimentos das pessoas à sua volta, muitas vezes em detrimento de resultados objetivos. Para você o bem estar das pessoas deve estar acima de resultados objetivos. Na atuação em grupo, você será bastante colaborativo e amigável para se relacionar. Valoriza tanto a harmonia do grupo, como ser compreendido. Fará esforços para criar um ambiente de apoio e cooperação e também para ser aceito, pois se sentir parte do grupo é algo importante para você. Em uma negociação, priorizam a manutenção de relações positivas. Estão dispostos a ceder e colaborar para alcançar acordos mutuamente benéficos. Perseguirá soluções ganha-ganha, mas estará disposto a fazer concessões em prol do grupo quando isso não for possível.",
        },
        'CONSCIENTIOUSNESS': {
            'AVENTUREIRO_ESPONTANEO_FLEXIVEL': "Você é 'Aventureiro, Espontâneo e Flexível'. Pessoas com essa combinação equilibram a disciplina com a capacidade de se adaptar a circunstâncias imprevistas. Você mantém rotinas estruturadas, mas estão dispostos a ajustá-las se algo importante surgir. Você valoriza a estabilidade, mas também sabe quando é necessário contornar obstáculos para alcançar seus objetivos. Apesar disso, mudanças de rota não devem comprometer os prazos e acordos já assumidos. Você cria planos sólidos, e procura segui-los de maneira sistemática. Entretanto, na medida em que se depara com desafios capazes de convencê-lo da necessidade de utilizar rotas alternativas, você tende a proceder desta forma, pois considera que em diferentes cenários modificações podem ser necessárias. Você toma decisões ponderadas, pesando as opções com base em informações disponíveis.",
            'AVENTUREIRO_ESPONTANEO_PERSISTENTE': "Você é 'Planejado, Espontâneo e Persistente'. Pessoas com esse combinação geralmente adotam uma abordagem balanceada entre a organização e a espontaneidade. Embora possuam um plano geral e sejam persistentes em relação aos seus objetivos, também se permitem agir de forma espontânea de vez em quando. Valorizam a segurança de um plano, mas é provável que não resistam a \"emoção\" de oportunidades que surgem do inesperado. Por essa razão, você cria planos mais abrangentes, que permitem espaço para aproveitar momentos espontâneos. Se por um lado pode ser bastante flexível na gestão de seu dia a dia, é pouco provável que considere alterar prazos e compromissos de maior relevância. É possível que mantenha uma lista de tarefas e objetivos a serem cumpridos, mas que seja flexível e uma pessoa disposta a se adaptar conforme surgem novas oportunidades ou desafios. Você tomam decisões considerando tanto os benefícios de longo prazo, sem descartar eventuais recompensas imediatas.",
            'AVENTUREIRO_DISCIPLINADO_FLEXIVEL': "Você é 'Aventureiro, Disciplinado e Flexível'. Indivíduos com essa combinação têm uma abordagem equilibrada entre a adaptação e a disciplina. São capazes de mudar de direção quando necessário, mas ainda valorizam a organização e a estrutura em suas vidas. Em outras palavras, você se sente produtivo quando tem uma programação, uma agenda a a ser executada, na qual possa organizar tempo para seus compromissos. Valorizam a autonomia em suas vidas mais do que segurança e estabilidade. Criam planos a partir de visões abrangentes sobre o que desejam, que podem ser facilmente ajustados a novas situações, inclusive porque, diante de obstáculos, preferem buscar caminhos alternativos do que insistir em seus planos iniciais. Por essa razão, tendem a postergar suas decisões até o momento em que entendem que suas ideias amadureceram e que é necessário fazer uma escolha.",
            'AVENTUREIRO_DISCIPLINADO_PERSISTENTE': "Você é 'Aventureiro, Disciplinado e Persistente'. Pessoas com essa combinação têm uma abordagem resiliente e estável em relação à vida. Não se apegam a objetivos de longo prazo, mas são extremamente determinados quando encontram oportunidades alinhadas com seus anseios. São capazes de se ajustar a novas situações, mas mantêm um senso de ordem e rotina. Valorizam o retorno positivo de uma rotina em termos de eficiência, mas deseja liberdade para rever os aspectos mais abrangentes de seus planos conforme muda suas expectativas. Você é o tipo de pessoa que faz planos gerais de acordo com as mudanças no ambiente, mas sempre mantém uma certa disciplina a fim de satisfazer suas expectativas do momento. São capazes de reajustar prazos e abordagens, mas não desviam do caminho com facilidade. Você tende a tomar decisões visando resultados no curto prazo. É curioso como embora seja uma pessoa que encara a vida como uma grande aventura, leva muito a sério aquilo que precisa ser feito para alcançar uma meta quando a define.",
            'PLANEJADO_ESPONTANEO_FLEXIVEL': "Você é 'Planejado, Espontâneo e Flexível'. Pessoas com essa combinação levam uma vida dinâmica e repleta de surpresas. Mantêm planos gerais, mas não se prendem a uma programação estruturada ou detalhes rígidos. Encontram segurança justamente na flexibilidade e a liberdade para explorar novas experiências. Você cria esboços de planos que são mais abertos e maleáveis, inclusive mostra disposição e flexibilidade para renegociar prazos ou realizar compromissos quando necessário. É provável que você valorize a criatividade e que esteja disposto a abandonar um plano se algo mais empolgante surgir. Seu processo de tomada de decisão é orientado por uma visão de longo prazo, de modo que seus planos precisam manter opções em aberto, ou seja, não abre mão de seu desejo de ser livre para aproveitar novas oportunidades.",
            'PLANEJADO_ESPONTANEO_PERSISTENTE': "Você é 'Aventureiro, Espontâneo e Persistente'. Pessoas com essa combinação têm uma abordagem versátil e determinada em relação à vida. São capazes de se adaptar a diferentes contextos, agindo com espírito aventureiro quando necessário, mas podem surpreender ao mostrar ter um foco constante no que diz respeito às suas metas e ambições. Você valoriza muito mais a autonomia e a flexibilidade do que segurança e estabilidade. Cria planos gerais e flexíveis que podem ser ajustados conforme entenda ser necessário. Suas listas de tarefas ficam abertas tanto para incluir novos compromissos como para excluir aqueles que não fazem mais sentido para você. Você mostra disposição para assumir riscos em suas decisões, pois além de ter um elevado senso de oportunidade, costuma ser adaptável e flexível. Pode até ter uma visão de longo prazo, mas seu ponto forte é justamente a combinação de sua persistência para perseguir aquilo que deseja com seu espírito empreendedor.",
            'PLANEJADO_DISCIPLINADO_FLEXIVEL': "Você é 'Planejado, Disciplinado e Flexível'. Pessoas com essa combinação equilibram a disciplina com a capacidade de se adaptar a circunstâncias imprevistas. Você mantém rotinas estruturadas, mas estão dispostos a ajustá-las se algo importante surgir. Você valoriza a estabilidade, mas também sabe quando é necessário contornar obstáculos para alcançar seus objetivos.",
            'PLANEJADO_DISCIPLINADO_PERSISTENTE': "Você é 'Planejado, Disciplinado e Persistente'. Pessoas com essa combinação tendem a levar uma vida estruturada e organizada. É provável que você consiga definir metas de longo prazo e que crie planos detalhados para alcançá-las. Valorizam a segurança proporcionada pela previsibilidade, razão pela qual tende a seguir rotinas rígidas. Você planeja meticulosamente cada cada passo, definindo marcos claros e cronogramas para suas atividades do dia a dia. Mostra comprometimento para seguir rigidamente uma programação predefinida e muito respeito aos prazos acordados, ajustando-os apenas quando absolutamente necessário. Seu processo de tomada de decisão envolve análise detalhada e avaliação de riscos e uma vez que tenha tomado uma decisão, isso lhe dá um direcionamento que permite elaborar e seguir seus planos de maneira disciplinada.",
        },
        'NEUROTICISM': {
            'DESPREOCUPADO_AUTOCONFIANTE_TRANQUILO_CONTROLADO': "Você é 'Despreocupado, Autoconfiante, Tranquilo e Controlado'. Pessoas com essas características geralmente são calmas e autoconfiantes, criando uma atmosfera tranquila nas interações sociais. Elas geralmente se sentem à vontade em situações sociais e podem ser vistas como referência por outras pessoas em momentos desafiadores emocionalmente. Seja em situações de interação social ou quando está lidando com tarefas desafiadoras, você consegue enxergar a situação de maneira racional, mantendo uma perspectiva positiva sobre si mesmo e sobre o desfecho das situações. Seu autocontrole fará com que se mantenha com a \"cabeça fria\" diante de adversidades, o que irá facilitar sua busca por soluções. Deve ficar atento para o fato de que pode enxergar as pessoas mais instáveis emocionalmente como infantis, o que é compreensível, pois instabilidade emocional de fato faz as pessoas se comportarem como crianças. Entretanto, é preciso ficar atento para que seu comportamento autocentrado, que, a propósito, deveria ser típico em pessoas adultas, não seja confundido com soberba.",
            'DESPREOCUPADO_AUTOCONFIANTE_TRANQUILO_REATIVO': "Você é 'Despreocupado, Autoconfiante, Tranquilo e Reativo'. Pessoas com essas características geralmente são calmas e autoconfiantes, criando uma atmosfera tranquila nas interações sociais. Elas geralmente se sentem à vontade em situações sociais e podem ser vistas como referência por outras pessoas em momentos desafiadores emocionalmente. Seja em situações de interação social ou quando está lidando com tarefas desafiadoras, você consegue enxergar a situação de maneira racional, mantendo uma perspectiva positiva sobre si mesmo e sobre o desfecho das situações. Em algumas situações e cenários de crise, você pode se sentir como um adulto cercado de crianças e pode surpreender as pessoas com respostas rápidas. Seu impulso natural será assumir as rédeas da situação e resolver logo a situação, como um adulto faria ao lidar com crianças. É importante notar que mesmo quando suas decisões se mostrem acertadas, à primeira vista essa atitude pode não ser compreendida pelas pessoas, pois na prática você estaria decidindo por elas e lhes tirando a autonomia.",
            'DESPREOCUPADO_AUTOCONFIANTE_IRRITAVEL_CONTROLADO': "Você é 'Despreocupado, Autoconfiante, Irritável e Controlado'. Pessoas com essas características geralmente são autoconfiantes, não costumam ficar preocupadas com eventos futuros, mas podem se irritar facilmente em interações sociais ou com coisas específicas. Elas geralmente se sentem à vontade em situações sociais, mas podem ser vistas como pessoas intransigentes em momentos desafiadores emocionalmente. Seja em situações de interação social ou quando está lidando com tarefas desafiadoras, você consegue enxergar o cenário de maneira racional, mantendo uma perspectiva positiva sobre si mesmo e sobre o desfecho das situações. Seu maior desafio é lidar com sua própria impaciência. Pode ser difícil para você lidar com pessoas quando essas manifestam comportamentos reativos. Para você, isso pode ser considerado infantilidade o que o deixará verdadeiramente irritado. Normalmente seu autocontrole fará com que se contenha nessas situações, mas é possível que as pessoas percebam seu desconforto manifesto não verbalmente, mas eventualmente com comentários duros, irônicos ou sarcasmo.",
            'DESPREOCUPADO_AUTOCONFIANTE_IRRITAVEL_REATIVO': "Você é 'Despreocupado, Autoconfiante, Irritável e Reativo'. Pessoas com essas características geralmente são autoconfiantes, não costumam ficar preocupadas com eventos futuros. Elas geralmente se sentem à vontade em situações sociais, mas como se irritam facilmente e são reativos, podem manifestar seus descontentamentos de forma agressiva, passando a imagem de briguentas nas mais variadas situações. Quando a situação está sob controle, seja em situações de interação social ou quando está lidando com tarefas desafiadoras, você consegue enxergar a situação de maneira racional, mantendo uma perspectiva positiva sobre a mesmo e sobre o desfecho das situações. Seu maior desafio é lidar com sua impaciência. Pode ser difícil para você lidar com pessoas quando essas manifestam sentimentalismo e comportamentos dramáticos. Para você, isso poderia ser considerado apenas infantilidade, mas por vezes se sentirá como se fosse uma provocação. Seu temperamento irritável e seu baixo controle de impulsos fará com que você dê verdadeiras broncas nas pessoas, que podem se sentir tratadas como crianças e ficarem bastante constrangidas.",
            'DESPREOCUPADO_INSEGURO_TRANQUILO_CONTROLADO': "Você é 'Despreocupado, Inseguro, Tranquilo e Controlado'. Pessoas com essas características geralmente são calmas, tranquilas e não costumam ficar preocupadas com eventos futuros. Entretanto, interações sociais ou situações nas quais suas capacidades possam ser colocadas a prova, podem se mostrar inseguras com as próprias habilidades. Sua insegurança combinada com seu temperamento tranquilo e controlado pode reforçar a imagem de timidez e dar uma ideia de que você é uma pessoa sensível e vulnerável. Pode ser difícil para você lidar com pessoas quando essas manifestam comportamentos reativos. Seu maior desafio é em um primeiro momento reconhecer suas próprias habilidades. Em um segundo momento, é aprender a lidar com essas pessoas mais agressivas, que podem confundir essa insegurança com fraqueza. Normalmente seu autocontrole fará com que se contenha nessas situações, mas é possível que as pessoas se sintam \"vencedoras\" de um embate em que você sequer aceitou entrar.",
            'DESPREOCUPADO_INSEGURO_TRANQUILO_REATIVO': "Você é 'Despreocupado, Inseguro, Tranquilo e Reativo'. Pessoas com essas características geralmente são aparentemente calmas e suas preocupações não costumam ser direcionadas para eventos futuros. O desconforto desse tipo de perfil provavelmente aparecerá em interações sociais ou situações nas quais suas capacidades possam ser colocadas a prova. Podem se mostrar inseguras com as próprias habilidades e apresentar comportamentos no sentido de buscar aprovação social ou simplesmente \"sair de cena\". Sob tensão, você pode mostrar insegurança e timidez, passando a imagem de uma pessoa sensível e vulnerável. Pode ser difícil para você confrontar as pessoas em defesa de suas necessidades. Seu maior desafio é em um primeiro momento conter seu ímpeto de fugir da situação. Em um segundo momento, é aprender a reconhecer suas habilidades e utilizar sua forma tranquila de se comunicar para expor seus pontos de vista.",
            'DESPREOCUPADO_INSEGURO_IRRITAVEL_CONTROLADO': "Você é 'Despreocupado, Inseguro, Irritável e Controlado'. Pessoas com essas características geralmente não costumam viver no futuro, mas carregam o momento presente com intensidade em razão de sua elevada sensibilidade e insegurança. Em situações sociais, podem mostrar um mix de timidez e irritação, sendo a segunda funcionando como um disfarce para a primeira. Isso pode fazer com que se frustre de maneira silenciosa, de modo que irá manifestar seu desconforto mais provavelmente com linguagens não verbais. As pessoas à sua volta irão notar seu incômodo, mas a aproximação delas tende a fazer você ficar ainda mais incomodado e intranquilo. Como solução você pode querer simplesmente deixar o ambiente e se afastar daquilo que entende ser a causa de seu desconforto. Na prática, o mais provável é que se feche e faça o possível para continuar invisível. Seu maior desafio é reconhecer suas próprias habilidades e qualidades de modo que não se sinta ameaçado por comportamentos que desaprova nas outras pessoas.",
            'DESPREOCUPADO_INSEGURO_IRRITAVEL_REATIVO': "Você é 'Despreocupado, Inseguro, Irritável e Reativo'. Pessoas com essas características geralmente não costumam viver no futuro, mas carregam o momento presente com intensidade em razão de sua elevada sensibilidade e insegurança. O que torna a situação ainda mais complicada é que você tende a não conter seus impulsos. Em situações sociais, podem mostrar um mix de timidez e irritação, que pode ser manifesto de maneira agressiva. Esse tipo de comportamento tende a expor seu desconforto sem contudo deixar claro o que está incomodando você. As pessoas à sua volta poderão construir uma imagem de que você é uma pessoa agressiva e intransigente, quando na verdade sua irritação pode ser fruto de sua insegurança e frustração por não conseguir solucionar os problemas que incomodam você. Dependendo de seu nível de extroversão, você pode inclusive ter o hábito de reclamar com certa frequência. É importante que consiga reconhecer as causas dessa sua frustração e, ao invés de tentar lidar com essas emoções sozinho, poderia como primeiro passo buscar ajuda junto às pessoas mais próximas de sua confiança.",
            'INQUIETO_AUTOCONFIANTE_TRANQUILO_CONTROLADO': "Você é 'Inquieto, Autoconfiante, Tranquilo e Controlado'. Pessoas com essas características geralmente apresentam comportamentos equilibrados nas relações sociais, pois são autoconfiantes, tranquilos e controlam bem seus impulsos. Entretanto, quando se trata de eventos futuros, costuma criar expectativas o que pode gerar uma agitação interna. Quando essa agitação é direcionada para ação, isso pode fazer você se envolver com atividades simplesmente para se sentir ocupado. As pessoas à sua volta podem não notar em um primeiro momento, mas em situações mais extremas, sua ansiedade pode transparecer como se estivesse sempre apressado e sem tempo para as relações. Seu maior desafio é reconhecer que não dá para antecipar o futuro e a única coisa que pode fazer é se concentrar naquilo que está acontecendo no momento.",
            'INQUIETO_AUTOCONFIANTE_TRANQUILO_REATIVO': "Você é 'Inquieto, Autoconfiante, Tranquilo e Reativo'. Pessoas com essas características geralmente são agradáveis nas relações sociais, pois são tranquilos e autoconfiantes. Porém, diante de eventos importantes podem querer antecipar o futuro e sua tendência em ser uma pessoa reativa pode fazer você se precipitar em decisões ou na realização de atividades que não necessariamente são urgentes, perdendo justamente a chance de aproveitar a oportunidade de refletir e fazer análises mais cuidadosas. As pessoas à sua volta irão notar sua ansiedade como se estivesse com pressa e sem tempo para as relações, confundindo sua agitação com impaciência. Seu maior desafio é reconhecer que não dá para antecipar o futuro e a única coisa que pode fazer é se concentrar naquilo que está acontecendo no momento. Para fazer isso é preciso encontrar formas de canalizar sua energia, que nessas situações mais estressantes pode ser exagerada.",
            'INQUIETO_AUTOCONFIANTE_IRRITAVEL_CONTROLADO': "Você é 'Inquieto, Autoconfiante, Irritável e Controlado'. Pessoas com essas características geralmente são ansiosas em relação aos eventos futuros. É pouco provável que suas preocupações estejam relacionadas com medo de fracasso, pois é autoconfiante. Entretanto, você pode querer demonstrar impaciência e ansiedade em fazer acontecer aquilo que elaborou em sua mente. Em situações sociais terá essa ansiedade sob a aparência de pura impaciência. As pessoas terão dificuldade de reconhecer quando sua irritação está relacionada com as atitudes deles ou quando são fruto de suas próprias preocupações com algo futuro. É importante que consiga internamente fazer essa diferenciação. Uma vez que sua conversa interna tenha lhe ajudado nesse sentido, dependendo do tamanho de seu desconforto, seria mais produtivo compartilhar a razão de suas preocupações com as pessoas a sua volta, evitando ser mal interpretado ou esclarecendo para o outro aquilo que o está incomodando.",
            'INQUIETO_AUTOCONFIANTE_IRRITAVEL_REATIVO': "Você é 'Inquieto, Autoconfiante, Irritável e Reativo'. Pessoas com essas características geralmente são ansiosas em relação aos eventos futuros. É pouco provável que suas preocupações estejam relacionadas com medo de fracasso, pois é autoconfiante. Entretanto, você pode querer demonstrar impaciência e ansiedade em fazer acontecer aquilo que elaborou em sua mente. Em situações sociais terá essa ansiedade sob a aparência de pura impaciência e a falta de controle de impulsos fará com que manifeste seus incômodos com ações intempestivas. As pessoas terão dificuldade de reconhecer quando sua irritação está relacionada com as atitudes deles ou quando são fruto de suas próprias preocupações com algo futuro. Sua forma por vezes \"sem filtro\" de expor suas emoções pode criar um ambiente de \"guerra\" à sua volta. Em um primeiro momento é preciso conter suas reações ponderando sobre as consequências em si mesmo e nos outros. Mas é importante que consiga internamente identificar a verdadeira razão de seu desconforto. Nem sempre uma conversa interna lhe ajudará nesse sentido, pois dependendo do tamanho de seu desconforto, seria mais produtivo buscar ajuda especializada para poder compartilhar a razão de suas preocupações e identificar os fatores que o incomodam. Vale ressaltar que toda essa sua manifestação emocional, partindo de uma pessoa autoconfiante, pode intimidar quem está em sua volta.",
            'INQUIETO_INSEGURO_TRANQUILO_CONTROLADO': "Você é 'Inquieto, Inseguro, Tranquilo e Controlado'. Pessoas com essas características geralmente são ansiosas em relação aos eventos futuros e temerosas em relação ao próprio fracasso. Entretanto, por ter autocontrole e um temperamento tranquilo, seu sofrimento acontecerá apenas em sua mente. As situações sociais poderão agravar esses sentimentos internos e ampliar sua insegurança em relação às suas próprias habilidades. As pessoas provavelmente irão notar sua insegurança, pois ela tenderá a se manifestar com excesso de timidez ou demonstrações de agitação, como se quisesse sair do local o mais rápido possível. Pode ser difícil reconhecer suas próprias capacidades, porém isso é importante, e em um primeiro momento procure se cercar de pessoas nas quais confie e que tenham atitudes de incentivo. Nem sempre será possível evitar situações desafiadoras, mas nessas ocasiões procure obter ajuda quando possível e caso não consiga, procure focalizar o que pode ser feito no momento. Identificar seus maiores medos e superá-los pode mudar radicalmente a forma como lida com a vida. Reflita sobre a importância de buscar apoio qualificado para trabalhar esses desconfortos emocionais.",
            'INQUIETO_INSEGURO_TRANQUILO_REATIVO': "Você é 'Inquieto, Inseguro, Tranquilo e Reativo'. Pessoas com essas características geralmente são ansiosas em relação aos eventos futuros e temerosas em relação ao próprio fracasso. Por serem tranquilos com os outros e ao mesmo tempo inseguras, podem manifestar comportamentos de busca por aprovação. Em algumas situações sociais assumirão a culpa por tudo aquilo que deu errado, podendo se colocar submissas à figuras autoritárias e críticas, tornando-se vítimas de injustiças. As pessoas provavelmente irão notar sua insegurança, pois ela tenderá a se manifestar com excesso de timidez e demonstrações de agitação, como se quisesse sair do local o mais rápido possível. Pode ser difícil reconhecer suas próprias capacidades, por isso é importante que em um primeiro momento procure se cercar de pessoas nas quais confie e que tenham atitudes de incentivar você. Nem sempre será possível evitar situações desafiadoras, mas nessas ocasiões procure obter ajuda quando possível e caso não consiga, procure focalizar o que pode ser feito no momento. Identificar seus maiores medos e superá-los pode mudar radicalmente a forma como lida com a vida. Reflita sobre a importância de buscar apoio qualificado para trabalhar esses desconfortos emocionais.",
            'INQUIETO_INSEGURO_IRRITAVEL_CONTROLADO': "Você é 'Inquieto, Inseguro, Irritável e Controlado'. Pessoas com essas características geralmente são ansiosas em relação aos eventos futuros e temerosas em relação ao próprio fracasso. As situações sociais poderão agravar esses sentimentos internos e ampliar sua insegurança em relação às suas próprias habilidades. As pessoas provavelmente irão notar sua insegurança pelo excesso de timidez e demonstrações de irritação, como se quisesse sair do local o mais rápido possível. Dependendo da situação você pode ser submissa, enquanto que em outras você pode parecer alguém intranquilo. Não será incomum você ser uma pessoa muito dura consigo mesma, com críticas pesadas que podem levá-lo a acreditar de que os problemas são de sua inteira responsabilidade, atitude que pode colocá-la em uma posição de mártir. Pode ser difícil reconhecer suas próprias capacidades, porém isso é importante, e em um primeiro momento procure se cercar de pessoas nas quais confie e que tenham atitudes de incentivo. Nem sempre será possível evitar situações desafiadoras, mas nessas ocasiões procure obter ajuda quando possível e caso não consiga, procure focalizar o que pode ser feito no momento. Identificar seus maiores medos e superá-los pode mudar radicalmente a forma como lida com a vida. Reflita sobre a importância de buscar apoio qualificado para trabalhar esses desconfortos emocionais.",
            'INQUIETO_INSEGURO_IRRITAVEL_REATIVO': "Você é 'Inquieto, Inseguro, Irritável e Reativo'. Pessoas com essas características geralmente são ansiosas em relação aos eventos futuros e temerosas em relação ao próprio fracasso. Por serem intranquilos com os outros e ao mesmo tempo inseguros, podem manifestar mudanças de humor extremas, ora buscando aprovação social, ora criticando tudo e todos. Deste modo, em algumas situações sociais assumirão a culpa por tudo aquilo que deu errado, podendo se colocar submissas à figuras autoritárias e críticas, tornando-se vítimas de injustiças. Em outras, podem se colocar como vítimas de uma conspiração que só faz sentido em sua própria mente. As pessoas provavelmente irão notar sua insegurança, pois ela tenderá a se manifestar com excesso de timidez e demonstrações de ansiedade, irritabilidade, reações de fuga, medo de conflitos. Pode ser difícil reconhecer suas próprias capacidades, por isso é importante que em um primeiro momento procure se cercar de pessoas nas quais confie e que tenha atitudes de incentivar você. Nem sempre será possível evitar situações desafiadoras, mas nessas ocasiões procure obter ajuda quando possível e caso não consiga, procure focalizar o que pode ser feito no momento. Identificar seus maiores medos e superá-los pode mudar radicalmente a forma como lida com a vida. Reflita sobre a importância de buscar apoio qualificado para trabalhar esses desconfortos emocionais.",
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

    private async generateFineTunedNarrative(traitKey: string, score: number, facets?: any[]): Promise<{ text: string | null, labels: string[] }> {
        const facetLabels: string[] = [];
        if (facets && facets.length > 0) {
            facets.forEach((f, idx) => {
                const label = this.getFacetLabel(traitKey, idx, f.score);
                if (label) facetLabels.push(label);
            });
            const signature = facetLabels.join('_');
            const defaultText = this.FINETUNED_TEXTS[traitKey]?.[signature];

            if (defaultText) {
                // Busca do banco ou cria
                const dbText = await this.getText(
                    `${traitKey}_${signature}`,
                    'FINE_TUNED',
                    defaultText,
                    `Interpretação Fina: ${traitKey} (${signature.replace(/_/g, ', ')})`
                );
                return { text: dbText, labels: facetLabels };
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
    // Chamado pelo Controller para garantir que TODOS os textos do código vão para o banco
    async seedAllDefinitions() {
        let count = 0;

        // 1. Seed Fine-Tuned Texts
        for (const [trait, signatures] of Object.entries(this.FINETUNED_TEXTS)) {
            for (const [signature, content] of Object.entries(signatures)) {
                // Ex: EXTRAVERSION_OUVINTE_SELETIVO...
                const key = `${trait}_${signature}`;

                // Formatar labels para descrição legível
                const readableSignature = signature
                    .replace(/_/g, ', ')
                    .toLowerCase()
                    .replace(/\b\w/g, c => c.toUpperCase()); // Title Case

                await this.getText(
                    key,
                    'FINE_TUNED',
                    content,
                    `Interpretação: ${trait} - ${readableSignature}`
                );
                count++;
            }
        }

        // 2. Seed Dimensions (Simulando chamadas para garantir defaults)
        // Isso já é coberto pelo uso normal, mas podemos reforçar aqui se necessário.
        // As chamadas dummy do controller cuidam disso.

        return count;
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

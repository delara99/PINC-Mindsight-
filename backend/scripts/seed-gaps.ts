import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento dos textos da planilha (Q1_Diferenças&Recomendações)
// Chaves Padronizadas: GAP_[TYPE]_[TRAIT]
// TYPE:
// - LOW_HIGH: Eu Baixo / Outro Alto
// - HIGH_LOW: Eu Alto / Outro Baixo
// - MODERATE: Diferença Moderada ou um no meio

const GAP_TEXTS = [
    // === EXTROVERSÃO ===
    {
        key: 'GAP_LOW_HIGH_EXTRAVERSION',
        group: 'GAP_DIFFERENCE',
        description: 'Extroversão: Eu Baixo - Outro Alto',
        content: 'Você pode interpretar {NOME} como alguém superficial e excessivamente falante, que não se preocupa em ouvir os outros. Isso pode levar a uma sensação de falta de conexão emocional e dificuldade em expressar suas próprias ideias e sentimentos. Para melhor compreender e se relacionar com uma pessoa extrovertida, você poderia valorizar a sua capacidade de se conectar facilmente com os outros e buscar oportunidades para compartilhar suas próprias opiniões. Lembre-se de que a extroversão não significa falta de profundidade, e cada pessoa tem uma forma única de se expressar.'
    },
    {
        key: 'GAP_MODERATE_EXTRAVERSION',
        group: 'GAP_DIFFERENCE',
        description: 'Extroversão: Diferença Moderada',
        content: 'Você pode interpretar {NOME} como alguém um tanto quanto diferente de você em relação à forma como expressa sua extroversão. Isso pode gerar dificuldade em encontrar um equilíbrio na comunicação. Para melhor compreender e se relacionar com pessoas com traços diferentes de você, utilize sua capacidade de adaptação e pratique sua flexibilidade. Esteja aberto(a) para se expressar quando sentir necessidade, mas também saiba ouvir e valorizar as contribuições dos outros. Busque entender que cada pessoa tem seu próprio ritmo social e suas próprias preferências.'
    },
    {
        key: 'GAP_HIGH_LOW_EXTRAVERSION',
        group: 'GAP_DIFFERENCE',
        description: 'Extroversão: Eu Alto - Outro Baixo',
        content: 'Você pode interpretar {NOME} como alguém reservado e distante, o que pode gerar uma sensação de isolamento e dificuldade em se conectar emocionalmente com ele(a). Para melhor compreender e se relacionar com ele(a), você poderia praticar a paciência e a compreensão. Reconheça que cada pessoa tem seu próprio ritmo social e que nem sempre expressar extroversão é um indicativo de maior conexão emocional. Esteja aberto(a) para ouvir e criar espaços seguros para que a pessoa possa compartilhar seus pensamentos e sentimentos quando se sentir confortável.'
    },

    // === AMABILIDADE ===
    {
        key: 'GAP_LOW_HIGH_AGREEABLENESS',
        group: 'GAP_DIFFERENCE',
        description: 'Amabilidade: Eu Baixo - Outro Alto',
        content: 'Você pode interpretar {NOME} como alguém submisso e carente de opiniões próprias, que sempre concorda com os outros para evitar conflitos. Isso pode levar a uma sensação de falta de autenticidade e dificuldade em expressar suas próprias necessidades e limites. Para melhor compreender e se relacionar com uma pessoa tão cordial, você poderia valorizar a sua capacidade de empatia e harmonia nas relações, e buscar oportunidades para encorajá-la(a) a expressar suas opiniões e necessidades. Lembre-se de que ser cordial não significa falta de posicionamento, e cada pessoa tem sua própria forma de se relacionar com os outros.'
    },
    {
        key: 'GAP_MODERATE_AGREEABLENESS',
        group: 'GAP_DIFFERENCE',
        description: 'Amabilidade: Diferença Moderada',
        content: 'Você pode interpretar {NOME} como alguém muito diferente de você em relação à forma como expressa empatia. Isso pode gerar dificuldade em encontrar um equilíbrio na comunicação e na busca de soluções conjuntas. Para melhor compreender e se relacionar com pessoas com traços diferentes dos seus, você poderia praticar a escuta ativa e a negociação. Esteja aberto(a) para ouvir as opiniões e necessidades dos outros, mas também saiba expressar suas próprias opiniões e limites de forma clara e respeitosa. Busque encontrar soluções que levem em consideração as necessidades de todos os envolvidos.'
    },
    {
        key: 'GAP_HIGH_LOW_AGREEABLENESS',
        group: 'GAP_DIFFERENCE',
        description: 'Amabilidade: Eu Alto - Outro Baixo',
        content: 'Você pode interpretar {NOME} como alguém rude e insensível, o que pode gerar desconforto e dificuldade em se relacionar com ele(a). Para melhor compreender e se relacionar com uma pessoa tão lógica e direta, você poderia valorizar sua franqueza e facilidade em expressar seus pontos de vista de maneira genuína. Não leve para o lado pessoal, mas reconheça que cada pessoa tem sua própria forma de se expressar e que pessoas assim costumam demonstrar respeito justamente pela forma como se preocupam em ser o mais claro possível sobre suas opiniões.'
    },

    // === ESTRUTURA (CONSCIENCIOSIDADE) ===
    {
        key: 'GAP_LOW_HIGH_CONSCIENTIOUSNESS',
        group: 'GAP_DIFFERENCE',
        description: 'Estrutura: Eu Baixo - Outro Alto',
        content: 'Você pode interpretar {NOME} como alguém rígido e controlador, que não permite erros ou improvisações. Isso pode levar a uma sensação de inadequação e dificuldade em atender suas expectativas. Para melhor compreender e se relacionar com ele(a), você poderia reconhecer e valorizar a sua capacidade de organização e disciplina, e buscar oportunidades para cooperar e negociar soluções que atendam às necessidades de ambos. Lembre-se de que cada pessoa tem sua própria forma de abordar as responsabilidades e ajude ele(a) a perceber que o perfeccionismo pode ser improdutivo.'
    },
    {
        key: 'GAP_MODERATE_CONSCIENTIOUSNESS',
        group: 'GAP_DIFFERENCE',
        description: 'Estrutura: Diferença Moderada',
        content: 'Você pode interpretar {NOME} como alguém muito diferente de você em relação à forma como lida com estrutura e organização. Isso pode gerar dificuldade em encontrar um equilíbrio no trabalho em conjunto e na execução de tarefas. Para melhor compreender e se relacionar com pessoas com traços diferentes dos seus, você poderia praticar a flexibilidade e a negociação. Esteja aberto(a) para compartilhar suas expectativas e ouvir as expectativas dos outros, buscando encontrar um ponto de equilíbrio que atenda às necessidades de todos. Lembre-se de que cada pessoa tem sua própria abordagem ao trabalho e às responsabilidades.'
    },
    {
        key: 'GAP_HIGH_LOW_CONSCIENTIOUSNESS',
        group: 'GAP_DIFFERENCE',
        description: 'Estrutura: Eu Alto - Outro Baixo',
        content: 'Você pode interpretar {NOME} como alguém desorganizado e irresponsável, o que pode gerar frustração e dificuldade em confiar nele(a). Para melhor compreender e se relacionar com ele(a), você poderia reconhecer sua flexibilidade e capacidade de adaptação. Lembre-se que nem o fato dele(a) não ser rigoroso em relação ao seguimento regras e processos é um indicativo de falta de comprometimento. Esteja aberto(a) para estabelecer acordos claros sobre aquilo que é prioridade e criar sistemas de apoio que ajudem a pessoa a cumprir com suas obrigações.'
    },

    // === ABERTURA ===
    {
        key: 'GAP_LOW_HIGH_OPENNESS',
        group: 'GAP_DIFFERENCE',
        description: 'Abertura: Eu Baixo - Outro Alto',
        content: 'Você pode interpretar {NOME} como uma pessoa cheia de ideias fantasiosas, por vezes dispersa, que se envolve em situações arriscadas e não considera as consequências de suas ações. Isso pode gerar preocupação e frustração em relação ao comportamento dele(a). Para melhor compreender e se relacionar com ele(a), você poderia reconhecer e valorizar a sua busca por novas experiências e perspectivas. Realmente pessoas imaginativas não costumam dar muita atenção a dados e fatos concretos, podendo ignorar detalhes relevantes, mas tente entender que elas podem contribuir de modo significativo com sua imaginação e forma como são capazes de identificar padrões e interpretar o mundo de maneira original. Esteja aberto(a) para ouvir suas ideias e teorias e compartilhe suas experiências e preocupações de forma respeitosa e empática, buscando um equilíbrio entre a segurança da experiência com a abertura ao novo.'
    },
    {
        key: 'GAP_MODERATE_OPENNESS',
        group: 'GAP_DIFFERENCE',
        description: 'Abertura: Diferença Moderada',
        content: 'Você pode interpretar {NOME} como alguém muito diferente em relação à forma como lida com o novo. Isso pode gerar dificuldade em encontrar um equilíbrio na tomada de decisões e na exploração de novas oportunidades. Para melhor compreender e se relacionar com pessoas com traços diferentes dos seus em relação à abertura, você poderia praticar a compreensão e a flexibilidade. Esteja aberto(a) para compartilhar suas preocupações e ouvir as perspectivas dos outros, buscando encontrar um ponto de equilíbrio que leve em consideração tanto a segurança quanto a busca por novas experiências. Lembre-se de que cada pessoa tem sua própria tolerância ao risco e sua própria forma de explorar o mundo.'
    },
    {
        key: 'GAP_HIGH_LOW_OPENNESS',
        group: 'GAP_DIFFERENCE',
        description: 'Abertura: Eu Alto - Outro Baixo',
        content: 'Você pode interpretar {NOME} como uma pessoa excessivamente pés no chão, limitada e fechada para novas experiências, o que pode gerar frustração e dificuldade em compartilhar interesses em comum. Para melhor compreender e se relacionar com ele(a), você poderia reconhecer e valorizar sua capacidade de concentração e atenção aos detalhes. Realmente pessoas realistas não costumam ser abertas para novas experiências, podendo demonstrar falta de imaginação e dificuldade para enxergar o futuro, mas tente entender que elas podem contribuir de modo significativo com análises cuidadosas de dados, e uma abordagem eficiente ao lidar com problemas práticos. Esteja aberto(a) para ouvir sobre suas experiências e recomendações e compartilhe suas ideias e visão de futuro de forma gradual, criando um ambiente seguro para que a pessoa possa se abrir aos poucos.'
    },

    // === ESTABILIDADE EMOCIONAL (N - Inverso de Neuroticismo) ===
    // Na imagem está "Estabilidade Emocional".
    // Eu Baixo (Baixa Estabilidade) - Outro Alto (Alta Estabilidade)
    // Eu Alto (Alta Estabilidade) - Outro Baixo (Baixa Estabilidade)

    {
        key: 'GAP_LOW_HIGH_NEUROTICISM', // Eu Baixa Estabilidade vs Outro Alta
        group: 'GAP_DIFFERENCE',
        description: 'Estabilidade: Eu Baixo - Outro Alto',
        // Texto da imagem coluna C, linha 7
        content: 'Você pode interpretar {NOME} como alguém frio e insensível, que não se abala com os seus sentimentos e necessidades emocionais das outras pessoas. Isso pode levar a uma sensação de rejeição e dificuldade em buscar apoio emocional. Para melhor compreender e se relacionar com uma pessoa bastante racional, você poderia reconhecer e valorizar a sua capacidade de manter a calma em situações desafiadoras e a objetividade que ela traz para a comunicação. Lembre-se do que cada pessoa tem sua própria forma de expressar e lidar com as emoções.'
    },
    {
        key: 'GAP_MODERATE_NEUROTICISM',
        group: 'GAP_DIFFERENCE',
        description: 'Estabilidade: Diferença Moderada',
        // Texto da imagem coluna D, linha 7
        content: 'Você pode interpretar {NOME} como alguém muito diferente em relação a forma como lida com as emoções e com a razão. Isso pode gerar confusão e dificuldade em prever suas reações dele(a). Para melhor compreender e se relacionar com pessoas com traços diferentes de estabilidade emocional, você poderia praticar a empatia e a escuta ativa. Tente entender as motivações e necessidades emocionais por trás do comportamento de cada pessoa, e lembre-se de que todos têm sua própria forma de lidar com as emoções.'
    },
    {
        key: 'GAP_HIGH_LOW_NEUROTICISM', // Eu Alta Estabilidade vs Outro Baixa
        group: 'GAP_DIFFERENCE',
        description: 'Estabilidade: Eu Alto - Outro Baixo',
        // Texto da imagem coluna E, linha 7
        content: 'Você pode interpretar {NOME} como emocionalmente instável e dramático, o que pode gerar desconforto e insegurança. Isso pode levar a uma sensação de imprevisibilidade e fragilidade. Para melhor compreender e se relacionar com uma pessoa mais emotiva, você poderia praticar a paciência e a compreensão. Reconheça que cada pessoa tem sua própria forma de lidar com as emoções e que nem sempre expressar emoções de maneira intensa significa falta de controle. Esteja aberta(a) para ouvir e oferecer apoio emocional, criando um ambiente seguro para que a pessoa possa compartilhar seus sentimentos sem se sentir vulnerável, a fim de que consiga retomar o equilíbrio, ajudando-o(a) a enxergar a situação de maneira mais racional.'
    }
];

async function main() {
    console.log('🔄 Sincronizando Textos de GAP (Diferenças & Recomendações)...');

    let count = 0;
    for (const item of GAP_TEXTS) {
        await prisma.talkingToMessage.upsert({
            where: { key: item.key },
            update: {
                content: item.content,
                description: item.description,
                group: item.group
            },
            create: {
                key: item.key,
                group: item.group,
                description: item.description,
                content: item.content
            }
        });
        console.log(`✅ Upserted: ${item.key}`);
        count++;
    }

    console.log(`🎉 Sucesso! ${count} textos de GAP atualizados.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

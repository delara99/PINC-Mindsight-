import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento dos textos da planilha (Q1_Comportamentos)
const BEHAVIOR_TEXTS = [
    // === EXTROVERSÃO (E) ===
    {
        key: 'EXTRAVERSION_LOW',
        group: 'DIMENSION', // Grupo Macro
        description: 'Extroversão - Baixa (Eu Negativo)',
        content: 'Você tende a ser mais reservado(a) e introvertido(a), preferindo atividades solitárias. Pode ter dificuldade em iniciar conversas ou se destacar em grupos sociais. No entanto, você pode ser muito observador(a) e reflexivo(a). Você pode sentir-se mais confortável em situações tranquilas e preferir passar tempo sozinho(a) ou com um pequeno grupo de pessoas íntimas.'
    },
    {
        key: 'EXTRAVERSION_AVG',
        group: 'DIMENSION',
        description: 'Extroversão - Média (Moderada)',
        content: 'Você é uma pessoa equilibrada em termos de sociabilidade. Você gosta de interagir com os outros, mas também valoriza seu tempo sozinho(a). Você pode se sentir energizado(a) em certas situações sociais, mas também pode precisar de momentos com mais isolamento. De modo geral, você pode participar de eventos sociais e conversas, mas também aprecia momentos de tranquilidade e introspecção. Situações extremas tendem a sobrecarregá-lo.'
    },
    {
        key: 'EXTRAVERSION_HIGH',
        group: 'DIMENSION',
        description: 'Extroversão - Alta (Eu Positivo)',
        content: 'Você é extrovertido(a) e se destaca em situações sociais. Você se sente energizado(a) ao estar rodeado(a) de pessoas e tende a ser o centro das atenções. Sua sociabilidade e energia são características marcantes que influenciam positivamente suas interações sociais. No entanto, é importante lembrar que a extroversão não significa necessariamente ser extrovertido(a) em todas as situações. De modo geral, você é capaz de se conectar facilmente com os outros, expressar suas ideias com confiança e buscar novas experiências sociais.'
    },

    // === AMABILIDADE (A) ===
    {
        key: 'AGREEABLENESS_LOW',
        group: 'DIMENSION',
        description: 'Amabilidade - Baixa (Eu Negativo)',
        content: 'Você costuma ser mais individualista e menos preocupado(a) com as necessidades dos outros. Pode ter dificuldade em expressar empatia e compreender as emoções dos outros. Você também pode ser mais assertivo(a) e direto(a) em suas interações. Geralmente você pode priorizar suas próprias necessidades e objetivos antes das dos outros.'
    },
    {
        key: 'AGREEABLENESS_AVG',
        group: 'DIMENSION',
        description: 'Amabilidade - Média (Moderada)',
        content: 'Você é uma pessoa equilibrada em relação ao quanto mostra se importar com as pessoas. Você valoriza a cooperação e a empatia, mas também pode ser assertivo(a) quando necessário. Você é capaz de se colocar no lugar dos outros e mostrar compreensão, mas também pode expressar suas próprias opiniões e defender seus interesses. De modo geral, você encontra um equilíbrio entre ser amigável e ser assertivo(a), dependendo das circunstâncias.'
    },
    {
        key: 'AGREEABLENESS_HIGH',
        group: 'DIMENSION',
        description: 'Amabilidade - Alta (Eu Positivo)',
        content: 'Você é altamente amável e empático(a). Você se preocupa genuinamente com as necessidades e emoções dos outros. Você é capaz de oferecer suporte emocional, ouvir atentamente e colaborar de forma construtiva. Geralmente, você é uma pessoa calorosa e acolhedora, capaz de estabelecer conexões profundas e positivas com os outros.'
    },

    // === ESTRUTURA / CONSCIENCIOSIDADE (C) ===
    {
        key: 'CONSCIENTIOUSNESS_LOW',
        group: 'DIMENSION',
        description: 'Estrutura - Baixa (Eu Negativo)',
        content: 'Você pode ter dificuldade em manter-se organizado(a) e cumprir prazos. Pode ser mais propenso(a) a adiar decisões e ter dificuldade em se comprometer com tarefas e responsabilidades. Por outro lado, você pode ser mais flexível e adaptável a mudanças de planos. Geralmente você terá uma abordagem mais relaxada em relação às suas obrigações e vai preferir um ambiente menos estruturado.'
    },
    {
        key: 'CONSCIENTIOUSNESS_AVG',
        group: 'DIMENSION',
        description: 'Estrutura - Média (Moderada)',
        content: 'Você é uma pessoa equilibrada em relação à forma como lida com a necessidade de estrutura. Você valoriza a organização e a responsabilidade, mas também pode ser flexível em certas situações. Você é capaz de cumprir tarefas e se comprometer com responsabilidades, mas também pode se adaptar a mudanças de planos quando necessário. De modo geral, você encontra um equilíbrio entre ser disciplinado(a) e ser flexível, dependendo das circunstâncias.'
    },
    {
        key: 'CONSCIENTIOUSNESS_HIGH',
        group: 'DIMENSION',
        description: 'Estrutura - Alta (Eu Positivo)',
        content: 'Você é altamente consciente e disciplinado(a). Você se esforça para manter organizado(a) e cumprir todas as suas responsabilidades. Sua tendência ao perfeccionismo pode levá-lo(a) a buscar a excelência em tudo o que faz. De modo geral, você é altamente confiável e comprometido(a) com suas tarefas e obrigações e costuma se esforçar para alcançar um alto nível de precisão e excelência em suas realizações.'
    },

    // === ABERTURA (O) ===
    {
        key: 'OPENNESS_LOW',
        group: 'DIMENSION',
        description: 'Abertura - Baixa (Eu Negativo)',
        content: 'Você pode ter uma tendência a ser mais fechado(a) e resistente a novas ideias e experiências. Pode ser mais cético(a) e relutante em sair da sua zona de conforto. Por outro lado, pode ser mais prático(a) e focado(a) em soluções conhecidas. De modo geral, você pode preferir a rotina e ter dificuldade em se adaptar a mudanças e novas situações.'
    },
    {
        key: 'OPENNESS_AVG',
        group: 'DIMENSION',
        description: 'Abertura - Média (Moderada)',
        content: 'Você é uma pessoa equilibrada em relação à forma como lida com mudanças. Você valoriza a curiosidade e a criatividade, mas também pode ser prático(a) quando necessário. Você está aberto(a) a novas experiências e ideias, mas também valoriza a estabilidade e a segurança. De modo geral, você encontra um equilíbrio entre ser aberto(a) e ser prático(a), dependendo das circunstâncias.'
    },
    {
        key: 'OPENNESS_HIGH',
        group: 'DIMENSION',
        description: 'Abertura - Alta (Eu Positivo)',
        content: 'Você é altamente aberto(a) e criativo(a). Você busca constantemente novas experiências e ideias. Sua imaginação e flexibilidade mental permitem que você pense de forma inovadora e encontre soluções criativas para os desafios. Geralmente, você é uma pessoa visionária e está sempre aberto(a) a novas possibilidades e perspectivas.'
    },

    // === ESTABILIDADE EMOCIONAL (N - Inverso de Neuroticismo) ===
    // Notar que aqui High Neuroticism (Instabilidade) é o "Eu Negativo" da Estabilidade
    // LOW STABILITY (HIGH NEUROTICISM)
    {
        key: 'NEUROTICISM_HIGH', // High Neuroticism = Low Stability
        group: 'DIMENSION',
        description: 'Estabilidade - Baixa (Alta Reatividade)',
        content: 'Você pode experimentar oscilações emocionais mais intensas e ter dificuldade em lidar com o estresse. Isso pode afetar seu bem-estar emocional e suas relações interpessoais. No entanto, você tem a capacidade de desenvolver estratégias para lidar com suas emoções de maneira saudável e buscar apoio quando necessário. Em momentos de maior instabilidade emocional, você pode sentir-se sobrecarregado(a) e ter dificuldade em manter a calma diante de situações desafiadoras. É importante lembrar que você pode aprender a controlar suas emoções e a desenvolver resiliência para lidar com os altos e baixos da vida.'
    },
    {
        key: 'NEUROTICISM_AVG',
        group: 'DIMENSION',
        description: 'Estabilidade - Média (Moderada)',
        content: 'Você é capaz de lidar com situações estressantes, mas também pode ser afetado(a) emocionalmente por elas. Você tem uma resiliência mediana e geralmente consegue se recuperar rapidamente de contratempos. Você valoriza a positividade e busca manter um equilíbrio emocional saudável. No entanto, é importante lembrar que a estabilidade emocional não significa necessariamente não sentir emoções negativas, mas sim ter a capacidade de lidar com elas de forma saudável. Você pode encontrar maneiras eficazes de lidar com o estresse e manter uma atitude positiva diante das adversidades se conseguir se mantiver atento em relação a como se sente.'
    },
    {
        key: 'NEUROTICISM_LOW', // Low Neuroticism = High Stability
        group: 'DIMENSION',
        description: 'Estabilidade - Alta (Alta Resiliência)',
        content: 'Você é emocionalmente estável e resiliente, mantendo a calma mesmo em situações desafiadoras. Você é capaz de controlar suas emoções e manter uma perspectiva positiva. Sua resiliência emocional permite que você enfrente os desafios da vida com confiança e adaptabilidade. No entanto, é importante lembrar que a estabilidade emocional não significa ser insensível ou reprimir emoções, mas sim ter a capacidade de lidar com elas de forma equilibrada e saudável. De modo geral, você é capaz de transmitir tranquilidade aos outros e enfrentar os obstáculos com serenidade.'
    }
];

async function main() {
    console.log('🔄 Sincronizando Textos de Comportamento (Q1_Comportamentos)...');

    let count = 0;
    for (const item of BEHAVIOR_TEXTS) {
        // Upsert garante atualização sem duplicidade
        await prisma.talkingToMessage.upsert({
            where: { key: item.key },
            update: {
                content: item.content, // Atualiza o conteúdo se mudou
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

    console.log(`🎉 Sucesso! ${count} textos de comportamento atualizados.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

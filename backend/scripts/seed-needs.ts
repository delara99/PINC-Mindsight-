import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento dos textos da planilha (Q1_Necessidades)
// Chaves Padronizadas: TRAIT_LEVEL_THEME
// Ex: EXTRAVERSION_LOW_TREATMENT
// Ex: EXTRAVERSION_LOW_ENVIRONMENT

const NEEDS_TEXTS = [
    // === EXTROVERSÃO (E) ===
    // Tratamento
    {
        key: 'EXTRAVERSION_LOW_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Extroversão Baixa - Tratamento',
        content: 'Na interação social, você prefere abordagens mais individualizadas e focadas em suas necessidades específicas. Gosta de que respeitem seu próprio espaço e tempo para recarregar as energias.'
    },
    {
        key: 'EXTRAVERSION_AVG_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Extroversão Média - Tratamento',
        content: 'Na interação social, você prefere uma abordagem flexível que respeite suas preferências pessoais. Você aprecia tanto momentos de tranquilidade como de interação social.'
    },
    {
        key: 'EXTRAVERSION_HIGH_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Extroversão Alta - Tratamento',
        content: 'Na interação social, você prefere abordagens que incentivem a socialização e proporcionem oportunidades de interação com outros indivíduos.'
    },

    // Ambiente
    {
        key: 'EXTRAVERSION_LOW_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Extroversão Baixa - Ambiente',
        content: 'Você prefere ambientes mais tranquilos e calmos, onde possa ter momentos de introspecção e privacidade.'
    },
    {
        key: 'EXTRAVERSION_AVG_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Extroversão Média - Ambiente',
        content: 'Você prefere ambientes onde encontre um equilíbrio entre momentos de solitude e de convivência com outras pessoas.'
    },
    {
        key: 'EXTRAVERSION_HIGH_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Extroversão Alta - Ambiente',
        content: 'Você prefere ambientes animados e estimulantes, onde possa se conectar com diversas pessoas. Gosta de estar cercado(a) de amigos e de participar de atividades sociais.'
    },


    // === AMABILIDADE (A) ===
    // Tratamento
    {
        key: 'AGREEABLENESS_LOW_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Amabilidade Baixa - Tratamento',
        content: 'Você apresenta uma necessidade de que os outros sejam objetivos e assertivos. Gosta de pessoas lógicas, que expressam claramente suas opiniões e necessidades. Espera que as pessoas sejam francas e transparentes em suas comunicações.'
    },
    {
        key: 'AGREEABLENESS_AVG_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Amabilidade Média - Tratamento',
        content: 'Você apresenta uma necessidade equilibrada em relação à forma como deseja afeto. Valoriza tanto a objetividade como também a empatia em suas relações. Espera que as pessoas expressem suas opiniões sobre tarefas e objetivos de forma respeitosa em relação aos sentimentos dos envolvidos.'
    },
    {
        key: 'AGREEABLENESS_HIGH_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Amabilidade Alta - Tratamento',
        content: 'Você apresenta uma necessidade de receber empatia e consideração por parte das pessoas. Sente-se mais confortável quando há harmonia e cordialidade nas relações. Gosta de um tratamento mais gentil e cuidadoso, no qual as pessoas sejam sensíveis aos seus sentimentos e demonstrem interesse genuíno em ajudar.'
    },

    // Ambiente
    {
        key: 'AGREEABLENESS_LOW_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Amabilidade Baixa - Ambiente',
        content: 'Para você é importante que haja clareza em relação aos papéis, funções e autoridade estabelecidos.'
    },
    {
        key: 'AGREEABLENESS_AVG_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Amabilidade Média - Ambiente',
        content: 'Para você é importante que tanto os objetivos como o impacto nas pessoas recebam a mesma atenção.'
    },
    {
        key: 'AGREEABLENESS_HIGH_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Amabilidade Alta - Ambiente',
        content: 'Para você é importante que as pessoas se sintam acolhidas, que sejam amigáveis e estejam dispostas a cooperar mutuamente.'
    },


    // === ESTRUTURA / CONSCIENCIOSIDADE (C) ===
    // Tratamento (Nota: Planilha Estrutura Tratamento está vazio na imagem, mas Ambiente está preenchido. Vou focar no Ambiente que é B, e presumir Tratamento ou pular se vazio na imagem? A imagem mostra Ambiente B na linha 7. Tratamento na linha 5 é Amabilidade. Linha 7 é Estrutura Ambiente B. Linha 6 da imagem é Amabilidade Ambiente D ?
    // Espera, olhando a imagem com cuidado:
    // Linha 3: Extroversão / Tratamento
    // Linha 4: Extroversão / Ambiente
    // Linha 5: Amabilidade / Tratamento
    // Linha 6: Amabilidade / Ambiente
    // Linha 7: Estrutura / Ambiente (Ops, cadê Tratamento da estrutura? A imagem corta ou não tem? Parece que a linha 7 é Ambiente. E a linha de tratamento da estrutura? Pode estar escondida ou não existir. Vou focar no que vejo.)
    // A linha 7 diz "Estrutura / Ambiente". Vou mapear essa.

    // Ambiente
    {
        key: 'CONSCIENTIOUSNESS_LOW_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Estrutura Baixa - Ambiente',
        content: 'Valoriza um ambiente mais descontraído e menos rígido, de modo que possa se sentir à vontade para explorar diferentes abordagens e formas de fazer as coisas. Você prefere ter mais flexibilidade em relação às suas responsabilidades e tarefas. Gosta de ter a liberdade de decidir quando e como realizar suas atividades.'
    },
    {
        key: 'CONSCIENTIOUSNESS_AVG_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Estrutura Média - Ambiente',
        content: 'Você é uma pessoa equilibrada em relação à forma como lida com estrutura, ou seja, quer organização, mas flexibilidade quando necessário ao lidar com suas tarefas. Do mesmo modo, quer ter certa autonomia para tomar decisões, mas um pouco de direcionamento sobre o que precisa ser feito.'
    },
    {
        key: 'CONSCIENTIOUSNESS_HIGH_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Estrutura Alta - Ambiente',
        content: 'Valoriza uma abordagem mais séria e focada em objetivos, que demonstre respeito pela sua dedicação e comprometimento em cumprir suas responsabilidades. Do mesmo modo, quer uma rotina bem estruturada e organizada. Gosta de receber um tratamento mais formal e objetivo, onde as expectativas e prazos sejam claros e definidos.'
    },

    // Tratamento para Estrutura não aparece na imagem, vou deixar placeholders ou pular.


    // === ABERTURA (O) ===
    // Tratamento (Linha 8)
    {
        key: 'OPENNESS_LOW_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Abertura Baixa - Tratamento',
        content: 'Também aprecia quando as pessoas mostram praticidade e apresentam informações e seus pontos de vistas com base em dados e fatos concretos.'
    },
    {
        key: 'OPENNESS_AVG_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Abertura Média - Tratamento',
        content: 'Também considera importante um equilíbrio entre praticidade e abertura para debater ideias novas.'
    },
    {
        key: 'OPENNESS_HIGH_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Abertura Alta - Tratamento',
        content: 'Também aprecia quando as pessoas mostram imaginação e apresentam diferentes possibilidades e perspectivas, estimulando a reflexão e a busca por novas ideias.'
    },

    // Ambiente (Linha 9)
    {
        key: 'OPENNESS_LOW_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Abertura Baixa - Ambiente',
        content: 'Entende que a comunicação deve ser pragmática, de modo que as informações sejam transmitidas de forma concisa e eficiente, focando nas ações e resultados. Se sente mais à vontade quando as decisões são tomadas de modo realista, com base em dados e fatos concretos.'
    },
    {
        key: 'OPENNESS_AVG_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Abertura Média - Ambiente',
        content: 'Entende que a comunicação deve ser equilibrada, de modo que as pessoas possam apresentar diferentes perspectivas e considerar as opções antes de tomar decisões.'
    },
    {
        key: 'OPENNESS_HIGH_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Abertura Alta - Ambiente',
        content: 'Entende que a comunicação precisa ser mais aberta e flexível, onde as pessoas estejam dispostas a explorar novos caminhos e pensar "fora da caixa". Você se sente mais confortável em ambientes que incentivam a inovação e a criatividade, nos quais as decisões são tomadas considerando tendências e possibilidades futuras.'
    },


    // === ESTABILIDADE EMOCIONAL (N) ===
    // (Lembrando: High N = Low Stability. Na imagem: "Estabilidade Emocional" -> Eu Negativo (Baixa Estabilidade) é Coluna C?
    // A coluna C diz "Eu Negativo". Para Estabilidade, "Negativo" é Baixa Estabilidade (Alto Neuroticismo).
    // Então Coluna C = NEUROTICISM_HIGH. Coluna E = NEUROTICISM_LOW.

    // Tratamento (Linha 10)
    {
        key: 'NEUROTICISM_HIGH_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Estabilidade Baixa - Tratamento',
        content: 'Críticas ou abordagens que considere agressivas, podem mexer com suas emoções e fazer você ter reações passionais.'
    },
    {
        key: 'NEUROTICISM_AVG_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Estabilidade Média - Tratamento',
        content: 'Excesso de críticas ou uma abordagem muito agressiva e desrespeitosa pode impactar suas emoções.'
    },
    {
        key: 'NEUROTICISM_LOW_TREATMENT', group: 'NEEDS_TREATMENT', description: 'Estabilidade Alta - Tratamento',
        content: 'Embora lide bem com críticas, excesso de drama o fará perder o interesse nas discussões.'
    },

    // Ambiente (Linha 11)
    {
        key: 'NEUROTICISM_HIGH_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Estabilidade Baixa - Ambiente',
        content: 'Pode ter dificuldade para trabalhar sob pressão ou em ambientes conflituosos.'
    },
    {
        key: 'NEUROTICISM_AVG_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Estabilidade Média - Ambiente',
        // Texto da Coluna D Linha 11: "Pressão em excesso ou conflitos muito frequentes podem desafiá-lo(a) emocionalmente."
        content: 'Pressão em excesso ou conflitos muito frequentes podem desafiá-lo(a) emocionalmente.'
    },
    {
        key: 'NEUROTICISM_LOW_ENVIRONMENT', group: 'NEEDS_ENVIRONMENT', description: 'Estabilidade Alta - Ambiente',
        content: 'É provável que saiba lidar com pressão e que não se deixe abalar em ambientes conflituosos.'
    }

];

async function main() {
    console.log('🔄 Sincronizando Textos de Necessidades (Q1_Necessidades)...');

    let count = 0;
    for (const item of NEEDS_TEXTS) {
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

    console.log(`🎉 Sucesso! ${count} textos de necessidades atualizados.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

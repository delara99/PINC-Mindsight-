import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBigFiveConfig() {
    console.log('🎯 Seeding Big Five Configuration...');

    // Buscar primeiro tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('❌ No tenant found. Please create a tenant first.');
        return;
    }

    console.log(`📍 Using tenant: ${tenant.name}`);

    // Criar configuração padrão
    const config = await prisma.bigFiveConfig.create({
        data: {
            tenantId: tenant.id,
            isActive: true,
            name: 'Configuração Padrão Big Five',
            veryLowMax: 20,
            lowMax: 40,
            averageMax: 60,
            highMax: 80,
            primaryColor: '#d11c9e',
            reportHeader: 'Relatório de Personalidade Big Five',
            reportFooter: 'Este relatório é confidencial e destinado apenas ao uso profissional.'
        }
    });

    console.log('✅ Config created:', config.id);

    // Dados dos 5 traços
    const traitsData = [
        {
            traitKey: 'openness',
            name: 'Abertura à Experiência',
            icon: '🎨',
            weight: 1.0,
            description: 'Avalia o interesse por novas experiências, criatividade e curiosidade intelectual.',
            veryLowText: 'Prefere rotinas estabelecidas, abordagens práticas e soluções testadas. Pode ser mais conservador em suas decisões.',
            lowText: 'Tende a preferir o familiar ao novo, mas pode se adaptar quando necessário. Equilibra tradição com inovação moderada.',
            averageText: 'Apresenta equilíbrio entre apreciação de novas ideias e manutenção de práticas estabelecidas.',
            highText: 'Demonstra interesse genuíno por novas experiências, ideias abstratas e perspectivas diversas.',
            veryHighText: 'Altamente criativo, imaginativo e intelectualmente curioso. Busca constantemente novidades e desafios mentais.'
        },
        {
            traitKey: 'conscientiousness',
            name: 'Conscienciosidade',
            icon: '📋',
            weight: 1.0,
            description: 'Mede organização, autodisciplina e orientação para objetivos.',
            veryLowText: 'Pode ter dificuldade em manter organização e seguir planos. Prefere flexibilidade e espontaneidade.',
            lowText: 'Tende a ser mais relaxado com prazos e organização. Pode precisar de suporte estrutural.',
            averageText: 'Equilibra planejamento com flexibilidade. Geralmente cumpre compromissos com alguma margem.',
            highText: 'Organizado, planejado e confiável. Cumpre prazos e mantém compromissos consistentemente.',
            veryHighText: 'Extremamente metódico, disciplinado e orientado para objetivos. Excelente em planejamento e execução.'
        },
        {
            traitKey: 'extraversion',
            name: 'Extroversão',
            icon: '🗣️',
            weight: 1.0,
            description: 'Avalia sociabilidade, assertividade e nível de energia em interações sociais.',
            veryLowText: 'Prefere ambientes tranquilos e interações individuais. Recupera energia em momentos de solidão.',
            lowText: 'Tende a preferir grupos pequenos e familiares. Pode precisar de tempo sozinho regularmente.',
            averageText: 'Confortável tanto em situações sociais quanto em momentos de privacidade.',
            highText: 'Energizado por interações sociais. Comunicativo e confortável em grupos.',
            veryHighText: 'Altamente sociável, expressivo e energético. Prospera em ambientes dinâmicos e com muita interação.'
        },
        {
            traitKey: 'agreeableness',
            name: 'Amabilidade',
            icon: '🤝',
            weight: 1.0,
            description: 'Mede cooperação, empatia e preocupação com harmonia social.',
            veryLowText: 'Pode ser mais direto e orientado para resultados do que para relacionamentos. Valoriza franqueza acima de diplomacia.',
            lowText: 'Tende a ser prático e objetivo, mas pode cooperar quando necessário.',
            averageText: 'Equilibra assertividade com cooperação. Adapta-se ao contexto social.',
            highText: 'Empático, cooperativo e valoriza harmonia nas relações. Bom em mediações.',
            veryHighText: 'Altamente empático e cooperativo. Prioriza bem-estar dos outros e harmonia grupal.'
        },
        {
            traitKey: 'neuroticism',
            name: 'Estabilidade Emocional',
            icon: '😌',
            weight: 1.0,
            description: 'Avalia estabilidade emocional, resiliência e gestão de estresse. (Nota: pontuação baixa indica alta estabilidade)',
            veryLowText: 'Excepcionalmente calmo e resiliente. Mantém equilíbrio mesmo sob pressão significativa.',
            lowText: 'Geralmente estável emocionalmente. Lida bem com a maioria dos estressores.',
            averageText: 'Reage normalmente a estressores. Recupera-se em tempo razoável.',
            highText: 'Pode ser mais sensível emocionalmente. Beneficia-se de ambiente de suporte.',
            veryHighText: 'Alta sensibilidade emocional. Pode precisar de estratégias específicas de gestão de estresse.'
        }
    ];

    // Criar traços
    for (const traitData of traitsData) {
        const trait = await prisma.bigFiveTraitConfig.create({
            data: {
                configId: config.id,
                ...traitData
            }
        });
        console.log(`✅ Trait created: ${trait.name}`);

        // Criar facetas para cada traço
        const facetsData = getFacetsForTrait(traitData.traitKey);
        for (const facetData of facetsData) {
            await prisma.bigFiveFacetConfig.create({
                data: {
                    traitId: trait.id,
                    ...facetData
                }
            });
        }
        console.log(`   ✅ ${facetsData.length} facets created`);
    }

    // Criar recomendações padrão
    await createDefaultRecommendations(config.id);

    console.log('\n✅ Big Five Configuration seeded successfully!');
}

function getFacetsForTrait(traitKey: string) {
    const facets: Record<string, any[]> = {
        openness: [
            { facetKey: 'creativity', name: 'Criatividade', weight: 1.0, description: 'Capacidade de pensar de forma original e gerar ideias inovadoras.' },
            { facetKey: 'curiosity', name: 'Curiosidade', weight: 1.0, description: 'Interesse em aprender coisas novas e explorar ideias.' },
            { facetKey: 'artistic', name: 'Apreciação Artística', weight: 1.0, description: 'Interesse por arte, beleza e experiências estéticas.' },
            { facetKey: 'emotionality', name: 'Abertura Emocional', weight: 1.0, description: 'Consciência e expressão de sentimentos próprios.' }
        ],
        conscientiousness: [
            { facetKey: 'organization', name: 'Organização', weight: 1.0, description: 'Tendência a manter ordem e estrutura.' },
            { facetKey: 'productiveness', name: 'Produtividade', weight: 1.0, description: 'Capacidade de completar tarefas eficientemente.' },
            { facetKey: 'responsibility', name: 'Responsabilidade', weight: 1.0, description: 'Confiabilidade e cumprimento de compromissos.' },
            { facetKey: 'perfectionism', name: 'Perfeccionismo', weight: 1.0, description: 'Busca por alta qualidade e excelência.' }
        ],
        extraversion: [
            { facetKey: 'sociability', name: 'Sociabilidade', weight: 1.0, description: 'Preferência por companhia e interação social.' },
            { facetKey: 'assertiveness', name: 'Assertividade', weight: 1.0, description: 'Capacidade de expressar opiniões e liderar.' },
            { facetKey: 'energy', name: 'Nível de Energia', weight: 1.0, description: 'Vitalidade e entusiasmo demonstrados.' },
            { facetKey: 'excitement', name: 'Busca por Excitação', weight: 1.0, description: 'Desejo por estimulação e novidade.' }
        ],
        agreeableness: [
            { facetKey: 'compassion', name: 'Compaixão', weight: 1.0, description: 'Empatia e preocupação com bem-estar alheio.' },
            { facetKey: 'trust', name: 'Confiança', weight: 1.0, description: 'Tendência a acreditar na boa intenção dos outros.' },
            { facetKey: 'cooperation', name: 'Cooperação', weight: 1.0, description: 'Disposição para trabalhar em equipe.' },
            { facetKey: 'politeness', name: 'Polidez', weight: 1.0, description: 'Cortesia e respeito nas interações.' }
        ],
        neuroticism: [
            { facetKey: 'anxiety', name: 'Ansiedade', weight: 1.0, description: 'Tendência a preocupação e nervosismo.' },
            { facetKey: 'depression', name: 'Depressão', weight: 1.0, description: 'Propensão a sentimentos de tristeza.' },
            { facetKey: 'emotional_volatility', name: 'Volatilidade Emocional', weight: 1.0, description: 'Flutuação nos estados emocionais.' },
            { facetKey: 'self_consciousness', name: 'Autoconsciência', weight: 1.0, description: 'Sensibilidade ao julgamento dos outros.' }
        ]
    };

    return facets[traitKey] || [];
}

async function createDefaultRecommendations(configId: string) {
    const recommendations = [
        // Abertura - Alta
        {
            configId,
            traitKey: 'openness',
            scoreRange: 'high',
            title: 'Capitalize sua Criatividade',
            description: 'Busque projetos que permitam inovação. Compartilhe ideias em brainstormings. Explore novas tecnologias.',
            icon: '💡',
            order: 1
        },
        {
            configId,
            traitKey: 'openness',
            scoreRange: 'high',
            title: 'Aprendizado Contínuo',
            description: 'Dedique tempo para cursos, leituras variadas e experiências culturais diversificadas.',
            icon: '📚',
            order: 2
        },
        // Conscienciosidade - Alta
        {
            configId,
            traitKey: 'conscientiousness',
            scoreRange: 'high',
            title: 'Lidere Projetos Estruturados',
            description: 'Sua organização é valiosa. Assuma responsabilidades de planejamento e coordenação.',
            icon: '📊',
            order: 1
        },
        {
            configId,
            traitKey: 'conscientiousness',
            scoreRange: 'high',
            title: 'Balance Perfeccionismo',
            description: 'Reconheça quando "suficientemente bom" é adequado. Pratique delegar tarefas.',
            icon: '⚖️',
            order: 2
        }
    ];

    for (const rec of recommendations) {
        await prisma.bigFiveRecommendation.create({ data: rec });
    }

    console.log('✅ Recommendations created');
}

// Export for reuse
export { seedBigFiveConfig };

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed única configuração padrão para ALL tenants
 * Execute: npx ts-node scripts/seed-all-tenants.ts
 */
async function seedAllTenants() {
    console.log('🎯 Seeding Big Five para TODOS os tenants...\n');

    const tenants = await prisma.tenant.findMany();

    for (const tenant of tenants) {
        console.log(`📍 Processando tenant: ${tenant.name}`);

        // Verificar se já tem config ativa
        const hasActive = await prisma.bigFiveConfig.findFirst({
            where: {
                tenantId: tenant.id,
                isActive: true
            },
            include: { traits: true }
        });

        if (hasActive && hasActive.traits.length > 0) {
            console.log(`  ⏭️  Já tem config ativa com ${hasActive.traits.length} traços. Pulando...`);
            continue;
        }

        // Criar config padrão
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

        console.log(`  ✅ Config created: ${config.id}`);

        // Dados dos 5 traços
        const traitsData = [
            {
                traitKey: 'openness',
                name: 'Abertura à Experiência',
                icon: '🎨',
                weight: 1.0,
                description: 'Avalia o interesse por novas experiências, criatividade e curiosidade intelectual.',
                veryLowText: 'Prefere rotinas estabelecidas, abordagens práticas e soluções testadas.',
                lowText: 'Tende a preferir o familiar ao novo, mas pode se adaptar quando necessário.',
                averageText: 'Apresenta equilíbrio entre apreciação de novas ideias e manutenção de práticas estabelecidas.',
                highText: 'Demonstra interesse genuíno por novas experiências, ideias abstratas e perspectivas diversas.',
                veryHighText: 'Altamente criativo, imaginativo e intelectualmente curioso.'
            },
            {
                traitKey: 'conscientiousness',
                name: 'Conscienciosidade',
                icon: '📋',
                weight: 1.0,
                description: 'Mede organização, autodisciplina e orientação para objetivos.',
                veryLowText: 'Pode ter dificuldade em manter organização e seguir planos.',
                lowText: 'Tende a ser mais relaxado com prazos e organização.',
                averageText: 'Equilibra planejamento com flexibilidade.',
                highText: 'Organizado, planejado e confiável.',
                veryHighText: 'Extremamente metódico, disciplinado e orientado para objetivos.'
            },
            {
                traitKey: 'extraversion',
                name: 'Extroversão',
                icon: '🗣️',
                weight: 1.0,
                description: 'Avalia sociabilidade, assertividade e nível de energia em interações sociais.',
                veryLowText: 'Prefere ambientes tranquilos e interações individuais.',
                lowText: 'Tende a preferir grupos pequenos e familiares.',
                averageText: 'Confortável tanto em situações sociais quanto em momentos de privacidade.',
                highText: 'Energizado por interações sociais. Comunicativo e confortável em grupos.',
                veryHighText: 'Altamente sociável, expressivo e energético.'
            },
            {
                traitKey: 'agreeableness',
                name: 'Amabilidade',
                icon: '🤝',
                weight: 1.0,
                description: 'Mede cooperação, empatia e preocupação com harmonia social.',
                veryLowText: 'Pode ser mais direto e orientado para resultados do que para relacionamentos.',
                lowText: 'Tende a ser prático e objetivo, mas pode cooperar quando necessário.',
                averageText: 'Equilibra assertividade com cooperação.',
                highText: 'Empático, cooperativo e valoriza harmonia nas relações.',
                veryHighText: 'Altamente empático e cooperativo.'
            },
            {
                traitKey: 'neuroticism',
                name: 'Estabilidade Emocional',
                icon: '😌',
                weight: 1.0,
                description: 'Avalia estabilidade emocional, resiliência e gestão de estresse.',
                veryLowText: 'Excepcionalmente calmo e resiliente.',
                lowText: 'Geralmente estável emocionalmente.',
                averageText: 'Reage normalmente a estressores.',
                highText: 'Pode ser mais sensível emocionalmente.',
                veryHighText: 'Alta sensibilidade emocional.'
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

            // Criar facetas (4 por traço)
            const facetsData = getFacetsForTrait(traitData.traitKey);
            for (const facetData of facetsData) {
                await prisma.bigFiveFacetConfig.create({
                    data: {
                        traitId: trait.id,
                        ...facetData
                    }
                });
            }
        }

        console.log(`  ✅ 5 traços + 20 facetas criados`);
        console.log('');
    }

    console.log('✅ Todos os tenants têm configuração padrão agora!\n');
    await prisma.$disconnect();
}

function getFacetsForTrait(traitKey: string) {
    const facets: Record<string, any[]> = {
        openness: [
            { facetKey: 'creativity', name: 'Criatividade', weight: 1.0, description: 'Capacidade de pensar de forma original.' },
            { facetKey: 'curiosity', name: 'Curiosidade', weight: 1.0, description: 'Interesse em aprender coisas novas.' },
            { facetKey: 'artistic', name: 'Apreciação Artística', weight: 1.0, description: 'Interesse por arte e beleza.' },
            { facetKey: 'emotionality', name: 'Abertura Emocional', weight: 1.0, description: 'Consciência de sentimentos.' }
        ],
        conscientiousness: [
            { facetKey: 'organization', name: 'Organização', weight: 1.0, description: 'Tendência a manter ordem.' },
            { facetKey: 'productiveness', name: 'Produtividade', weight: 1.0, description: 'Capacidade de completar tarefas.' },
            { facetKey: 'responsibility', name: 'Responsabilidade', weight: 1.0, description: 'Confiabilidade.' },
            { facetKey: 'perfectionism', name: 'Perfeccionismo', weight: 1.0, description: 'Busca por excelência.' }
        ],
        extraversion: [
            { facetKey: 'sociability', name: 'Sociabilidade', weight: 1.0, description: 'Preferência por companhia.' },
            { facetKey: 'assertiveness', name: 'Assertividade', weight: 1.0, description: 'Capacidade de liderar.' },
            { facetKey: 'energy', name: 'Nível de Energia', weight: 1.0, description: 'Vitalidade demonstrada.' },
            { facetKey: 'excitement', name: 'Busca por Excitação', weight: 1.0, description: 'Desejo por estimulação.' }
        ],
        agreeableness: [
            { facetKey: 'compassion', name: 'Compaixão', weight: 1.0, description: 'Empatia e preocupação.' },
            { facetKey: 'trust', name: 'Confiança', weight: 1.0, description: 'Acreditar nos outros.' },
            { facetKey: 'cooperation', name: 'Cooperação', weight: 1.0, description: 'Trabalho em equipe.' },
            { facetKey: 'politeness', name: 'Polidez', weight: 1.0, description: 'Cortesia nas interações.' }
        ],
        neuroticism: [
            { facetKey: 'anxiety', name: 'Ansiedade', weight: 1.0, description: 'Tendência a preocupação.' },
            { facetKey: 'depression', name: 'Depressão', weight: 1.0, description: 'Propensão a tristeza.' },
            { facetKey: 'emotional_volatility', name: 'Volatilidade Emocional', weight: 1.0, description: 'Flutuação emocional.' },
            { facetKey: 'self_consciousness', name: 'Autoconsciência', weight: 1.0, description: 'Sensibilidade ao julgamento.' }
        ]
    };
    return facets[traitKey] || [];
}

seedAllTenants();

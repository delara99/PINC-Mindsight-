import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = '020bae32-797c-4b37-b427-c1f82fc2b6d9'; // Tenant do teste8

const traitsData = [
    {
        name: 'Abertura à Experiência',
        key: 'OPENNESS',
        description: 'Imaginação, curiosidade intelectual e abertura a novas experiências',
        facets: [
            { name: 'Imaginação', key: 'IMAGINATION', description: 'Capacidade de fantasiar e criar' },
            { name: 'Curiosidade Intelectual', key: 'INTELLECTUAL_CURIOSITY', description: 'Interesse por ideias abstratas' },
            { name: 'Criatividade Artística', key: 'ARTISTIC_CREATIVITY', description: 'Apreciação pela arte e beleza' },
            { name: 'Sensibilidade Emocional', key: 'EMOTIONAL_SENSITIVITY', description: 'Consciência dos próprios sentimentos' },
            { name: 'Aventura', key: 'ADVENTURE', description: 'Preferência por variedade e novidade' },
            { name: 'Liberalismo', key: 'LIBERALISM', description: 'Disposição para desafiar autoridade' }
        ]
    },
    {
        name: 'Conscienciosidade',
        key: 'CONSCIENTIOUSNESS',
        description: 'Organização, responsabilidade e orientação para objetivos',
        facets: [
            { name: 'Competência', key: 'COMPETENCE', description: 'Sentir-se capaz e eficaz' },
            { name: 'Ordem', key: 'ORDER', description: 'Preferência por organização e arrumação' },
            { name: 'Senso de Dever', key: 'DUTIFULNESS', description: 'Adesão estrita a princípios éticos' },
            { name: 'Esforço por Conquistas', key: 'ACHIEVEMENT_STRIVING', description: 'Ambição e determinação' },
            { name: 'Autodisciplina', key: 'SELF_DISCIPLINE', description: 'Capacidade de começar e completar tarefas' },
            { name: 'Ponderação', key: 'CAUTIOUSNESS', description: 'Tendência a pensar antes de agir' }
        ]
    },
    {
        name: 'Extroversão',
        key: 'EXTRAVERSION',
        description: 'Sociabilidade, assertividade e busca por estimulação',
        facets: [
            { name: 'Cordialidade', key: 'WARMTH', description: 'Capacidade de formar laços afetivos' },
            { name: 'Gregarismo', key: 'GREGARIOUSNESS', description: 'Preferência pela companhia de outros' },
            { name: 'Assertividade', key: 'ASSERTIVENESS', description: 'Tendência a ser dominante e influente' },
            { name: 'Atividade', key: 'ACTIVITY', description: 'Ritmo de vida acelerado' },
            { name: 'Busca por Emoções', key: 'EXCITEMENT_SEEKING', description: 'Necessidade de estímulo e excitação' },
            { name: 'Emoções Positivas', key: 'POSITIVE_EMOTIONS', description: 'Tendência a experimentar alegria e felicidade' }
        ]
    },
    {
        name: 'Amabilidade',
        key: 'AGREEABLENESS',
        description: 'Altruísmo, confiança e cooperação',
        facets: [
            { name: 'Confiança', key: 'TRUST', description: 'Crença na honestidade e boas intenções alheias' },
            { name: 'Franqueza', key: 'STRAIGHTFORWARDNESS', description: 'Sinceridade e ingenuidade' },
            { name: 'Altruísmo', key: 'ALTRUISM', description: 'Preocupação ativa com o bem-estar dos outros' },
            { name: 'Complacência', key: 'COMPLIANCE', description: 'Tendência a ceder em conflitos' },
            { name: 'Modéstia', key: 'MODESTY', description: 'Humildade e aversão a se vangloriar' },
            { name: 'Sensibilidade', key: 'TENDER_MINDEDNESS', description: 'Empatia e compaixão' }
        ]
    },
    {
        name: 'Estabilidade Emocional',
        key: 'NEUROTICISM',
        description: 'Estabilidade emocional e resistência ao estresse',
        facets: [
            { name: 'Ansiedade', key: 'ANXIETY', description: 'Tendência a se preocupar' },
            { name: 'Raiva/Hostilidade', key: 'ANGER', description: 'Propensão a experimentar raiva' },
            { name: 'Depressão', key: 'DEPRESSION', description: 'Tendência a experimentar tristeza' },
            { name: 'Autoconsciência', key: 'SELF_CONSCIOUSNESS', description: 'Timidez e constrangimento' },
            { name: 'Impulsividade', key: 'IMPULSIVENESS', description: 'Incapacidade de controlar desejos' },
            { name: 'Vulnerabilidade', key: 'VULNERABILITY', description: 'Suscetibilidade ao estresse' }
        ]
    }
];

async function main() {
    console.log('🔧 Criando Config Big Five para tenant do teste8...\n');
    console.log(`Tenant ID: ${TENANT_ID}\n`);

    // 1. Desativar configs existentes
    const existingConfigs = await prisma.bigFiveConfig.findMany({
        where: { tenantId: TENANT_ID }
    });

    if (existingConfigs.length > 0) {
        console.log(`Desativando ${existingConfigs.length} configs existentes...`);
        await prisma.bigFiveConfig.updateMany({
            where: { tenantId: TENANT_ID },
            data: { isActive: false }
        });
    }

    // 2. Criar nova config
    console.log('Criando nova config ativa...');
    const config = await prisma.bigFiveConfig.create({
        data: {
            tenantId: TENANT_ID,
            isActive: true
        }
    });

    console.log(`✅ Config criada: ${config.id}\n`);

    // 3. Criar traços e facetas
    let totalFacets = 0;
    for (const traitData of traitsData) {
        console.log(`Criando traço: ${traitData.name}...`);

        const trait = await prisma.bigFiveTraitConfig.create({
            data: {
                configId: config.id,
                name: traitData.name,
                description: traitData.description
            }
        });

        for (const facetData of traitData.facets) {
            await prisma.bigFiveFacetConfig.create({
                data: {
                    traitId: trait.id,
                    name: facetData.name,
                    description: facetData.description,
                    weight: 1.0
                }
            });
            totalFacets++;
        }
    }

    console.log('\n════════════════════════════════════════');
    console.log('✅ CONFIG CRIADA COM SUCESSO!');
    console.log(`   Config ID: ${config.id}`);
    console.log(`   Traços: ${traitsData.length}`);
    console.log(`   Facetas: ${totalFacets}`);
    console.log('════════════════════════════════════════\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

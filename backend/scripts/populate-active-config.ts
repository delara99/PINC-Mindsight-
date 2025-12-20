import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

const traitsData = [
    {
        key: 'OPENNESS',
        name: 'Abertura à Experiência',
        facets: ['Fantasia', 'Estética', 'Sentimentos', 'Ações', 'Ideias', 'Valores']
    },
    {
        key: 'CONSCIENTIOUSNESS',
        name: 'Conscienciosidade',
        facets: ['Competência', 'Ordem', 'Senso de dever', 'Esforço por realizações', 'Autodisciplina', 'Ponderação']
    },
    {
        key: 'EXTRAVERSION',
        name: 'Extroversão',
        facets: ['Cordialidade', 'Gregariedade', 'Assertividade', 'Atividade', 'Busca de sensações', 'Emoções positivas']
    },
    {
        key: 'AGREEABLENESS',
        name: 'Amabilidade',
        facets: ['Confiança', 'Franqueza', 'Altruísmo', 'Complacência', 'Modéstia', 'Sensibilidade']
    },
    {
        key: 'NEUROTICISM',
        name: 'Neuroticismo',
        facets: ['Ansiedade', 'Hostilidade', 'Depressão', 'Embaraço', 'Impulsividade', 'Vulnerabilidade']
    }
];

async function populateActiveConfig() {
    console.log('\n🚀 POPULANDO CONFIG ATIVA COM TRAITS E FACETS\n');

    // 1. Buscar config ativa
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: { isActive: true },
        include: { traits: true }
    });

    if (!activeConfig) {
        console.log('❌ Nenhuma config ativa encontrada!');
        return;
    }

    console.log(`✅ Config ativa: ${activeConfig.name} (${activeConfig.id})`);
    console.log(`   Traits atuais: ${activeConfig.traits.length}`);

    // 2. Deletar traits antigos se houver
    if (activeConfig.traits.length > 0) {
        console.log('🗑️  Removendo traits antigos...');
        await prisma.bigFiveTraitConfig.deleteMany({
            where: { configId: activeConfig.id }
        });
    }

    // 3. Criar os 5 traits com suas facetas
    let traitsCreated = 0;
    let facetsCreated = 0;

    for (const td of traitsData) {
        console.log(`\n📊 Criando trait: ${td.name}`);

        const trait = await prisma.bigFiveTraitConfig.create({
            data: {
                configId: activeConfig.id,
                traitKey: td.key,
                name: td.name,
                weight: 1.0,
                isActive: true,
                description: `Avalia ${td.name}`,
                icon: '',
                veryLowText: 'Muito Baixo',
                lowText: 'Baixo',
                averageText: 'Médio',
                highText: 'Alto',
                veryHighText: 'Muito Alto'
            }
        });

        traitsCreated++;
        console.log(`   ✅ Trait criado: ${trait.id}`);

        // Criar facetas
        for (let i = 0; i < td.facets.length; i++) {
            const facet = await prisma.bigFiveFacetConfig.create({
                data: {
                    traitId: trait.id,
                    facetKey: `${td.key}_F${i + 1}`,
                    name: td.facets[i],
                    weight: 1.0,
                    isActive: true,
                    description: ''
                }
            });
            facetsCreated++;
            console.log(`      - Faceta: ${facet.name}`);
        }
    }

    console.log('\n✅ CONCLUÍDO!');
    console.log(`   Traits criados: ${traitsCreated}`);
    console.log(`   Facetas criadas: ${facetsCreated}`);
    console.log('\n🎯 Agora atualize a página do relatório (F5)!\n');
}

populateActiveConfig()
    .catch(e => {
        console.error('❌ ERRO:', e);
        console.error('Stack:', e.stack);
    })
    .finally(() => prisma.$disconnect());

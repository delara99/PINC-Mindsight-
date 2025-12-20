import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

const CONFIG_ID = 'b8d11272-fb89-4284-b51d-991486e05a45'; // Config ativa específica

const traitsData = [
    { key: 'OPENNESS', name: 'Abertura à Experiência', facets: ['Fantasia', 'Estética', 'Sentimentos', 'Ações', 'Ideias', 'Valores'] },
    { key: 'CONSCIENTIOUSNESS', name: 'Conscienciosidade', facets: ['Competência', 'Ordem', 'Senso de dever', 'Esforço por realizações', 'Autodisciplina', 'Ponderação'] },
    { key: 'EXTRAVERSION', name: 'Extroversão', facets: ['Cordialidade', 'Gregariedade', 'Assertividade', 'Atividade', 'Busca de sensações', 'Emoções positivas'] },
    { key: 'AGREEABLENESS', name: 'Amabilidade', facets: ['Confiança', 'Franqueza', 'Altruísmo', 'Complacência', 'Modéstia', 'Sensibilidade'] },
    { key: 'NEUROTICISM', name: 'Neuroticismo', facets: ['Ansiedade', 'Hostilidade', 'Depressão', 'Embaraço', 'Impulsividade', 'Vulnerabilidade'] }
];

async function populateSpecificConfig() {
    console.log(`\n🎯 POPULANDO CONFIG ESPECÍFICA: ${CONFIG_ID}\n`);

    // Deletar traits antigos se houver
    await prisma.bigFiveTraitConfig.deleteMany({ where: { configId: CONFIG_ID } });
    console.log('🗑️  Traits antigos removidos');

    let traitsCreated = 0;
    let facetsCreated = 0;

    for (const td of traitsData) {
        console.log(`\n📊 Criando trait: ${td.name}`);

        const trait = await prisma.bigFiveTraitConfig.create({
            data: {
                configId: CONFIG_ID,
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

        for (let i = 0; i < td.facets.length; i++) {
            await prisma.bigFiveFacetConfig.create({
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
            console.log(`   - ${td.facets[i]}`);
        }
    }

    console.log('\n✅ CONCLUÍDO!');
    console.log(`   Traits: ${traitsCreated}`);
    console.log(`   Facetas: ${facetsCreated}`);
    console.log('\n🎯 ATUALIZE O RELATÓRIO AGORA!\n');
}

populateSpecificConfig()
    .catch(e => console.error('❌ ERRO:', e))
    .finally(() => prisma.$disconnect());

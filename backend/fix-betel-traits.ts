import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    const configId = '45a93dce-8670-48f6-a7a6-24aa1483ac25'; // Betel ativa

    console.log('🔧 Populando Betel com traços...\n');

    // Buscar config do Wagner que tem traços
    const source = await prisma.bigFiveConfig.findFirst({
        where: {
            tenantId: '10361c57-bbc3-4d20-8ee5-8d40d1b6e81f', // Wagner
            traits: { some: {} }
        },
        include: { traits: { include: { facets: true } } }
    });

    if (!source) {
        console.log('❌ Sem config fonte');
        await prisma.$disconnect();
        return;
    }

    console.log('✅ Fonte:', source.traits.length, 'traços\n');

    // Copiar cada traço
    for (const trait of source.traits) {
        const newTrait = await prisma.bigFiveTraitConfig.create({
            data: {
                configId,
                traitKey: trait.traitKey,
                name: trait.name,
                icon: trait.icon,
                weight: trait.weight,
                description: trait.description,
                veryLowText: trait.veryLowText,
                lowText: trait.lowText,
                averageText: trait.averageText,
                highText: trait.highText,
                veryHighText: trait.veryHighText
            }
        });

        console.log('✅', newTrait.name);

        // Copiar facetas
        for (const facet of trait.facets) {
            await prisma.bigFiveFacetConfig.create({
                data: {
                    traitId: newTrait.id,
                    facetKey: facet.facetKey,
                    name: facet.name,
                    weight: facet.weight,
                    description: facet.description
                }
            });
        }
        console.log('   ↳', trait.facets.length, 'facetas');
    }

    console.log('\n✅✅✅ PRONTO! Recarregue a página! ✅✅✅');

    await prisma.$disconnect();
}

fix();

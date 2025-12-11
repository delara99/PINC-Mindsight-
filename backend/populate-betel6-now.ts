import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateBetel6() {
    const source = await prisma.bigFiveConfig.findFirst({
        where: { traits: { some: {} } },
        include: { traits: { include: { facets: true } } }
    });

    if (!source) {
        console.log('❌ Nenhuma config com traços encontrada');
        return;
    }

    console.log('✅ Encontrada:', source.name, 'com', source.traits.length, 'traços\n');

    const targetId = 'c71fe217-9f77-4a7f-8c6b-466234cc3444';

    // Deletar existentes
    const existing = await prisma.bigFiveTraitConfig.findMany({
        where: { configId: targetId }
    });

    if (existing.length > 0) {
        console.log('⚠️  Deletando', existing.length, 'traços existentes...');
        for (const trait of existing) {
            await prisma.bigFiveFacetConfig.deleteMany({ where: { traitId: trait.id } });
        }
        await prisma.bigFiveTraitConfig.deleteMany({ where: { configId: targetId } });
    }

    // Copiar
    console.log('📋 Copiando traços:\n');
    for (const trait of source.traits) {
        const newTrait = await prisma.bigFiveTraitConfig.create({
            data: {
                configId: targetId,
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
        console.log('  ✅', newTrait.name);

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
    }

    console.log('\n✅✅✅ BETEL 6 POPULADA COM SUCESSO! ✅✅✅');
    console.log('Agora dê F5 na página!\n');

    await prisma.$disconnect();
}

populateBetel6();

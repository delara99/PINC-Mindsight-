import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populate() {
    const configId = '45a93dce-8670-48f6-a7a6-24aa1483ac25'; // Betel
    const tenantId = 'c2c1f3a8-d1a7-48fc-abd9-1f783e2f2246'; // Empresa Demo

    console.log('🔄 Populando Betel...\n');

    // 1. Config alvo
    const config = await prisma.bigFiveConfig.findFirst({
        where: { id: configId, tenantId },
        include: { traits: true }
    });

    if (!config) {
        console.log('❌ Config não encontrada!');
        return;
    }

    console.log('✅ Config:', config.name);
    console.log('   Traços atuais:', config.traits.length);

    // 2. Config ativa
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: {
            tenantId,
            isActive: true
        },
        include: {
            traits: {
                include: { facets: true }
            }
        }
    });

    if (!activeConfig) {
        console.log('❌ Nenhuma config ativa no tenant!');
        return;
    }

    console.log('\n✅ Config ativa:', activeConfig.name);
    console.log('   Traços:', activeConfig.traits.length);

    if (!activeConfig.traits || activeConfig.traits.length === 0) {
        console.log('❌ Config ativa SEM traços!');
        return;
    }

    // 3. Deletar traços existentes (se houver)
    if (config.traits.length > 0) {
        console.log('\n⚠️  Deletando', config.traits.length, 'traços existentes...');
        for (const trait of config.traits) {
            await prisma.bigFiveFacetConfig.deleteMany({ where: { traitId: trait.id } });
        }
        await prisma.bigFiveTraitConfig.deleteMany({ where: { configId } });
    }

    // 4. Copiar traços
    console.log('\n📋 Copiando traços:\n');
    for (const trait of activeConfig.traits) {
        const newTrait = await prisma.bigFiveTraitConfig.create({
            data: {
                configId: config.id,
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
        console.log('     ↳', trait.facets.length, 'facetas');
    }

    console.log('\n✅✅✅ BETEL POPULADA COM SUCESSO! ✅✅✅');

    await prisma.$disconnect();
}

populate();

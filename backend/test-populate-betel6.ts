import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPopulate() {
    const configId = 'c71fe217-9f77-4a7f-8c6b-466234cc3444'; // Betel 6
    const tenantId = '5137f70b-8f07-463d-bc85-2c61c3fbc32a'; // Wagner

    console.log('🔍 Testando populate...\n');

    // 1. Verificar config alvo
    const targetConfig = await prisma.bigFiveConfig.findFirst({
        where: { id: configId, tenantId },
        include: { traits: true }
    });

    console.log('Config alvo:', targetConfig?.name);
    console.log('Traços atuais:', targetConfig?.traits.length);

    // 2. Verificar config ativa
    const activeConfig = await prisma.bigFiveConfig.findFirst({
        where: { tenantId, isActive: true },
        include: {
            traits: {
                include: { facets: true }
            }
        }
    });

    console.log('\nConfig ativa:', activeConfig?.name);
    console.log('Traços na ativa:', activeConfig?.traits.length);
    console.log('Facetas na ativa:', activeConfig?.traits.reduce((sum, t) => sum + t.facets.length, 0));

    if (!activeConfig?.traits || activeConfig.traits.length === 0) {
        console.log('\n❌ Config ativa não tem traços!');
        return;
    }

    if (!targetConfig) {
        console.log('\n❌ Config alvo não encontrada!');
        return;
    }

    // 3. Testar populate
    console.log('\n🔄 Copiando traços...');

    for (const trait of activeConfig.traits) {
        try {
            const newTrait = await prisma.bigFiveTraitConfig.create({
                data: {
                    configId: targetConfig.id,
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
            console.log('     ✅', trait.facets.length, 'facetas');

        } catch (err: any) {
            console.log('  ❌ Erro:', err.message);
        }
    }

    // 4. Verificar resultado
    const updated = await prisma.bigFiveConfig.findUnique({
        where: { id: configId },
        include: { traits: { include: { facets: true } } }
    });

    console.log('\n✅ Resultado:');
    console.log('Traços copiados:', updated?.traits.length);
    console.log('Facetas copiadas:', updated?.traits.reduce((sum, t) => sum + t.facets.length, 0));

    await prisma.$disconnect();
}

testPopulate();


import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking BigFiveConfigs ---');
    const configs = await prisma.bigFiveConfig.findMany({
        where: { isActive: true },
        include: {
            traits: {
                include: {
                    facets: true,
                    _count: { select: { facets: true } }
                }
            }
        }
    });

    for (const config of configs) {
        console.log(`Config: ${config.name} (ID: ${config.id}, Tenant: ${config.tenantId})`);
        for (const trait of config.traits) {
            console.log(`  Trait: ${trait.name} (Key: ${trait.traitKey}) - Facets: ${trait.facets.length}`);
            if (trait.facets.length === 0) {
                console.log(`    ⚠️  WARNING: NO FACETS FOUND for ${trait.name}`);
            } else {
                // List first 3 facets as sample
                const sample = trait.facets.slice(0, 3).map(f => `${f.name} (${f.facetKey})`).join(', ');
                console.log(`    Sample: ${sample}`);
            }
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

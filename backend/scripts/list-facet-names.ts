import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listFacetNames() {
    console.log('='.repeat(80));
    console.log('NOMES DAS FACETAS NO BANCO DE DADOS');
    console.log('='.repeat(80));

    // Buscar todos os mapeamentos ativos
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: { isActive: true },
        select: {
            dimension: true,
            facet: true
        },
        distinct: ['dimension', 'facet']
    });

    // Agrupar por dimensão
    const byDimension: Record<string, Set<string>> = {};

    mappings.forEach(m => {
        if (!byDimension[m.dimension]) {
            byDimension[m.dimension] = new Set();
        }
        byDimension[m.dimension].add(m.facet);
    });

    // Exibir
    Object.entries(byDimension).forEach(([dimension, facets]) => {
        console.log(`\n📊 ${dimension}:`);
        Array.from(facets).sort().forEach(facet => {
            // Normalizar para ver como ficaria no código
            const normalized = facet.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, '');
            console.log(`  - "${facet}" → normalized: "${normalized}"`);
        });
    });

    console.log('\n' + '='.repeat(80));
    console.log('COPIE ESSES NOMES E ME ENVIE!');
    console.log('='.repeat(80));

    await prisma.$disconnect();
}

listFacetNames().catch(console.error);

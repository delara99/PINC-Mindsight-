
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Analisando Mapeamentos de Facetas...');

    // Buscar todos os mapeamentos ativos
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: { isActive: true },
        select: { dimension: true, facet: true }
    });

    console.log(`Total de Mapeamentos Ativos: ${mappings.length}`);

    // Agrupar e contar
    const facets = new Set<string>();
    const byDimension: Record<string, Set<string>> = {};

    mappings.forEach(m => {
        facets.add(m.facet);
        if (!byDimension[m.dimension]) byDimension[m.dimension] = new Set();
        byDimension[m.dimension].add(m.facet);
    });

    console.log('\n--- FACETAS ENCONTRADAS (RAW NAMES) ---');
    console.log([...facets].sort());

    console.log('\n--- FACETAS POR DIMENSÃO ---');
    Object.keys(byDimension).forEach(dim => {
        console.log(`\nDimensão ${dim}:`);
        [...byDimension[dim]].sort().forEach(f => console.log(`  - "${f}"`));
    });

    // Validar Duplicatas Potenciais (Case Insensitive)
    console.log('\n--- VERIFICAÇÃO DE DUPLICATAS (CASE INSENSITIVE) ---');
    const normalized = new Map<string, string[]>();
    [...facets].forEach(f => {
        const key = f.toLowerCase().trim();
        if (!normalized.has(key)) normalized.set(key, []);
        normalized.get(key)?.push(f);
    });

    normalized.forEach((vals, key) => {
        if (vals.length > 1) {
            console.warn(`⚠️ ALERTA DUPLICATA: A chave "${key}" tem múltiplas variações:`, vals);
        }
    });

    // Testar Normalização do Frontend
    console.log('\n--- TESTE DE TRADUÇÃO (NORMALIZAÇÃO) ---');
    [...facets].forEach(f => {
        const normalizedFrontend = f.toLowerCase().replace(/[^a-z]/g, '');
        console.log(`"${f}" -> "${normalizedFrontend}"`);
    });

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

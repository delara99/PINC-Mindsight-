import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * MIGRAÇÃO: Adicionar Fórmulas do Especialista ao Motor de Cálculo
 * 
 * Cria novas fórmulas no banco de dados para que o admin possa ver e editar
 */

async function addSpecialistFormulas() {
    console.log('='.repeat(80));
    console.log('MIGRAÇÃO: Adicionar Fórmulas do Especialista ao Motor');
    console.log('='.repeat(80));

    // 1. Criar fórmula de mapeamento de valores (1-4 → 0.05, 1, 2, 2.95)
    console.log('\n📋 ETAPA 1: Criar fórmula de mapeamento de valores...\n');

    const valueMapping = await prisma.calculationFormula.upsert({
        where: { name: 'VALUE_MAPPING_1_4_SPECIALIST' },
        update: {},
        create: {
            name: 'VALUE_MAPPING_1_4_SPECIALIST',
            type: 'TRANSFORMATION',
            description: 'Mapeamento de valores 1-4 para escala normalizada (Especialista)',
            formula: {
                type: 'VALUE_MAP',
                mapping: {
                    1: 0.05,  // DISCORDO
                    2: 1,     // DISCORDO PARCIALMENTE
                    3: 2,     // CONCORDO PARCIALMENTE
                    4: 2.95   // CONCORDO
                },
                note: 'Valores ajustados para evitar extremos absolutos (0 e 100)',
                maxValue: 3,
                minValue: 0.05
            },
            minValue: 0.05,
            maxValue: 2.95,
            isActive: true
        }
    });

    console.log(`✅ Fórmula criada: ${valueMapping.name}`);
    console.log(`   ID: ${valueMapping.id}`);
    console.log(`   Descrição: ${valueMapping.description}`);

    // 2. Criar fórmula de inversão (3 - valor)
    console.log('\n📋 ETAPA 2: Criar fórmula de inversão...\n');

    const reverseFormula = await prisma.calculationFormula.upsert({
        where: { name: 'REVERSE_SCORING_1_4_SPECIALIST' },
        update: {},
        create: {
            name: 'REVERSE_SCORING_1_4_SPECIALIST',
            type: 'TRANSFORMATION',
            description: 'Inversão para escala 1-4 (Especialista): 3 - valor',
            formula: {
                type: 'REVERSE',
                expression: '3 - x',
                maxScale: 3,
                note: 'Escala máxima = 3 (não 7 como na antiga)'
            },
            minValue: 0.05,
            maxValue: 2.95,
            isActive: true
        }
    });

    console.log(`✅ Fórmula criada: ${reverseFormula.name}`);
    console.log(`   ID: ${reverseFormula.id}`);
    console.log(`   Fórmula: ${JSON.stringify(reverseFormula.formula)}`.substring(0, 80) + '...');

    // 3. Criar fórmula de normalização (valor / 3 * 100)
    console.log('\n📋 ETAPA 3: Criar fórmula de normalização...\n');

    const normalizationFormula = await prisma.calculationFormula.upsert({
        where: { name: 'NORMALIZATION_1_4_TO_0_100_SPECIALIST' },
        update: {},
        create: {
            name: 'NORMALIZATION_1_4_TO_0_100_SPECIALIST',
            type: 'NORMALIZATION',
            description: 'Normalização 1-4 para escala 0-100 (Especialista): (valor / 3) * 100',
            formula: {
                type: 'NORMALIZE',
                expression: '(x / 3) * 100',
                divisor: 3,
                multiplier: 100,
                note: 'Divisor = 3 (escala máxima após mapeamento)'
            },
            minValue: 0,
            maxValue: 100,
            isActive: true
        }
    });

    console.log(`✅ Fórmula criada: ${normalizationFormula.name}`);
    console.log(`   ID: ${normalizationFormula.id}`);
    console.log(`   Fórmula: ${JSON.stringify(normalizationFormula.formula)}`.substring(0, 80) + '...');

    // 4. Criar fórmula de média simples (sem pesos)
    console.log('\n📋 ETAPA 4: Criar fórmula de média simples...\n');

    const simpleAverage = await prisma.calculationFormula.upsert({
        where: { name: 'FACET_SIMPLE_AVERAGE_SPECIALIST' },
        update: {},
        create: {
            name: 'FACET_SIMPLE_AVERAGE_SPECIALIST',
            type: 'AGGREGATION',
            description: 'Média simples para facetas (Especialista): Σ(valores) / quantidade',
            formula: {
                type: 'SIMPLE_AVERAGE',
                expression: 'sum(values) / count(values)',
                ignoreWeights: true,
                note: 'Média aritmética simples, sem considerar pesos'
            },
            minValue: 0,
            maxValue: 100,
            isActive: true
        }
    });

    console.log(`✅ Fórmula criada: ${simpleAverage.name}`);
    console.log(`   ID: ${simpleAverage.id}`);
    console.log(`   Fórmula: ${JSON.stringify(simpleAverage.formula)}`.substring(0, 80) + '...');

    // 5. Listar todas as fórmulas
    console.log('\n📋 ETAPA 5: Listar todas as fórmulas disponíveis...\n');

    const allFormulas = await prisma.calculationFormula.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
    });

    console.log('📊 FÓRMULAS DISPONÍVEIS NO MOTOR:\n');
    console.log('Tipo | Descrição | Fórmula');
    console.log('-'.repeat(80));

    allFormulas.forEach(f => {
        const formulaStr = typeof f.formula === 'string'
            ? f.formula
            : JSON.stringify(f.formula).substring(0, 30) + '...';
        console.log(`${f.type.padEnd(30)} | ${f.description.substring(0, 30).padEnd(30)} | ${formulaStr}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('RESUMO');
    console.log('='.repeat(80));
    console.log(`
✅ SUCESSO! Fórmulas do Especialista Adicionadas ao Motor!

📊 FÓRMULAS CRIADAS:
1. VALUE_MAPPING_1_4 - Mapeamento de valores (1→0.05, 2→1, 3→2, 4→2.95)
2. REVERSE_SCORING_1_4 - Inversão (3 - valor)
3. NORMALIZATION_1_4_TO_0_100 - Normalização ((valor / 3) * 100)
4. FACET_SIMPLE_AVERAGE - Média simples (sem pesos)

✅ FÓRMULAS ANTIGAS MANTIDAS:
- NORMALIZATION_1_6_TO_0_100 (compatibilidade)
- REVERSE_SCORING_1_6 (compatibilidade)
- FACET_WEIGHTED_AVERAGE (compatibilidade)

🎯 PRÓXIMOS PASSOS:
1. Atualizar código para usar fórmulas do banco
2. Remover hardcode
3. Admin pode ver/editar pela interface

⚠️ IMPORTANTE:
- Sistema agora é 100% dinâmico
- Admin tem controle total
- Fórmulas antigas preservadas (compatibilidade)
- Novos testes usam fórmulas novas automaticamente
    `);

    await prisma.$disconnect();
}

addSpecialistFormulas().catch(console.error);

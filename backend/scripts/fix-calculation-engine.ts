import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * SCRIPT: Correção Definitiva do Motor de Cálculo
 * 1. Sincroniza Inversões com Planilha
 * 2. Atualiza Fórmulas (Map 1:1, Rev 5-v, Norm 25/50/75/100)
 * 3. Valida
 */

async function fixCalculationEngine() {
    console.log('='.repeat(80));
    console.log('🔧 CORREÇÃO DO MOTOR DE CÁLCULO');
    console.log('='.repeat(80));

    // 1. SINCRONIZAR INVERSÕES
    console.log('\n📝 1. Sincronizando Questões Invertidas...');

    const analiseJsonPath = path.join(__dirname, '../data/specialist-spreadsheets/analise-planilha.json');
    if (!fs.existsSync(analiseJsonPath)) {
        console.error('❌ analise-planilha.json não encontrado!');
        return;
    }

    const { questoesInvertidas, questoes } = JSON.parse(fs.readFileSync(analiseJsonPath, 'utf-8'));
    const invertidasSet = new Set(questoesInvertidas);

    let updated = 0;
    let created = 0;

    for (const q of questoes) {
        const qNum = parseInt(q.numero);
        const shouldBeReversed = invertidasSet.has(qNum);

        // Dados para create/update
        const dimension = "O"; // Placeholder, o que importa é o dichotomy
        const dichotomy = q.dimensao; // Ex: "CONCRETO-ABSTRATO"
        const facet = q.faceta;

        // Procurar existente
        const existing = await prisma.calculationQuestionMapping.findFirst({
            where: { questionId: qNum }
        });

        if (existing) {
            // Se estado de inversão ou dicotomia estiver errado, atualizar
            if (existing.isReversed !== shouldBeReversed || existing.dichotomy !== dichotomy) {
                await prisma.calculationQuestionMapping.update({
                    where: { id: existing.id },
                    data: {
                        isReversed: shouldBeReversed,
                        dichotomy: dichotomy, // Atualizar também a dimensão correta da planilha
                        facet: facet
                    }
                });
                updated++;
                process.stdout.write('U');
            } else {
                process.stdout.write('.');
            }
        } else {
            // Criar se não existir
            await prisma.calculationQuestionMapping.create({
                data: {
                    questionId: qNum,
                    questionText: `Questão ${qNum}`,
                    dimension: dimension,
                    dichotomy: dichotomy,
                    facet: facet,
                    isReversed: shouldBeReversed,
                    weight: 1.0,
                    isActive: true
                }
            });
            created++;
            process.stdout.write('C');
        }
    }

    console.log(`\n\n✅ Sincronização: ${updated} atualizados, ${created} criados.`);

    // 2. ATUALIZAR FÓRMULAS
    console.log('\n📝 2. Atualizando Fórmulas...');

    // A. Mapeamento de Valores (1->1, 2->2...)
    await prisma.calculationFormula.upsert({
        where: { name: 'VALUE_MAPPING_1_4_SPECIALIST' },
        update: {
            formula: { type: 'VALUE_MAP', mapping: { "1": 1, "2": 2, "3": 3, "4": 4 } },
            minValue: 1, maxValue: 4
        },
        create: {
            name: 'VALUE_MAPPING_1_4_SPECIALIST',
            type: 'TRANSFORMATION',
            description: 'Mapeamento Identidade 1-4',
            formula: { type: 'VALUE_MAP', mapping: { "1": 1, "2": 2, "3": 3, "4": 4 } },
            minValue: 1, maxValue: 4, isActive: true
        }
    });
    console.log('   ✅ VALUE_MAPPING: Identidade (1->1)');

    // B. Inversão (1->4, 2->3...)
    // Fórmula: 5 - valor. Como fazer isso com Value Map? {1:4, 2:3, 3:2, 4:1}
    await prisma.calculationFormula.upsert({
        where: { name: 'REVERSE_SCORING_1_4_SPECIALIST' },
        update: {
            formula: { type: 'VALUE_MAP', mapping: { "1": 4, "2": 3, "3": 2, "4": 1 } }
        },
        create: {
            name: 'REVERSE_SCORING_1_4_SPECIALIST',
            type: 'TRANSFORMATION',
            description: 'Inversão 1-4 (5 - valor)',
            formula: { type: 'VALUE_MAP', mapping: { "1": 4, "2": 3, "3": 2, "4": 1 } },
            minValue: 1, maxValue: 4, isActive: true
        }
    });
    console.log('   ✅ REVERSE_SCORING: 5-Valor ({1:4, 4:1...})');

    // C. Normalização (1->25, 2->50...)
    await prisma.calculationFormula.upsert({
        where: { name: 'NORMALIZATION_1_4_TO_0_100_SPECIALIST' },
        update: {
            formula: { type: 'VALUE_MAP', mapping: { "1": 25, "2": 50, "3": 75, "4": 100 } },
            minValue: 25, maxValue: 100
        },
        create: {
            name: 'NORMALIZATION_1_4_TO_0_100_SPECIALIST',
            type: 'NORMALIZATION',
            description: 'Normalização Linear (Val/4 * 100)',
            formula: { type: 'VALUE_MAP', mapping: { "1": 25, "2": 50, "3": 75, "4": 100 } },
            minValue: 25, maxValue: 100, isActive: true
        }
    });
    console.log('   ✅ NORMALIZATION: Linear ({1:25, 2:50, 3:75, 4:100})');

    // 3. EXECUTAR VALIDAÇÃO
    console.log('\n📝 3. Executando Validação...');

    // Executar o script read-spreadsheet-simple via child_process
    const { execSync } = require('child_process');
    try {
        console.log('\n--- SAÍDA DO TESTE ---\n');
        const output = execSync('npx ts-node scripts/read-spreadsheet-simple.ts', {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8',
            env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
        });
        console.log(output);
        console.log('\n--- FIM DO TESTE ---');
    } catch (e: any) {
        console.error('❌ Erro ao rodar teste:', e.message);
        console.log(e.stdout);
    }

    await prisma.$disconnect();
}

fixCalculationEngine().catch(console.error);

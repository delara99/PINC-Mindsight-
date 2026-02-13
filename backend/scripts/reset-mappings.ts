import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * SCRIPT: Reset Total de Mappings
 * Remove TODOS os mappings e recria apenas os 126 corretos -> Garantia de Integridade
 */

async function resetMappings() {
    console.log('='.repeat(80));
    console.log('🧹 RESET TOTAL DE MAPPINGS DO MOTOR DE CÁLCULO');
    console.log('='.repeat(80));

    // 1. Ler dados corretos
    const analiseJsonPath = path.join(__dirname, '../data/specialist-spreadsheets/analise-planilha.json');
    if (!fs.existsSync(analiseJsonPath)) {
        console.error('❌ analise-planilha.json não encontrado!');
        return;
    }
    const { questoes } = JSON.parse(fs.readFileSync(analiseJsonPath, 'utf-8'));

    console.log(`\n📋 Lendo ${questoes.length} questões do JSON de referência.`);

    // 2. BACKUP E LIMPEZA
    // Vou contar antes
    const beforeCount = await prisma.calculationQuestionMapping.count();
    console.log(`\n📊 Estado Atual: ${beforeCount} mappings no banco.`);

    console.log('\n⚠️  DELETANDO TODOS OS MAPPINGS... (Limpeza de duplicatas)');
    // Deletar tudo
    await prisma.calculationQuestionMapping.deleteMany({});

    console.log('✅ Tabela limpa.');

    // 3. RECRIAR 126 MAPPINGS CORRETOS
    console.log('\n🏗️  Recriando 126 mappings corretos...');

    let createdCount = 0;

    // Usar transação para garantir tudo ou nada? Melhor loop simples para debug
    // batch create é melhor

    const dataToCreate = questoes.map((q: any) => ({
        questionId: parseInt(q.numero),
        questionText: `Questão ${q.numero} - ${q.dimensao}`,
        dimension: q.dimensao, // USAR VALOR REAL E NÃO PLACEHOLDER!
        dichotomy: q.dimensao,
        facet: q.faceta,
        isReversed: q.invertida,
        weight: 1.0,
        isActive: true
    }));

    // Prisma createMany é mais eficiente
    const result = await prisma.calculationQuestionMapping.createMany({
        data: dataToCreate
    });

    console.log(`✅ ${result.count} mappings criados com sucesso!`);

    // 4. VERIFICAR SE BATEMOS 126
    const finalCount = await prisma.calculationQuestionMapping.count();
    if (finalCount === 126) {
        console.log('\n🎉 SUCESSO! Banco de dados normalizado com 126 questões únicas.');
    } else {
        console.error(`\n❌ ERRO: Esperava 126, tem ${finalCount}`);
    }

    // 5. RODAR VALIDAÇÃO FINAL
    console.log('\n📝 Executando validação final de cálculo...');
    const { execSync } = require('child_process');
    try {
        console.log('\n--- SAÍDA DO TESTE ---\n');
        const output = execSync('npx ts-node scripts/read-spreadsheet-simple.ts', {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf-8',
            env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
        });
        console.log(output);
    } catch (e: any) {
        console.log(e.stdout);
    }

    await prisma.$disconnect();
}

resetMappings().catch(console.error);

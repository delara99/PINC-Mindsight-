import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * SCRIPT: Comparar Questões Invertidas
 * Compara as questões invertidas do sistema com as da planilha
 */

async function compareInvertedQuestions() {
    console.log('='.repeat(80));
    console.log('COMPARAÇÃO: Questões Invertidas Sistema vs Planilha');
    console.log('='.repeat(80));

    // 1. Ler questões invertidas da planilha
    const analiseJsonPath = path.join(__dirname, '../data/specialist-spreadsheets/analise-planilha.json');
    const analiseData = JSON.parse(fs.readFileSync(analiseJsonPath, 'utf-8'));

    const planilhaInvertidas = new Set(analiseData.questoesInvertidas);

    console.log(`\n📊 Planilha: ${planilhaInvertidas.size} questões invertidas\n`);

    // 2. Buscar questões invertidas do sistema
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: {
            isReversed: true
        },
        orderBy: {
            questionId: 'asc'
        }
    });

    const sistemaInvertidas = new Set(mappings.map(m => m.questionId));

    console.log(`📊 Sistema: ${sistemaInvertidas.size} questões invertidas\n`);

    // 3. Comparar
    const apenasNaPlanilha = [...planilhaInvertidas].filter(q => !sistemaInvertidas.has(q));
    const apenasNoSistema = [...sistemaInvertidas].filter(q => !planilhaInvertidas.has(q));
    const emAmbos = [...planilhaInvertidas].filter(q => sistemaInvertidas.has(q));

    console.log('='.repeat(80));
    console.log('RESULTADO DA COMPARAÇÃO');
    console.log('='.repeat(80));
    console.log('');

    console.log(`✅ Em ambos: ${emAmbos.length} questões`);
    console.log(`❌ Apenas na planilha: ${apenasNaPlanilha.length} questões`);
    console.log(`⚠️  Apenas no sistema: ${apenasNoSistema.length} questões`);
    console.log('');

    if (apenasNaPlanilha.length > 0) {
        console.log('❌ QUESTÕES INVERTIDAS NA PLANILHA MAS NÃO NO SISTEMA:');
        console.log('   ', apenasNaPlanilha.sort((a, b) => a - b).join(', '));
        console.log('');
    }

    if (apenasNoSistema.length > 0) {
        console.log('⚠️  QUESTÕES INVERTIDAS NO SISTEMA MAS NÃO NA PLANILHA:');
        console.log('   ', apenasNoSistema.sort((a, b) => a - b).join(', '));
        console.log('');
    }

    // 4. Análise de impacto
    console.log('='.repeat(80));
    console.log('ANÁLISE DE IMPACTO');
    console.log('='.repeat(80));
    console.log('');

    const totalDiferencas = apenasNaPlanilha.length + apenasNoSistema.length;
    const percentualDiferenca = ((totalDiferencas / 126) * 100).toFixed(1);

    console.log(`Total de diferenças: ${totalDiferencas} questões (${percentualDiferenca}% do total)`);
    console.log('');

    if (totalDiferencas > 0) {
        console.log('🎯 IMPACTO:');
        console.log('   Cada questão invertida incorretamente pode causar diferença de até 200 pontos');
        console.log('   (invertendo quando não deveria ou vice-versa)');
        console.log('');
        console.log(`   Impacto estimado: ${totalDiferencas} questões × ~15-30 pontos = ${totalDiferencas * 15}-${totalDiferencas * 30} pontos`);
        console.log('   Distribuído entre 5 dimensões = ~${(totalDiferencas * 15 / 5).toFixed(0)}-${(totalDiferencas * 30 / 5).toFixed(0)} pontos por dimensão');
        console.log('');
        console.log('   ✅ Isso explica a diferença média de 19.4 pontos que encontramos!');
    }

    // 5. Recomendação
    console.log('');
    console.log('='.repeat(80));
    console.log('RECOMENDAÇÃO');
    console.log('='.repeat(80));
    console.log('');

    if (totalDiferencas === 0) {
        console.log('✅ PERFEITO! Listas de questões invertidas estão idênticas!');
        console.log('   O problema deve estar na fórmula de normalização.');
    } else {
        console.log('❌ AÇÃO NECESSÁRIA:');
        console.log('');
        console.log('1. Atualizar questionMappings no banco de dados');
        console.log('   - Adicionar inversão para:', apenasNaPlanilha.sort((a, b) => a - b).join(', '));
        console.log('   - Remover inversão de:', apenasNoSistema.sort((a, b) => a - b).join(', '));
        console.log('');
        console.log('2. Atualizar fórmula de normalização');
        console.log('   - Planilha usa: (resposta - 1) / 3 * 100');
        console.log('   - Sistema usa: valores mapeados (0.05, 1, 2, 2.95)');
        console.log('');
        console.log('3. Recalcular teste e comparar novamente');
    }

    console.log('');
    console.log('='.repeat(80));

    await prisma.$disconnect();
}

compareInvertedQuestions().catch(console.error);

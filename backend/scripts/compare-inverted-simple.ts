import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function compareInvertedQuestions() {
    console.log('='.repeat(80));
    console.log('COMPARAÇÃO: Questões Invertidas Sistema vs Planilha');
    console.log('='.repeat(80));

    // 1. Ler questões invertidas da planilha
    const analiseJsonPath = path.join(__dirname, '../data/specialist-spreadsheets/analise-planilha.json');
    const analiseData = JSON.parse(fs.readFileSync(analiseJsonPath, 'utf-8'));

    const planilhaInvertidas: number[] = analiseData.questoesInvertidas;

    console.log(`\n📊 Planilha: ${planilhaInvertidas.length} questões invertidas\n`);

    // 2. Buscar questões invertidas do sistema
    const mappings = await prisma.calculationQuestionMapping.findMany({
        where: { isReversed: true },
        orderBy: { questionId: 'asc' }
    });

    const sistemaInvertidas: number[] = mappings.map(m => m.questionId);

    console.log(`📊 Sistema: ${sistemaInvertidas.length} questões invertidas\n`);

    // 3. Comparar
    const apenasNaPlanilha = planilhaInvertidas.filter(q => !sistemaInvertidas.includes(q));
    const apenasNoSistema = sistemaInvertidas.filter(q => !planilhaInvertidas.includes(q));
    const emAmbos = planilhaInvertidas.filter(q => sistemaInvertidas.includes(q));

    console.log('='.repeat(80));
    console.log('RESULTADO');
    console.log('='.repeat(80));
    console.log('');
    console.log(`✅ Em ambos: ${emAmbos.length}`);
    console.log(`❌ Apenas na planilha: ${apenasNaPlanilha.length}`);
    console.log(`⚠️  Apenas no sistema: ${apenasNoSistema.length}`);
    console.log('');

    if (apenasNaPlanilha.length > 0) {
        console.log('❌ FALTAM NO SISTEMA:');
        console.log('   ', apenasNaPlanilha.join(', '));
        console.log('');
    }

    if (apenasNoSistema.length > 0) {
        console.log('⚠️  SOBRAM NO SISTEMA:');
        console.log('   ', apenasNoSistema.join(', '));
        console.log('');
    }

    const totalDiferencas = apenasNaPlanilha.length + apenasNoSistema.length;

    console.log('='.repeat(80));
    console.log(`TOTAL DE DIFERENÇAS: ${totalDiferencas} questões`);
    console.log('='.repeat(80));
    console.log('');

    if (totalDiferencas === 0) {
        console.log('✅ PERFEITO! Listas idênticas!');
    } else {
        console.log('❌ AÇÃO NECESSÁRIA: Atualizar banco de dados');
    }

    await prisma.$disconnect();
}

compareInvertedQuestions().catch(console.error);

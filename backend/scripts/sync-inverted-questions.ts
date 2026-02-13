import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * SCRIPT: Sincronizar Inversões com a Planilha
 * Atualiza o banco de dados para refletir exatamente as inversões da planilha
 */

async function syncInvertedQuestions() {
    console.log('='.repeat(80));
    console.log('SINCRONIZANDO QUESTÕES INVERTIDAS');
    console.log('='.repeat(80));

    // 1. Ler dados da análise da planilha
    const analiseJsonPath = path.join(__dirname, '../data/specialist-spreadsheets/analise-planilha.json');

    if (!fs.existsSync(analiseJsonPath)) {
        console.error('❌ Arquivo analise-planilha.json não encontrado. Rode analyze-spreadsheet-formulas.ts primeiro.');
        return;
    }

    const analiseData = JSON.parse(fs.readFileSync(analiseJsonPath, 'utf-8'));
    const questoesInvertidasPlanilha: number[] = analiseData.questoesInvertidas;

    console.log(`\n📋 Planilha tem ${questoesInvertidasPlanilha.length} questões invertidas.`);

    // 2. Atualizar TODAS as questões no banco
    // Vamos iterar de 1 a 126

    let updatedCount = 0;
    let invertedCount = 0;
    let normalCount = 0;

    console.log('\n🔄 Atualizando banco de dados...');

    for (let qNum = 1; qNum <= 126; qNum++) {
        const shouldBeReversed = questoesInvertidasPlanilha.includes(qNum);

        // Atualizar no banco
        // Nota: Assumindo que CalculationQuestionMapping usa questionId como Int 1-126
        // Se não encontrar, tenta criar ou avisa

        try {
            const mapping = await prisma.calculationQuestionMapping.findFirst({
                where: { questionId: qNum }
            });

            if (mapping) {
                if (mapping.isReversed !== shouldBeReversed) {
                    await prisma.calculationQuestionMapping.update({
                        where: { id: mapping.id },
                        data: { isReversed: shouldBeReversed }
                    });
                    process.stdout.write(shouldBeReversed ? 'R' : 'N'); // R = Reversed, N = Normal (fix)
                    updatedCount++;
                } else {
                    process.stdout.write('.'); // Sem mudança
                }
            } else {
                process.stdout.write('?'); // Não encontrado
                // Opcional: Criar se não existir? Melhor não arriscar sem saber o resto dos dados
            }
        } catch (error) {
            console.error(`\nErro na questão ${qNum}:`, error);
        }

        if (shouldBeReversed) invertedCount++;
        else normalCount++;
    }

    console.log('\n\n✅ Sincronização concluída!');
    console.log(`   Questões atualizadas: ${updatedCount}`);
    console.log(`   Total Invertidas agora: ${invertedCount}`);
    console.log(`   Total Normais agora: ${normalCount}`);

    await prisma.$disconnect();
}

syncInvertedQuestions().catch(console.error);

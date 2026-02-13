import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function readSpreadsheetAndCreateTest() {
    console.log('='.repeat(80));
    console.log('LER PLANILHA E CRIAR TESTE');
    console.log('='.repeat(80));

    const excelPath = path.join(__dirname, '../data/specialist-spreadsheets/respostas-cristiano.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`\n✅ Arquivo lido: ${workbook.SheetNames[0]}\n`);

    // Extrair respostas da planilha
    const respostas: Record<number, number> = {};

    data.forEach((row: any) => {
        const questao = row['__EMPTY'];

        if (typeof questao === 'number' && questao >= 1 && questao <= 126) {
            let resposta = 0;

            if (row['__EMPTY_8']) resposta = 1;
            else if (row['__EMPTY_9']) resposta = 2;
            else if (row['__EMPTY_10']) resposta = 3;
            else if (row['__EMPTY_11']) resposta = 4;

            if (resposta > 0) {
                respostas[questao] = resposta;
            }
        }
    });

    console.log(`✅ Respostas extraídas: ${Object.keys(respostas).length}\n`);

    // Buscar usuário
    const user = await prisma.user.findUnique({
        where: { email: 'cristianoan04ii@gmail.com' }
    });

    if (!user) {
        console.log('❌ Usuário não encontrado!');
        await prisma.$disconnect();
        return;
    }

    // Buscar assessment
    const assessment = await prisma.assessmentModel.findFirst({
        where: { title: { contains: 'TalkingTO' } },
        include: { questions: { orderBy: { createdAt: 'asc' } } }
    });

    if (!assessment) {
        console.log('❌ Assessment não encontrado!');
        await prisma.$disconnect();
        return;
    }

    // Mapear questões
    const sequenceToQuestionId = new Map<string, string>();
    assessment.questions.forEach((q, index) => {
        sequenceToQuestionId.set((index + 1).toString(), q.id);
    });

    // Preparar respostas
    const responsesToCreate = [];
    for (const [seq, answer] of Object.entries(respostas)) {
        const questionId = sequenceToQuestionId.get(seq);
        if (questionId) {
            responsesToCreate.push({ questionId, answer });
        }
    }

    console.log(`📊 Respostas para inserir: ${responsesToCreate.length}\n`);

    // Criar assignment
    const newAssignment = await prisma.assessmentAssignment.create({
        data: {
            userId: user.id,
            assessmentId: assessment.id,
            status: 'COMPLETED',
            assignedAt: new Date(),
            completedAt: new Date(),
            responses: { create: responsesToCreate }
        }
    });

    console.log(`✅ Assignment criado: ${newAssignment.id}\n`);

    // Calcular scores
    const { ScoreCalculationService } = await import('../src/reports/score-calculation.service');
    const { PrismaService } = await import('../src/prisma/prisma.service');
    const scoreService = new ScoreCalculationService(new PrismaService());
    const scores = await scoreService.calculateScores(newAssignment.id);

    console.log('📊 RESULTADOS:\n');
    Object.entries(scores.scores).forEach(([key, result]) => {
        console.log(`${result.traitName.padEnd(30)} | ${result.normalizedScore}`);
    });

    // Salvar
    await prisma.assessmentResult.create({
        data: {
            assignmentId: newAssignment.id,
            scores: scores.scores as any
        }
    });

    // Comparar
    const planilhaScores = {
        'CONCRETO-ABSTRATO': 84,
        'ADAPTÁVEL-ESTRUTURADO': 51,
        'INTROVERSÃO-EXTROVERSÃO': 72,
        'EMOÇÃO-RAZÃO': 80,
        'LÓGICO-SENTIMENTAL': 54
    };

    console.log('\n📊 COMPARAÇÃO:\n');
    console.log('Dimensão | Sistema | Planilha | Diferença');
    console.log('-'.repeat(70));

    let totalDiff = 0;
    let count = 0;

    Object.entries(scores.scores).forEach(([key, result]) => {
        for (const [pName, pScore] of Object.entries(planilhaScores)) {
            if (result.traitName.includes(pName.split('-')[0])) {
                const diff = result.normalizedScore - pScore;
                totalDiff += Math.abs(diff);
                count++;
                console.log(`${pName.padEnd(30)} |   ${result.normalizedScore.toString().padStart(3)}   |    ${pScore.toString().padStart(3)}    |   ${diff > 0 ? '+' : ''}${diff}`);
                break;
            }
        }
    });

    const avgDiff = count > 0 ? (totalDiff / count).toFixed(1) : 0;

    console.log(`\n✅ CONCLUÍDO!`);
    console.log(`   Assignment ID: ${newAssignment.id}`);
    console.log(`   Diferença média: ${avgDiff} pontos`);
    console.log(`   Status: ${parseFloat(avgDiff.toString()) <= 5 ? '✅ EXCELENTE!' : '⚠️ INVESTIGAR'}\n`);

    await prisma.$disconnect();
}

readSpreadsheetAndCreateTest().catch(console.error);
